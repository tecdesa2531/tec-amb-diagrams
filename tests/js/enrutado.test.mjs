import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
    puntosConexion,
    ladoAutoOrigen,
    trazarOrtogonal,
    puntosAPath,
    calcularRuta,
} from "../../web/js/nucleo/enrutado.js";

const EL_A = { id: "a", x: 0,   y: 0,   ancho: 100, alto: 60 };
const EL_B = { id: "b", x: 200, y: 0,   ancho: 100, alto: 60 };
const EL_C = { id: "c", x: 0,   y: 150, ancho: 100, alto: 60 };

describe("puntosConexion", () => {
    it("calcula los 4 puntos cardinales de un elemento", () => {
        const pts = puntosConexion(EL_A);
        assert.deepEqual(pts.E, { x: 100, y: 30 });
        assert.deepEqual(pts.W, { x: 0,   y: 30 });
        assert.deepEqual(pts.N, { x: 50,  y: 0  });
        assert.deepEqual(pts.S, { x: 50,  y: 60 });
    });

    it("los puntos cardinales estan en el borde del elemento", () => {
        const el = { id: "x", x: 10, y: 20, ancho: 80, alto: 40 };
        const pts = puntosConexion(el);
        assert.equal(pts.E.x, 90);
        assert.equal(pts.W.x, 10);
        assert.equal(pts.N.y, 20);
        assert.equal(pts.S.y, 60);
    });
});

describe("ladoAutoOrigen", () => {
    it("devuelve E cuando el destino esta a la derecha", () => {
        assert.equal(ladoAutoOrigen(EL_A, EL_B), "E");
    });
    it("devuelve W cuando el destino esta a la izquierda", () => {
        assert.equal(ladoAutoOrigen(EL_B, EL_A), "W");
    });
    it("devuelve S cuando el destino esta abajo", () => {
        assert.equal(ladoAutoOrigen(EL_A, EL_C), "S");
    });
    it("devuelve N cuando el destino esta arriba", () => {
        assert.equal(ladoAutoOrigen(EL_C, EL_A), "N");
    });
    it("desempate horizontal cuando dy == dx", () => {
        const elD = { id: "d", x: 100, y: 60, ancho: 100, alto: 60 };
        // Centro A = (50, 30), Centro D = (150, 90). dx=100, dy=60: horizontal gana
        assert.equal(ladoAutoOrigen(EL_A, elD), "E");
    });
});

describe("trazarOrtogonal", () => {
    it("empieza en p1 y termina en p2", () => {
        const p1 = { x: 100, y: 30 };
        const p2 = { x: 200, y: 30 };
        const pts = trazarOrtogonal(p1, "E", p2, "W");
        assert.deepEqual(pts[0], p1);
        assert.deepEqual(pts[pts.length - 1], p2);
    });

    it("genera al menos 2 puntos", () => {
        const pts = trazarOrtogonal({ x: 100, y: 30 }, "E", { x: 200, y: 30 }, "W");
        assert.ok(pts.length >= 2);
    });

    it("path horizontal alineado: todos los puntos en y=30", () => {
        const pts = trazarOrtogonal({ x: 100, y: 30 }, "E", { x: 200, y: 30 }, "W");
        for (const p of pts) assert.equal(p.y, 30);
    });

    it("path con diferente nivel genera quiebres", () => {
        const pts = trazarOrtogonal({ x: 100, y: 30 }, "E", { x: 200, y: 80 }, "W");
        assert.ok(pts.length >= 4);
    });

    it("no genera puntos duplicados consecutivos", () => {
        const pts = trazarOrtogonal({ x: 100, y: 30 }, "E", { x: 200, y: 30 }, "W");
        for (let i = 1; i < pts.length; i++) {
            assert.ok(pts[i].x !== pts[i-1].x || pts[i].y !== pts[i-1].y, `punto ${i} duplicado`);
        }
    });
});

describe("puntosAPath", () => {
    it("devuelve cadena vacia para menos de 2 puntos", () => {
        assert.equal(puntosAPath([]), "");
        assert.equal(puntosAPath([{ x: 0, y: 0 }]), "");
    });

    it("genera una cadena que empieza con M", () => {
        const d = puntosAPath([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
        assert.ok(d.startsWith("M "));
    });

    it("incluye L para segmentos", () => {
        const d = puntosAPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }]);
        assert.ok(d.includes("L "));
    });
});

describe("calcularRuta - modo auto (lado null)", () => {
    it("con B a la derecha: sale por E y llega al borde W de B", () => {
        const con = {
            origen:  { elementoId: "a", lado: null },
            destino: { elementoId: "b", lado: null },
            quiebres: [],
        };
        const pts = calcularRuta(con, [EL_A, EL_B]);
        assert.ok(pts.length >= 2);
        assert.equal(pts[0].x, 100); // punto E de A
        assert.equal(pts[pts.length - 1].x, 200); // punto W de B
    });

    it("con C abajo: sale por S del origen", () => {
        const con = {
            origen:  { elementoId: "a", lado: null },
            destino: { elementoId: "c", lado: null },
            quiebres: [],
        };
        const pts = calcularRuta(con, [EL_A, EL_C]);
        assert.equal(pts[0].y, 60); // punto S de A
    });
});

describe("calcularRuta - lado fijo", () => {
    it("conserva lado E del origen aunque el destino este abajo", () => {
        const con = {
            origen:  { elementoId: "a", lado: "E" },
            destino: { elementoId: "c", lado: null },
            quiebres: [],
        };
        const pts = calcularRuta(con, [EL_A, EL_C]);
        assert.equal(pts[0].x, 100); // siempre sale por E (x=100)
        assert.equal(pts[0].y, 30);
    });

    it("devuelve arreglo vacio si ninguno de los elementos existe", () => {
        const con = {
            origen:  { elementoId: "x", lado: null },
            destino: { elementoId: "y", lado: null },
            quiebres: [],
        };
        const pts = calcularRuta(con, [EL_A]);
        assert.equal(pts.length, 0);
    });
});
