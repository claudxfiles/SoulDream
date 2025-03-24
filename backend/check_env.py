import os
import dotenv
import sys

# Intenta cargar desde diferentes rutas
possible_env_files = [
    '.env',
    '../.env',
    'backend/.env',
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
]

for env_file in possible_env_files:
    if os.path.exists(env_file):
        print(f"Cargando variables de entorno desde: {env_file}")
        dotenv.load_dotenv(env_file)
        break
else:
    print("No se encontró ningún archivo .env")

# Imprimir variables de entorno de Supabase
print("\nVariables de entorno de Supabase:")
print(f"SUPABASE_URL: {os.environ.get('SUPABASE_URL', 'No definida')}")
print(f"SUPABASE_ANON_KEY definida: {bool(os.environ.get('SUPABASE_ANON_KEY'))}")
print(f"SUPABASE_KEY definida: {bool(os.environ.get('SUPABASE_KEY'))}")
print(f"SUPABASE_SERVICE_ROLE_KEY definida: {bool(os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))}")

# Imprimir las primeras letras de las claves (por seguridad)
if os.environ.get('SUPABASE_ANON_KEY'):
    key = os.environ.get('SUPABASE_ANON_KEY')
    print(f"SUPABASE_ANON_KEY primeros 10 caracteres: {key[:10]}...")

if os.environ.get('SUPABASE_KEY'):
    key = os.environ.get('SUPABASE_KEY')
    print(f"SUPABASE_KEY primeros 10 caracteres: {key[:10]}...")

# Si tenemos el módulo supabase, intentar crear un cliente
try:
    from supabase import create_client
    
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY') or os.environ.get('SUPABASE_KEY')
    
    if supabase_url and supabase_key:
        print("\nIntentando conectar a Supabase...")
        try:
            supabase = create_client(supabase_url, supabase_key)
            print("¡Conexión exitosa a Supabase!")
        except Exception as e:
            print(f"Error al conectar a Supabase: {e}")
    else:
        print("\nNo se puede conectar a Supabase: falta URL o clave")
except ImportError:
    print("\nNo se puede importar el módulo supabase. Instálalo con 'pip install supabase-py'") 