# Ambito

Editor local de diagramas de arquitectura AWS. Sin instalacion, sin dependencias externas.
Funciona en cualquier sistema con Python 3 y un navegador moderno.

## Requisitos

- Python 3.10 o superior (probado con 3.14)
- Edge, Chrome, Firefox o Safari reciente

## Arrancar

**Mac:**
```
python3 ambito.py
```
O doble clic en `iniciar.command`.

**Windows:**
```
python ambito.py
```
O doble clic en `iniciar.bat`.

El servidor arranca en `http://127.0.0.1:8765` y abre el navegador automaticamente.

### Opciones

| Opcion | Default | Descripcion |
|--------|---------|-------------|
| `--puerto 8765` | 8765 | Puerto TCP del servidor |
| `--carpeta ./diagramas` | `./diagramas` | Carpeta donde se guardan los archivos |
| `--iconos ./iconos` | `./iconos` | Carpeta con el paquete de iconos AWS |
| `--sin-navegador` | — | Inicia el servidor sin abrir el navegador |

## Iconos AWS

Los iconos no se incluyen en el repositorio. Para tenerlos:

1. Descarga el paquete oficial de AWS Architecture Icons desde el sitio de AWS.
2. Extrae el contenido en la carpeta `iconos/` dentro de este directorio.

Sin iconos la app funciona igual, pero los elementos se muestran como cajas con etiqueta.

## Atajos de teclado

| Atajo | Accion |
|-------|--------|
| `Ctrl/Cmd + S` | Guardar |
| `Ctrl/Cmd + Shift + S` | Guardar como |
| `Ctrl/Cmd + Z` | Deshacer |
| `Ctrl/Cmd + Shift + Z` / `Ctrl + Y` | Rehacer |
| `Ctrl/Cmd + Shift + H` | Ajustar diagrama a la ventana |
| `Ctrl/Cmd + A` | Seleccionar todo |
| `Ctrl/Cmd + C` | Copiar seleccion |
| `Ctrl/Cmd + V` | Pegar |
| `Ctrl/Cmd + D` | Duplicar seleccion |
| `Delete` / `Backspace` | Eliminar seleccion |
| `Escape` | Cancelar / deseleccionar |
| `Flechas` | Mover seleccion 1 px |
| `Shift + Flechas` | Mover seleccion 10 px |
| `Espacio + arrastre` | Desplazar el lienzo |
| `Ctrl/Cmd + rueda` | Zoom |
| `Alt + arrastre` | Mover sin imanes de cuadricula |

## Archivos

Los diagramas se guardan con extension `.ambito` en JSON. Para abrir uno:
guarda el archivo en la carpeta `diagramas/` y recarga la pagina (el selector aparece
en el panel de la paleta bajo "Recientes").

## Pruebas

```
# Python
python3 -m unittest discover -s tests/python -v

# JavaScript
node --test tests/js/*.test.mjs
```
