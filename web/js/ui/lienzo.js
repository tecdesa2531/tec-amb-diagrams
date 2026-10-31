// Lienzo SVG interactivo: pan/zoom, seleccion, mover, redimensionar, editar etiqueta.

import { TIPOS_GRUPO } from "../nucleo/modelo.js";
import { contenedorEn, ordenDibujo } from "../nucleo/grupos.js";

const NS = "http://www.w3.org/2000/svg";
const ESCALA_MIN = 0.25;
const ESCALA_MAX = 4.0;
const MARGEN = 40;
const H_HANDLE = 8; // pixels en pantalla

// --- Estado del modulo ---
let svgEl, raizEl, contEl, editorEl;
let tx = 0, ty = 0, escala = 1.0;
let seleccionIds = new Set();
let cb = {};
let elementosActuales = [], iconosActuales = {};
let overlayEl = null, bandaEl = null, highlightEl = null;
let arrastre = null;
let editandoId = null;
let espacioPresionado = false;
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
        fill: def.borde + "20",
        stroke: def.borde,
        "stroke-width": 3 / escala,
        rx: 6 / escala,
        "pointer-events": "none",
    }));
}

function ocultarHighlight() {
    grupoHighlightId = null;
    highlightEl.innerHTML = "";
}

// --- Renderizado de elementos ---
function nodoCaja(el) {
    const g = nodo("g", { "data-id": el.id, "data-tipo": el.tipo, cursor: "move" });
    g.appendChild(nodo("rect", { x: el.x, y: el.y, width: el.ancho, height: el.alto, fill: "#ffffff", stroke: "#9BA7B4", "stroke-width": "1.5", rx: "4" }));
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
    if (datos.svg) {
        href = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(datos.svg)));
    } else if (datos.ruta) {
        href = datos.ruta;
    }
    if (href) {
        g.appendChild(nodo("image", { x: el.x, y: el.y, width: el.ancho, height: el.alto, href }));
    }
    if (el.etiqueta) {
        const t = nodo("text", { x: el.x + el.ancho / 2, y: el.y + el.alto + 14, "text-anchor": "middle", "font-size": "12", "font-family": "system-ui, sans-serif", fill: "#232F3E" });
        t.textContent = el.etiqueta;
        g.appendChild(t);
    }
    return g;
}

function nodoGrupo(el) {
    const def = TIPOS_GRUPO[el.subtipo] ?? TIPOS_GRUPO["generico"];
    const g = nodo("g", { "data-id": el.id, "data-tipo": "grupo", cursor: "move" });
    const dasharray = def.linea === "discontinua" ? "8 4" : "none";
    g.appendChild(nodo("rect", {
        x: el.x, y: el.y, width: el.ancho, height: el.alto,
        fill: def.relleno ?? "none",
        stroke: def.borde,
        "stroke-width": "2",
        rx: "4",
        "stroke-dasharray": dasharray,
    }));
    // Etiqueta en la esquina superior izquierda, dentro del borde
    const etiq = el.etiqueta || def.nombre;
    const t = nodo("text", {
        x: el.x + 8, y: el.y + 16,
        "font-size": "11", "font-family": "system-ui, sans-serif",
        fill: def.borde, "font-weight": "600",
        "pointer-events": "none",
    });
    t.textContent = etiq;
    g.appendChild(t);
    return g;
}

function nodoElemento(el, iconos) {
    if (el.tipo === "grupo") return nodoGrupo(el);
    if (el.tipo === "icono") return nodoIcono(el, iconos);
    return nodoCaja(el);
}

// --- Seleccion visual ---
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
        { n: "nw", x: bb.x,              y: bb.y,             cur: "nw-resize" },
        { n: "n",  x: bb.x+bb.ancho/2,   y: bb.y,             cur: "n-resize"  },
        { n: "ne", x: bb.x+bb.ancho,      y: bb.y,             cur: "ne-resize" },
        { n: "e",  x: bb.x+bb.ancho,      y: bb.y+bb.alto/2,  cur: "e-resize"  },
        { n: "se", x: bb.x+bb.ancho,      y: bb.y+bb.alto,    cur: "se-resize" },
        { n: "s",  x: bb.x+bb.ancho/2,   y: bb.y+bb.alto,    cur: "s-resize"  },
        { n: "sw", x: bb.x,              y: bb.y+bb.alto,    cur: "sw-resize" },
        { n: "w",  x: bb.x,              y: bb.y+bb.alto/2,  cur: "w-resize"  },
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
export function renderizar(elementos, iconos) {
    elementosActuales = elementos;
    iconosActuales = iconos ?? {};
    Array.from(raizEl.children).filter(n => n.dataset?.id).forEach(n => n.remove());
    for (const el of ordenDibujo(elementos)) {
        raizEl.insertBefore(nodoElemento(el, iconosActuales), overlayEl);
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

export function setSeleccion(ids) {
    seleccionIds = new Set(ids);
    dibujarSeleccion();
}

export function limpiarSeleccion() { setSeleccion([]); }
export function obtenerSeleccion() { return new Set(seleccionIds); }
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
    const handle = e.target.dataset?.handle;
    if (handle && seleccionIds.size === 1) {
        const [id] = [...seleccionIds];
        const el = elementosActuales.find(e2 => e2.id === id);
        if (!el) return;
        arrastre = { tipo: "resize", handle, el, x0: el.x, y0: el.y, w0: el.ancho, h0: el.alto, sx: e.clientX, sy: e.clientY };
        svgEl.setPointerCapture(e.pointerId);
        return;
    }
    const nodoEl = e.target.closest("[data-id]");
    if (nodoEl) {
        const id = nodoEl.dataset.id;
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
    if (!e.shiftKey) { seleccionIds = new Set(); cb.onSeleccion?.(new Set()); dibujarSeleccion(); }
    const { x, y } = screenACanvas(e.clientX, e.clientY);
    arrastre = { tipo: "banda", sx: e.clientX, sy: e.clientY, cx: x, cy: y };
    svgEl.setPointerCapture(e.pointerId);
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

// Detecta el grupo contenedor potencial para la seleccion en movimiento.
function grupoContenedorParaMover(dx, dy) {
    const seleccionados = elementosActuales.filter(e => seleccionIds.has(e.id));
    if (seleccionados.length === 0) return null;
    const bb = boundingBox(seleccionados.map(e => ({ ...e, x: e.x + dx, y: e.y + dy })));
    return contenedorEn(elementosActuales, bb.x, bb.y, bb.ancho, bb.alto, new Set(seleccionIds));
}

function onPointerMove(e) {
    if (!arrastre) return;
    if (arrastre.tipo === "pan") {
        tx = arrastre.tx0 + e.clientX - arrastre.sx;
        ty = arrastre.ty0 + e.clientY - arrastre.sy;
        aplicarTransform(); return;
    }
    if (arrastre.tipo === "mover") {
        const dx = (e.clientX - arrastre.sx) / escala;
        const dy = (e.clientY - arrastre.sy) / escala;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) arrastre.movido = true;
        if (!arrastre.movido) return;
        for (const id of seleccionIds) {
            const nodoEl = raizEl.querySelector(`[data-id="${id}"]`);
            if (nodoEl) nodoEl.setAttribute("transform", `translate(${Math.round(dx)},${Math.round(dy)})`);
        }
        const tempEls = elementosActuales.map(el => seleccionIds.has(el.id) ? { ...el, x: arrastre.posIni[el.id].x + dx, y: arrastre.posIni[el.id].y + dy } : el);
        dibujarSeleccionDe(tempEls.filter(el => seleccionIds.has(el.id)));
        // Highlight del grupo contenedor al estilo Lucidchart
        mostrarHighlight(grupoContenedorParaMover(dx, dy));
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
    if (arrastre.tipo === "mover" && arrastre.movido) {
        const dx = (e.clientX - arrastre.sx) / escala;
        const dy = (e.clientY - arrastre.sy) / escala;
        const movidos = elementosActuales.filter(el => seleccionIds.has(el.id)).map(el => ({ id: el.id, x: Math.round(arrastre.posIni[el.id].x + dx), y: Math.round(arrastre.posIni[el.id].y + dy) }));
        ocultarHighlight();
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
    for (const id of seleccionIds) {
        raizEl.querySelector(`[data-id="${id}"]`)?.removeAttribute("transform");
    }
    arrastre = null;
    svgEl.style.cursor = "";
}

// --- Editor de etiqueta ---
function onDblClick(e) {
    if (editandoId) { confirmarEdicion(); return; }
    const nodoEl = e.target.closest("[data-id]");
    if (!nodoEl) return;
    const el = elementosActuales.find(e2 => e2.id === nodoEl.dataset.id);
    if (!el) return;
    editandoId = el.id;
    const r = svgEl.getBoundingClientRect();
    const sx = el.x * escala + tx + r.left;
    const sy = el.y * escala + ty + r.top;
    editorEl.value = el.etiqueta ?? "";
    editorEl.style.left   = sx + "px";
    editorEl.style.top    = sy + "px";
    editorEl.style.width  = (el.ancho * escala) + "px";
    editorEl.style.height = (el.alto * escala) + "px";
    editorEl.style.fontSize = Math.max(10, 13 * escala) + "px";
    editorEl.hidden = false;
    editorEl.focus();
    editorEl.select();
}

function confirmarEdicion() {
    if (!editandoId) return;
    const id = editandoId;
    editandoId = null;
    editorEl.hidden = true;
    cb.onEtiqueta?.(id, editorEl.value);
}

function cancelarEdicion() {
    editandoId = null;
    editorEl.hidden = true;
}

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

    highlightEl = nodo("g", { id: "highlight-grupo", "pointer-events": "none" });
    raizEl.appendChild(highlightEl);

    overlayEl = nodo("g", { id: "overlay-sel", "pointer-events": "all" });
    raizEl.appendChild(overlayEl);

    bandaEl = nodo("rect", { id: "banda-sel", fill: "rgba(9,114,211,0.08)", stroke: "#0972D3", "stroke-width": "1", display: "none" });
    svgEl.appendChild(bandaEl);

    svgEl.addEventListener("wheel", onRueda, { passive: false });
    svgEl.addEventListener("pointerdown", onPointerDown);
    svgEl.addEventListener("pointermove", onPointerMove);
    svgEl.addEventListener("pointerup", onPointerUp);
    svgEl.addEventListener("dblclick", onDblClick);
    contEl.addEventListener("dragover", onDragOver);
    contEl.addEventListener("dragleave", onDragLeave);
    contEl.addEventListener("drop", onDrop);

    editorEl.addEventListener("blur", confirmarEdicion);
    editorEl.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); confirmarEdicion(); }
        if (e.key === "Escape") { cancelarEdicion(); }
    });

    document.addEventListener("keydown", e => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        if (e.key === " ") { e.preventDefault(); espacioPresionado = true; svgEl.style.cursor = "grab"; }
    });
    document.addEventListener("keyup", e => {
        if (e.key === " ") { espacioPresionado = false; if (!arrastre) svgEl.style.cursor = ""; }
    });
}
