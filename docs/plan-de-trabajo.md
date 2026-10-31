# Ambito — Plan de trabajo por fases

Reglas para cada fase:

1. Presentar el análisis y el plan de la fase. **Esperar la confirmación explícita** antes de escribir código.
2. Implementar solo lo de la fase.
3. Aplicar la skill `verificar-ambito` y mostrar los resultados reales.
4. Proponer un commit con un mensaje en español sin tildes. Ejemplo: `fase 3: grupos de red aws`.

---

## Fase 0 — Esqueleto

- Crear la estructura de carpetas de `CLAUDE.md`.
- `ambito.py`:
  - Servidor en `127.0.0.1`, con sus opciones de línea de comandos.
  - Servir `web/`.
  - Abrir el navegador.
  - Mensaje claro si el puerto está ocupado.
- `index.html` con el layout vacío: barra superior, paleta, lienzo y propiedades, con estilo corporativo base.
- Lanzadores `iniciar.command` e `iniciar.bat`.
- Pruebas base de Python y JavaScript, aunque sean mínimas.

**Aceptación:**

- `python3 ambito.py` abre la interfaz vacía en la Mac.
- `--puerto` y `--sin-navegador` funcionan.
- Las pruebas corren y pasan.

## Fase 1 — Modelo de documento y formato `.ambito`

- `web/js/nucleo/`:
  - Modelo del documento: crear, agregar, quitar y actualizar elementos y conectores.
  - Serialización canónica, validación y migraciones (aunque por ahora solo exista la v1).
- API para guardar, listar y abrir. Importar y descargar copia.
- Respaldo automático e indicador de cambios sin guardar.
- Por ahora el lienzo solo dibuja cajas simples, lo justo para probar el ciclo.

**Aceptación:**

- La prueba de ida y vuelta (guardar, abrir, guardar) da texto idéntico y pasa con documentos de ejemplo que cubren todos los campos.
- Un archivo con un `formato` incorrecto se rechaza con un mensaje claro.

## Fase 2 — Iconos y lienzo

- Catálogo de iconos: inspeccionar primero el paquete real en `iconos/` (skill `iconos-aws`).
- Paleta con buscador, categorías y recientes.
- Arrastrar un icono al lienzo. Seleccionar, mover, redimensionar, editar la etiqueta y eliminar.
- Zoom y desplazamiento, con trackpad de Mac y mouse de Windows.
- Panel de propiedades básico.
- Copiar, pegar y duplicar.
- Deshacer y rehacer por instantáneas.
- Iconos embebidos en el `.ambito`.

**Aceptación:**

- Un diagrama solo con iconos se guarda y se reabre idéntico.
- El buscador encuentra "ec2", "s3" y "alb".
- Deshacer y rehacer funcionan después de mover, redimensionar y editar.

## Fase 3 — Grupos de red AWS

- Los 11 tipos de grupo de la especificación, con sus colores verificados contra el paquete oficial.
- Anidamiento automático al soltar. Mover un grupo arrastra a sus descendientes.
- Orden de dibujo correcto.

**Aceptación:**

- Se arma AWS Cloud > Region > VPC > AZ > subnet > EC2.
- Al mover la VPC se mueve todo su contenido.
- Al reabrir, el anidamiento queda idéntico.

## Fase 4 — Conectores

- Puntos de conexión y creación arrastrando.
- Enganche automático o fijo según dónde se suelte, y extremos libres.
- Trazado ortogonal con esquinas redondeadas, tramos editables y enderezado.
- Texto sobre la flecha. Estilos de la paleta: línea y puntas.
- Las flechas se recalculan al mover o redimensionar.
- La lógica de trazado vive en `nucleo/`, con pruebas en `node --test`.

**Aceptación:**

- Con una flecha automática, al mover el destino de la derecha a abajo del origen, la flecha cambia de lado.
- Una flecha fija conserva su lado.
- Al reabrir el archivo, las flechas quedan idénticas, quiebres manuales incluidos.

## Fase 5 — Guías inteligentes y alineación

- Guías de bordes y centros contra todos los elementos.
- Imán con umbral dependiente del zoom, cuadrícula y `Alt/Option` para desactivarlo.
- Espaciado igual con marcas de distancia.
- Guías dentro de los contenedores y al redimensionar.
- Botones de alinear, distribuir e igualar tamaños.
- Lógica en `nucleo/guias.js`, con pruebas.

**Aceptación:**

- Se ven y se aplican las guías de alineación con iconos lejanos.
- El espaciado igual se detecta en una fila de tres iconos.
- Ninguna guía aparece en las exportaciones.

## Fase 6 — Exportaciones

- PNG a 1x, 2x o 3x, con fondo blanco o transparente.
- PDF vectorial desde el navegador con `@page` dinámico.
- PDF con Python según la sección 9.3 de la especificación.

**Aceptación:**

- Los tres formatos se ven correctos y sin elementos del editor.
- El PDF de Python abre bien en el visor de Mac y en Edge.
- Prueba de Python que valida la estructura del PDF generado.

## Fase 7 — Pulido y validación final

- Revisión visual completa con la skill `estilo-corporativo`.
- Construir `ejemplos/red-referencia.ambito` (sección 12 de la especificación).
- Revisar los atajos con Cmd y con Ctrl, y los mensajes de error.
- README breve: cómo arrancar, dónde poner los iconos, atajos.
- Checklist de prueba en Windows para que el usuario la ejecute en la laptop corporativa.

**Aceptación:** se cumplen todos los criterios de la sección 12 de la especificación.
