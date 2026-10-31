// Trazado ortogonal de conectores: logica pura sin DOM.

const STUB = 20;
const OPUESTO = { E: "W", W: "E", N: "S", S: "N" };

export function puntosConexion(el) {
    const cx = el.x + el.ancho / 2;
    const cy = el.y + el.alto  / 2;
    return {
        N: { x: cx,               y: el.y            },
        S: { x: cx,               y: el.y + el.alto   },
        E: { x: el.x + el.ancho,  y: cy              },
        W: { x: el.x,             y: cy              },
    };
}

export function ladoAutoOrigen(elO, elD) {
    const dx = (elD.x + elD.ancho / 2) - (elO.x + elO.ancho / 2);
    const dy = (elD.y + elD.alto  / 2) - (elO.y + elO.alto  / 2);
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "E" : "W";
    return dy >= 0 ? "S" : "N";
}

export { OPUESTO };

export function trazarOrtogonal(p1, lado1, p2, lado2) {
    function salida(p, lado) {
        if (lado === "E") return { x: p.x + STUB, y: p.y };
        if (lado === "W") return { x: p.x - STUB, y: p.y };
        if (lado === "S") return { x: p.x,        y: p.y + STUB };
        return               { x: p.x,        y: p.y - STUB };
    }

    const s1 = salida(p1, lado1);
    const s2 = salida(p2, lado2);
    const h1 = lado1 === "E" || lado1 === "W";
    const h2 = lado2 === "E" || lado2 === "W";

    const medios = [];
    if (h1 && h2) {
        const midX = (s1.x + s2.x) / 2;
        medios.push({ x: midX, y: s1.y }, { x: midX, y: s2.y });
    } else if (!h1 && !h2) {
        const midY = (s1.y + s2.y) / 2;
        medios.push({ x: s1.x, y: midY }, { x: s2.x, y: midY });
    } else if (h1) {
        medios.push({ x: s2.x, y: s1.y });
    } else {
        medios.push({ x: s1.x, y: s2.y });
    }

    return dedup([p1, s1, ...medios, s2, p2]);
}

function dedup(pts) {
    return pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
}

export function puntosAPath(puntos, radio = 6) {
    if (puntos.length < 2) return "";
    let d = `M ${fmt(puntos[0].x)} ${fmt(puntos[0].y)}`;
    for (let i = 1; i < puntos.length - 1; i++) {
        const prev = puntos[i - 1], curr = puntos[i], next = puntos[i + 1];
        const len1 = dist(prev, curr), len2 = dist(curr, next);
        if (len1 < 0.5 || len2 < 0.5) { d += ` L ${fmt(curr.x)} ${fmt(curr.y)}`; continue; }
        const rv = Math.min(radio, len1 / 2, len2 / 2);
        const u1 = unitDir(prev, curr), u2 = unitDir(curr, next);
        d += ` L ${fmt(curr.x - u1.x * rv)} ${fmt(curr.y - u1.y * rv)}`;
        d += ` Q ${fmt(curr.x)} ${fmt(curr.y)} ${fmt(curr.x + u2.x * rv)} ${fmt(curr.y + u2.y * rv)}`;
    }
    const last = puntos[puntos.length - 1];
    d += ` L ${fmt(last.x)} ${fmt(last.y)}`;
    return d;
}

export function calcularRuta(conector, elementos) {
    const elO = elementos.find(e => e.id === conector.origen.elementoId);
    const elD = elementos.find(e => e.id === conector.destino.elementoId);
    if (!elO && !elD) return [];

    let p1, lado1, p2, lado2;

    if (elO && elD) {
        lado1 = conector.origen.lado  ?? ladoAutoOrigen(elO, elD);
        lado2 = conector.destino.lado ?? OPUESTO[lado1];
        p1 = puntosConexion(elO)[lado1];
        p2 = puntosConexion(elD)[lado2];
    } else if (elO) {
        lado1 = conector.origen.lado ?? "E";
        p1    = puntosConexion(elO)[lado1];
        lado2 = OPUESTO[lado1];
        p2    = { x: conector.destino.x ?? 0, y: conector.destino.y ?? 0 };
    } else {
        lado2 = conector.destino.lado ?? "W";
        p2    = puntosConexion(elD)[lado2];
        lado1 = OPUESTO[lado2];
        p1    = { x: conector.origen.x ?? 0, y: conector.origen.y ?? 0 };
    }

    return trazarOrtogonal(p1, lado1, p2, lado2);
}

function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
function unitDir(a, b) { const d = dist(a, b) || 1; return { x: (b.x - a.x) / d, y: (b.y - a.y) / d }; }
function fmt(n) { return Math.round(n * 10) / 10; }
