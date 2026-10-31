---
name: project-entorno-python
description: Entorno conda con Python 3.14.7 disponible en la Mac para desarrollo de Ambito, equivalente al de la laptop Santander
metadata:
  type: project
---

El usuario tiene un entorno conda llamado `python3147` que usa Python 3.14.7,
la misma version que corre en la laptop corporativa de Santander.

**Why:** Garantiza que el codigo se prueba en el mismo interprete que usara
en produccion (Windows/Santander), evitando diferencias de version.

**How to apply:** Para ejecutar el servidor y las pruebas de Python en la Mac,
usar siempre `conda run -n python3147 python ambito.py` (o activar el entorno
con `conda activate python3147` antes de correr comandos Python). Nunca asumir
que el `python3` del sistema es la version correcta.
