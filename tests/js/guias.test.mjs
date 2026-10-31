import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
    calcularGuias,
    aplicarSnap,
    detectarEspaciadoIgual,
    alinear,
    distribuir,
    igualarTamano,
} from "../../web/js/nucleo/guias.js";

const A = { id: "a", x: 0,   y: 0,   ancho: 50, alto: 30 };
const B = { id: "b", x: 100, y: 0,   ancho: 50, alto: 30 };
const C = { id: "c", x: 200, y: 0,   ancho: 50, alto: 30 };
const D = { id: "d", x: 0,   y: 100, ancho: 50, alto: 30 };

describe("calcularGuias", () => {
    it("genera guias desde bordes y centros de los otros elementos", () => {
        const guias = calcularGuias(B, [A, C]);
        const valsX = guias.filter(g => g.eje === "x").map(g => g.valor);
        assert.ok(valsX.includes(0),   "borde izq de A");
        assert.ok(valsX.includes(50),  "borde der de A");
        assert.ok(valsX.includes(25),  "centro de A");
        assert.ok(valsX.includes(200), "borde izq de C");
        assert.ok(valsX.includes(250), "borde der de C");
        assert.ok(valsX.includes(225), "centro de C");
    });

    it("no incluye guias del propio elemento", () => {
        const guias = calcularGuias(A, [A, B]);
        assert.ok(guias.every(g => g.origen !== "a"), "no debe haber guias de A");
    });

    it("genera guias en eje y", () => {
        const guias = calcularGuias(A, [D]);
        const valsY = guias.filter(g => g.eje === "y").map(g => g.valor);
        assert.ok(valsY.includes(100), "borde sup de D");
        assert.ok(valsY.includes(130), "borde inf de D");
        assert.ok(valsY.includes(115), "centro de D");
    });
});

describe("aplicarSnap", () => {
    it("snap al borde izq de una guia cuando el elemento esta cerca", () => {
        const guias = [{ eje: "x", valor: 100, tipo: "borde", origen: "b" }];
        const { x } = aplicarSnap(98, 0, 50, 30, guias, 1, false);
        assert.equal(x, 100);
    });

    it("snap al borde der de una guia (right edge cerca)", () => {
        const guias = [{ eje: "x", valor: 150, tipo: "borde", origen: "b" }];
        // borde der del elemento: 98+50=148, distancia a 150 = 2 < umbral
        // resultado: x = 150 - 50 = 100
        const { x } = aplicarSnap(98, 0, 50, 30, guias, 1, false);
        assert.equal(x, 100);
    });

    it("snap a la cuadricula cuando no hay guias cerca", () => {
        const guias = [{ eje: "x", valor: 200, tipo: "borde", origen: "b" }];
        const { x } = aplicarSnap(103, 0, 50, 30, guias, 1, false);
        assert.equal(x, 100); // 103 redondea a 100 en grid de 10
    });

    it("sin snap con alt presionado: devuelve posicion exacta", () => {
        const guias = [{ eje: "x", valor: 100, tipo: "borde", origen: "b" }];
        const { x, guiasActivas } = aplicarSnap(98, 0, 50, 30, guias, 1, true);
        assert.equal(x, 98);
        assert.equal(guiasActivas.length, 0);
    });

    it("devuelve la guia activa en guiasActivas", () => {
        const guias = [{ eje: "x", valor: 100, tipo: "borde", origen: "b" }];
        const { guiasActivas } = aplicarSnap(98, 0, 50, 30, guias, 1, false);
        assert.equal(guiasActivas.length, 1);
        assert.equal(guiasActivas[0].eje, "x");
    });

    it("umbral escala con el zoom: con escala 2 el umbral es mayor en canvas", () => {
        // umbral = 8/escala = 8/2 = 4 canvas units
        const guias = [{ eje: "x", valor: 100, tipo: "borde", origen: "b" }];
        // distancia = 3 canvas units < umbral 4: debe snapear
        const { x } = aplicarSnap(97, 0, 50, 30, guias, 2, false);
        assert.equal(x, 100);
    });
});

describe("detectarEspaciadoIgual", () => {
    it("detecta tres elementos con espaciado horizontal igual", () => {
        const grupos = detectarEspaciadoIgual([A, B, C]);
        assert.ok(grupos.length > 0);
        assert.equal(grupos[0].eje, "x");
        assert.equal(grupos[0].distancia, 50);
        assert.deepEqual(grupos[0].ids, ["a", "b", "c"]);
    });

    it("no detecta espaciado si los elementos no son equidistantes", () => {
        const X = { id: "x", x: 0,   y: 0, ancho: 50, alto: 30 };
        const Y = { id: "y", x: 100, y: 0, ancho: 50, alto: 30 };
        const Z = { id: "z", x: 220, y: 0, ancho: 50, alto: 30 };
        const grupos = detectarEspaciadoIgual([X, Y, Z]);
        assert.equal(grupos.length, 0);
    });

    it("devuelve arreglo vacio con menos de 3 elementos", () => {
        const grupos = detectarEspaciadoIgual([A, B]);
        assert.equal(grupos.length, 0);
    });
});

describe("alinear", () => {
    it("alinea al borde izquierdo mas pequeno", () => {
        const cambios = alinear(["a", "b"], [A, B], "left");
        assert.ok(cambios.every(c => c.x === 0));
    });

    it("alinea al borde derecho mas grande", () => {
        const cambios = alinear(["a", "b"], [A, B], "right");
        // borde der max = 100+50 = 150; A: x = 150-50 = 100, B: x = 100
        assert.ok(cambios.every(c => c.x === 100));
    });

    it("centra horizontalmente", () => {
        const cambios = alinear(["a", "b"], [A, B], "centerH");
        // centros: 25, 125 -> media = 75; A: x=75-25=50, B: x=75-25=50
        assert.ok(cambios.every(c => c.x === 50));
    });

    it("devuelve arreglo vacio con un solo elemento", () => {
        const cambios = alinear(["a"], [A], "left");
        assert.equal(cambios.length, 0);
    });
});

describe("distribuir", () => {
    it("distribuye tres elementos con espaciado igual horizontal", () => {
        const P = { id: "p", x: 0,   y: 0, ancho: 50, alto: 30 };
        const Q = { id: "q", x: 80,  y: 0, ancho: 50, alto: 30 };
        const R = { id: "r", x: 200, y: 0, ancho: 50, alto: 30 };
        const cambios = distribuir(["p","q","r"], [P, Q, R], "x");
        // inicio=0, fin=250, totalAncho=150, espacio=(250-150)/2=50
        assert.equal(cambios.find(c => c.id === "p").x, 0);
        assert.equal(cambios.find(c => c.id === "q").x, 100);
        assert.equal(cambios.find(c => c.id === "r").x, 200);
    });

    it("devuelve arreglo vacio con menos de 3 elementos", () => {
        const cambios = distribuir(["a","b"], [A, B], "x");
        assert.equal(cambios.length, 0);
    });
});

describe("igualarTamano", () => {
    it("iguala el ancho de todos al del primero", () => {
        const cambios = igualarTamano(["a","b"], [A, B], "ancho");
        assert.equal(cambios.length, 1);
        assert.equal(cambios[0].ancho, A.ancho);
        assert.equal(cambios[0].id, "b");
    });

    it("iguala ancho y alto con ambos", () => {
        const cambios = igualarTamano(["a","b"], [A, B], "ambos");
        assert.equal(cambios[0].ancho, A.ancho);
        assert.equal(cambios[0].alto,  A.alto);
    });

    it("devuelve arreglo vacio con un solo elemento", () => {
        const cambios = igualarTamano(["a"], [A], "ancho");
        assert.equal(cambios.length, 0);
    });
});
