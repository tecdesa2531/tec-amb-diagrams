import { crearDocumento, crearElemento, crearGrupo, actualizarElemento, eliminarElemento, agregarElemento, registrarIcono } from "./nucleo/modelo.js";
import { serializar, deserializar } from "./nucleo/formato.js";
import { crearHistorial, empujar, deshacer as deshacerH, rehacer as rehacerH } from "./nucleo/historial.js";
import { descendientes, contenedorEn } from "./nucleo/grupos.js";
import { iniciar as iniciarLienzo, renderizar as renderizarL, ajustarAContenido, zoomEn, setSeleccion, limpiarSeleccion, obtenerSeleccion, moverSeleccion } from "./ui/lienzo.js";
import { iniciar as iniciarPaleta } from "./ui/paleta.js";
import { iniciar as iniciarProps, actualizar as actualizarProps } from "./ui/propiedades.js";
import { iniciar as iniciarBarra, actualizarZoom } from "./ui/barra.js";
import { iniciar as iniciarAtajos } from "./ui/atajos.js";

// --- Estado global ---
let docActual = crearDocumento();
let historialActual = empujar(crearHistorial(), docActual);
let hayPendientes = false;
let portapapeles = [];

// --- Barra superior ---
function nombreSlug(titulo) {
    return titulo.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-_]/g, "") || "sin-titulo";
}

function actualizarBarraTitulo() {
    const prefijo = hayPendientes ? "* " : "";
    document.getElementById("nombre-archivo").textContent = prefijo + docActual.documento.titulo;
    document.title = prefijo + "Ambito";
}

function marcarPendiente()  { hayPendientes = true;  actualizarBarraTitulo(); }
function limpiarPendiente() { hayPendientes = false; actualizarBarraTitulo(); }

// --- Renderizado ---
function renderizarLienzo() {
    renderizarL(docActual.elementos, docActual.iconos ?? {});
    actualizarProps(
        document.getElementById("propiedades"),
        docActual.elementos,
        obtenerSeleccion()
    );
}

// --- Mutacion del documento con historial ---
function aplicarCambio(nuevoDoc) {
    if (!nuevoDoc || nuevoDoc === docActual) return false;
    historialActual = empujar(historialActual, nuevoDoc);
    docActual = nuevoDoc;
    marcarPendiente();
    return true;
}

function accion(fn) {
    if (aplicarCambio(fn(docActual))) renderizarLienzo();
}

// --- Deshacer / Rehacer ---
function deshacer() {
    const { historial, doc } = deshacerH(historialActual);
    if (!doc) return;
    historialActual = historial;
    docActual = doc;
    marcarPendiente();
    renderizarLienzo();
}

function rehacer() {
    const { historial, doc } = rehacerH(historialActual);
    if (!doc) return;
    historialActual = historial;
    docActual = doc;
    marcarPendiente();
    renderizarLienzo();
}

// --- Guardar ---
async function guardarConNombre(nombre, titulo) {
    const docParaGuardar = { ...docActual, documento: { ...docActual.documento, titulo } };
    try {
        const resp = await fetch(`/api/diagramas/${nombre}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: serializar(docParaGuardar),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        docActual = docParaGuardar;
        limpiarPendiente();
    } catch (e) {
        console.error("Error al guardar:", e);
    }
}

function guardar() {
    guardarConNombre(nombreSlug(docActual.documento.titulo), docActual.documento.titulo);
}

// --- Modal guardar como ---
const modal       = document.getElementById("modal-guardar-como");
const inputNombre = document.getElementById("modal-nombre");

function abrirModalGuardarComo() {
    inputNombre.value = docActual.documento.titulo;
    modal.hidden = false;
    inputNombre.focus();
    inputNombre.select();
}

function cerrarModal() { modal.hidden = true; }

function confirmarGuardarComo() {
    const titulo = inputNombre.value.trim();
    const slug = nombreSlug(titulo);
    if (!slug) return;
    cerrarModal();
    guardarConNombre(slug, titulo || "Sin titulo");
}

document.getElementById("modal-cancelar").addEventListener("click", cerrarModal);
document.getElementById("modal-confirmar").addEventListener("click", confirmarGuardarComo);
inputNombre.addEventListener("keydown", e => {
    if (e.key === "Enter")  confirmarGuardarComo();
    if (e.key === "Escape") cerrarModal();
});
modal.addEventListener("click", e => { if (e.target === modal) cerrarModal(); });
document.getElementById("btn-guardar").addEventListener("click", guardar);
document.getElementById("btn-guardar-como").addEventListener("click", abrirModalGuardarComo);

// --- Abrir ---
async function abrir(nombre) {
    try {
        const res = await fetch(`/api/diagramas/${nombre}`);
        if (!res.ok) return;
        docActual = deserializar(await res.text());
        historialActual = empujar(crearHistorial(), docActual);
        limpiarSeleccion();
        renderizarLienzo();
        limpiarPendiente();
    } catch (e) {
        console.error("Error al abrir:", e);
    }
}

// --- Copiar / Pegar / Duplicar ---
function copiar() {
    const ids = [...obtenerSeleccion()];
    portapapeles = docActual.elementos.filter(e => ids.includes(e.id));
}

function pegar() {
    if (!portapapeles.length) return;
    const nuevosIds = [];
    let d = docActual;
    for (const el of portapapeles) {
        const pegado = { ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y + 20 };
        nuevosIds.push(pegado.id);
        d = agregarElemento(d, pegado);
    }
    if (aplicarCambio(d)) {
        setSeleccion(nuevosIds);
        renderizarLienzo();
    }
}

function duplicar() { copiar(); pegar(); }

// --- Callbacks del lienzo ---

// Mueve los elementos seleccionados, sus descendientes (si son grupos) y actualiza
// el padre de cada elemento movido segun donde termino (re-parentado Lucidchart).
function onMover(movidos) {
    accion(doc => {
        // Mapa de id -> nuevo {x, y} y delta
        const deltaMap = new Map();
        for (const m of movidos) {
            const orig = doc.elementos.find(e => e.id === m.id);
            if (orig) deltaMap.set(m.id, { newX: m.x, newY: m.y, dx: m.x - orig.x, dy: m.y - orig.y });
        }

        // Elementos que se mueven arrastrados por un grupo padre seleccionado
        const autoMovidos = new Map();
        for (const [id, { dx, dy }] of deltaMap) {
            const el = doc.elementos.find(e => e.id === id);
            if (el?.tipo !== "grupo") continue;
            for (const descId of descendientes(doc, id)) {
                if (deltaMap.has(descId)) continue;
                const desc = doc.elementos.find(e => e.id === descId);
                if (desc) autoMovidos.set(descId, { x: desc.x + dx, y: desc.y + dy });
            }
        }

        let d = doc;
        for (const { id, x, y } of movidos) d = actualizarElemento(d, id, { x, y });
        for (const [id, { x, y }] of autoMovidos) d = actualizarElemento(d, id, { x, y });

        // Re-parentado: cada elemento movido directamente puede cambiar de grupo padre
        const autoMovidosIds = new Set(autoMovidos.keys());
        for (const m of movidos) {
            if (autoMovidosIds.has(m.id)) continue;
            const el = d.elementos.find(e => e.id === m.id);
            if (!el) continue;
            const excluir = new Set([m.id, ...descendientes(d, m.id)]);
            const nuevoPadre = contenedorEn(d.elementos, m.x, m.y, el.ancho, el.alto, excluir);
            if (nuevoPadre !== el.padre) d = actualizarElemento(d, m.id, { padre: nuevoPadre });
        }

        return d;
    });
}

function onRedimensionar(id, geom) {
    accion(doc => actualizarElemento(doc, id, geom));
}

function onEtiqueta(id, etiqueta) {
    accion(doc => actualizarElemento(doc, id, { etiqueta }));
}

function onSeleccion(ids) {
    actualizarProps(document.getElementById("propiedades"), docActual.elementos, ids);
}

function onZoom(porcentaje) { actualizarZoom(porcentaje); }

async function onDrop(datos, x, y) {
    const esGrupo = datos.tipo === "grupo";
    const esIcono = datos.tipo === "icono";
    const ancho = esGrupo ? 300 : (esIcono ? 48 : 120);
    const alto  = esGrupo ? 200 : (esIcono ? 48 : 60);
    const cx = x - Math.round(ancho / 2);
    const cy = y - Math.round(alto / 2);

    let el;
    if (esGrupo) {
        el = crearGrupo(datos.subtipo, cx, cy, { etiqueta: datos.etiqueta ?? "" });
    } else {
        el = crearElemento(datos.tipo, cx, cy, { etiqueta: datos.etiqueta ?? "", icono: datos.icono ?? null });
    }

    let d = agregarElemento(docActual, el);

    // Detectar padre (re-parentado Lucidchart al soltar)
    const padre = contenedorEn(d.elementos, cx, cy, ancho, alto, new Set([el.id]));
    if (padre) d = actualizarElemento(d, el.id, { padre });

    // Embeber SVG para iconos
    if (esIcono && datos.icono && datos.ruta) {
        try {
            const res = await fetch(datos.ruta);
            const svg = await res.text();
            d = registrarIcono(d, datos.icono, { nombre: datos.etiqueta, ruta: datos.ruta, svg });
        } catch { /* seguir sin SVG embebido */ }
    }

    if (aplicarCambio(d)) {
        setSeleccion([el.id]);
        renderizarLienzo();
    }
}

// --- Callbacks del panel de propiedades ---
function onPropsCambio(id, cambios) {
    accion(doc => actualizarElemento(doc, id, cambios));
}

// --- Inicializacion ---
async function iniciar() {
    let itemsIconos = [];
    try {
        const res = await fetch("/api/iconos");
        if (res.ok) itemsIconos = await res.json();
    } catch { /* sin iconos */ }

    iniciarLienzo(
        document.getElementById("lienzo"),
        document.getElementById("raiz"),
        document.getElementById("lienzo-contenedor"),
        document.getElementById("etiqueta-editor"),
        { onMover, onRedimensionar, onEtiqueta, onSeleccion, onZoom, onDrop }
    );

    iniciarPaleta(document.getElementById("paleta"), itemsIconos);
    iniciarProps(document.getElementById("propiedades"), { onChange: onPropsCambio });

    iniciarBarra({
        onZoomMas:   () => zoomEn(1.25),
        onZoomMenos: () => zoomEn(0.8),
        onAjustar:   () => ajustarAContenido(docActual.elementos, [...obtenerSeleccion()].length > 0),
    });

    iniciarAtajos({
        guardar,
        guardarComo:     abrirModalGuardarComo,
        deshacer,
        rehacer,
        ajustar:         () => ajustarAContenido(docActual.elementos, [...obtenerSeleccion()].length > 0),
        seleccionarTodo: () => { setSeleccion(docActual.elementos.map(e => e.id)); actualizarProps(document.getElementById("propiedades"), docActual.elementos, obtenerSeleccion()); },
        copiar,
        pegar,
        duplicar,
        eliminar:        () => { const ids = [...obtenerSeleccion()]; if (!ids.length) return; accion(doc => ids.reduce((d, id) => eliminarElemento(d, id), doc)); limpiarSeleccion(); },
        escape:          () => { limpiarSeleccion(); onSeleccion(new Set()); },
        moverFlecha:     (dx, dy) => { moverSeleccion(dx, dy); },
    });

    renderizarLienzo();
    limpiarPendiente();
    console.log("Ambito iniciado");
}

iniciar();
