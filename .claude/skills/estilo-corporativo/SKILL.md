---
name: estilo-corporativo
description: >-
  Sistema visual corporativo de Ambito: tipografia, colores, flechas, grupos AWS,
  espaciados y checklist de acabado. Usar siempre que se cree o modifique algo
  visual del lienzo, la interfaz o las exportaciones PNG/PDF. Dispara aunque el
  usuario no mencione "estilo" si toca CSS, SVG del lienzo, el renderizado de
  flechas, etiquetas, grupos, seleccion o cualquier pieza de la UI.
---

# Estilo corporativo de Ambito

Los diagramas se presentan ante gerencia. Todo debe verse limpio, sobrio,
alineado y consistente. **Ante la duda, menos: menos colores, menos grosores,
menos adornos.**

## Tokens (definir una sola vez)

Lugar: `web/css/estilos.css` (variables CSS) y `web/js/nucleo/estilo.js` (constantes JS).
Nunca inventar valores fuera de esta tabla.

| Token | Valor |
|---|---|
| Fuente | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| Color texto principal | `#232F3E` |
| Color texto secundario | `#545B64` |
| Fondo lienzo | `#FFFFFF` |
| Tamano titulo | 20 px |
| Tamano subtitulo | 16 px |
| Tamano normal | 13 px |
| Tamano etiqueta icono | 12 px |
| Tamano texto flecha | 11 px |
| Tamano nota | 11 px |
| Paleta (orden de seleccion) | `#545B64`, `#7D8998`, `#0972D3`, `#ED7100`, `#DD344C`, `#7AA116`, `#8C4FFF` |
| Grosores permitidos | 1, 1.5, 2 (por defecto 1.5) |
| Flecha — color por defecto | `#545B64` |
| Flecha — esquinas radio | 6 px |
| Flecha — punta final | triangulo relleno ~8 px |
| Texto de flecha — fondo | blanco con relleno 2–4 px |
| Guias de alineacion | `#E0119D`, 1 px (solo en el editor) |
| Cuadricula editor | puntos `#E5E7EB` cada 10 px (nunca en exportaciones) |
| Icono AWS tamano por defecto | 48 × 48 px |
| Etiqueta icono — separacion | 6 px debajo, centrada, ancho max ~120 px, ajuste de linea |
| Color seleccion | `#0972D3` |

## Grupos AWS

Verificar colores contra los SVG oficiales de `iconos/` (carpeta de grupos del
paquete). Si difieren, mandan los oficiales y se actualiza esta tabla.

| id | Borde | Relleno | Linea |
|---|---|---|---|
| aws-cloud | `#232F3E` | — | continua |
| cuenta | `#E7157B` | — | continua |
| region | `#00A4A6` | — | discontinua |
| vpc | `#8C4FFF` | — | continua |
| zona-disponibilidad | `#00A4A6` | — | discontinua |
| subnet-publica | `#7AA116` | `#F2F6E8` | continua |
| subnet-privada | `#00A4A6` | `#E6F6F7` | continua |
| security-group | `#DD344C` | — | continua |
| auto-scaling | `#ED7100` | — | discontinua |
| centro-datos | `#7D8998` | — | continua |
| generico | `#7D8998` | — | discontinua |

**Encabezado del grupo:** icono oficial 32 × 32 en esquina superior izquierda,
sin margen; nombre a 8 px a su derecha, tamano 13, color del borde (`#232F3E`
para aws-cloud). Borde 1.5 px, esquinas rectas.

## Interfaz del editor

- Barras y paneles: blanco y gris muy claro `#F7F8FA`, separados por lineas `#E5E7EB`.
- Sin sombras fuertes, sin degradados, sin animaciones llamativas.
- Botones con texto claro en espanol sin tildes en el codigo (`"Agregar"`, nunca `"Anadir"`).
- Seleccion: azul `#0972D3`, tiradores blancos con borde azul.

## Checklist de acabado (revisar al tocar algo visual)

- [ ] Solo se usan tokens. No hay colores, grosores ni tamanos inventados.
- [ ] La fuente es la del sistema y se ve bien en Mac (San Francisco) y Windows (Segoe UI).
- [ ] Las flechas no tienen escalones pequenos, esquinas redondeadas, puntas consistentes.
- [ ] Las etiquetas no se superponen con iconos ni con flechas.
- [ ] En exportaciones no aparecen cuadricula, guias, seleccion ni tiradores.
- [ ] El PNG a 2x se ve nitido y el PDF del navegador es vectorial.
