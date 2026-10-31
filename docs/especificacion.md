# Ambito — Especificación funcional y técnica (versión 1)

## 1. Objetivo

Ambito es un editor de diagramas que corre en local, con el estilo de Lucidchart, para dibujar **arquitectura AWS y redes AWS** con acabado profesional, limpio y corporativo, listo para presentar ante directivos.

**Principios:**

1. **Acabado profesional sin esfuerzo.** El estilo corporativo viene incorporado y todo diagrama sale prolijo por defecto.
2. **Alineación impecable.** Guías inteligentes como en Lucidchart.
3. **Fidelidad total del archivo.** Lo que se guarda en `.ambito` se reabre idéntico.
4. **Cero dependencias.** Python estándar y navegador, nada más.
5. **Código simple.** Una persona debe poder leerlo y mantenerlo.

## 2. Entorno y arquitectura

- **Backend:** `ambito.py`, solo con la librería estándar de Python 3.14 (`http.server` con `ThreadingHTTPServer`, `json`, `pathlib`, `zlib`, `webbrowser`, `argparse`).
- **Frontend:** `web/`, con HTML, CSS y JavaScript puro en módulos ES. El lienzo se dibuja con **SVG**.
- **Plataformas:** Windows (laptop corporativa, sin permisos de administrador), macOS (desarrollo) y Linux.
- **Navegadores:** Edge, Chrome, Safari y Firefox recientes.
- **Red:** el servidor escucha solo en `127.0.0.1`. Ningún recurso externo: sin CDN, sin fuentes web, sin telemetría.

### 2.1 Arranque

- `python ambito.py` (Windows) o `python3 ambito.py` (Mac) inicia el servidor y abre el navegador por defecto en `http://127.0.0.1:8765`.
- Opciones:
  - `--puerto`: por defecto 8765. Si está ocupado, se muestra un mensaje claro sugiriendo otro.
  - `--carpeta`: carpeta de diagramas, por defecto `./diagramas`. Se crea si no existe.
  - `--iconos`: carpeta de iconos, por defecto `./iconos`.
  - `--sin-navegador`
- Los lanzadores `iniciar.command` (Mac) e `iniciar.bat` (Windows) son de una o dos líneas, sin adornos.
- La consola muestra solo lo esencial, en texto plano: URL, carpeta de diagramas, número de iconos cargados y errores.

### 2.2 API local

Todas las respuestas son JSON en UTF-8, salvo la del PDF y los archivos estáticos.

| Método | Ruta | Uso |
|---|---|---|
| GET | `/` y `/web/...` | Archivos estáticos de la interfaz |
| GET | `/api/iconos` | Catálogo de iconos: id, nombre, categoría, tipo y ruta |
| GET | `/iconos/...` | Archivo SVG de un icono |
| GET | `/api/diagramas` | Lista de archivos `.ambito` en la carpeta de trabajo, con nombre y fecha de modificación |
| GET | `/api/diagrama?nombre=X` | Contenido de un `.ambito` |
| POST | `/api/diagrama` | Guardar: `{nombre, contenido}` |
| POST | `/api/respaldo` | Respaldo automático en `diagramas/.respaldo/` |
| POST | `/api/pdf` | Genera el PDF con Python (ver sección 9.3) |

**Seguridad:**

- Validar los nombres de archivo con una lista blanca de caracteres (letras, números, espacio, `-`, `_`, `.`). Rechazar rutas, `..` y separadores.
- No servir nada fuera de `web/`, `iconos/` y la carpeta de diagramas.
- Poner un límite de tamaño a los cuerpos POST, por ejemplo 50 MB.

## 3. Interfaz

Diseño limpio, sobrio y corporativo, en tres zonas más una barra superior.

- **Barra superior:**
  - Nombre "Ambito" y nombre del archivo actual, con un indicador de cambios sin guardar.
  - Botones: Nuevo, Abrir, Guardar, Guardar como, Importar archivo, Exportar, Deshacer, Rehacer.
  - Control de zoom.
- **Panel izquierdo (paleta):**
  - Buscador de iconos.
  - Sección "Grupos de red AWS" (contenedores).
  - Sección "Formas básicas": texto y caja simple.
  - Iconos AWS agrupados por categoría, en secciones plegables.
  - Sección "Recientes" con los últimos 12 usados.
- **Lienzo central:** fondo blanco, cuadrícula de puntos muy sutil (se ve en el editor, nunca en las exportaciones), zoom y desplazamiento.
- **Panel derecho (propiedades):** muestra las propiedades editables del elemento seleccionado (texto, tamaño, estilo de flecha, tipo de grupo, etc.). Sin selección, muestra las propiedades del documento.
- La interfaz usa la fuente del sistema e iconografía mínima.

### 3.1 Interacción con el lienzo

- **Lienzo virtualmente infinito:** el espacio de trabajo no tiene bordes. Se puede desplazar y hacer zoom sin topar con ningún límite. Solo hay que ajustar el viewport (transform de pan y zoom) sin recrear ni redibujar todo el SVG en cada movimiento.
- **Rendimiento sin lag:** el pan y el zoom se aplican con `transform="translate(x,y) scale(z)"` sobre un grupo SVG raíz, sin tocar elementos individuales. No se recalcula el layout ni se re-renderiza el DOM en cada frame. El objetivo es mantener 60 fps en diagramas de hasta 200 elementos.
- **Zoom:** del 25 % al 400 %.
  - `Ctrl/Cmd` + rueda, o el gesto de pellizcar en el trackpad de la Mac.
  - Botones + y −.
- **Ajustar a contenido (`Ctrl/Cmd+Shift+H` o botón en la barra):** calcula el bounding box de todos los elementos del diagrama y ajusta el pan y zoom para que quepan centrados en el viewport con un margen de 40 px. Si el diagrama está vacío, restablece el zoom a 100 % y centra el origen. Este botón es la forma principal de encontrar el diagrama cuando el usuario se "pierde" en el lienzo.
- **Zoom a selección:** si hay elementos seleccionados, `Ctrl/Cmd+Shift+H` ajusta solo al bounding box de la selección.
- **Desplazamiento:** rueda o trackpad, `Espacio` + arrastrar, o arrastrar con el botón central.
- **Selección:** clic, `Shift` + clic para sumar, o rectángulo de selección arrastrando sobre el fondo.
- **Mover:** arrastrar con el mouse. Con las flechas del teclado, 1 px; con `Shift` + flechas, 10 px.
- **Redimensionar:** con los tiradores. Los iconos mantienen su proporción.
- **Texto:** doble clic sobre un elemento para editarlo en el lugar.

### 3.2 Atajos de teclado (`Ctrl` en Windows y Linux, `Cmd` en Mac)

| Atajo | Acción |
|---|---|
| Ctrl/Cmd+S | Guardar |
| Ctrl/Cmd+Shift+S | Guardar como |
| Ctrl/Cmd+O | Abrir |
| Ctrl/Cmd+Z | Deshacer |
| Ctrl/Cmd+Shift+Z y Ctrl+Y | Rehacer |
| Ctrl/Cmd+C, V | Copiar y pegar |
| Ctrl/Cmd+D | Duplicar |
| Ctrl/Cmd+A | Seleccionar todo |
| Supr / Backspace | Eliminar |
| Esc | Cancelar la acción o quitar la selección |
| Ctrl/Cmd+Shift+H | Ajustar diagrama a pantalla (o seleccion si hay algo seleccionado) |
| Alt/Option (mantener) | Desactivar el imán mientras se arrastra |

Los tooltips muestran "Cmd" o "Ctrl" según el sistema.

## 4. Iconos AWS

- **Fuente:** el paquete oficial **AWS Architecture Icons** en SVG, descomprimido dentro de `iconos/`. No se modifica ni se versiona en git.
- **Catálogo:** el servidor recorre `iconos/` de forma recursiva al arrancar, y lo vuelve a hacer cuando se llama a `/api/iconos?recargar=1`. Por cada SVG:
  - **Categoría:** sale de la carpeta. Por ejemplo, `Arch_Compute` pasa a "Compute".
  - **Nombre legible:** sale del nombre del archivo, sin prefijos ni sufijos. Por ejemplo, `Arch_Amazon-EC2_64.svg` pasa a "Amazon EC2".
  - **Tipo:** servicio, recurso, grupo o categoría.
  - **Duplicados:** el paquete trae el mismo icono en varios tamaños. Se toma **una sola variante** por icono, preferentemente la de 64 px para servicios y la de 48 px Light para recursos.
- La estructura exacta del paquete cambia entre versiones. **Antes de programar el catálogo, inspeccionar la carpeta real** y adaptar las reglas (ver la skill `iconos-aws`).
- **Búsqueda:** sin distinguir mayúsculas ni tildes, por nombre y categoría. También acepta alias simples, por ejemplo "ec2", "s3", "alb", "rds" o "nat".
- **Tamaño por defecto en el lienzo:** 48 × 48. Etiqueta debajo, centrada.

## 5. Elementos del diagrama

### 5.1 Icono
SVG del catálogo con una etiqueta debajo. La etiqueta se ajusta a varias líneas con un ancho máximo de unos 120 px y queda centrada.

### 5.2 Grupo (contenedor de red AWS)

Es un rectángulo con un encabezado: el icono del grupo de 32 × 32 en la esquina superior izquierda y el nombre al lado.

**Tipos de la versión 1 y colores de referencia**

Verificar los colores contra los SVG del paquete oficial de grupos. Si difieren, mandan los oficiales.

| id | Nombre | Borde | Relleno | Línea |
|---|---|---|---|---|
| `aws-cloud` | AWS Cloud | #232F3E | ninguno | continua |
| `cuenta` | AWS Account | #E7157B | ninguno | continua |
| `region` | Region | #00A4A6 | ninguno | discontinua |
| `vpc` | VPC | #8C4FFF | ninguno | continua |
| `zona-disponibilidad` | Availability Zone | #00A4A6 | ninguno | discontinua |
| `subnet-publica` | Public subnet | #7AA116 | #F2F6E8 | continua |
| `subnet-privada` | Private subnet | #00A4A6 | #E6F6F7 | continua |
| `security-group` | Security group | #DD344C | ninguno | continua |
| `auto-scaling` | Auto Scaling group | #ED7100 | ninguno | discontinua |
| `centro-datos` | Corporate data center | #7D8998 | ninguno | continua |
| `generico` | Grupo genérico | #7D8998 | ninguno | discontinua |

**Anidamiento**

- Al soltar un elemento dentro de un grupo, ese elemento pasa a ser su **hijo**. El padre es el grupo más interno que lo contiene.
- Al sacar el elemento del grupo, deja de ser hijo.
- Al mover un grupo se mueven todos sus descendientes.
- Los grupos se dibujan siempre por debajo de sus hijos.

### 5.3 Texto
Texto libre con tamaños predefinidos (título 20, subtítulo 16, normal 13, nota 11) y alineación izquierda, centro o derecha.

### 5.4 Caja
Rectángulo simple con texto centrado, para elementos externos (usuarios, sistemas on-premise). Usa la paleta corporativa.

## 6. Conectores (flechas estilo Lucidchart)

### 6.1 Creación y enganche

- Al pasar el mouse sobre un elemento aparecen sus **puntos de conexión**: el centro de cada lado y las esquinas.
- La flecha se crea arrastrando desde un punto de conexión.
- Mientras se arrastra:
  - Si la punta queda **sobre el cuerpo** de un elemento, se resalta el elemento completo. Al soltar, el extremo queda en **modo automático**.
  - Si la punta queda **sobre un punto de conexión** (a unos 10 px de pantalla), se resalta solo ese punto. Al soltar, el extremo queda en **modo fijo**: guarda el lado y la posición relativa sobre ese lado (de 0 a 1).
  - Si se suelta en el vacío, el extremo queda **libre**, con coordenadas absolutas.
- **Cambiar el modo después:**
  - Arrastrar el extremo a un punto concreto lo vuelve fijo.
  - Arrastrarlo al centro o al cuerpo del elemento lo vuelve automático.
- **Modo automático:** en cada movimiento se recalcula el par de lados que da la ruta más corta y natural, según la posición relativa de los elementos.
- Cada extremo de la flecha tiene su propio modo.
- Al mover o redimensionar un elemento, todas sus flechas se recalculan y siguen pegadas.

### 6.2 Trazado

- **Ortogonal:** solo tramos horizontales y verticales.
  - La flecha sale perpendicular al lado, con un tramo inicial de unos 20 px, y llega perpendicular al lado de destino.
  - Se usan rutas en L o en Z con el menor número de quiebres posible.
- **Esquinas redondeadas:** radio de 6 px.
- **Quiebres manuales:** al seleccionar una flecha aparecen tiradores en el medio de cada tramo. Arrastrar un tramo lo desplaza en perpendicular. La ruta manual se guarda como lista de puntos y se respeta mientras sea coherente con los extremos. Si un movimiento la vuelve imposible, se recalcula.
- **Enderezado:** si un tramo queda casi recto (desvío de 3 px o menos), se endereza automáticamente.
- **Fuera de la versión 1:** esquivar obstáculos y saltos de línea en los cruces. Quedan para la versión 2.

### 6.3 Estilo

- **Por defecto:** línea de 1,5 px en gris oscuro #545B64, continua, sin punta al inicio y con una punta de triángulo relleno pequeño (unos 8 px) al final.
- **Colores:** solo de la paleta corporativa (sección 7).
- **Línea:** continua, discontinua o punteada.
- **Puntas, al inicio y al final:** ninguna, flecha rellena, flecha abierta o círculo.
- **Texto sobre la flecha:** 11 px, sobre un fondo blanco ajustado al texto, centrado en el tramo medio. Se puede arrastrar a lo largo de la flecha y se guarda su posición relativa.

## 7. Estilo corporativo

El detalle de tokens y la checklist están en la skill `estilo-corporativo`.

- **Tipografía:** `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. El archivo guarda "sistema", nunca una fuente concreta.
- **Texto principal:** #232F3E. **Texto secundario:** #545B64.
- **Paleta para flechas y cajas:**
  - Gris oscuro #545B64 (por defecto)
  - Gris #7D8998
  - Azul #0972D3
  - Naranja AWS #ED7100
  - Rojo #DD344C
  - Verde #7AA116
  - Morado #8C4FFF
- **Grosores fijos:** 1 px, 1,5 px y 2 px. No se permiten valores libres.
- **Cuadrícula:** 10 px.
- **Diferencias de tamaño de fuente entre sistemas:** las cajas y los contenedores conservan su tamaño guardado. Solo el texto interior se reajusta, con ajuste de línea y centrado. Las posiciones y las flechas nunca dependen de la medida del texto.

## 8. Alineación: guías inteligentes (prioridad máxima)

Comportamiento igual al de Lucidchart.

- **Guías al arrastrar:** mientras se mueve uno o varios elementos, se comparan sus bordes izquierdo, centro y derecho, y superior, medio e inferior, con los de **todos** los elementos visibles, aunque estén lejos.
  - Cuando coinciden, se dibuja una línea guía de color #E0119D que une los elementos alineados.
  - El umbral es de 5 px de pantalla, dividido por el zoom.
- **Imán:** dentro del umbral, el elemento se ajusta exacto a la alineación. Si no hay ninguna guía cerca, se ajusta a la cuadrícula de 10 px. Mantener `Alt/Option` desactiva el imán.
- **Espaciado igual:** si la separación entre el elemento que se mueve y su vecino coincide con una separación existente entre otros dos elementos de la misma fila o columna, se muestran marcas de distancia y se aplica el imán a esa separación.
- **Dentro de grupos:**
  - Guías para centrar un elemento en su contenedor.
  - Guías para igualar el margen respecto al borde del contenedor con el de sus hermanos.
- **Al redimensionar:** guías para igualar el ancho y el alto con otros elementos.
- **Flechas:** el enderezado automático de la sección 6.2.
- **Botones** (con dos o más elementos seleccionados):
  - Alinear a la izquierda, al centro o a la derecha.
  - Alinear arriba, al medio o abajo.
  - Distribuir en horizontal o en vertical (requiere tres o más elementos).
  - Igualar ancho, alto o ambos.
- Las guías no aparecen en las exportaciones.

## 9. Archivo y exportaciones

### 9.1 Formato `.ambito`

Es JSON en UTF-8 y el **único formato que se importa y exporta**. El detalle está en la skill `formato-ambito`.

```json
{
  "formato": "ambito",
  "version": 1,
  "documento": {
    "nombre": "Red produccion",
    "creado": "2026-10-31T10:00:00-05:00",
    "modificado": "2026-10-31T11:20:00-05:00"
  },
  "lienzo": { "cuadricula": 10 },
  "iconos": {
    "arch-amazon-ec2": {
      "nombre": "Amazon EC2",
      "categoria": "Compute",
      "svg": "<svg ...>...</svg>"
    }
  },
  "elementos": [
    { "id": "g1", "tipo": "grupo", "grupo": "vpc", "padre": null,
      "x": 100, "y": 80, "ancho": 800, "alto": 500, "texto": "VPC produccion" },
    { "id": "e1", "tipo": "icono", "icono": "arch-amazon-ec2", "padre": "g1",
      "x": 300, "y": 200, "ancho": 48, "alto": 48, "texto": "Servidor web" }
  ],
  "conectores": [
    { "id": "c1",
      "origen":  { "elemento": "e1", "modo": "auto" },
      "destino": { "elemento": "e2", "modo": "fijo", "lado": "izquierda", "posicion": 0.5 },
      "puntos": [[420, 224], [420, 300]],
      "texto": "HTTPS 443", "posicionTexto": 0.5,
      "estilo": { "color": "#545B64", "grosor": 1.5, "linea": "continua",
                  "inicio": "ninguna", "fin": "flecha" } }
  ]
}
```

**Reglas:**

- **Validación al abrir:**
  - Si `formato` no es `"ambito"`, el archivo se rechaza con un mensaje claro.
  - Si `version` es mayor que la soportada, se muestra un aviso: "creado con una version mas nueva".
  - Las versiones anteriores pasan por funciones de migración `v1 -> v2 -> ...`.
- **Icono embebido:** cada icono usado se guarda dentro del archivo, una sola vez por id. Así se abre igual aunque falte la carpeta `iconos/` o se cambie de equipo.
- **Orden y capas:** el orden del arreglo `elementos` define el orden de dibujo, y los grupos siempre van antes que sus hijos. Las coordenadas son absolutas en el lienzo.
- **Extremo libre de una flecha:** `{ "modo": "libre", "x": 0, "y": 0 }`.
- **Escritura canónica:**
  - Indentación de 2 espacios.
  - Claves en el orden del esquema.
  - Números redondeados a 2 decimales.
  - Guardar, abrir y volver a guardar debe producir **exactamente el mismo texto**.

### 9.2 Guardar, abrir y respaldo

- **Guardar** escribe en la carpeta de trabajo (`--carpeta`) mediante la API.
- **Abrir** muestra la lista de archivos `.ambito` de esa carpeta.
- **Importar archivo** abre un `.ambito` desde cualquier ubicación con el selector de archivos del navegador.
- **Descargar copia** baja el `.ambito` con la descarga normal del navegador.
- **Cambios sin guardar:** se marcan en la barra superior y se avisa antes de cerrar la pestaña.
- **Respaldo automático:** cada 60 segundos, si hubo cambios, se escribe en `diagramas/.respaldo/`. Se conservan los últimos 10 por diagrama.

### 9.3 Exportaciones (solo para ver y compartir, sin datos internos)

En todas las exportaciones:

- Se incluye solo el contenido, con un margen de 40 px.
- No aparecen la selección, los tiradores, las guías ni la cuadrícula.
- Los iconos se insertan como imágenes en base64 (`data:`) para que el renderizado no dependa de rutas.

**PNG**

- Escala 1x, 2x o 3x (por defecto 2x).
- Fondo blanco (por defecto) o transparente.
- Se genera en el navegador: SVG, luego imagen, luego canvas, luego `toBlob`.

**PDF desde el navegador (vectorial)**

- Abre una vista de impresión que contiene solo el diagrama, con `@page { size: <ancho>px <alto>px; margin: 0 }` calculado dinámicamente.
- El usuario elige "Guardar como PDF" en el diálogo del navegador.

**PDF con Python (descarga directa)**

1. El navegador dibuja el diagrama en un canvas a 3x con fondo blanco.
2. Toma los píxeles con `getImageData`, quita el canal alfa (deja RGB) y los comprime con `CompressionStream('deflate')`, que produce formato zlib.
3. Envía a `/api/pdf` el ancho y el alto en píxeles, el tamaño lógico del diagrama y los datos comprimidos.
4. Python arma un PDF de una página con el tamaño lógico (px × 0,75 = puntos), con la imagen como XObject `/FlateDecode` en `/DeviceRGB` y 8 bits.
5. El PDF se devuelve como descarga.

El PDF debe empezar con `%PDF-1.4`, tener la tabla xref correcta y terminar en `%%EOF`.

## 10. Historial

- **Deshacer y rehacer** por instantáneas del documento: cada acción completa cuenta como un paso. Un arrastre entero es un solo paso, no uno por cada píxel.
- Límite de 100 pasos.
- Al abrir un archivo se reinicia el historial.

## 11. Fuera de alcance de la versión 1 (versión 2 en adelante)

- Exportar SVG (descartado).
- Esquivar obstáculos con las flechas y saltos de línea en los cruces.
- Varias páginas por documento.
- Plantillas de arquitectura.
- Capas y bloqueo de elementos.
- Comentarios.
- Colaboración.
- Insertar la fuente en las exportaciones.

## 12. Criterios de aceptación finales (entregable completo)

1. Un diagrama de referencia en `ejemplos/red-referencia.ambito` incluye:
   - AWS Cloud, Region y VPC con 2 Availability Zones, cada una con una subnet pública y una privada.
   - Internet Gateway, ALB, NAT Gateway, 2 instancias EC2 y RDS.
   - Un usuario externo.
   - Flechas con texto, en modo automático y en modo fijo.

   Se puede construir de cero solo con la interfaz.
2. Guardar, cerrar, abrir y volver a guardar ese diagrama produce un archivo idéntico, byte a byte.
3. Las exportaciones PNG, PDF del navegador y PDF de Python se ven correctas y prolijas, sin elementos del editor.
4. Todas las pruebas pasan en la Mac.
5. El repositorio clonado en la laptop Windows corporativa arranca con `python ambito.py`, sin instalar nada. El diagrama de referencia se abre idéntico y se exporta bien en Edge.
