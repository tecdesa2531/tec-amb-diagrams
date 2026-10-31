import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { parsearCatalogo, buscar, todos } from "../../web/js/nucleo/catalogo.js";

const ITEMS = [
    { id: "s-amazon-ec2",       nombre: "Amazon EC2",       categoria: "Compute",     tipo: "servicio" },
    { id: "s-amazon-s3",        nombre: "Amazon S3",        categoria: "Storage",     tipo: "servicio" },
    { id: "s-elastic-lb",       nombre: "Elastic Load Balancing", categoria: "Networking", tipo: "servicio" },
    { id: "s-amazon-lambda",    nombre: "AWS Lambda",       categoria: "Compute",     tipo: "servicio" },
    { id: "s-amazon-rds",       nombre: "Amazon RDS",       categoria: "Database",    tipo: "servicio" },
];

describe("catalogo - parsearCatalogo", () => {
    it("agrupa por categoria", () => {
        const cat = parsearCatalogo(ITEMS);
        assert.ok(cat["Compute"]);
        assert.ok(cat["Storage"]);
        assert.equal(cat["Compute"].length, 2);
    });

    it("devuelve categorias en orden alfabetico", () => {
        const cat = parsearCatalogo(ITEMS);
        const claves = Object.keys(cat);
        assert.deepEqual(claves, [...claves].sort());
    });
});

describe("catalogo - buscar", () => {
    it("devuelve todos los items si el termino esta vacio", () => {
        assert.equal(buscar(ITEMS, "").length, ITEMS.length);
        assert.equal(buscar(ITEMS, "   ").length, ITEMS.length);
    });

    it("filtra por nombre (case insensitive)", () => {
        const res = buscar(ITEMS, "EC2");
        assert.equal(res.length, 1);
        assert.equal(res[0].id, "s-amazon-ec2");
    });

    it("filtra por categoria", () => {
        const res = buscar(ITEMS, "Compute");
        assert.equal(res.length, 2);
    });

    it("resuelve alias ec2", () => {
        const res = buscar(ITEMS, "ec2");
        assert.equal(res.length, 1);
        assert.equal(res[0].nombre, "Amazon EC2");
    });

    it("resuelve alias s3", () => {
        const res = buscar(ITEMS, "s3");
        assert.equal(res.length, 1);
        assert.equal(res[0].nombre, "Amazon S3");
    });

    it("resuelve alias alb", () => {
        const res = buscar(ITEMS, "alb");
        assert.equal(res.length, 1);
        assert.equal(res[0].nombre, "Elastic Load Balancing");
    });
});

describe("catalogo - todos", () => {
    it("devuelve todos los items en una lista plana", () => {
        const cat = parsearCatalogo(ITEMS);
        assert.equal(todos(cat).length, ITEMS.length);
    });
});
