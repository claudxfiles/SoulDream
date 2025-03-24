#!/bin/bash

# Asegurarnos de que conda está disponible
source ~/miniconda3/etc/profile.d/conda.sh

# Activar el entorno conda
conda activate souldream

# Ir al directorio del backend e iniciar el servidor
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 