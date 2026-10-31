// Guias inteligentes de alineacion: logica pura sin DOM.

const GRID = 10;

export function calcularGuias(el, todos) {
    const guias = [];
    for (const otro of todos) {
        if (otro.id === el.id) continue;
        const ocx = otro.x + otro.ancho / 2;
        const ocy = otro.y + otro.alto  / 2;
        guias.push({ eje: "x", valor: otro.x,              tipo: "borde",  origen: otro.id });
        guias.push({ eje: "x", valor: otro.x + otro.ancho, tipo: "borde",  origen: otro.id });
        guias.push({ eje: "x", valor: ocx,                  tipo: "centro", origen: otro.id });
        guias.push({ eje: "y", valor: otro.y,              tipo: "borde",  origen: otro.id });
        guias.push({ eje: "y", valor: otro.y + otro.alto,  tipo: "borde",  origen: otro.id });
        guias.push({ eje: "y", valor: ocy,                  tipo: "centro", origen: otro.id });
    }
    return guias;
}

// Devuelve {x, y, guiasActivas}. Con altPresionado, sin snap (posicion libre).
export function aplicarSnap(x, y, ancho, alto, guias, escala, altPresionado, grid = GRID) {
    if (altPresionado) return { x, y, guiasActivas: [] };
    const umbral = 8 / escala;
    const { val: nx, guia: guiaX } = snapEje(x, ancho, guias.filter(g => g.eje === "x"), umbral, grid);
    const { val: ny, guia: guiaY } = snapEje(y, alto,  guias.filter(g => g.eje === "y"), umbral, grid);
    const guiasActivas = [];
    if (guiaX) guiasActivas.push(guiaX);
    if (guiaY) guiasActivas.push(guiaY);
    return { x: nx, y: ny, guiasActivas };
}

// Candidatos de enganche: borde izq/top, borde der/bot, centro
function snapEje(pos, tam, guias, umbral, grid) {
    const offsets = [0, tam, tam / 2];
    let mejor = umbral, val = null, guia = null;
    for (const offset of offsets) {
        const borde = pos + offset;
        for (const g of guias) {
            const d = Math.abs(borde - g.valor);
            if (d < mejor) { mejor = d; val = g.valor - offset; guia = g; }
        }
    }
    if (val !== null) return { val, guia };
    return { val: Math.round(pos / grid) * grid, guia: null };
}

// Detecta grupos de 3+ elementos con espaciado igual entre bordes consecutivos.
export function detectarEspaciadoIgual(elementos) {
    const resultados = [];
    if (elementos.length < 3) return resultados;
    const porX = [...elementos].sort((a, b) => a.x - b.x);
    const porY = [...elementos].sort((a, b) => a.y - b.y);
    resultados.push(...gruposEspaciado(porX, "x"));
    resultados.push(...gruposEspaciado(porY, "y"));
    return resultados;
}

function gruposEspaciado(ordenados, eje) {
    const resultado = [];
    for (let i = 0; i + 2 < ordenados.length; i++) {
        const a = ordenados[i], b = ordenados[i+1], c = ordenados[i+2];
        const d1 = eje === "x" ? b.x - (a.x + a.ancho) : b.y - (a.y + a.alto);
        const d2 = eje === "x" ? c.x - (b.x + b.ancho) : c.y - (b.y + b.alto);
        if (d1 > 0 && Math.abs(d1 - d2) <= 2) {
            resultado.push({ eje, distancia: Math.round(d1), ids: [a.id, b.id, c.id] });
        }
    }
    return resultado;
}

// Alinea los elementos segun el tipo dado. Devuelve [{id, x?}, {id, y?}].
export function alinear(ids, elementos, tipo) {
    const targets = elementos.filter(e => ids.includes(e.id));
    if (targets.length < 2) return [];
    const ref = calcularRefAlineacion(targets, tipo);
    return targets.map(e => mapearAlineacion(e, tipo, ref));
}

function calcularRefAlineacion(targets, tipo) {
    switch (tipo) {
        case "left":    return Math.min(...targets.map(e => e.x));
        case "right":   return Math.max(...targets.map(e => e.x + e.ancho));
        case "top":     return Math.min(...targets.map(e => e.y));
        case "bottom":  return Math.max(...targets.map(e => e.y + e.alto));
        case "centerH": return targets.reduce((s, e) => s + (e.x + e.ancho / 2), 0) / targets.length;
        case "centerV": return targets.reduce((s, e) => s + (e.y + e.alto  / 2), 0) / targets.length;
        default:        return 0;
    }
}

function mapearAlineacion(e, tipo, ref) {
    switch (tipo) {
        case "left":    return { id: e.id, x: Math.round(ref) };
        case "right":   return { id: e.id, x: Math.round(ref - e.ancho) };
        case "top":     return { id: e.id, y: Math.round(ref) };
        case "bottom":  return { id: e.id, y: Math.round(ref - e.alto) };
        case "centerH": return { id: e.id, x: Math.round(ref - e.ancho / 2) };
        case "centerV": return { id: e.id, y: Math.round(ref - e.alto  / 2) };
        default:        return { id: e.id };
    }
}

// Distribuye elementos con espaciado igual entre ellos sobre el eje dado.
export function distribuir(ids, elementos, eje) {
    const targets = elementos.filter(e => ids.includes(e.id));
    if (targets.length < 3) return [];
    if (eje === "x") {
        const sorted = [...targets].sort((a, b) => a.x - b.x);
        const inicio = sorted[0].x;
        const fin = sorted.at(-1).x + sorted.at(-1).ancho;
        const totalAncho = sorted.reduce((s, e) => s + e.ancho, 0);
        const espacio = (fin - inicio - totalAncho) / (sorted.length - 1);
        let cx = inicio;
        return sorted.map(e => { const r = { id: e.id, x: Math.round(cx) }; cx += e.ancho + espacio; return r; });
    }
    const sorted = [...targets].sort((a, b) => a.y - b.y);
    const inicio = sorted[0].y;
    const fin = sorted.at(-1).y + sorted.at(-1).alto;
    const totalAlto = sorted.reduce((s, e) => s + e.alto, 0);
    const espacio = (fin - inicio - totalAlto) / (sorted.length - 1);
    let cy = inicio;
    return sorted.map(e => { const r = { id: e.id, y: Math.round(cy) }; cy += e.alto + espacio; return r; });
}

// Iguala tamano de todos los seleccionados al del primero.
export function igualarTamano(ids, elementos, referencia) {
    const targets = elementos.filter(e => ids.includes(e.id));
    if (targets.length < 2) return [];
    const ref = targets[0];
    return targets.slice(1).map(e => {
        const cambios = { id: e.id };
        if (referencia === "ancho" || referencia === "ambos") cambios.ancho = ref.ancho;
        if (referencia === "alto"  || referencia === "ambos") cambios.alto  = ref.alto;
        return cambios;
    });
}
