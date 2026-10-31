// Modelo del documento: funciones puras sin DOM ni efectos secundarios.
// Cada funcion recibe el documento actual y devuelve uno nuevo (inmutable).

export function crearDocumento(titulo = "Sin titulo") {
    const ahora = new Date().toISOString();
    return {
        formato: "ambito",
        version: 1,
        documento: { titulo, creado: ahora, modificado: ahora },
        lienzo: { cuadricula: 10 },
        elementos: [],
        conectores: [],
    };
}

export function crearElemento(tipo, x, y, opciones = {}) {
    return {
        id: crypto.randomUUID(),
        tipo,
        x,
        y,
        ancho: opciones.ancho ?? 120,
        alto: opciones.alto ?? 60,
        etiqueta: opciones.etiqueta ?? "",
        estilo: opciones.estilo ?? {},
    };
}

export function crearConector(origenId, destinoId, opciones = {}) {
    return {
        id: crypto.randomUUID(),
        origen: { elementoId: origenId, modo: "auto" },
        destino: { elementoId: destinoId, modo: "auto" },
        quiebres: [],
        etiqueta: opciones.etiqueta ?? "",
        estilo: opciones.estilo ?? {},
    };
}

function tocarFecha(doc) {
    return { ...doc, documento: { ...doc.documento, modificado: new Date().toISOString() } };
}

export function agregarElemento(doc, elemento) {
    return tocarFecha({ ...doc, elementos: [...doc.elementos, elemento] });
}

export function actualizarElemento(doc, id, cambios) {
    const elementos = doc.elementos.map(e => e.id === id ? { ...e, ...cambios } : e);
    return tocarFecha({ ...doc, elementos });
}

export function eliminarElemento(doc, id) {
    const elementos = doc.elementos.filter(e => e.id !== id);
    const conectores = doc.conectores.filter(
        c => c.origen.elementoId !== id && c.destino.elementoId !== id
    );
    return tocarFecha({ ...doc, elementos, conectores });
}

export function agregarConector(doc, conector) {
    return tocarFecha({ ...doc, conectores: [...doc.conectores, conector] });
}

export function actualizarConector(doc, id, cambios) {
    const conectores = doc.conectores.map(c => c.id === id ? { ...c, ...cambios } : c);
    return tocarFecha({ ...doc, conectores });
}

export function eliminarConector(doc, id) {
    return tocarFecha({ ...doc, conectores: doc.conectores.filter(c => c.id !== id) });
}
