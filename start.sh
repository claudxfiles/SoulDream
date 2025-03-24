#!/bin/bash

# Asegurarnos de que conda está disponible
source ~/miniconda3/etc/profile.d/conda.sh

# Activar el entorno conda
conda activate souldream

# Iniciar el backend
echo "Iniciando el backend..."
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
backend_pid=$!

# Esperar 5 segundos para que el backend inicie correctamente
echo "Esperando que el backend inicie..."
sleep 5

# Iniciar el frontend
echo "Iniciando el frontend..."
cd ../frontend
npm run dev

# Para detener todos los procesos cuando se cierre el script
kill $backend_pid
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT 