import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { serializar, deserializar, validar } from "../../web/js/nucleo/formato.js";
import { crearDocumento, crearElemento, agregarElemento } from "../../web/js/nucleo/modelo.js";

describe("formato - serializar y deserializar", () => {
    it("ida y vuelta produce JSON identico", () => {
        const doc = crearDocumento("Red de prueba");
        const json1 = serializar(doc);
        const doc2 = deserializar(json1);
        const json2 = serializar(doc2);
        assert.equal(json1, json2);
    });

    it("ida y vuelta con elementos conserva los datos", () => {
        let doc = crearDocumento("Con elementos");
        doc = agregarElemento(doc, crearElemento("caja", 10, 20, { etiqueta: "EC2" }));
        const json1 = serializar(doc);
        const doc2 = deserializar(json1);
        assert.equal(doc2.elementos.length, 1);
        assert.equal(doc2.elementos[0].etiqueta, "EC2");
        assert.equal(doc2.elementos[0].x, 10);
        assert.equal(serializar(doc2), json1);
    });

    it("serializar produce JSON valido", () => {
        const doc = crearDocumento();
        const json = serializar(doc);
        assert.doesNotThrow(() => JSON.parse(json));
    });
});

describe("formato - validar rechazo de documentos invalidos", () => {
    it("rechaza formato distinto de ambito", () => {
        assert.throws(
            () => validar({ formato: "otro", version: 1, documento: { titulo: "x" }, elementos: [], conectores: [] }),
            /Formato desconocido/
        );
    });

    it("rechaza version que no es numero", () => {
        assert.throws(
            () => validar({ formato: "ambito", version: "1", documento: { titulo: "x" }, elementos: [], conectores: [] }),
            /version/
        );
    });

    it("rechaza elementos que no es arreglo", () => {
        assert.throws(
            () => validar({ formato: "ambito", version: 1, documento: { titulo: "x" }, elementos: null, conectores: [] }),
            /elementos/
        );
    });

    it("rechaza si falta el campo documento", () => {
        assert.throws(
            () => validar({ formato: "ambito", version: 1, elementos: [], conectores: [] }),
            /documento/
        );
    });
});

describe("formato - deserializar con JSON invalido", () => {
    it("lanza error descriptivo con JSON malformado", () => {
        assert.throws(() => deserializar("{no es json}"), /JSON invalido/);
    });

    it("lanza error con formato incorrecto en JSON valido", () => {
        const json = JSON.stringify({ formato: "otro", version: 1, documento: { titulo: "x" }, elementos: [], conectores: [] });
        assert.throws(() => deserializar(json), /Formato desconocido/);
    });
});
