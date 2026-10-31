// Lienzo SVG interactivo: pan/zoom, seleccion, mover, redimensionar, editar etiqueta, conectores.

import { TIPOS_GRUPO } from "../nucleo/modelo.js";
import { contenedorEn, ordenDibujo } from "../nucleo/grupos.js";
import { puntosConexion, calcularRuta, puntosAPath, OPUESTO, ladoAutoOrigen, trazarOrtogonal } from "../nucleo/enrutado.js";
import { calcularGuias, aplicarSnap, detectarEspaciadoIgual } from "../nucleo/guias.js";
import { COLOR_BORDE, COLOR_TEXTO, COLOR_TEXTO_SEC, COLOR_SELECCION, TAM_NORMAL, ICONO_ETIQUETA_OFFSET, GROSOR_NORMAL } from "../nucleo/estilo.js";

const NS = "http://www.w3.org/2000/svg";
const ESCALA_MIN = 0.25;
const ESCALA_MAX = 4.0;
const MARGEN = 40;
const H_HANDLE = 8;
const R_CONEXION = 10; // radio de captura para puntos de conexion en canvas units

// --- Estado del modulo ---
let svgEl, raizEl, contEl, editorEl;
let tx = 0, ty = 0, escala = 1.0;
let seleccionIds = new Set();
let seleccionConectorId = null;
let cb = {};
let elementosActuales = [], conectoresActuales = [], iconosActuales = {};
let overlayEl = null, bandaEl = null, highlightEl = null;
let conectoresEl = null, puntosConexionEl = null, previewConectorEl = null;
let guiasEl = null;
let arrastre = null;
let editandoId = null;
let espacioPresionado = false, altPresionado = false;
let grupoHighlightId = null;

// --- SVG helpers ---
function nodo(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

// --- Coordenadas ---
function screenACanvas(sx, sy) {
    const r = svgEl.getBoundingClientRect();
    return { x: (sx - r.left - tx) / escala, y: (sy - r.top - ty) / escala };
}

function canvasAScreen(cx, cy) {
    const r = svgEl.getBoundingClientRect();
    return { sx: cx * escala + tx + r.left, sy: cy * escala + ty + r.top };
}

// --- Transform ---
function aplicarTransform() {
    raizEl.setAttribute("transform", `translate(${tx},${ty}) scale(${escala})`);
    cb.onZoom?.(Math.round(escala * 100));
}

// --- Highlight de contenedor (estilo Lucidchart) ---
function mostrarHighlight(grupoId) {
    if (grupoHighlightId === grupoId) return;
    grupoHighlightId = grupoId;
    highlightEl.innerHTML = "";
    if (!grupoId) return;
    const g = elementosActuales.find(e => e.id === grupoId);
    if (!g) return;
    const def = TIPOS_GRUPO[g.subtipo] ?? { borde: "#0972D3" };
    const m = 4 / escala;
    highlightEl.appendChild(nodo("rect", {
        x: g.x - m, y: g.y - m,
        width: g.ancho + m * 2, height: g.alto + m * 2,
        fill: def.borde + "20", stroke: def.borde,
        "stroke-width": 3 / escala, rx: 6 / escala,
        "pointer-events": "none",
    }));
}

function ocultarHighlight() { grupoHighlightId = null; highlightEl.innerHTML = ""; }

// --- Puntos de conexion ---
function dibujarPuntosConexion(el) {
    puntosConexionEl.innerHTML = "";
    if (!el) return;
    const pts = puntosConexion(el);
    const r = 5 / escala;
    const sw = 1.5 / escala;
    for (const [lado, pt] of Object.entries(pts)) {
        puntosConexionEl.appendChild(nodo("circle", {
            cx: pt.x, cy: pt.y, r,
            fill: "#0972D3", stroke: "#fff", "stroke-width": sw,
            "data-conexion": lado, "data-elemento": el.id,
            cursor: "crosshair",
        }));
    }
}

function puntoConexionBajoCanvas(x, y, excluirId) {
    const r = R_CONEXION / escala;
    for (const el of elementosActuales) {
        if (el.id === excluirId) continue;
        for (const [lado, pt] of Object.entries(puntosConexion(el))) {
            if (Math.abs(pt.x - x) < r && Math.abs(pt.y - y) < r) return { elementoId: el.id, lado };
        }
    }
    return null;
}

function elementoBajoPointerExcluido(x, y, excluirId) {
    let mejor = null, mejorArea = Infinity;
    for (const el of elementosActuales) {
        if (el.id === excluirId) continue;
        if (x >= el.x && y >= el.y && x <= el.x + el.ancho && y <= el.y + el.alto) {
            const area = el.ancho * el.alto;
            if (area < mejorArea) { mejorArea = area; mejor = el; }
        }
    }
    return mejor;
}

// --- Renderizado de elementos ---
function nodoCaja(el) {
    const g = nodo("g", { "data-id": el.id, "data-tipo": el.tipo, cursor: "move" });
    g.appendChild(nodo("rect", { x: el.x, y: el.y, width: el.ancho, height: el.alto, fill: "#ffffff", stroke: COLOR_BORDE, "stroke-width": GROSOR_NORMAL, rx: "4" }));
    if (el.etiqueta) {
        const t = nodo("text", { x: el.x + el.ancho / 2, y: el.y + el.alto / 2, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": "13", "font-family": "system-ui, sans-serif", fill: "#232F3E" });
        t.textContent = el.etiqueta;
        g.appendChild(t);
    }
    return g;
}

function nodoIcono(el, iconos) {
    const datos = iconos?.[el.icono];
    if (!datos) return nodoCaja(el);
    const g = nodo("g", { "data-id": el.id, "data-tipo": "icono", cursor: "move" });
    let href;
    if (datos.svg) href = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(datos.svg)));
    else if (datos.ruta) href = datos.ruta;
    if (href) g.appendChild(nodo("image", { x: el.x, y: el.y, width: el.ancho, height: el.alto, href }));
    if (el.etiqueta) {
        const t = nodo("text", { x: el.x + el.ancho / 2, y: el.y + el.alto + ICONO_ETIQUETA_OFFSET, "text-anchor": "middle", "dominant-baseline": "hanging", "font-size": "12", "font-family": "system-ui, sans-serif", fill: COLOR_TEXTO });
        t.textContent = el.etiqueta;
        g.appendChild(t);
    }
    return g;
}

function nodoGrupo(el) {
    const def = TIPOS_GRUPO[el.subtipo] ?? TIPOS_GRUPO["generico"];
    const g = nodo("g", { "data-id": el.id, "data-tipo": "grupo", cursor: "move" });
    const dasharray = def.linea === "discontinua" ? "8 4" : "none";
    g.appendChild(nodo("rect", { x: el.x, y: el.y, width: el.ancho, height: el.alto, fill: def.relleno ?? "none", stroke: def.borde, "stroke-width": GROSOR_NORMAL, rx: "0", "stroke-dasharray": dasharray }));
    const t = nodo("text", { x: el.x + 8, y: el.y + 16, "font-size": TAM_NORMAL, "font-family": "system-ui, sans-serif", fill: def.borde, "font-weight": "600", "pointer-events": "none" });
    t.textContent = el.etiqueta || def.nombre;
    g.appendChild(t);
    return g;
}

function nodoElemento(el, iconos) {
    if (el.tipo === "grupo") return nodoGrupo(el);
    if (el.tipo === "icono") return nodoIcono(el, iconos);
    return nodoCaja(el);
}

// --- Renderizado de conectores ---
function nodoConector(con, elementos, seleccionado) {
    const puntos = calcularRuta(con, elementos);
    if (puntos.length < 2) return null;
    const d = puntosAPath(puntos);
    const g = nodo("g", { "data-conector-id": con.id, cursor: "pointer" });
    const color = seleccionado ? "#0972D3" : "#545B64";
    const dasharray = con.estilo?.linea === "discontinua" ? `${6/escala} ${3/escala}` : "none";
    // Hitbox invisible para facilitar clic
    g.appendChild(nodo("path", { d, fill: "none", stroke: "transparent", "stroke-width": 12 / escala }));
    g.appendChild(nodo("path", {
        d, fill: "none", stroke: color,
        "stroke-width": (seleccionado ? 2 : 1.5) / escala,
        "stroke-dasharray": dasharray,
        "marker-end": "url(#amb-flecha-fin)",
        "pointer-events": "none",
    }));
    if (con.etiqueta) {
        const mid = puntos[Math.floor(puntos.length / 2)];
        const t = nodo("text", {
            x: mid.x, y: mid.y - 6 / escala,
            "text-anchor": "middle",
            "font-size": 11 / escala,
            "font-family": "system-ui, sans-serif",
            fill: COLOR_TEXTO,
            stroke: "#ffffff",
            "stroke-width": 4 / escala,
            "paint-order": "stroke",
            "pointer-events": "none",
        });
        t.textContent = con.etiqueta;
        g.appendChild(t);
    }
    return g;
}

// --- Seleccion visual de elementos ---
function boundingBox(elementos) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of elementos) {
        minX = Math.min(minX, e.x); minY = Math.min(minY, e.y);
        maxX = Math.max(maxX, e.x + e.ancho); maxY = Math.max(maxY, e.y + e.alto);
    }
    return { x: minX, y: minY, ancho: maxX - minX, alto: maxY - minY };
}

function posHandles(bb, h) {
    return [
        { n: "nw", x: bb.x,            y: bb.y,            cur: "nw-resize" },
        { n: "n",  x: bb.x+bb.ancho/2, y: bb.y,            cur: "n-resize"  },
        { n: "ne", x: bb.x+bb.ancho,   y: bb.y,            cur: "ne-resize" },
        { n: "e",  x: bb.x+bb.ancho,   y: bb.y+bb.alto/2,  cur: "e-resize"  },
        { n: "se", x: bb.x+bb.ancho,   y: bb.y+bb.alto,    cur: "se-resize" },
        { n: "s",  x: bb.x+bb.ancho/2, y: bb.y+bb.alto,    cur: "s-resize"  },
        { n: "sw", x: bb.x,            y: bb.y+bb.alto,    cur: "sw-resize" },
        { n: "w",  x: bb.x,            y: bb.y+bb.alto/2,  cur: "w-resize"  },
    ];
}

function dibujarSeleccionDe(seleccionados) {
    overlayEl.innerHTML = "";
    if (seleccionados.length === 0) return;
    const bb = boundingBox(seleccionados);
    const h = H_HANDLE / escala;
    const sw = 1.5 / escala;
    overlayEl.appendChild(nodo("rect", { x: bb.x, y: bb.y, width: bb.ancho, height: bb.alto, fill: "none", stroke: "#0972D3", "stroke-width": sw, "stroke-dasharray": seleccionados.length > 1 ? `${4/escala}` : "none", "pointer-events": "none" }));
    if (seleccionados.length === 1) {
        for (const p of posHandles(bb, h)) {
            overlayEl.appendChild(nodo("rect", { x: p.x - h/2, y: p.y - h/2, width: h, height: h, fill: "#ffffff", stroke: "#0972D3", "stroke-width": `${1/escala}`, "data-handle": p.n, cursor: p.cur }));
        }
    }
}

function dibujarSeleccion() {
    dibujarSeleccionDe(elementosActuales.filter(e => seleccionIds.has(e.id)));
}

// --- API de renderizado ---
export function renderizar(elementos, conectores, iconos) {
    elementosActuales = elementos;
    conectoresActuales = conectores ?? [];
    iconosActuales = iconos ?? {};
    Array.from(raizEl.children).filter(n => n.dataset?.id).forEach(n => n.remove());
    for (const el of ordenDibujo(elementos)) {
        raizEl.insertBefore(nodoElemento(el, iconosActuales), conectoresEl);
    }
    conectoresEl.innerHTML = "";
    for (const con of conectoresActuales) {
        const n = nodoConector(con, elementos, con.id === seleccionConectorId);
        if (n) conectoresEl.appendChild(n);
    }
    dibujarSeleccion();
}

export function ajustarAContenido(elementos, soloSeleccion = false) {
    const targets = soloSeleccion ? elementos.filter(e => seleccionIds.has(e.id)) : elementos;
    const r = svgEl.getBoundingClientRect();
    if (targets.length === 0) { tx = 0; ty = 0; escala = 1.0; aplicarTransform(); return; }
    const bb = boundingBox(targets);
    const escX = (r.width - 2 * MARGEN) / bb.ancho;
    const escY = (r.height - 2 * MARGEN) / bb.alto;
    escala = Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, Math.min(escX, escY)));
    tx = (r.width - bb.ancho * escala) / 2 - bb.x * escala;
    ty = (r.height - bb.alto * escala) / 2 - bb.y * escala;
    aplicarTransform();
}

export function zoomEn(factor) {
    const r = svgEl.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const nueva = Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, escala * factor));
    tx = cx - (cx - tx) * nueva / escala;
    ty = cy - (cy - ty) * nueva / escala;
    escala = nueva;
    aplicarTransform();
}

export function setSeleccion(ids) { seleccionIds = new Set(ids); dibujarSeleccion(); }
export function limpiarSeleccion() { seleccionIds = new Set(); seleccionConectorId = null; dibujarSeleccion(); }
export function obtenerSeleccion() { return new Set(seleccionIds); }
export function obtenerSeleccionConector() { return seleccionConectorId; }
export function getTransform() { return { tx, ty, escala }; }

// --- Eventos de rueda ---
function onRueda(e) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const r = svgEl.getBoundingClientRect();
        const mx = e.clientX - r.left, my = e.clientY - r.top;
        const nueva = Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, escala * factor));
        tx = mx - (mx - tx) * nueva / escala;
        ty = my - (my - ty) * nueva / escala;
        escala = nueva;
    } else {
        tx -= e.deltaX; ty -= e.deltaY;
    }
    aplicarTransform();
}

// --- Eventos de pointer ---
function onPointerDown(e) {
    if (editandoId) return;
    if (e.button === 1 || espacioPresionado) {
        e.preventDefault();
        arrastre = { tipo: "pan", sx: e.clientX, sy: e.clientY, tx0: tx, ty0: ty };
        svgEl.setPointerCapture(e.pointerId);
        svgEl.style.cursor = "grabbing";
        return;
    }
    // Punto de conexion -> crear conector
    const conxLado = e.target.dataset?.conexion;
    const conxElId = e.target.dataset?.elemento;
    if (conxLado && conxElId) {
        puntosConexionEl.innerHTML = "";
        const { x, y } = screenACanvas(e.clientX, e.clientY);
        arrastre = { tipo: "conector-nuevo", origenId: conxElId, ladoOrigen: conxLado, x, y };
        svgEl.setPointerCapture(e.pointerId);
        svgEl.style.cursor = "crosshair";
        return;
    }
    // Conector -> seleccionar
    const conectorId = e.target.closest("[data-conector-id]")?.dataset?.conectorId;
    if (conectorId) {
        seleccionIds = new Set();
        seleccionConectorId = conectorId;
        cb.onSeleccion?.(new Set());
        cb.onSeleccionConector?.(conectorId);
        renderizarConectores();
        dibujarSeleccion();
        arrastre = null;
        return;
    }
    // Handle de resize
    const handle = e.target.dataset?.handle;
    if (handle && seleccionIds.size === 1) {
        const [id] = [...seleccionIds];
        const el = elementosActuales.find(e2 => e2.id === id);
        if (!el) return;
        arrastre = { tipo: "resize", handle, el, x0: el.x, y0: el.y, w0: el.ancho, h0: el.alto, sx: e.clientX, sy: e.clientY };
        svgEl.setPointerCapture(e.pointerId);
        return;
    }
    // Elemento -> mover / seleccionar
    const nodoEl = e.target.closest("[data-id]");
    if (nodoEl) {
        const id = nodoEl.dataset.id;
        seleccionConectorId = null;
        if (!e.shiftKey && !seleccionIds.has(id)) {
            seleccionIds = new Set([id]);
        } else if (e.shiftKey) {
            seleccionIds = new Set(seleccionIds);
            seleccionIds.has(id) ? seleccionIds.delete(id) : seleccionIds.add(id);
        }
        cb.onSeleccion?.(new Set(seleccionIds));
        dibujarSeleccion();
        const posIni = Object.fromEntries(elementosActuales.filter(el => seleccionIds.has(el.id)).map(el => [el.id, { x: el.x, y: el.y }]));
        arrastre = { tipo: "mover", sx: e.clientX, sy: e.clientY, movido: false, posIni };
        svgEl.setPointerCapture(e.pointerId);
        return;
    }
    seleccionIds = new Set(); seleccionConectorId = null;
    cb.onSeleccion?.(new Set());
    renderizarConectores();
    dibujarSeleccion();
    const { x, y } = screenACanvas(e.clientX, e.clientY);
    arrastre = { tipo: "banda", sx: e.clientX, sy: e.clientY, cx: x, cy: y };
    svgEl.setPointerCapture(e.pointerId);
}

function renderizarConectores() {
    conectoresEl.innerHTML = "";
    for (const con of conectoresActuales) {
        const n = nodoConector(con, elementosActuales, con.id === seleccionConectorId);
        if (n) conectoresEl.appendChild(n);
    }
}

function calcularResize({ handle, el, x0, y0, w0, h0 }, dx, dy) {
    let x = x0, y = y0, w = w0, h = h0;
    if (handle.includes("e")) w = Math.max(20, w0 + dx);
    if (handle.includes("s")) h = Math.max(20, h0 + dy);
    if (handle.includes("w")) { x = x0 + dx; w = Math.max(20, w0 - dx); }
    if (handle.includes("n")) { y = y0 + dy; h = Math.max(20, h0 - dy); }
    if (el.tipo === "icono" && w0 > 0 && h0 > 0) {
        const ratio = w0 / h0;
        if (Math.abs(dx) >= Math.abs(dy)) h = w / ratio; else w = h * ratio;
    }
    return { x: Math.round(x), y: Math.round(y), ancho: Math.round(Math.max(20, w)), alto: Math.round(Math.max(20, h)) };
}

function grupoContenedorParaMover(dx, dy) {
    const seleccionados = elementosActuales.filter(e => seleccionIds.has(e.id));
    if (seleccionados.length === 0) return null;
    const bb = boundingBox(seleccionados.map(e => ({ ...e, x: e.x + dx, y: e.y + dy })));
    return contenedorEn(elementosActuales, bb.x, bb.y, bb.ancho, bb.alto, new Set(seleccionIds));
}

// --- Guias visuales de alineacion ---
function dibujarGuiasActivas(guiasActivas) {
    guiasEl.innerHTML = "";
    const r = svgEl.getBoundingClientRect();
    for (const g of guiasActivas) {
        if (g.eje === "x") {
            const sx = g.valor * escala + tx;
            guiasEl.appendChild(nodo("line", { x1: sx, y1: 0, x2: sx, y2: r.height, stroke: "#E0119D", "stroke-width": 1, "pointer-events": "none" }));
        } else {
            const sy = g.valor * escala + ty;
            guiasEl.appendChild(nodo("line", { x1: 0, y1: sy, x2: r.width, y2: sy, stroke: "#E0119D", "stroke-width": 1, "pointer-events": "none" }));
        }
    }
}

function dibujarEspaciadoIgual(grupos, elementos) {
    for (const grupo of grupos) {
        const sorted = grupo.ids.map(id => elementos.find(e => e.id === id)).filter(Boolean);
        for (let i = 0; i + 1 < sorted.length; i++) {
            const a = sorted[i], b = sorted[i + 1];
            if (grupo.eje === "x") {
                const x1 = (a.x + a.ancho) * escala + tx;
                const x2 = b.x * escala + tx;
                const y  = (a.y + a.alto / 2) * escala + ty;
                const xm = (x1 + x2) / 2;
                guiasEl.appendChild(nodo("line", { x1, y1: y, x2, y2: y, stroke: "#E0119D", "stroke-width": 1, "stroke-dasharray": "4 2", "pointer-events": "none" }));
                const txt = document.createElementNS(NS, "text");
                Object.entries({ x: xm, y: y - 4, "text-anchor": "middle", "font-size": "10", fill: "#E0119D", "pointer-events": "none", "font-family": "system-ui, sans-serif" }).forEach(([k, v]) => txt.setAttribute(k, v));
                txt.textContent = grupo.distancia;
                guiasEl.appendChild(txt);
            } else {
                const y1 = (a.y + a.alto) * escala + ty;
                const y2 = b.y * escala + ty;
                const x  = (a.x + a.ancho / 2) * escala + tx;
                const ym = (y1 + y2) / 2;
                guiasEl.appendChild(nodo("line", { x1: x, y1, x2: x, y2, stroke: "#E0119D", "stroke-width": 1, "stroke-dasharray": "4 2", "pointer-events": "none" }));
                const txt = document.createElementNS(NS, "text");
                Object.entries({ x: x + 4, y: ym, "dominant-baseline": "middle", "font-size": "10", fill: "#E0119D", "pointer-events": "none", "font-family": "system-ui, sans-serif" }).forEach(([k, v]) => txt.setAttribute(k, v));
                txt.textContent = grupo.distancia;
                guiasEl.appendChild(txt);
            }
        }
    }
}

function limpiarGuias() { if (guiasEl) guiasEl.innerHTML = ""; }

function dibujarPreviewConector(origenId, ladoOrigen, x2, y2) {
    const elO = elementosActuales.find(e => e.id === origenId);
    if (!elO) { previewConectorEl.innerHTML = ""; return; }
    const p1 = puntosConexion(elO)[ladoOrigen];
    const elD = elementoBajoPointerExcluido(x2, y2, origenId);
    let p2, lado2;
    if (elD) {
        lado2 = OPUESTO[ladoOrigen];
        p2 = puntosConexion(elD)[lado2];
    } else {
        lado2 = OPUESTO[ladoOrigen];
        p2 = { x: x2, y: y2 };
    }
    const puntos = trazarOrtogonal(p1, ladoOrigen, p2, lado2);
    const d = puntosAPath(puntos);
    previewConectorEl.innerHTML = "";
    previewConectorEl.appendChild(nodo("path", {
        d, fill: "none", stroke: "#0972D3",
        "stroke-width": 1.5 / escala,
        "stroke-dasharray": `${4/escala} ${2/escala}`,
        "marker-end": "url(#amb-flecha-fin)",
        "pointer-events": "none",
    }));
}

function onPointerMove(e) {
    if (!arrastre) {
        // Hover: mostrar puntos de conexion del elemento bajo el cursor
        if (e.pointerType === "mouse") {
            const { x, y } = screenACanvas(e.clientX, e.clientY);
            let mejor = null, mejorArea = Infinity;
            for (const el of elementosActuales) {
                if (x >= el.x && y >= el.y && x <= el.x + el.ancho && y <= el.y + el.alto) {
                    const area = el.ancho * el.alto;
                    if (area < mejorArea) { mejorArea = area; mejor = el; }
                }
            }
            dibujarPuntosConexion(mejor);
        }
        return;
    }
    if (arrastre.tipo === "pan") {
        tx = arrastre.tx0 + e.clientX - arrastre.sx;
        ty = arrastre.ty0 + e.clientY - arrastre.sy;
        aplicarTransform(); return;
    }
    if (arrastre.tipo === "conector-nuevo") {
        const { x, y } = screenACanvas(e.clientX, e.clientY);
        arrastre.x = x; arrastre.y = y;
        dibujarPreviewConector(arrastre.origenId, arrastre.ladoOrigen, x, y);
        return;
    }
    if (arrastre.tipo === "mover") {
        const dx = (e.clientX - arrastre.sx) / escala;
        const dy = (e.clientY - arrastre.sy) / escala;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) arrastre.movido = true;
        if (!arrastre.movido) return;

        // Calcular snap sobre la BB de los elementos seleccionados
        const selEls  = elementosActuales.filter(el => seleccionIds.has(el.id));
        const otrosEls = elementosActuales.filter(el => !seleccionIds.has(el.id));
        const bb  = boundingBox(selEls);
        const bbMov = { id: "__sel__", x: bb.x + dx, y: bb.y + dy, ancho: bb.ancho, alto: bb.alto };
        const guias = calcularGuias(bbMov, otrosEls);
        const { x: sx, y: sy, guiasActivas } = aplicarSnap(bbMov.x, bbMov.y, bb.ancho, bb.alto, guias, escala, altPresionado);
        const dxs = sx - bb.x;
        const dys = sy - bb.y;
        arrastre.dxSnap = dxs;
        arrastre.dySnap = dys;

        for (const id of seleccionIds) {
            const nodoEl = raizEl.querySelector(`[data-id="${id}"]`);
            if (nodoEl) nodoEl.setAttribute("transform", `translate(${Math.round(dxs)},${Math.round(dys)})`);
        }
        const tempEls = elementosActuales.map(el => seleccionIds.has(el.id) ? { ...el, x: arrastre.posIni[el.id].x + dxs, y: arrastre.posIni[el.id].y + dys } : el);
        dibujarSeleccionDe(tempEls.filter(el => seleccionIds.has(el.id)));
        mostrarHighlight(grupoContenedorParaMover(dxs, dys));

        dibujarGuiasActivas(guiasActivas);
        dibujarEspaciadoIgual(detectarEspaciadoIgual(tempEls), tempEls);
        return;
    }
    if (arrastre.tipo === "resize") {
        const dx = (e.clientX - arrastre.sx) / escala;
        const dy = (e.clientY - arrastre.sy) / escala;
        const { x, y, ancho, alto } = calcularResize(arrastre, dx, dy);
        const nodoEl = raizEl.querySelector(`[data-id="${arrastre.el.id}"]`);
        if (nodoEl) {
            const rect = nodoEl.querySelector("rect, image");
            if (rect) { rect.setAttribute("x", x); rect.setAttribute("y", y); rect.setAttribute("width", ancho); rect.setAttribute("height", alto); }
        }
        dibujarSeleccionDe([{ ...arrastre.el, x, y, ancho, alto }]);
        return;
    }
    if (arrastre.tipo === "banda") {
        const { x, y } = screenACanvas(e.clientX, e.clientY);
        const bx = Math.min(arrastre.cx, x), by = Math.min(arrastre.cy, y);
        const bw = Math.abs(x - arrastre.cx), bh = Math.abs(y - arrastre.cy);
        bandaEl.setAttribute("x", bx); bandaEl.setAttribute("y", by);
        bandaEl.setAttribute("width", bw); bandaEl.setAttribute("height", bh);
        bandaEl.removeAttribute("display");
        seleccionIds = new Set(elementosActuales.filter(el => el.x >= bx && el.y >= by && el.x + el.ancho <= bx + bw && el.y + el.alto <= by + bh).map(el => el.id));
        dibujarSeleccion();
    }
}

function onPointerUp(e) {
    if (!arrastre) return;
    if (arrastre.tipo === "conector-nuevo") {
        previewConectorEl.innerHTML = "";
        const { x, y } = screenACanvas(e.clientX, e.clientY);
        const conxFija = puntoConexionBajoCanvas(x, y, arrastre.origenId);
        if (conxFija) {
            cb.onCrearConector?.(arrastre.origenId, arrastre.ladoOrigen, conxFija.elementoId, conxFija.lado);
        } else {
            const elD = elementoBajoPointerExcluido(x, y, arrastre.origenId);
            if (elD) cb.onCrearConector?.(arrastre.origenId, arrastre.ladoOrigen, elD.id, null);
        }
        arrastre = null;
        svgEl.style.cursor = "";
        return;
    }
    if (arrastre.tipo === "mover" && arrastre.movido) {
        const dxs = arrastre.dxSnap ?? (e.clientX - arrastre.sx) / escala;
        const dys = arrastre.dySnap ?? (e.clientY - arrastre.sy) / escala;
        const movidos = elementosActuales.filter(el => seleccionIds.has(el.id)).map(el => ({ id: el.id, x: Math.round(arrastre.posIni[el.id].x + dxs), y: Math.round(arrastre.posIni[el.id].y + dys) }));
        ocultarHighlight();
        limpiarGuias();
        cb.onMover?.(movidos);
    }
    if (arrastre.tipo === "resize") {
        const dx = (e.clientX - arrastre.sx) / escala;
        const dy = (e.clientY - arrastre.sy) / escala;
        cb.onRedimensionar?.(arrastre.el.id, calcularResize(arrastre, dx, dy));
    }
    if (arrastre.tipo === "banda") {
        bandaEl.setAttribute("display", "none");
        cb.onSeleccion?.(new Set(seleccionIds));
    }
    limpiarGuias();
    for (const id of seleccionIds) {
        raizEl.querySelector(`[data-id="${id}"]`)?.removeAttribute("transform");
    }
    arrastre = null;
    svgEl.style.cursor = "";
}

// --- Editor de etiqueta ---
function iniciarEdicion(el, etiquetaActual, sx, sy, ancho, alto) {
    editandoId = el.id;
    editorEl.value = etiquetaActual ?? "";
    editorEl.style.left   = sx + "px";
    editorEl.style.top    = sy + "px";
    editorEl.style.width  = ancho + "px";
    editorEl.style.height = alto + "px";
    editorEl.style.fontSize = Math.max(10, 13 * escala) + "px";
    editorEl.hidden = false;
    editorEl.focus();
    editorEl.select();
}

function onDblClick(e) {
    if (editandoId) { confirmarEdicion(); return; }
    // Conector: editar etiqueta en el punto medio
    const conNodo = e.target.closest("[data-conector-id]");
    if (conNodo) {
        const con = conectoresActuales.find(c => c.id === conNodo.dataset.conectorId);
        if (!con) return;
        const puntos = calcularRuta(con, elementosActuales);
        if (puntos.length < 2) return;
        const mid = puntos[Math.floor(puntos.length / 2)];
        const { sx, sy } = canvasAScreen(mid.x, mid.y);
        editandoId = con.id;
        editorEl.value = con.etiqueta ?? "";
        editorEl.style.left = (sx - 40) + "px";
        editorEl.style.top  = (sy - 12) + "px";
        editorEl.style.width = "80px";
        editorEl.style.height = "24px";
        editorEl.style.fontSize = Math.max(10, 11 * escala) + "px";
        editorEl.hidden = false;
        editorEl.focus();
        editorEl.select();
        return;
    }
    const nodoEl = e.target.closest("[data-id]");
    if (!nodoEl) return;
    const el = elementosActuales.find(e2 => e2.id === nodoEl.dataset.id);
    if (!el) return;
    const r = svgEl.getBoundingClientRect();
    iniciarEdicion(el, el.etiqueta,
        el.x * escala + tx + r.left, el.y * escala + ty + r.top,
        el.ancho * escala, el.alto * escala);
}

function confirmarEdicion() {
    if (!editandoId) return;
    const id = editandoId;
    editandoId = null;
    editorEl.hidden = true;
    // Determinar si es conector o elemento
    if (conectoresActuales.find(c => c.id === id)) {
        cb.onEtiquetaConector?.(id, editorEl.value);
    } else {
        cb.onEtiqueta?.(id, editorEl.value);
    }
}

function cancelarEdicion() { editandoId = null; editorEl.hidden = true; }

// --- Drag & drop desde paleta ---
function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const { x, y } = screenACanvas(e.clientX, e.clientY);
    mostrarHighlight(contenedorEn(elementosActuales, x - 1, y - 1, 2, 2, new Set()));
}

function onDragLeave() { ocultarHighlight(); }

function onDrop(e) {
    e.preventDefault();
    ocultarHighlight();
    let datos;
    try { datos = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
    const r = svgEl.getBoundingClientRect();
    const x = Math.round((e.clientX - r.left - tx) / escala);
    const y = Math.round((e.clientY - r.top - ty) / escala);
    cb.onDrop?.(datos, x, y);
}

// --- Mover con flechas del teclado ---
export function moverSeleccion(dx, dy) {
    if (seleccionIds.size === 0) return;
    const movidos = elementosActuales.filter(el => seleccionIds.has(el.id)).map(el => ({ id: el.id, x: el.x + dx, y: el.y + dy }));
    cb.onMover?.(movidos);
}

// --- Inicializacion ---
export function iniciar(svg, raiz, cont, editor, callbacks) {
    svgEl = svg; raizEl = raiz; contEl = cont; editorEl = editor;
    cb = callbacks ?? {};

    // Marcador de flecha para conectores
    const defs = document.createElementNS(NS, "defs");
    const marker = document.createElementNS(NS, "marker");
    marker.setAttribute("id", "amb-flecha-fin");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "6");
    marker.setAttribute("markerHeight", "6");
    marker.setAttribute("orient", "auto-start-reverse");
    const arrowPath = document.createElementNS(NS, "path");
    arrowPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    arrowPath.setAttribute("fill", "#545B64");
    marker.appendChild(arrowPath);
    defs.appendChild(marker);
    svgEl.insertBefore(defs, svgEl.firstChild);

    conectoresEl    = nodo("g", { id: "conectores",      "pointer-events": "all" });
    puntosConexionEl = nodo("g", { id: "puntos-conexion", "pointer-events": "all" });
    previewConectorEl = nodo("g", { id: "preview-conector", "pointer-events": "none" });
    highlightEl     = nodo("g", { id: "highlight-grupo", "pointer-events": "none" });
    overlayEl       = nodo("g", { id: "overlay-sel",     "pointer-events": "all" });
    raizEl.appendChild(conectoresEl);
    raizEl.appendChild(puntosConexionEl);
    raizEl.appendChild(previewConectorEl);
    raizEl.appendChild(highlightEl);
    raizEl.appendChild(overlayEl);

    bandaEl = nodo("rect", { id: "banda-sel", fill: "rgba(9,114,211,0.08)", stroke: "#0972D3", "stroke-width": "1", display: "none" });
    svgEl.appendChild(bandaEl);
    guiasEl = nodo("g", { id: "guias-visual", "pointer-events": "none" });
    svgEl.appendChild(guiasEl);

    svgEl.addEventListener("wheel", onRueda, { passive: false });
    svgEl.addEventListener("pointerdown", onPointerDown);
    svgEl.addEventListener("pointermove", onPointerMove);
    svgEl.addEventListener("pointerup", onPointerUp);
    svgEl.addEventListener("dblclick", onDblClick);
    svgEl.addEventListener("mouseleave", () => { if (!arrastre) puntosConexionEl.innerHTML = ""; });
    contEl.addEventListener("dragover", onDragOver);
    contEl.addEventListener("dragleave", onDragLeave);
    contEl.addEventListener("drop", onDrop);

    editorEl.addEventListener("blur", confirmarEdicion);
    editorEl.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); confirmarEdicion(); }
        if (e.key === "Escape") { cancelarEdicion(); }
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Alt") { altPresionado = true; return; }
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        if (e.key === " ") { e.preventDefault(); espacioPresionado = true; svgEl.style.cursor = "grab"; }
    });
    document.addEventListener("keyup", e => {
        if (e.key === "Alt") { altPresionado = false; return; }
        if (e.key === " ") { espacioPresionado = false; if (!arrastre) svgEl.style.cursor = ""; }
    });
}
