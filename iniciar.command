#!/bin/bash
# Lanzador para Mac — doble clic para abrir Ambito
# Requiere el entorno conda python3147. Si no existe, usa python3 del sistema.
cd "$(dirname "$0")"
if conda run -n python3147 python --version > /dev/null 2>&1; then
    conda run -n python3147 python ambito.py
else
    python3 ambito.py
fi
