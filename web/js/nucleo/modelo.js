// Modelo del documento: funciones puras sin DOM ni efectos secundarios.
// Cada funcion recibe el documento actual y devuelve uno nuevo (inmutable).

export const TIPOS_GRUPO = {
    "aws-cloud":           { nombre: "AWS Cloud",             borde: "#232F3E", relleno: null,       linea: "continua" },
    "cuenta":              { nombre: "AWS Account",           borde: "#E7157B", relleno: null,       linea: "continua" },
    "region":              { nombre: "Region",                borde: "#00A4A6", relleno: null,       linea: "discontinua" },
    "vpc":                 { nombre: "VPC",                   borde: "#8C4FFF", relleno: null,       linea: "continua" },
    "zona-disponibilidad": { nombre: "Availability Zone",    borde: "#00A4A6", relleno: null,       linea: "discontinua" },
    "subnet-publica":      { nombre: "Public subnet",         borde: "#7AA116", relleno: "#F2F6E8",  linea: "continua" },
    "subnet-privada":      { nombre: "Private subnet",        borde: "#00A4A6", relleno: "#E6F6F7",  linea: "continua" },
    "security-group":      { nombre: "Security group",        borde: "#DD344C", relleno: null,       linea: "continua" },
    "auto-scaling":        { nombre: "Auto Scaling group",    borde: "#ED7100", relleno: null,       linea: "discontinua" },
    "centro-datos":        { nombre: "Corporate data center", borde: "#7D8998", relleno: null,       linea: "continua" },
    "generico":            { nombre: "Grupo generico",        borde: "#7D8998", relleno: null,       linea: "discontinua" },
};

export function crearGrupo(subtipo, x, y, opciones = {}) {
    const def = TIPOS_GRUPO[subtipo] ?? TIPOS_GRUPO["generico"];
    return {
        id: crypto.randomUUID(),
        tipo: "grupo",
        subtipo,
        x, y,
        ancho: opciones.ancho ?? 300,
        alto:  opciones.alto  ?? 200,
        etiqueta: opciones.etiqueta ?? def.nombre,
        padre: opciones.padre ?? null,
        estilo: opciones.estilo ?? {},
    };
}

export function crearDocumento(titulo = "Sin titulo") {
    const ahora = new Date().toISOString();
    return {
        formato: "ambito",
        version: 1,
        documento: { titulo, creado: ahora, modificado: ahora },
        lienzo: { cuadricula: 10 },
        iconos: {},
        elementos: [],
        conectores: [],
    };
}

export function crearElemento(tipo, x, y, opciones = {}) {
    const esIcono = tipo === "icono";
    return {
        id: crypto.randomUUID(),
        tipo,
        x,
        y,
        ancho: opciones.ancho ?? (esIcono ? 48 : 120),
        alto: opciones.alto ?? (esIcono ? 48 : 60),
        etiqueta: opciones.etiqueta ?? "",
        padre: opciones.padre ?? null,
        ...(esIcono ? { icono: opciones.icono ?? null } : {}),
        estilo: opciones.estilo ?? {},
    };
}

export function registrarIcono(doc, id, datos) {
    if (doc.iconos[id]) return doc;
    return { ...doc, iconos: { ...doc.iconos, [id]: datos } };
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
    const elementos = doc.elementos
        .filter(e => e.id !== id)
        .map(e => e.padre === id ? { ...e, padre: null } : e);
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
