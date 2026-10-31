---
name: formato-ambito
description: >-
  Reglas del formato de archivo .ambito (guardar, abrir, importar, validar, migrar).
  Usar siempre que se cree o modifique el modelo de documento, la serializacion,
  la carga de archivos o se agregue un campo nuevo a elementos o conectores.
  Dispara aunque el usuario no mencione "formato" explicitamente si toca
  web/js/nucleo/formato.js, el modelo de datos, la apertura o el guardado.
---

# Formato .ambito

El archivo .ambito es la unica fuente de verdad de un diagrama. Su garantia
principal: **lo que se guarda se reabre identico**. Cualquier cambio que la
ponga en riesgo es un error grave.

## Reglas

1. **Encabezado obligatorio:** `"formato": "ambito"` y `"version": <entero>`.
   La version actual vive en una sola constante, en `web/js/nucleo/formato.js`.

2. **Escritura canonica:** una sola funcion serializa, y es la unica que se usa.
   - Indentacion de 2 espacios, UTF-8, fin de linea LF y salto de linea final.
   - Claves en el orden definido por el esquema, nunca en el orden de insercion.
   - Numeros redondeados a 2 decimales. Sin `-0`.
   - Los arreglos conservan su orden (el orden de `"elementos"` es el orden de dibujo).

3. **Iconos embebidos:** una sola copia del SVG por id en `"iconos"`, solo de
   los iconos que se usan. Al guardar se eliminan los que ya no se usan.

4. **Coordenadas absolutas** en el lienzo. El campo `"padre"` define el
   anidamiento, no la posicion.

5. **Extremos de conector:**
   - `{"elemento": "<id>", "modo": "auto"}`
   - `{"elemento": "<id>", "modo": "fijo", "lado": "<lado>", "posicion": <0-1>}`
   - `{"modo": "libre", "x": <n>, "y": <n>}`

   `"lado"` vale `arriba`, `abajo`, `izquierda` o `derecha`.

6. **Nada derivado:** no se guarda nada recalculable (path SVG de una flecha,
   medidas de texto). Si se guardan los quiebres manuales (`"puntos"`).

7. **Sin datos del sistema:** sin fuentes concretas, rutas absolutas ni datos
   del SO.

## Agregar o cambiar un campo

1. Cambio compatible (campo nuevo opcional con valor por defecto) → mantener
   version. Al leer, aplicar el valor por defecto si falta.
2. Cambio incompatible → subir `"version"` y escribir `migrar_vN_a_vN1(doc)`.
   Las migraciones se encadenan al abrir.
3. Actualizar esquema, orden de claves, validador y documento de ejemplo de pruebas.
4. Agregar casos a la prueba de ida y vuelta.

## Validacion al abrir

| Situacion | Respuesta |
|---|---|
| JSON invalido | "El archivo no es valido o esta danado" |
| `"formato"` distinto de `ambito` | "Este archivo no es un diagrama de Ambito" |
| Version mayor que la soportada | Avisar y no abrir |
| Referencias rotas (padre o elemento inexistente) | Reparar conservadoramente y avisar |

Reparacion conservadora: padre pasa a `null`, extremo pasa a libre en su
ultima posicion conocida.

## Prueba obligatoria (`tests/js/formato.test.mjs`)

- `serializar(abrir(serializar(doc))) === serializar(doc)` para documentos que
  cubran: todos los tipos de elemento, todos los modos de extremo, quiebres
  manuales, textos con tildes/ñ/comillas/emojis, e iconos embebidos.
- Rechazo de formato incorrecto y de version futura.
- Que una migracion deja el documento en la version actual.

> Los textos que escribe el usuario dentro del diagrama si pueden llevar tildes
> y ñ. La regla de no usar tildes aplica solo al codigo.
