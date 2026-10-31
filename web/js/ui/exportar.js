// Exportaciones: PNG a 1x/2x/3x y PDF del navegador.

const NS = "http://www.w3.org/2000/svg";
const MARGEN = 24;

function boundingBox(elementos) {
    if (!elementos.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of elementos) {
        minX = Math.min(minX, e.x); minY = Math.min(minY, e.y);
        maxX = Math.max(maxX, e.x + e.ancho); maxY = Math.max(maxY, e.y + e.alto);
    }
    return { x: minX, y: minY, ancho: maxX - minX, alto: maxY - minY };
}

function clonarSVGLimpio(svgEl, elementos) {
    const bb = boundingBox(elementos);
    if (!bb) return null;
    const vx = bb.x - MARGEN, vy = bb.y - MARGEN;
    const vw = bb.ancho + MARGEN * 2, vh = bb.alto + MARGEN * 2;

    const clone = svgEl.cloneNode(true);
    clone.setAttribute("xmlns", NS);
    clone.setAttribute("viewBox", `${vx} ${vy} ${vw} ${vh}`);
    clone.setAttribute("width", vw);
    clone.setAttribute("height", vh);
    clone.removeAttribute("style");
    clone.removeAttribute("id");

    // Eliminar transformacion de pan/zoom para usar coordenadas canvas directas
    clone.querySelector("#raiz")?.removeAttribute("transform");

    for (const sel of ["#fondo-cuadricula", "#banda-sel", "#guias-visual", "#overlay-sel", "#puntos-conexion", "#preview-conector", "#highlight-grupo"]) {
        clone.querySelector(sel)?.remove();
    }

    const bg = document.createElementNS(NS, "rect");
    bg.setAttribute("x", vx); bg.setAttribute("y", vy);
    bg.setAttribute("width", vw); bg.setAttribute("height", vh);
    bg.setAttribute("fill", "#ffffff");
    clone.insertBefore(bg, clone.firstChild);

    return { clone, vw, vh };
}

export async function exportarPNG(svgEl, elementos, factor, titulo) {
    const res = clonarSVGLimpio(svgEl, elementos);
    if (!res) return;
    const { clone, vw, vh } = res;

    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width  = Math.round(vw * factor);
            canvas.height = Math.round(vh * factor);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            canvas.toBlob(blob2 => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob2);
                a.download = (titulo || "diagrama") + "-" + factor + "x.png";
                a.click();
                URL.revokeObjectURL(a.href);
                resolve();
            }, "image/png");
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        img.src = url;
    });
}

export function exportarPDF() {
    window.print();
}
