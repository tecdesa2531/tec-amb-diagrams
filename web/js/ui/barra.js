// Barra superior: controles de zoom y boton de ajustar a contenido.

let cb = {};

export function iniciar(callbacks) {
    cb = callbacks ?? {};
    document.getElementById("btn-zoom-mas").addEventListener("click",   () => cb.onZoomMas?.());
    document.getElementById("btn-zoom-menos").addEventListener("click", () => cb.onZoomMenos?.());
    document.getElementById("btn-ajustar").addEventListener("click",    () => cb.onAjustar?.());
}

export function actualizarZoom(porcentaje) {
    const el = document.getElementById("indicador-zoom");
    if (el) el.textContent = porcentaje + "%";
}
