// Deshacer y rehacer por instantaneas del documento. Limite de 100 pasos.

const LIMITE = 100;

export function crearHistorial() {
    return { instantaneas: [], indice: -1 };
}

export function empujar(historial, doc) {
    const previas = historial.instantaneas.slice(0, historial.indice + 1);
    const nuevas = [...previas, doc].slice(-LIMITE);
    return { instantaneas: nuevas, indice: nuevas.length - 1 };
}

export function deshacer(historial) {
    if (!puedeDeshacer(historial)) return { historial, doc: null };
    const indice = historial.indice - 1;
    return { historial: { ...historial, indice }, doc: historial.instantaneas[indice] };
}

export function rehacer(historial) {
    if (!puedeRehacer(historial)) return { historial, doc: null };
    const indice = historial.indice + 1;
    return { historial: { ...historial, indice }, doc: historial.instantaneas[indice] };
}

export function puedeDeshacer(historial) {
    return historial.indice > 0;
}

export function puedeRehacer(historial) {
    return historial.indice < historial.instantaneas.length - 1;
}
