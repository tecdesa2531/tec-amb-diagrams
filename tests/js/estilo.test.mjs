import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  COLOR_TEXTO, COLOR_TEXTO_SEC, COLOR_SELECCION, COLOR_GUIA, COLOR_BORDE,
  PALETA,
  TAM_TITULO, TAM_NORMAL, TAM_FLECHA,
  GROSOR_FINO, GROSOR_NORMAL, GROSOR_GRUESO,
  ICONO_TAMANO_DEFAULT, ICONO_ETIQUETA_OFFSET,
  CUADRICULA_TAMANO, FLECHA_RADIO, FLECHA_PUNTA_TAM,
} from "../../web/js/nucleo/estilo.js";

const esHex = (v) => /^#[0-9A-Fa-f]{6}$/.test(v);

describe("estilo - colores", () => {
  it("todos los colores son strings hex validos", () => {
    for (const color of [COLOR_TEXTO, COLOR_TEXTO_SEC, COLOR_SELECCION, COLOR_GUIA, COLOR_BORDE]) {
      assert.ok(esHex(color), `color invalido: ${color}`);
    }
  });

  it("la paleta tiene exactamente 7 colores validos", () => {
    assert.equal(PALETA.length, 7);
    for (const color of PALETA) {
      assert.ok(esHex(color), `color de paleta invalido: ${color}`);
    }
  });
});

describe("estilo - tamanos de texto", () => {
  it("titulo es mayor que normal y normal mayor que flecha", () => {
    assert.ok(TAM_TITULO > TAM_NORMAL);
    assert.ok(TAM_NORMAL > TAM_FLECHA);
  });
});

describe("estilo - grosores", () => {
  it("fino < normal < grueso", () => {
    assert.ok(GROSOR_FINO < GROSOR_NORMAL);
    assert.ok(GROSOR_NORMAL < GROSOR_GRUESO);
  });

  it("el grosor por defecto es 1.5", () => {
    assert.equal(GROSOR_NORMAL, 1.5);
  });
});

describe("estilo - medidas del lienzo", () => {
  it("el icono por defecto mide 48 px", () => {
    assert.equal(ICONO_TAMANO_DEFAULT, 48);
  });

  it("la cuadricula es de 10 px", () => {
    assert.equal(CUADRICULA_TAMANO, 10);
  });

  it("el radio de las esquinas de flecha es 6", () => {
    assert.equal(FLECHA_RADIO, 6);
  });

  it("la punta de flecha mide 8 px", () => {
    assert.equal(FLECHA_PUNTA_TAM, 8);
  });

  it("la etiqueta del icono empieza 6 px debajo", () => {
    assert.equal(ICONO_ETIQUETA_OFFSET, 6);
  });
});
