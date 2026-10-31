// Renderizado SVG del lienzo. Solo dibuja cajas simples en Fase 1.
// En Fase 2 se agrega pan/zoom, iconos y seleccion.

const NS = "http://www.w3.org/2000/svg";

function svgElemento(tag, atributos) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v);
    return el;
}

function dibujarCaja(elemento) {
    const grupo = svgElemento("g", { "data-id": elemento.id });

    grupo.appendChild(svgElemento("rect", {
        x: elemento.x,
        y: elemento.y,
        width: elemento.ancho,
        height: elemento.alto,
        fill: "#ffffff",
        stroke: "#9BA7B4",
        "stroke-width": "1.5",
        rx: "4",
    }));

    if (elemento.etiqueta) {
        const texto = svgElemento("text", {
            x: elemento.x + elemento.ancho / 2,
            y: elemento.y + elemento.alto / 2,
            "text-anchor": "middle",
            "dominant-baseline": "middle",
            "font-size": "13",
            "font-family": "system-ui, sans-serif",
            fill: "#232F3E",
        });
        texto.textContent = elemento.etiqueta;
        grupo.appendChild(texto);
    }

    return grupo;
}

export function renderizar(raiz, elementos) {
    raiz.innerHTML = "";
    for (const elemento of elementos) {
        raiz.appendChild(dibujarCaja(elemento));
    }
}
