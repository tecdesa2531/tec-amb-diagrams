# Ambito — contexto para Claude Code

Ambito es un editor de diagramas local y gratuito, con el estilo de Lucidchart, enfocado en **arquitectura AWS y redes AWS**. Su propósito es producir diagramas con acabado profesional y corporativo para presentar ante gerencia y directivos.

Se desarrolla en una Mac y se usa en una laptop corporativa con Windows, sin permisos de administrador. Debe funcionar igual en cualquier sistema que tenga Python 3 y un navegador moderno.

## Documentos del proyecto (leer antes de trabajar)

- `docs/especificacion.md` — especificacion funcional y tecnica completa. Es la fuente de verdad.
- `docs/plan-de-trabajo.md` — fases de desarrollo con criterios de aceptacion.

Si algo de este archivo contradice la especificacion, manda la especificacion. Si la especificacion no cubre un caso, pregunta antes de decidir.

## Skills activos

Se cargan automaticamente cuando la tarea coincide con su descripcion:

| Skill | Cuando aplica |
|---|---|
| `codigo-ambito` | Al crear o modificar cualquier archivo .py, .js, .html o .css — siempre |
| `formato-ambito` | Al tocar el modelo de datos, la serializacion, apertura o guardado de `.ambito` |
| `estilo-corporativo` | Al tocar CSS, SVG del lienzo, flechas, etiquetas, grupos, exportaciones o cualquier pieza visual |
| `iconos-aws` | Al crear o modificar el catalogo de iconos o al actualizar el paquete AWS |
| `verificar-ambito` | Al terminar una fase, antes de proponer un commit, o al pedir verificacion |

## Forma de trabajo (obligatoria)

1. **Analizar antes de programar.** Antes de cada fase o cambio no trivial, presenta tu análisis y plan (archivos que vas a crear o tocar, decisiones, riesgos) y **espera la confirmación explícita del usuario**. No escribas código sin esa confirmación.
2. Trabaja **una fase a la vez**, en el orden de `docs/plan-de-trabajo.md`.
3. Al terminar una fase, aplica la skill `verificar-ambito` y muestra los resultados reales. No des una fase por terminada si fallan pruebas.
4. Propón un commit por fase con un mensaje claro en español sin tildes.

## Restricciones técnicas (no negociables)

- **Python 3.14** (el mismo en la Mac y en Windows). Solo la **librería estándar**: nada de pip, ni requirements.txt, ni dependencias.
- **Frontend:** HTML, CSS y JavaScript puro (módulos ES) servidos por el propio Python. Sin frameworks, sin npm, sin bundlers, sin paso de compilación, **sin CDN ni recursos de internet** (la laptop corporativa no debe depender de la red).
- **Node.js** solo se permite para **ejecutar pruebas** con su test runner integrado (`node --test`), sin paquetes npm. La app nunca depende de Node.
- El servidor escucha **solo en `127.0.0.1`**, en el puerto 8765 por defecto, configurable.
- Debe funcionar en Windows, macOS y Linux, en Edge, Chrome, Safari y Firefox recientes.
- Los módulos `cgi` y `cgitb` ya no existen en Python 3.13+: no usarlos. Leer los cuerpos JSON a mano desde `rfile`.

## Reglas de código

- **Ningún texto dentro del código lleva tildes, ñ ni caracteres especiales:** variables, funciones, comentarios, mensajes de consola, textos de la interfaz, nombres de archivos y claves JSON. Si una palabra necesita ñ, se elige un sinónimo natural ("Agregar" en lugar de "Añadir", "Diseno" no). El nombre visible de la app es **Ambito**, sin tilde.
- Código **simple, legible y fácil de entender** por una persona: funciones cortas, nombres claros en español sin tildes, comentarios breves solo donde aportan. Nada de trucos ni abstracciones innecesarias.
- Separar la **lógica pura** (modelo, formato, enrutado de flechas, guías, geometría) de la manipulación del DOM, para poder probarla con `node --test`.
- Archivos de tamaño razonable (orientativo: menos de 400 líneas). Si crece, dividir por responsabilidad.
- **Portabilidad:**
  - Rutas con `pathlib`.
  - Abrir archivos siempre con `encoding="utf-8"` (en Windows el valor por defecto no es UTF-8).
  - Atajos de teclado que acepten `Ctrl` (Windows y Linux) y `Cmd` (`metaKey`, Mac).
  - Fin de línea LF (ya configurado en `.gitattributes`).

## Estructura objetivo del repositorio

```
ambito/
  ambito.py              servidor local + API + generador de PDF (solo stdlib)
  iniciar.command        lanzador para Mac (doble clic)
  iniciar.bat            lanzador para Windows (doble clic)
  web/
    index.html
    css/estilos.css
    js/
      nucleo/            logica pura, sin DOM, probada con node --test
                         (modelo, formato, geometria, enrutado, guias, historial)
      ui/                lienzo, paleta, propiedades, barra, atajos, exportar
      app.js             punto de entrada
  iconos/                paquete oficial AWS Architecture Icons (no se versiona)
  diagramas/             carpeta de trabajo por defecto (no se versiona)
  ejemplos/              diagramas .ambito de ejemplo (si se versionan)
  tests/
    python/              unittest
    js/                  *.test.mjs para node --test
  docs/
  .claude/skills/
```

Es una estructura orientativa. Si durante una fase conviene ajustarla, propónlo y justifícalo antes de cambiarla.

## Entorno de desarrollo (Mac)

El entorno conda `python3147` tiene Python 3.14.7, la misma version que la laptop corporativa de Santander. Usarlo siempre para correr el servidor y las pruebas:

```
conda activate python3147
python ambito.py
```

O sin activar: `conda run -n python3147 python ambito.py`.

No asumir que el `python3` del sistema es la version correcta.

## Comandos

- Ejecutar en Mac: `conda run -n python3147 python ambito.py`. En Windows: `python ambito.py`.
- Opciones: `--puerto 8765`, `--carpeta ./diagramas`, `--iconos ./iconos`, `--sin-navegador`.
- Pruebas de Python: `python3 -m unittest discover -s tests/python -v`.
- Pruebas de JavaScript: `node --test tests/js/*.test.mjs`.

## Decisiones cerradas (no reabrir sin preguntar)

- Nombre **Ambito**. Extensión única **`.ambito`** para todos los sistemas operativos.
- `.ambito` es el **único formato que se importa y exporta**. Al reabrirlo, todo queda idéntico: posiciones, tamaños, contenedores, flechas con su enganche y sus quiebres, textos y estilos.
- Exportaciones **solo para ver y compartir**, sin datos internos: PNG, PDF vectorial desde el navegador y PDF generado con Python. **No se exporta SVG.**
- Tipografía: la **fuente del sistema** (Segoe UI en Windows, San Francisco en Mac).
- Flechas: enganche **automático** si se sueltan sobre el cuerpo del icono, **fijo** si se sueltan sobre un punto de conexión.
- Las **guías inteligentes de alineación** son prioridad máxima: el diagrama es para gerencia.
