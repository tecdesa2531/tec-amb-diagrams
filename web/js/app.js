import { crearDocumento } from "./nucleo/modelo.js";
import { serializar, deserializar } from "./nucleo/formato.js";
import { renderizar } from "./ui/lienzo.js";

let docActual = crearDocumento();
let hayPendientes = false;

function nombreSlug(titulo) {
    return titulo.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-_]/g, "") || "sin-titulo";
}

function actualizarBarra() {
    const prefijo = hayPendientes ? "* " : "";
    document.getElementById("nombre-archivo").textContent = prefijo + docActual.documento.titulo;
    document.title = prefijo + "Ambito";
}

function marcarPendiente() {
    hayPendientes = true;
    actualizarBarra();
}

function limpiarPendiente() {
    hayPendientes = false;
    actualizarBarra();
}

function renderizarLienzo() {
    const raiz = document.getElementById("raiz");
    renderizar(raiz, docActual.elementos);
}

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

const modal    = document.getElementById("modal-guardar-como");
const inputNombre = document.getElementById("modal-nombre");

function abrirModalGuardarComo() {
    inputNombre.value = docActual.documento.titulo;
    modal.hidden = false;
    inputNombre.focus();
    inputNombre.select();
}

function cerrarModal() {
    modal.hidden = true;
}

function confirmarGuardarComo() {
    const titulo = inputNombre.value.trim();
    const slug   = nombreSlug(titulo);
    if (!slug || slug === "sin-titulo" && !titulo) return;
    cerrarModal();
    guardarConNombre(slug, titulo || "Sin titulo");
}

document.getElementById("modal-cancelar").addEventListener("click", cerrarModal);
document.getElementById("modal-confirmar").addEventListener("click", confirmarGuardarComo);

inputNombre.addEventListener("keydown", (e) => {
    if (e.key === "Enter")  confirmarGuardarComo();
    if (e.key === "Escape") cerrarModal();
});

// Cerrar al hacer clic en el fondo oscuro
modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });

// --- Botones de la barra ---

document.getElementById("btn-guardar").addEventListener("click", guardar);
document.getElementById("btn-guardar-como").addEventListener("click", abrirModalGuardarComo);

// --- Atajos de teclado ---

function registrarAtajos() {
    document.addEventListener("keydown", (e) => {
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && !e.shiftKey && e.key === "s") { e.preventDefault(); guardar(); }
        if (ctrl && e.shiftKey  && e.key === "S") { e.preventDefault(); abrirModalGuardarComo(); }
    });
}

// --- API de lectura ---

async function abrir(nombre) {
    try {
        const res = await fetch(`/api/diagramas/${nombre}`);
        if (!res.ok) return;
        docActual = deserializar(await res.text());
        renderizarLienzo();
        limpiarPendiente();
    } catch (e) {
        console.error("Error al abrir:", e);
    }
}

registrarAtajos();
renderizarLienzo();
limpiarPendiente();

console.log("Ambito iniciado");
