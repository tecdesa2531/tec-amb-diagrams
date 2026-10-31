import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { crearHistorial, empujar, deshacer, rehacer, puedeDeshacer, puedeRehacer } from "../../web/js/nucleo/historial.js";

describe("historial - estado inicial", () => {
    it("crearHistorial devuelve indice -1 y arreglo vacio", () => {
        const h = crearHistorial();
        assert.equal(h.indice, -1);
        assert.deepEqual(h.instantaneas, []);
    });

    it("puedeDeshacer y puedeRehacer son false en historial vacio", () => {
        const h = crearHistorial();
        assert.equal(puedeDeshacer(h), false);
        assert.equal(puedeRehacer(h), false);
    });
});

describe("historial - empujar", () => {
    it("empujar agrega una instantanea", () => {
        let h = crearHistorial();
        h = empujar(h, { estado: 1 });
        assert.equal(h.instantaneas.length, 1);
        assert.equal(h.indice, 0);
    });

    it("empujar dos veces da indice 1", () => {
        let h = crearHistorial();
        h = empujar(h, { estado: 1 });
        h = empujar(h, { estado: 2 });
        assert.equal(h.instantaneas.length, 2);
        assert.equal(h.indice, 1);
    });

    it("empujar tras deshacer descarta el futuro", () => {
        let h = crearHistorial();
        h = empujar(h, { estado: 1 });
        h = empujar(h, { estado: 2 });
        const r1 = deshacer(h);
        h = r1.historial;
        h = empujar(h, { estado: 3 });
        assert.equal(h.instantaneas.length, 2);
        assert.deepEqual(h.instantaneas[1], { estado: 3 });
    });
});

describe("historial - deshacer y rehacer", () => {
    it("deshacer retrocede al estado anterior", () => {
        let h = crearHistorial();
        h = empujar(h, { v: 1 });
        h = empujar(h, { v: 2 });
        const { historial, doc } = deshacer(h);
        assert.deepEqual(doc, { v: 1 });
        assert.equal(historial.indice, 0);
    });

    it("rehacer avanza al estado siguiente", () => {
        let h = crearHistorial();
        h = empujar(h, { v: 1 });
        h = empujar(h, { v: 2 });
        const r1 = deshacer(h);
        const { historial, doc } = rehacer(r1.historial);
        assert.deepEqual(doc, { v: 2 });
        assert.equal(historial.indice, 1);
    });

    it("deshacer en el primer paso devuelve doc null", () => {
        let h = crearHistorial();
        h = empujar(h, { v: 1 });
        const { doc } = deshacer(h);
        assert.equal(doc, null);
    });

    it("rehacer al final devuelve doc null", () => {
        let h = crearHistorial();
        h = empujar(h, { v: 1 });
        const { doc } = rehacer(h);
        assert.equal(doc, null);
    });
});
