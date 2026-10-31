// Logica pura de grupos de red AWS: jerarquia, ordenamiento y deteccion de contenedor.

export function esGrupo(tipo) {
    return tipo === "grupo";
}

// Todos los ids de elementos que son descendientes directos o indirectos de id.
export function descendientes(doc, id) {
    const resultado = new Set();
    const cola = doc.elementos.filter(e => e.padre === id).map(e => e.id);
    while (cola.length > 0) {
        const curr = cola.shift();
        resultado.add(curr);
        doc.elementos.filter(e => e.padre === curr).forEach(e => cola.push(e.id));
    }
    return resultado;
}

// Id del grupo mas interior que contiene completamente el rectangulo (x,y,ancho,alto).
// excluirIds: Set de ids a ignorar (el propio elemento y sus descendientes).
export function contenedorEn(elementos, x, y, ancho, alto, excluirIds = new Set()) {
    const grupos = elementos.filter(e => e.tipo === "grupo" && !excluirIds.has(e.id));
    // Menor area primero: el grupo mas interior (mas pequeno) tiene prioridad.
    grupos.sort((a, b) => (a.ancho * a.alto) - (b.ancho * b.alto));
    for (const g of grupos) {
        if (x >= g.x && y >= g.y && x + ancho <= g.x + g.ancho && y + alto <= g.y + g.alto) {
            return g.id;
        }
    }
    return null;
}

// Ordena elementos para el dibujado SVG: grupos de mayor nivel primero (al fondo),
// hojas al final (encima). Dentro del mismo nivel los grupos van antes que las hojas.
export function ordenDibujo(elementos) {
    const idAEl = new Map(elementos.map(e => [e.id, e]));
    const cache = new Map();

    function profundidad(id, visto = new Set()) {
        if (cache.has(id)) return cache.get(id);
        if (visto.has(id)) return 0;
        visto.add(id);
        const el = idAEl.get(id);
        const p = el?.padre ? 1 + profundidad(el.padre, visto) : 0;
        cache.set(id, p);
        return p;
    }

    return [...elementos].sort((a, b) => {
        const da = profundidad(a.id);
        const db = profundidad(b.id);
        if (da !== db) return da - db;
        if (a.tipo === "grupo" && b.tipo !== "grupo") return -1;
        if (a.tipo !== "grupo" && b.tipo === "grupo") return 1;
        return 0;
    });
}
