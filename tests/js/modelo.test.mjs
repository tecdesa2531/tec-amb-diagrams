import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
    crearDocumento, crearElemento, crearConector,
    agregarElemento, actualizarElemento, eliminarElemento,
    agregarConector, actualizarConector, eliminarConector,
} from "../../web/js/nucleo/modelo.js";

describe("modelo - crearDocumento", () => {
    it("tiene la estructura base correcta", () => {
        const doc = crearDocumento("Mi diagrama");
        assert.equal(doc.formato, "ambito");
        assert.equal(doc.version, 1);
        assert.equal(doc.documento.titulo, "Mi diagrama");
        assert.deepEqual(doc.elementos, []);
        assert.deepEqual(doc.conectores, []);
    });

    it("usa titulo por defecto si no se pasa uno", () => {
        const doc = crearDocumento();
        assert.equal(doc.documento.titulo, "Sin titulo");
    });
});

describe("modelo - crearElemento", () => {
    it("genera id unico y aplica valores por defecto", () => {
        const el = crearElemento("caja", 10, 20);
        assert.ok(typeof el.id === "string" && el.id.length > 0);
        assert.equal(el.tipo, "caja");
        assert.equal(el.x, 10);
        assert.equal(el.y, 20);
        assert.equal(el.ancho, 120);
        assert.equal(el.alto, 60);
        assert.equal(el.etiqueta, "");
    });

    it("respeta las opciones que se pasan", () => {
        const el = crearElemento("icono", 0, 0, { ancho: 48, alto: 48, etiqueta: "EC2" });
        assert.equal(el.ancho, 48);
        assert.equal(el.alto, 48);
        assert.equal(el.etiqueta, "EC2");
    });
});

describe("modelo - operaciones con elementos", () => {
    it("agregarElemento incluye el elemento en el documento", () => {
        const doc = crearDocumento();
        const el = crearElemento("caja", 0, 0);
        const doc2 = agregarElemento(doc, el);
        assert.equal(doc2.elementos.length, 1);
        assert.equal(doc2.elementos[0].id, el.id);
    });

    it("actualizarElemento cambia solo el campo indicado", () => {
        const doc = agregarElemento(crearDocumento(), crearElemento("caja", 0, 0, { etiqueta: "A" }));
        const id = doc.elementos[0].id;
        const doc2 = actualizarElemento(doc, id, { etiqueta: "B" });
        assert.equal(doc2.elementos[0].etiqueta, "B");
        assert.equal(doc2.elementos[0].x, 0);
    });

    it("eliminarElemento quita el elemento y sus conectores", () => {
        let doc = crearDocumento();
        const e1 = crearElemento("caja", 0, 0);
        const e2 = crearElemento("caja", 200, 0);
        doc = agregarElemento(doc, e1);
        doc = agregarElemento(doc, e2);
        doc = agregarConector(doc, crearConector(e1.id, e2.id));
        assert.equal(doc.conectores.length, 1);
        const doc2 = eliminarElemento(doc, e1.id);
        assert.equal(doc2.elementos.length, 1);
        assert.equal(doc2.conectores.length, 0);
    });
});

describe("modelo - operaciones con conectores", () => {
    it("agregarConector y eliminarConector funcionan", () => {
        let doc = crearDocumento();
        const e1 = crearElemento("caja", 0, 0);
        const e2 = crearElemento("caja", 200, 0);
        doc = agregarElemento(doc, e1);
        doc = agregarElemento(doc, e2);
        const con = crearConector(e1.id, e2.id);
        doc = agregarConector(doc, con);
        assert.equal(doc.conectores.length, 1);
        const doc2 = eliminarConector(doc, con.id);
        assert.equal(doc2.conectores.length, 0);
    });

    it("actualizarConector cambia solo el campo indicado", () => {
        let doc = crearDocumento();
        const e1 = crearElemento("caja", 0, 0);
        const e2 = crearElemento("caja", 200, 0);
        doc = agregarElemento(doc, e1);
        doc = agregarElemento(doc, e2);
        const con = crearConector(e1.id, e2.id);
        doc = agregarConector(doc, con);
        const doc2 = actualizarConector(doc, con.id, { etiqueta: "flujo" });
        assert.equal(doc2.conectores[0].etiqueta, "flujo");
        assert.equal(doc2.conectores[0].origen.elementoId, e1.id);
    });
});
