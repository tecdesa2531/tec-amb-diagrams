---
name: verificar-ambito
description: >-
  Procedimiento de verificacion antes de dar por terminada una fase o un cambio
  en Ambito: pruebas Python y JS, arranque del servidor, ida y vuelta del
  formato, revision portable Mac/Windows. Usar siempre al terminar una fase,
  antes de proponer un commit, o cuando el usuario pida verificar o confirmar
  que algo funciona. Dispara ante frases como "termina la fase", "verifica",
  "esta listo", "propon el commit" o "que falta probar".
---

# Verificar Ambito

**No se declara terminado nada sin ejecutar estos pasos y mostrar el resultado
real.** Si algo falla, se informa y se corrige. Nunca se oculta.

## 1. Pruebas automaticas

```bash
python3 -m unittest discover -s tests/python -v
node --test tests/js/
```

Deben pasar todas. Si una prueba cambio, explicar por que.

## 2. Arranque

```bash
python3 ambito.py --sin-navegador --puerto 8799
```

- Comprobar que `GET /` responde 200.
- Comprobar que `GET /api/iconos` devuelve JSON.
- Si la fase toco la API: probar sus rutas, incluidas las de error (nombre de
  archivo invalido, intento de path traversal con `..`).
- Detener el servidor al terminar.

## 3. Formato (solo si se toco el modelo o el archivo)

La prueba de ida y vuelta del skill `formato-ambito` debe pasar.

## 4. Revision de reglas del proyecto

- [ ] Ningun texto del codigo lleva tildes, ñ ni caracteres especiales.
      Buscar con: `grep -rn '[^\x00-\x7F]' ambito/ web/ tests/ --include="*.py" --include="*.js" --include="*.html" --include="*.css"`
- [ ] Ningun recurso externo: no hay `http://` ni `https://` en `web/`,
      salvo `127.0.0.1`.
- [ ] Ninguna dependencia nueva: sin `pip`, sin `npm`, sin `import` fuera de la stdlib.
- [ ] Archivos abiertos con `encoding="utf-8"` y rutas con `pathlib`.
- [ ] Los atajos aceptan `Ctrl` (Windows/Linux) y `Cmd` (`metaKey`, Mac).

## 5. Prueba manual guiada

Entregar al usuario una lista corta (5–10 pasos) para probar en el navegador
lo que agrego la fase, con el resultado esperado de cada paso. Si la fase es
visual, incluir ademas la checklist del skill `estilo-corporativo`.

## 6. Resumen

Indicar que se verifico, que paso y que no, y proponer el mensaje de commit
en espanol sin tildes (por ejemplo: `"fase 1: servidor local y estructura base"`).
