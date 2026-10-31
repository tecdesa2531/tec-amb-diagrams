---
name: codigo-ambito
description: >-
  Reglas de modularidad, legibilidad y estructura de codigo para el proyecto
  Ambito. Usar siempre que se vaya a crear o modificar cualquier archivo .py,
  .js, .html o .css del proyecto. Dispara ante frases como "implementa",
  "crea el archivo", "agrega la funcion", "refactoriza", "divide el modulo"
  o al empezar cualquier fase de desarrollo.
---

# Codigo Ambito — modular, legible y mantenible

Un humano debe poder leer cualquier archivo del proyecto sin necesitar contexto
previo. Cada archivo tiene **una sola responsabilidad** y su nombre la dice.

## La separacion mas importante: nucleo/ vs ui/

```
web/js/
  nucleo/   logica pura — sin DOM, sin eventos, sin efectos secundarios
  ui/       todo lo que toca el navegador — canvas, eventos, paneles
```

**nucleo/** es testeable con `node --test` porque no sabe que existe un
navegador. Si una funcion necesita `document` o `window`, pertenece a **ui/**.

Esta separacion no es opcional: es lo que permite probar la logica de formato,
geometria y enrutado sin abrir un navegador.

## Modulos JS de nucleo/ (uno por responsabilidad)

| Archivo | Que contiene |
|---|---|
| `modelo.js` | Crear, leer, actualizar y eliminar elementos y conectores del documento |
| `formato.js` | Serializar, abrir, validar y migrar el formato `.ambito` |
| `geometria.js` | Calculos de distancia, interseccion, rectangulos, puntos |
| `enrutado.js` | Calcular el path ortogonal de una flecha entre dos extremos |
| `guias.js` | Detectar alineaciones y calcular el iman de cuadricula |
| `historial.js` | Instantaneas para deshacer y rehacer |
| `estilo.js` | Constantes de tokens visuales (colores, grosores, tamanos) |
| `catalogo.js` | Transformar la respuesta de /api/iconos en el catalogo de la paleta |

Crear el archivo solo cuando la fase lo necesite. No anticipar modulos futuros.

## Modulos JS de ui/ (uno por responsabilidad)

| Archivo | Que contiene |
|---|---|
| `lienzo.js` | Renderizado SVG, zoom, desplazamiento, seleccion |
| `paleta.js` | Panel izquierdo, buscador, arrastre al lienzo |
| `propiedades.js` | Panel derecho, edicion de propiedades del elemento seleccionado |
| `barra.js` | Barra superior, botones de archivo y zoom |
| `atajos.js` | Registro de atajos de teclado (Ctrl y Cmd) |
| `exportar.js` | PNG, PDF del navegador y envio al endpoint PDF de Python |

## Reglas para cada funcion

1. **Una sola cosa.** Si necesitas "y" en el nombre, divide.
2. **Nombre que dice que hace.** `calcularRutaFlecha`, no `procesar` ni `hacer`.
3. **Menos de 30 lineas** como orientacion. Si crece, extrae funciones auxiliares.
4. **Sin efectos secundarios en nucleo/.** Las funciones reciben datos y devuelven
   datos. No modifican variables globales ni el DOM.
5. **Parametros explicitos.** Nada de variables globales como entrada implicita.

## Reglas para cada archivo

- **Menos de 400 lineas.** Si crece, divide por responsabilidad y actualiza las
  importaciones. Nunca dividas de forma arbitraria a mitad de un concepto.
- **Una exportacion por concepto.** Agrupa lo relacionado; separa lo que cambia
  por razones distintas.
- **El orden importa para leer:** exports al final, helpers privados arriba de
  quien los usa, constantes al principio del archivo.

## Comentarios: solo el porque no obvio

Escribe un comentario solo cuando un lector razonable se preguntaria
"¿por que hace esto asi?". Nunca describas lo que el nombre ya dice.

```js
// MAL: incrementa el contador de version
version++;

// BIEN: la version sube aunque el cambio sea compatible,
// para que el respaldo siempre produzca un archivo distinto
version++;
```

Un bloque de comentarios de varias lineas es casi siempre una senal de que
la funcion hace demasiado o tiene un nombre malo.

## Python (ambito.py)

- Divide por responsabilidad en funciones nombradas, no en un `do_GET` de
  300 lineas. Extrae: `manejar_iconos`, `manejar_diagrama`, `manejar_pdf`, etc.
- Los bloques `if ruta == ...` son el enrutador: mantenlos cortos, cada rama
  llama a una funcion.
- Sin clases innecesarias. Una funcion que no comparte estado con otras
  no necesita ser un metodo.

## Checklist antes de entregar codigo

- [ ] Cada archivo tiene una sola responsabilidad y su nombre la refleja.
- [ ] Ninguna funcion en nucleo/ toca el DOM ni variables globales del navegador.
- [ ] Ninguna funcion supera las 30 lineas sin una razon clara.
- [ ] Ningun archivo supera las 400 lineas.
- [ ] Los comentarios explican el porque, no el que.
- [ ] Ningun texto en el codigo lleva tildes, ni la letra n con virgulilla.
