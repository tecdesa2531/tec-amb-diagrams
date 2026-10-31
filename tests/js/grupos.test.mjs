import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { esGrupo, descendientes, contenedorEn, ordenDibujo } from "../../web/js/nucleo/grupos.js";

// Documento de prueba: VPC > AZ > Subnet > EC2
const ELEMENTOS = [
    { id: "vpc",    tipo: "grupo", subtipo: "vpc",    x: 0,   y: 0,   ancho: 500, alto: 400, padre: null },
    { id: "az",     tipo: "grupo", subtipo: "zona-disponibilidad", x: 20, y: 40, ancho: 460, alto: 340, padre: "vpc" },
    { id: "subnet", tipo: "grupo", subtipo: "subnet-publica",      x: 40, y: 80, ancho: 420, alto: 260, padre: "az" },
    { id: "ec2",    tipo: "icono", subtipo: null,      x: 60,  y: 120, ancho: 48,  alto: 48,  padre: "subnet" },
    { id: "caja",   tipo: "caja",  subtipo: null,      x: 600, y: 0,   ancho: 120, alto: 60,  padre: null },
];
const DOC = { elementos: ELEMENTOS };

describe("grupos - esGrupo", () => {
    it("devuelve true para tipo grupo", () => {
        assert.equal(esGrupo("grupo"), true);
    });
    it("devuelve false para otros tipos", () => {
        assert.equal(esGrupo("caja"), false);
        assert.equal(esGrupo("icono"), false);
    });
});

describe("grupos - descendientes", () => {
    it("devuelve los descendientes directos e indirectos de vpc", () => {
        const desc = descendientes(DOC, "vpc");
        assert.equal(desc.has("az"), true);
        assert.equal(desc.has("subnet"), true);
        assert.equal(desc.has("ec2"), true);
        assert.equal(desc.size, 3);
    });

    it("devuelve solo los hijos de az", () => {
        const desc = descendientes(DOC, "az");
        assert.equal(desc.has("subnet"), true);
        assert.equal(desc.has("ec2"), true);
        assert.equal(desc.has("vpc"), false);
        assert.equal(desc.size, 2);
    });

    it("devuelve conjunto vacio para elemento hoja", () => {
        const desc = descendientes(DOC, "ec2");
        assert.equal(desc.size, 0);
    });
});

describe("grupos - contenedorEn", () => {
    it("detecta subnet como contenedor de un icono peqeno dentro", () => {
        // Icono totalmente dentro de subnet (40-460, 80-340)
        const id = contenedorEn(ELEMENTOS, 100, 130, 48, 48, new Set());
        assert.equal(id, "subnet");
    });

    it("detecta az cuando el rect cabe en az pero no en subnet", () => {
        // Cabe en az (20-480, 40-380) pero no en subnet (40-460, 80-340)
        const id = contenedorEn(ELEMENTOS, 21, 41, 200, 200, new Set());
        assert.equal(id, "az");
    });

    it("devuelve null cuando el rect no cabe en ningun grupo", () => {
        const id = contenedorEn(ELEMENTOS, 600, 0, 120, 60, new Set());
        assert.equal(id, null);
    });

    it("respeta excluirIds", () => {
        // Con subnet excluido, el mismo icono queda en az
        const id = contenedorEn(ELEMENTOS, 100, 130, 48, 48, new Set(["subnet"]));
        assert.equal(id, "az");
    });
});

describe("grupos - ordenDibujo", () => {
    it("los grupos de mayor nivel van primero", () => {
        const ordenado = ordenDibujo(ELEMENTOS);
        const idxVpc    = ordenado.findIndex(e => e.id === "vpc");
        const idxAz     = ordenado.findIndex(e => e.id === "az");
        const idxSubnet = ordenado.findIndex(e => e.id === "subnet");
        const idxEc2    = ordenado.findIndex(e => e.id === "ec2");
        assert.ok(idxVpc < idxAz,     "vpc antes que az");
        assert.ok(idxAz < idxSubnet,  "az antes que subnet");
        assert.ok(idxSubnet < idxEc2, "subnet antes que ec2");
    });

    it("elementos raiz sin padre quedan al principio", () => {
        const ordenado = ordenDibujo(ELEMENTOS);
        const idxVpc  = ordenado.findIndex(e => e.id === "vpc");
        const idxCaja = ordenado.findIndex(e => e.id === "caja");
        // Ambos son profundidad 0; vpc (grupo) va antes que caja (no grupo)
        assert.ok(idxVpc < idxCaja);
    });

    it("no muta el arreglo original", () => {
        const copia = [...ELEMENTOS];
        ordenDibujo(ELEMENTOS);
        assert.deepEqual(ELEMENTOS, copia);
    });
});
