#!/bin/bash
# integration_audit.sh - Auditoría de integraciones para aplicaciones web
# Uso: ./integration_audit.sh

# Colores para terminal
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Archivo de salida
OUTPUT_FILE="integration_audit.md"

# Limpiar archivo si ya existe
> "$OUTPUT_FILE"

echo -e "${BLUE}🔍 Iniciando auditoría completa de integraciones...${NC}"
echo -e "${CYAN}Este proceso analizará problemas de coherencia entre componentes${NC}"
echo ""

# Función para contar ocurrencias
count_occurrences() {
    grep -r "$1" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "dist" | wc -l
}

# Función para obtener ejemplos
get_examples() {
    grep -r "$1" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "dist" | head -n 3
}

# Función para registrar un problema
log_issue() {
    local severity=$1
    local title=$2
    local description=$3
    local solution=$4
    local examples=$5
    local severity_icon=""
    
    case $severity in
        "critical") severity_icon="🔴" ;;
        "high") severity_icon="🟠" ;;
        "medium") severity_icon="🟡" ;;
        "low") severity_icon="🟢" ;;
        *) severity_icon="⚪" ;;
    esac
    
    cat >> "$OUTPUT_FILE" << EOL
### $severity_icon $title

**Severidad**: $severity

**Descripción**: $description

**Ejemplos encontrados**:
\`\`\`
$examples
\`\`\`

**Solución recomendada**: $solution

---

EOL
}

# Función para añadir una sección
add_section() {
    local section_num=$1
    local section_title=$2
    local section_desc=$3
    
    cat >> "$OUTPUT_FILE" << EOL
## $section_num $section_title

$section_desc

EOL
}

# Iniciar el archivo con un formato mejorado
cat > "$OUTPUT_FILE" << EOL
# 🔍 Auditoría Completa de Integraciones

**Fecha**: $(date)

<div align="center">
<img src="https://img.shields.io/badge/Auditoría-Integraciones-blue" alt="Auditoría de Integraciones">
</div>

Este informe identifica problemas de integración entre diferentes componentes de la aplicación, enfocándose en la coherencia y el flujo de datos entre sistemas.

**Resumen Ejecutivo:**
- Se buscan inconsistencias en la gestión de usuarios y sesiones
- Se revisan múltiples implementaciones de sistemas de pago
- Se identifican problemas con la gestión de imágenes
- Se analizan integraciones entre diferentes componentes y bases de datos

---

## 📋 Índice
1. [Autenticación y Gestión de Usuarios](#1-autenticación-y-gestión-de-usuarios)
2. [Pagos y Suscripciones](#2-pagos-y-suscripciones)
3. [Bases de Datos e Integraciones](#3-bases-de-datos-e-integraciones)
4. [Imágenes y Assets](#4-imágenes-y-assets)
5. [Arquitectura y Coherencia](#5-arquitectura-y-coherencia)
6. [Recomendaciones para Integración](#6-recomendaciones-para-integración)

---

EOL
echo -e "${CYAN}Analizando autenticación y gestión de usuarios...${NC}"

add_section "1." "Autenticación y Gestión de Usuarios" "Esta sección analiza cómo se implementa la autenticación y la coherencia en los datos de usuario a través de la aplicación."

# Contar referencias a autenticación
AUTH_COUNT=$(count_occurrences "auth\|login\|signin\|signIn\|authenticate")
echo "- Encontradas $AUTH_COUNT referencias a autenticación" >> "$OUTPUT_FILE"

# Contar implementaciones de login
LOGIN_COUNT=$(count_occurrences "login\|signin\|signIn\|signInWith")
echo "- Encontradas $LOGIN_COUNT referencias a funciones de login" >> "$OUTPUT_FILE"

# Contar implementaciones de logout
LOGOUT_COUNT=$(count_occurrences "logout\|signout\|signOut")
echo "- Encontradas $LOGOUT_COUNT referencias a funciones de logout" >> "$OUTPUT_FILE"

# Contar referencias a perfil de usuario
PROFILE_COUNT=$(count_occurrences "profile\|user\.|userData\|userInfo")
echo "- Encontradas $PROFILE_COUNT referencias a datos de usuario" >> "$OUTPUT_FILE"

# Contar referencias a proveedores de autenticación
OAUTH_COUNT=$(count_occurrences "google\|facebook\|twitter\|github\|oauth")
echo "- Encontradas $OAUTH_COUNT referencias a proveedores de autenticación" >> "$OUTPUT_FILE"

# Buscar almacenamiento de tokens 
TOKEN_COUNT=$(count_occurrences "token\|jwt\|localStorage\|sessionStorage")
echo "- Encontradas $TOKEN_COUNT referencias a tokens/almacenamiento local" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"

# Detectar problemas en autenticación
if [ $AUTH_COUNT -gt 15 ]; then
    AUTH_EXAMPLES=$(get_examples "auth\|login\|signin\|signIn\|authenticate")
    log_issue "high" "Múltiples implementaciones de autenticación" \
    "Se detectaron múltiples referencias a autenticación ($AUTH_COUNT), lo que sugiere sistemas de login duplicados o inconsistentes." \
    "Consolida toda la lógica de autenticación en un servicio centralizado. Implementa un hook o contexto global para manejar el estado de autenticación." \
    "$AUTH_EXAMPLES"
fi

if [ $PROFILE_COUNT -gt 20 ]; then
    PROFILE_EXAMPLES=$(get_examples "profile\|user\.|userData\|userInfo")
    log_issue "high" "Inconsistencias en el perfil de usuario" \
    "Se encontraron múltiples referencias a datos de usuario ($PROFILE_COUNT), lo que puede causar que la información mostrada sea inconsistente entre distintas partes de la aplicación." \
    "Implementa un store centralizado (Redux, Zustand, Context API) para mantener un único origen de datos del usuario. Crea un custom hook para acceder a los datos de manera consistente." \
    "$PROFILE_EXAMPLES"
fi

if [ $TOKEN_COUNT -gt 10 ]; then
    TOKEN_EXAMPLES=$(get_examples "token\|jwt\|localStorage\|sessionStorage")
    log_issue "medium" "Gestión de tokens dispersa" \
    "La gestión de tokens de autenticación está dispersa en múltiples archivos, lo que dificulta el mantenimiento y puede causar problemas de seguridad." \
    "Centraliza el manejo de tokens en un servicio dedicado. Considera usar HttpOnly cookies para tokens sensibles en lugar de localStorage." \
    "$TOKEN_EXAMPLES"
fi
echo -e "${CYAN}Analizando sistemas de pago y suscripciones...${NC}"

add_section "2." "Pagos y Suscripciones" "Esta sección examina la coherencia en los sistemas de pago y suscripciones implementados en la aplicación."

# Contar referencias a pagos
PAYMENT_COUNT=$(count_occurrences "payment\|checkout\|pay\|stripe\|paypal")
echo "- Encontradas $PAYMENT_COUNT referencias a sistemas de pago" >> "$OUTPUT_FILE"

# Referencias a PayPal específicamente
PAYPAL_COUNT=$(count_occurrences "paypal\|PayPal")
echo "- Encontradas $PAYPAL_COUNT referencias específicas a PayPal" >> "$OUTPUT_FILE"

# Referencias a Stripe específicamente
STRIPE_COUNT=$(count_occurrences "stripe\|Stripe")
echo "- Encontradas $STRIPE_COUNT referencias específicas a Stripe" >> "$OUTPUT_FILE"

# Contar implementaciones de checkout/compra
CHECKOUT_COUNT=$(count_occurrences "checkout\|purchase\|buy\|comprar")
echo "- Encontradas $CHECKOUT_COUNT referencias a procesos de compra/checkout" >> "$OUTPUT_FILE"

# Contar referencias a suscripciones
SUBSCRIPTION_COUNT=$(count_occurrences "subscription\|suscripción\|plan\|membresía")
echo "- Encontradas $SUBSCRIPTION_COUNT referencias a suscripciones/planes" >> "$OUTPUT_FILE"

# Contar referencias a webhooks/callbacks
WEBHOOK_COUNT=$(count_occurrences "webhook\|callback\|notification\|IPN")
echo "- Encontradas $WEBHOOK_COUNT referencias a webhooks/callbacks" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"

# Detectar problemas en pagos
if [ $PAYPAL_COUNT -gt 0 ] && [ $STRIPE_COUNT -gt 0 ]; then
    PAYMENT_EXAMPLES=$(get_examples "paypal\|PayPal\|stripe\|Stripe")
    log_issue "medium" "Múltiples proveedores de pago sin abstracción clara" \
    "Se están utilizando múltiples proveedores de pago (PayPal: $PAYPAL_COUNT, Stripe: $STRIPE_COUNT) sin una abstracción clara." \
    "Implementa una capa de abstracción (adapter pattern) para gestionar diferentes proveedores de pago con una interfaz común." \
    "$PAYMENT_EXAMPLES"
fi

if [ $CHECKOUT_COUNT -gt 10 ]; then
    CHECKOUT_EXAMPLES=$(get_examples "checkout\|purchase\|buy\|comprar")
    log_issue "high" "Múltiples implementaciones de checkout" \
    "Se detectaron múltiples implementaciones de procesos de checkout ($CHECKOUT_COUNT), lo que puede llevar a inconsistencias en la experiencia de pago." \
    "Centraliza el proceso de checkout en un flujo unificado. Implementa un servicio que encapsule toda la lógica de procesamiento de pagos." \
    "$CHECKOUT_EXAMPLES"
fi

if [ $SUBSCRIPTION_COUNT -gt 8 ]; then
    SUB_EXAMPLES=$(get_examples "subscription\|suscripción\|plan\|membresía")
    log_issue "high" "Gestión fragmentada de suscripciones" \
    "La gestión de suscripciones está dispersa en múltiples lugares de la aplicación, dificultando un manejo coherente de los planes y beneficios." \
    "Implementa un modelo unificado de suscripciones con tipos/interfaces claros. Centraliza la lógica de verificación de beneficios en un servicio dedicado." \
    "$SUB_EXAMPLES"
fi
echo -e "${CYAN}Analizando integraciones con bases de datos...${NC}"

add_section "3." "Bases de Datos e Integraciones" "Esta sección analiza la coherencia en el acceso a datos y las integraciones entre diferentes sistemas."

# Contar referencias a bases de datos
DB_COUNT=$(count_occurrences "database\|supabase\|firebase\|mongodb\|db\.\|query")
echo "- Encontradas $DB_COUNT referencias a bases de datos" >> "$OUTPUT_FILE"

# Contar operaciones específicas
INSERT_COUNT=$(count_occurrences "insert\|create\|add\|post")
echo "- Encontradas $INSERT_COUNT operaciones de inserción" >> "$OUTPUT_FILE"

UPDATE_COUNT=$(count_occurrences "update\|put\|patch\|modify")
echo "- Encontradas $UPDATE_COUNT operaciones de actualización" >> "$OUTPUT_FILE"

SELECT_COUNT=$(count_occurrences "select\|get\|fetch\|find\|query")
echo "- Encontradas $SELECT_COUNT operaciones de consulta" >> "$OUTPUT_FILE"

DELETE_COUNT=$(count_occurrences "delete\|remove\|destroy")
echo "- Encontradas $DELETE_COUNT operaciones de eliminación" >> "$OUTPUT_FILE"

# Contar referencias a tablas/colecciones específicas
TABLE_COUNT=$(count_occurrences "table\|collection\|model\|entity\|from('")
echo "- Encontradas $TABLE_COUNT referencias a tablas/colecciones" >> "$OUTPUT_FILE"

# Contar referencias a servicios específicos
SUPABASE_COUNT=$(count_occurrences "supabase")
FIREBASE_COUNT=$(count_occurrences "firebase\|firestore")
echo "- Referencias específicas: Supabase ($SUPABASE_COUNT), Firebase ($FIREBASE_COUNT)" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"

# Detectar problemas en bases de datos
if [ $DB_COUNT -gt 25 ]; then
    DB_EXAMPLES=$(get_examples "database\|supabase\|firebase\|mongodb\|db\.\|query")
    log_issue "high" "Acceso a base de datos disperso" \
    "El acceso a la base de datos está disperso en muchos lugares de la aplicación ($DB_COUNT referencias), lo que dificulta mantener la coherencia en las operaciones de datos." \
    "Implementa un patrón Repository o Data Access Layer para centralizar todo el acceso a datos. Crea servicios específicos para cada entidad (UserRepository, PaymentRepository, etc.)." \
    "$DB_EXAMPLES"
fi

if [ $SUPABASE_COUNT -gt 0 ] && [ $FIREBASE_COUNT -gt 0 ]; then
    MIXED_DB_EXAMPLES=$(get_examples "supabase\|firebase\|firestore")
    log_issue "critical" "Uso mezclado de servicios de base de datos" \
    "Se están utilizando múltiples servicios de base de datos (Supabase: $SUPABASE_COUNT, Firebase: $FIREBASE_COUNT) sin una clara separación, lo que puede llevar a inconsistencias en los datos." \
    "Elige un único servicio de base de datos como principal o implementa una clara separación de responsabilidades. Utiliza una capa de abstracción para interactuar con diferentes servicios." \
    "$MIXED_DB_EXAMPLES"
fi

if [ $TABLE_COUNT -gt 15 ]; then
    TABLE_EXAMPLES=$(get_examples "table\|collection\|model\|entity\|from('")
    log_issue "medium" "Referencias dispersas a modelos de datos" \
    "Hay múltiples referencias a tablas/colecciones dispersas por la aplicación, lo que dificulta mantener la coherencia en el modelo de datos." \
    "Centraliza la definición de modelos y el acceso a tablas en archivos/servicios específicos. Implementa un sistema de migraciones para gestionar cambios en el esquema." \
    "$TABLE_EXAMPLES"
fi
echo -e "${CYAN}Analizando gestión de imágenes y assets...${NC}"

add_section "4." "Imágenes y Assets" "Esta sección examina cómo se gestionan las imágenes y otros assets en la aplicación."

# Contar referencias a imágenes
IMG_COUNT=$(count_occurrences "img\|image\|src=\|imagen\|picture\|photo")
echo "- Encontradas $IMG_COUNT referencias a imágenes" >> "$OUTPUT_FILE"

# Contar referencias a optimización de imágenes
IMG_OPT_COUNT=$(count_occurrences "next/image\|Image\|optimized\|lazy\|loading=\"lazy\"")
echo "- Encontradas $IMG_OPT_COUNT referencias a optimización de imágenes" >> "$OUTPUT_FILE"

# Contar URLs hardcodeadas
URL_COUNT=$(count_occurrences "http:\|https:\|www\\.")
echo "- Encontradas $URL_COUNT URLs hardcodeadas" >> "$OUTPUT_FILE"

# Contar referencias a rutas de assets
ASSET_PATH_COUNT=$(count_occurrences "/assets\|/images\|/img\|/public")
echo "- Encontradas $ASSET_PATH_COUNT referencias a rutas de assets" >> "$OUTPUT_FILE"

# Detectar CDNs
CDN_COUNT=$(count_occurrences "cloudinary\|imgix\|cloudfront\|cdn")
echo "- Encontradas $CDN_COUNT referencias a CDNs" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"

# Detectar problemas con imágenes
if [ $IMG_COUNT -gt 20 ] && [ $IMG_OPT_COUNT -lt 5 ]; then
    IMG_EXAMPLES=$(get_examples "img\|image\|src=\|imagen\|picture")
    log_issue "medium" "Imágenes sin optimización" \
    "Se encontraron muchas referencias a imágenes ($IMG_COUNT) pero pocas implementaciones de optimización ($IMG_OPT_COUNT), lo que puede afectar el rendimiento." \
    "Implementa un componente común para imágenes con optimización. Considera usar Next/Image, react-optimized-image o un servicio como Cloudinary." \
    "$IMG_EXAMPLES"
fi

if [ $URL_COUNT -gt 15 ]; then
    URL_EXAMPLES=$(get_examples "http:\|https:\|www\\.")
    log_issue "medium" "URLs hardcodeadas" \
    "Hay múltiples URLs hardcodeadas en el código, lo que dificulta el mantenimiento y la migración entre entornos." \
    "Centraliza todas las URLs en un archivo de configuración o variables de entorno. Implementa una función helper para gestionar las URLs base según el entorno." \
    "$URL_EXAMPLES"
fi

if [ $ASSET_PATH_COUNT -gt 10 ]; then
    ASSET_EXAMPLES=$(get_examples "/assets\|/images\|/img\|/public")
    log_issue "low" "Rutas de assets inconsistentes" \
    "Se encontraron múltiples referencias a rutas de assets, posiblemente inconsistentes entre sí." \
    "Define constantes para las rutas base de los assets. Considera usar un helper para construir rutas completas a assets." \
    "$ASSET_EXAMPLES"
fi
echo -e "${CYAN}Analizando arquitectura general y coherencia...${NC}"

add_section "5." "Arquitectura y Coherencia" "Esta sección analiza la arquitectura general y la coherencia entre diferentes partes de la aplicación."

# Contar hooks personalizados
HOOK_COUNT=$(count_occurrences "function use[A-Z]")
echo "- Encontrados $HOOK_COUNT hooks personalizados" >> "$OUTPUT_FILE"

# Contar contextos
CONTEXT_COUNT=$(count_occurrences "createContext\|useContext\|Provider value=")
echo "- Encontrados $CONTEXT_COUNT contextos/providers" >> "$OUTPUT_FILE"

# Contar implementaciones de estado global
GLOBAL_STATE_COUNT=$(count_occurrences "redux\|zustand\|recoil\|jotai\|mobx\|createStore")
echo "- Encontradas $GLOBAL_STATE_COUNT referencias a gestión de estado global" >> "$OUTPUT_FILE"

# Contar servicios/APIs
SERVICE_COUNT=$(count_occurrences "service\|api\|client\|axios\|fetch")
echo "- Encontradas $SERVICE_COUNT referencias a servicios/APIs" >> "$OUTPUT_FILE"

# Contar interfaces/types
TYPE_COUNT=$(count_occurrences "interface \|type \|: {")
echo "- Encontradas $TYPE_COUNT definiciones de tipos/interfaces" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"

# Detectar problemas de arquitectura
if [ $HOOK_COUNT -lt 5 ] && [ $SERVICE_COUNT -gt 20 ]; then
    SERVICE_EXAMPLES=$(get_examples "service\|api\|client\|axios\|fetch")
    log_issue "high" "Falta de abstracción en llamadas a servicios" \
    "Hay muchas llamadas a servicios/APIs ($SERVICE_COUNT) pero pocos hooks personalizados para abstraerlos ($HOOK_COUNT), lo que puede llevar a duplicación de código e inconsistencias." \
    "Implementa hooks personalizados para abstraer la lógica de servicio (useUsers, usePayments, etc.). Centraliza la configuración de clientes HTTP (axios, fetch) en un archivo." \
    "$SERVICE_EXAMPLES"
fi

if [ $CONTEXT_COUNT -gt 10 ]; then
    CONTEXT_EXAMPLES=$(get_examples "createContext\|useContext\|Provider value=")
    log_issue "medium" "Contextos excesivos" \
    "Hay demasiados contextos ($CONTEXT_COUNT), lo que puede complicar el flujo de datos y crear 'provider hell'." \
    "Consolida contextos relacionados. Considera implementar un estado global con Redux, Zustand o una solución similar para datos compartidos ampliamente." \
    "$CONTEXT_EXAMPLES"
fi

if [ $TYPE_COUNT -lt $((SERVICE_COUNT / 2)) ]; then
    log_issue "medium" "Tipado insuficiente" \
    "Hay pocas definiciones de tipos/interfaces ($TYPE_COUNT) en comparación con la cantidad de servicios ($SERVICE_COUNT), lo que puede llevar a inconsistencias en los datos." \
    "Define interfaces claras para todas las entidades y respuestas de API. Implementa un patrón de tipos compartidos entre frontend y backend si es posible." \
    "$(get_examples "any")"
fi

echo -e "${CYAN}Generando recomendaciones...${NC}"

add_section "6." "Recomendaciones para Integración" "Esta sección proporciona recomendaciones específicas para resolver los problemas de integración detectados."

cat >> "$OUTPUT_FILE" << 'EOL'
### 6.1 Plan de Acción para Resolver Problemas de Integración

#### Autenticación y Gestión de Usuarios

1. **Crear un servicio centralizado de autenticación**:
   ```typescript
   // auth.service.ts
   export class AuthService {
     // Un único punto para manejar login, logout, registro
     async login(email: string, password: string) {...}
     async register(userData: UserData) {...}
     async logout() {...}
     
     // Gestión centralizada de tokens
     private storeTokens(tokens: AuthTokens) {...}
     getAccessToken() {...}
     refreshToken() {...}
   }
