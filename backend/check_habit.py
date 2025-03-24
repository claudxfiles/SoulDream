import os
from dotenv import load_dotenv
from supabase import create_client, Client
import json
import sys

# Cargar variables de entorno
load_dotenv()

# Configurar cliente Supabase
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

# ID del hábito a verificar (se puede pasar como argumento)
habit_id = sys.argv[1] if len(sys.argv) > 1 else "69b28ecf-9af5-4acb-95b4-6f2b07d3b15c"

# Consultar sin restricciones
def check_habit():
    # Verificar en la tabla habits
    response = supabase.table("habits").select("*").eq("id", habit_id).execute()
    
    print(f"=== Verificando hábito ID: {habit_id} ===")
    
    if not response.data:
        print("Resultado: El hábito NO EXISTE en la base de datos")
        return False
    
    habit = response.data[0]
    print("Resultado: El hábito EXISTE en la base de datos")
    print(f"Usuario asignado: {habit.get('user_id')}")
    print(f"Estado activo: {habit.get('is_active')}")
    print(f"Título: {habit.get('title')}")

    # Verificar logs asociados
    logs_response = supabase.table("habit_logs").select("*").eq("habit_id", habit_id).execute()
    print(f"Número de logs asociados: {len(logs_response.data)}")
    
    # Verificar políticas RLS
    try:
        rls_query = """
        SELECT 
            schemaname, 
            tablename, 
            policyname, 
            permissive, 
            roles, 
            cmd, 
            qual
        FROM 
            pg_policies 
        WHERE 
            tablename = 'habits';
        """
        
        rls_response = supabase.rpc('execute_sql', { 'query': rls_query }).execute()
        print("\n=== Políticas RLS para la tabla 'habits' ===")
        if hasattr(rls_response, 'data') and rls_response.data:
            for policy in rls_response.data:
                print(json.dumps(policy, indent=2))
        else:
            print("No se pudieron obtener las políticas RLS o no existen")
    
    except Exception as e:
        print(f"Error al verificar políticas RLS: {str(e)}")
    
    return True

def delete_habit():
    """Intenta eliminar el hábito usando el rol de servicio"""
    if not check_habit():
        print("No se puede eliminar un hábito que no existe")
        return
    
    try:
        print(f"\n=== Intentando eliminar hábito ID: {habit_id} ===")
        delete_response = supabase.table("habits").delete().eq("id", habit_id).execute()
        
        if hasattr(delete_response, 'data') and delete_response.data:
            print("Resultado: El hábito se eliminó correctamente")
            print(f"Datos del hábito eliminado: {json.dumps(delete_response.data[0], indent=2)}")
        else:
            print("Resultado: No se pudo eliminar el hábito o no se recibió confirmación")
            print(f"Respuesta completa: {delete_response}")
    
    except Exception as e:
        print(f"Error al intentar eliminar el hábito: {str(e)}")

if __name__ == "__main__":
    action = sys.argv[2] if len(sys.argv) > 2 else "check"
    
    if action == "delete":
        delete_habit()
    else:
        check_habit() 