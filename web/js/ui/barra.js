// Barra superior: controles de zoom, ajustar y exportar.

let cb = {};

function crearDropdownExportar() {
    const wrapper = document.createElement("div");
    wrapper.className = "exportar-wrapper";

    const btn = document.createElement("button");
    btn.id = "btn-exportar";
    btn.textContent = "Exportar";

    const menu = document.createElement("div");
    menu.id = "exportar-menu";
    menu.hidden = true;

    const opciones = [
        ["PNG 1x", () => cb.onExportarPNG?.(1)],
        ["PNG 2x", () => cb.onExportarPNG?.(2)],
        ["PNG 3x", () => cb.onExportarPNG?.(3)],
        ["PDF",    () => cb.onExportarPDF?.()],
    ];
    for (const [label, action] of opciones) {
        const item = document.createElement("button");
        item.className = "exportar-item";
        item.textContent = label;
        item.addEventListener("click", () => { menu.hidden = true; action(); });
        menu.appendChild(item);
    }

    btn.addEventListener("click", e => { e.stopPropagation(); menu.hidden = !menu.hidden; });
    document.addEventListener("click", () => { menu.hidden = true; });

    wrapper.appendChild(btn);
    wrapper.appendChild(menu);
    return wrapper;
}

export function iniciar(callbacks) {
    cb = callbacks ?? {};
    document.getElementById("btn-zoom-mas").addEventListener("click",   () => cb.onZoomMas?.());
    document.getElementById("btn-zoom-menos").addEventListener("click", () => cb.onZoomMenos?.());
    document.getElementById("btn-ajustar").addEventListener("click",    () => cb.onAjustar?.());
    document.getElementById("barra-acciones").appendChild(crearDropdownExportar());
}

export function actualizarZoom(porcentaje) {
    const el = document.getElementById("indicador-zoom");
    if (el) el.textContent = porcentaje + "%";
}
