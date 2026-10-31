# Checklist de prueba en Windows (laptop corporativa)

Ejecutar en Edge. Marcar cada paso cuando se complete.

## 1. Arranque

- [ ] Clonar o copiar el repositorio en la laptop.
- [ ] Abrir PowerShell o CMD en la carpeta del proyecto.
- [ ] Ejecutar: `python ambito.py`
  - Resultado esperado: mensaje `Ambito corriendo en http://127.0.0.1:8765` y el navegador abre la app.
- [ ] La interfaz muestra barra superior, paleta izquierda, lienzo central y panel de propiedades.

## 2. Diagrama de referencia

- [ ] Copiar `ejemplos/red-referencia.ambito` a la carpeta `diagramas/`.
- [ ] Recargar la pagina (F5).
- [ ] En la paleta, buscar y abrir `red-referencia`.
  - Resultado esperado: el diagrama se carga con grupos anidados, elementos y flechas.
- [ ] Verificar que los grupos AWS Cloud, Region, VPC, 2 AZ y subnets se ven correctamente.
- [ ] Verificar que las flechas tienen texto y puntas.

## 3. Edicion basica

- [ ] Arrastrar un elemento del lienzo y soltarlo en otro lugar.
- [ ] Presionar `Ctrl+Z` — el elemento vuelve a su posicion original.
- [ ] Presionar `Ctrl+Shift+Z` — el elemento vuelve a la posicion movida.
- [ ] Hacer doble clic en un elemento y editar su etiqueta. Presionar Enter.
- [ ] Presionar `Ctrl+S` — debe guardarse sin error.

## 4. Guardar y reabrir

- [ ] Presionar `Ctrl+Shift+S`, ingresar un nombre nuevo y guardar.
- [ ] Cerrar el navegador. Volver a ejecutar `python ambito.py`.
- [ ] Abrir el diagrama guardado.
  - Resultado esperado: posiciones, etiquetas y flechas son identicas.

## 5. Zoom y navegacion

- [ ] Usar `Ctrl + rueda del mouse` para hacer zoom in y zoom out.
- [ ] Usar la rueda del mouse (sin Ctrl) para desplazar verticalmente.
- [ ] Presionar `Ctrl+Shift+H` — el diagrama se ajusta al area visible.

## 6. Exportaciones

- [ ] Hacer clic en el boton "Exportar" en la barra superior.
- [ ] Seleccionar "PNG 1x" — se descarga un archivo `.png`. Abrirlo y verificar que se ve limpio (sin cuadricula ni tiradores de seleccion).
- [ ] Seleccionar "PNG 2x" — imagen mas grande y nitida.
- [ ] Seleccionar "PDF" — se abre el dialogo de impresion de Edge.
  - Verificar que solo se ve el diagrama, sin barras ni paneles.
  - Guardar como PDF y verificar que el resultado es correcto.

## 7. Paleta e iconos

- [ ] Escribir "ec2" en el buscador de la paleta.
  - Si los iconos estan instalados: aparece el icono de EC2.
  - Si no estan instalados: la paleta muestra "Sin resultados" o los elementos basicos.
- [ ] Arrastrar cualquier elemento al lienzo y verificar que se puede mover y redimensionar.

## 8. Atajos criticos en Windows

- [ ] `Ctrl+A` selecciona todos los elementos.
- [ ] `Ctrl+C` copia la seleccion.
- [ ] `Ctrl+V` pega con offset de 20 px.
- [ ] `Delete` elimina la seleccion.
- [ ] `Escape` deselecciona.

## Resultado

Si todos los pasos pasan: la app esta lista para uso en Windows con Edge.
Si alguno falla: anotar el paso y el mensaje de error, y reportarlo.
