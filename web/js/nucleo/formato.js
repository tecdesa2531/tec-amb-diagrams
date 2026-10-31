// Serializacion, validacion y migracion del formato .ambito
// Estas funciones son puras: no tocan el DOM ni el disco.

export function validar(obj) {
    if (!obj || typeof obj !== "object") throw new Error("El documento no es un objeto");
    if (obj.formato !== "ambito") throw new Error(`Formato desconocido: ${JSON.stringify(obj.formato)}`);
    if (typeof obj.version !== "number") throw new Error("El campo version debe ser un numero");
    if (!obj.documento || typeof obj.documento !== "object") throw new Error("El campo documento es obligatorio");
    if (typeof obj.documento.titulo !== "string") throw new Error("El titulo debe ser una cadena");
    if (!Array.isArray(obj.elementos)) throw new Error("El campo elementos debe ser un arreglo");
    if (!Array.isArray(obj.conectores)) throw new Error("El campo conectores debe ser un arreglo");
}

export function migrar(obj) {
    // Solo existe v1. Las versiones futuras se migran aqui antes de llegar al modelo.
    return obj;
}

export function serializar(doc) {
    return JSON.stringify({
        formato: doc.formato,
        version: doc.version,
        documento: { ...doc.documento },
        lienzo: { ...doc.lienzo },
        iconos: { ...(doc.iconos ?? {}) },
        elementos: doc.elementos.map(e => ({ ...e })),
        conectores: doc.conectores.map(c => ({ ...c })),
    }, null, 2);
}

export function deserializar(json) {
    let obj;
    try {
        obj = JSON.parse(json);
    } catch (e) {
        throw new Error(`JSON invalido: ${e.message}`);
    }
    validar(obj);
    return migrar(obj);
}
