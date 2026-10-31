// Panel izquierdo: buscador, formas basicas e iconos AWS con drag-to-canvas.

import { buscar } from "../nucleo/catalogo.js";

const FORMAS = [
    { tipo: "caja",   etiqueta: "Caja",  simbolo: "B" },
    { tipo: "texto",  etiqueta: "Texto", simbolo: "T" },
];

function crearItemDraggable(datos) {
    const item = document.createElement("div");
    item.className = "paleta-item";
    item.draggable = true;
    item.title = datos.nombre ?? datos.etiqueta ?? datos.tipo;

    if (datos.ruta) {
        const img = document.createElement("img");
        img.src = datos.ruta;
        img.alt = datos.nombre ?? "";
        img.className = "paleta-item-img";
        item.appendChild(img);
    } else {
        const ic = document.createElement("span");
        ic.className = "paleta-forma-icono";
        ic.textContent = datos.simbolo ?? datos.tipo[0].toUpperCase();
        item.appendChild(ic);
    }

    const lbl = document.createElement("span");
    lbl.className = "paleta-item-nombre";
    lbl.textContent = datos.nombre ?? datos.etiqueta ?? datos.tipo;
    item.appendChild(lbl);

    item.addEventListener("dragstart", e => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", JSON.stringify({
            tipo:     datos.tipo,
            icono:    datos.icono ?? null,
            etiqueta: datos.nombre ?? datos.etiqueta ?? "",
            ruta:     datos.ruta ?? null,
        }));
    });
    return item;
}

function renderizarFormas(contenedor) {
    const titulo = document.createElement("p");
    titulo.className = "paleta-seccion-titulo";
    titulo.textContent = "Formas";
    contenedor.appendChild(titulo);
    for (const f of FORMAS) contenedor.appendChild(crearItemDraggable(f));
}

function renderizarIconos(contenedor, items) {
    contenedor.innerHTML = "";
    if (items.length === 0) {
        const msg = document.createElement("p");
        msg.className = "paleta-mensaje";
        msg.textContent = "No hay iconos. Agrega el paquete AWS a la carpeta iconos/.";
        contenedor.appendChild(msg);
        return;
    }
    for (const item of items) {
        contenedor.appendChild(crearItemDraggable({ ...item, tipo: "icono", icono: item.id }));
    }
}

export function iniciar(panel, items) {
    panel.innerHTML = "";

    const buscarEl = document.createElement("input");
    buscarEl.type = "text";
    buscarEl.id = "paleta-buscar";
    buscarEl.placeholder = "Buscar icono...";
    buscarEl.autocomplete = "off";
    panel.appendChild(buscarEl);

    const secFormas = document.createElement("div");
    secFormas.className = "paleta-seccion";
    renderizarFormas(secFormas);
    panel.appendChild(secFormas);

    const secTituloIconos = document.createElement("p");
    secTituloIconos.className = "paleta-seccion-titulo";
    secTituloIconos.textContent = "Iconos AWS";
    panel.appendChild(secTituloIconos);

    const secIconos = document.createElement("div");
    secIconos.className = "paleta-seccion paleta-grid";
    renderizarIconos(secIconos, items);
    panel.appendChild(secIconos);

    buscarEl.addEventListener("input", () => {
        renderizarIconos(secIconos, buscar(items, buscarEl.value));
    });
}
