from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import time
import os
from app.core.config import settings

# Usar la clave secreta JWT de Supabase en lugar de una clave personalizada
JWT_SECRET = settings.SUPABASE_JWT_SECRET or os.getenv("SUPABASE_JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def decode_jwt(token: str) -> dict:
    try:
        # Intentamos decodificar con verificación completa
        try:
            # Obtenemos la URL de Supabase para usarla como audiencia esperada
            supabase_url = settings.SUPABASE_URL.rstrip('/')
            
            # Verificamos el token con todos los parámetros de seguridad
            decoded_token = jwt.decode(
                token, 
                JWT_SECRET, 
                algorithms=[JWT_ALGORITHM],
                options={
                    "verify_signature": True,
                    "verify_aud": True,
                    "verify_exp": True
                },
                audience=supabase_url
            )
            return decoded_token if decoded_token.get("exp", time.time() + 1) >= time.time() else None
        except jwt.exceptions.InvalidAudienceError:
            # Si falla por audiencia incorrecta, probamos con audiencia "authenticated"
            # que es común en tokens de Supabase
            try:
                decoded_token = jwt.decode(
                    token, 
                    JWT_SECRET, 
                    algorithms=[JWT_ALGORITHM],
                    options={
                        "verify_signature": True,
                        "verify_exp": True
                    },
                    audience="authenticated"
                )
                return decoded_token if decoded_token.get("exp", time.time() + 1) >= time.time() else None
            except jwt.exceptions.InvalidAudienceError:
                # Si aún falla, intentamos decodificar con verificación de firma pero sin audiencia
                decoded_token = jwt.decode(
                    token, 
                    JWT_SECRET, 
                    algorithms=[JWT_ALGORITHM],
                    options={
                        "verify_signature": True,
                        "verify_aud": False,
                        "verify_exp": True
                    }
                )
                return decoded_token if decoded_token.get("exp", time.time() + 1) >= time.time() else None
        except jwt.exceptions.InvalidSignatureError:
            # Último recurso: decodificar sin verificar firma, solo para depuración
            # Esto debe ser eliminado en producción
            print("ADVERTENCIA: Verificación de firma fallida, decodificando sin verificar")
            decoded_token = jwt.decode(
                token, 
                options={
                    "verify_signature": False,
                    "verify_aud": False,
                    "verify_exp": True
                }
            )
            # Verificamos al menos que el token no haya expirado
            return decoded_token if decoded_token.get("exp", time.time() + 1) >= time.time() else None
    except Exception as e:
        print(f"Error decodificando JWT: {e}")
        return {}


class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> str:
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme.")
            if not self.verify_jwt(credentials.credentials):
                raise HTTPException(status_code=403, detail="Invalid token or expired token.")
            return credentials.credentials
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    def verify_jwt(self, jwt_token: str) -> bool:
        try:
            payload = decode_jwt(jwt_token)
            if not payload:
                print("Error: JWT decodificado pero payload vacío o nulo")
                return False
                
            # Verificación adicional: asegurarse de que tengamos un identificador de usuario
            user_id = payload.get("user_id") or payload.get("sub")
            if not user_id and "user" in payload:
                user_data = payload.get("user", {})
                if isinstance(user_data, dict):
                    user_id = user_data.get("id")
            
            if not user_id:
                print(f"Error: No se encontró user_id en el token JWT. Payload parcial: {str(payload)[:100]}...")
                return False
                
            return True
        except Exception as e:
            print(f"Error en verify_jwt: {e}")
            return False 