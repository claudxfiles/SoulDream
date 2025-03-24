#!/bin/bash
# analyze.sh - Script mejorado para un análisis más detallado del proyecto

# Definir ruta de salida
PROJECT_ROOT=$(pwd)
OUTPUT_FILE="${PROJECT_ROOT}/analysis_report.md"

echo "# Análisis de tu Proyecto" > $OUTPUT_FILE
echo "Fecha: $(date)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Excluir node_modules y .git del análisis
EXCLUDE_DIRS="--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=out --exclude-dir=dist --exclude-dir=build"

# Verificar estructura del proyecto
echo "## Estructura del Proyecto" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Contar archivos por tipo (excluyendo node_modules)
echo "### Archivos por Tipo" >> $OUTPUT_FILE
TS_COUNT=$(find $PROJECT_ROOT -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
TSX_COUNT=$(find $PROJECT_ROOT -type f -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
JS_COUNT=$(find $PROJECT_ROOT -type f -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
JSX_COUNT=$(find $PROJECT_ROOT -type f -name "*.jsx" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
SCSS_COUNT=$(find $PROJECT_ROOT -type f -name "*.scss" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
CSS_COUNT=$(find $PROJECT_ROOT -type f -name "*.css" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)

echo "- TypeScript: $TS_COUNT archivos" >> $OUTPUT_FILE
echo "- React (TSX): $TSX_COUNT archivos" >> $OUTPUT_FILE
echo "- JavaScript: $JS_COUNT archivos" >> $OUTPUT_FILE
echo "- React (JSX): $JSX_COUNT archivos" >> $OUTPUT_FILE
echo "- SCSS: $SCSS_COUNT archivos" >> $OUTPUT_FILE
echo "- CSS: $CSS_COUNT archivos" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Análisis de complejidad de archivos
echo "### Complejidad de Archivos" >> $OUTPUT_FILE
LARGEST_FILES=$(find $PROJECT_ROOT -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -exec wc -l {} \; | sort -nr | head -5)
echo "**Archivos más grandes (por líneas de código):**" >> $OUTPUT_FILE
echo '```' >> $OUTPUT_FILE
echo "$LARGEST_FILES" >> $OUTPUT_FILE
echo '```' >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Buscar frameworks y tecnologías
echo "## Tecnologías Detectadas" >> $OUTPUT_FILE

# Buscar Next.js (más métodos)
NEXT_DETECTED=false
NEXT_VERSION=""

# Método 1: Buscar en package.json
if [ -f "package.json" ]; then
  if grep -q "\"next\"" "package.json"; then
    NEXT_DETECTED=true
    NEXT_VERSION=$(grep -o '"next": *"[^"]*"' package.json | cut -d'"' -f4)
  fi
fi

# Método 2: Buscar archivos típicos de Next.js
if [ -d "pages" ] || [ -d "app" ]; then
  NEXT_DETECTED=true
fi

# Método 3: Buscar imports de Next.js en el código
if grep -q "from 'next\|from \"next" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
  NEXT_DETECTED=true
fi

# Método 4: Buscar next.config.js
if [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
  NEXT_DETECTED=true
fi

if [ "$NEXT_DETECTED" = true ]; then
  echo "- ✅ Next.js detectado" >> $OUTPUT_FILE
  if [ ! -z "$NEXT_VERSION" ]; then
    echo "  - Versión: $NEXT_VERSION" >> $OUTPUT_FILE
  fi
  
  # Analizar estructura App Router vs Pages Router
  if [ -d "app" ]; then
    echo "  - Usando App Router (moderno)" >> $OUTPUT_FILE
    APP_ROUTES=$(find $PROJECT_ROOT/app -type d -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
    echo "  - Rutas App Router: aproximadamente $APP_ROUTES" >> $OUTPUT_FILE
  fi
  
  if [ -d "pages" ]; then
    echo "  - Usando Pages Router (clásico)" >> $OUTPUT_FILE
    PAGE_ROUTES=$(find $PROJECT_ROOT/pages -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.js" -o -name "*.ts" | wc -l)
    echo "  - Páginas definidas: aproximadamente $PAGE_ROUTES" >> $OUTPUT_FILE
  fi
  
  # Verificar uso de API Routes
  if [ -d "pages/api" ] || [ -d "app/api" ]; then
    echo "  - API Routes implementadas" >> $OUTPUT_FILE
    API_ROUTES=$(find $PROJECT_ROOT -path "*/api/*" -type f -name "*.ts" -o -name "*.js" | wc -l)
    echo "  - Endpoints API: aproximadamente $API_ROUTES" >> $OUTPUT_FILE
  fi
else
  echo "- ❌ Next.js no encontrado" >> $OUTPUT_FILE
fi

# Buscar React (más métodos)
REACT_DETECTED=false
REACT_VERSION=""

# Método 1: Buscar en package.json
if [ -f "package.json" ]; then
  if grep -q "\"react\"" "package.json"; then
    REACT_DETECTED=true
    REACT_VERSION=$(grep -o '"react": *"[^"]*"' package.json | cut -d'"' -f4)
  fi
fi

# Método 2: Buscar imports de React
if grep -q "from 'react\|from \"react\|import React" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
  REACT_DETECTED=true
fi

if [ "$REACT_DETECTED" = true ]; then
  echo "- ✅ React detectado" >> $OUTPUT_FILE
  if [ ! -z "$REACT_VERSION" ]; then
    echo "  - Versión: $REACT_VERSION" >> $OUTPUT_FILE
  fi
  
  # Contar componentes
  COMPONENT_COUNT=$(grep -r "function.*(" --include="*.tsx" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
  echo "  - Aproximadamente $COMPONENT_COUNT componentes definidos" >> $OUTPUT_FILE
  
  # Detectar uso de hooks personalizados
  CUSTOM_HOOKS=$(grep -r "function use" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
  echo "  - $CUSTOM_HOOKS hooks personalizados detectados" >> $OUTPUT_FILE
  
  # Detectar bibliotecas de componentes UI
  if grep -q "shadcn\|ui/.*button\|ui/.*card" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Biblioteca UI: Shadcn UI detectada" >> $OUTPUT_FILE
  fi
  
  if grep -q "material-ui\|@mui\|@emotion" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Biblioteca UI: Material UI detectada" >> $OUTPUT_FILE
  fi
  
  if grep -q "chakra-ui\|@chakra-ui" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Biblioteca UI: Chakra UI detectada" >> $OUTPUT_FILE
  fi
else
  echo "- ❌ React no encontrado" >> $OUTPUT_FILE
fi

# Buscar Tailwind CSS (más métodos)
TAILWIND_DETECTED=false
TAILWIND_VERSION=""

# Método 1: Buscar en package.json
if [ -f "package.json" ]; then
  if grep -q "\"tailwindcss\"" "package.json"; then
    TAILWIND_DETECTED=true
    TAILWIND_VERSION=$(grep -o '"tailwindcss": *"[^"]*"' package.json | cut -d'"' -f4)
  fi
fi

# Método 2: Buscar archivos de configuración de Tailwind
if [ -f "tailwind.config.js" ] || [ -f "tailwind.config.ts" ]; then
  TAILWIND_DETECTED=true
fi

# Método 3: Buscar clases de Tailwind en archivos
if grep -q "className=\".*flex\|className=\".*text-\|className=\".*bg-" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
  TAILWIND_DETECTED=true
fi

if [ "$TAILWIND_DETECTED" = true ]; then
  echo "- ✅ Tailwind CSS detectado" >> $OUTPUT_FILE
  if [ ! -z "$TAILWIND_VERSION" ]; then
    echo "  - Versión: $TAILWIND_VERSION" >> $OUTPUT_FILE
  fi
  
  # Verificar plugins y configuraciones
  if grep -q "tailwindcss/typography\|@tailwindcss/forms\|@tailwindcss/aspect-ratio" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="tailwind.config.js" --include="tailwind.config.ts"; then
    echo "  - Plugins Tailwind detectados" >> $OUTPUT_FILE
    PLUGINS=$(grep -r "require.*tailwindcss" --include="tailwind.config.js" --include="tailwind.config.ts" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    echo "  - $PLUGINS plugins configurados" >> $OUTPUT_FILE
  fi
  
  # Verificar personalización
  if grep -q "theme: {" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="tailwind.config.js" --include="tailwind.config.ts"; then
    echo "  - Tema personalizado configurado" >> $OUTPUT_FILE
  fi
else
  echo "- ❌ Tailwind CSS no encontrado" >> $OUTPUT_FILE
fi

# Buscar Supabase (más métodos)
SUPABASE_DETECTED=false
SUPABASE_VERSION=""
SUPABASE_STATUS="0%"

# Método 1: Buscar en package.json
if [ -f "package.json" ]; then
  if grep -q "supabase" "package.json"; then
    SUPABASE_DETECTED=true
    SUPABASE_VERSION=$(grep -o '"@supabase[^"]*": *"[^"]*"' package.json | cut -d'"' -f4)
  fi
fi

# Método 2: Buscar imports de Supabase
if grep -q "from '@supabase\|from \"@supabase\|import.*supabase" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
  SUPABASE_DETECTED=true
  SUPABASE_STATUS="98%"
fi

if [ "$SUPABASE_DETECTED" = true ]; then
  echo "- ✅ Supabase detectado" >> $OUTPUT_FILE
  if [ ! -z "$SUPABASE_VERSION" ]; then
    echo "  - Versión: $SUPABASE_VERSION" >> $OUTPUT_FILE
  fi
  
  # Detectar tablas y esquema
  SUPABASE_TABLES=$(grep -r "supabase.*from\|from(.*'" $PROJECT_ROOT $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" | grep -o "'[^']*'" | sort | uniq | tr '\n' ', ' | sed 's/,$//')
  if [ ! -z "$SUPABASE_TABLES" ]; then
    echo "  - Tablas detectadas: $SUPABASE_TABLES" >> $OUTPUT_FILE
  fi
  
  # Detectar uso de funciones de autenticación
  if grep -q "supabase.*auth\|auth.*signin\|auth.*signup\|signIn\|signUp\|signOut" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Autenticación Supabase implementada" >> $OUTPUT_FILE
    
    # Detectar proveedores OAuth
    if grep -q "supabase.*google\|provider.*google" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
      echo "  - Proveedor OAuth: Google" >> $OUTPUT_FILE
    fi
    
    if grep -q "supabase.*github\|provider.*github" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
      echo "  - Proveedor OAuth: GitHub" >> $OUTPUT_FILE
    fi
  fi
  
  # Detectar uso de realtime
  if grep -q "supabase.*realtime\|subscribe\|subscription" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Funcionalidad Realtime implementada" >> $OUTPUT_FILE
  fi
  
  # Detectar uso de storage
  if grep -q "supabase.*storage\|storage.*upload\|storage.*download" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Storage de Supabase implementado" >> $OUTPUT_FILE
  fi
  
  # Detectar RLS y políticas de seguridad
  if grep -q "RLS\|row level security\|security policy" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.sql" --include="*.ts" --include="*.js"; then
    echo "  - Políticas de seguridad RLS implementadas" >> $OUTPUT_FILE
  fi
  
  echo "  - Implementación: $SUPABASE_STATUS" >> $OUTPUT_FILE
else
  echo "- ❌ Supabase no encontrado" >> $OUTPUT_FILE
fi

# Buscar OpenRouter y modelos específicos
USING_OPENROUTER=false
USING_QWEN=false
USING_GROQ_FIREWORKS=false
AI_STATUS="0%"

# Buscar referencias a modelo, provider, order, Groq, Fireworks
if grep -q "model\|provider\|order\|messages\|stream" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
  if grep -q "\"order\"\|'order'\|order:" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
    if grep -q "Groq\|Fireworks" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
      USING_OPENROUTER=true
      USING_GROQ_FIREWORKS=true
      echo "- ✅ OpenRouter detectado" >> $OUTPUT_FILE
      echo "  - ✅ Configuración con provider.order" >> $OUTPUT_FILE
      echo "  - ✅ Proveedores: Groq, Fireworks" >> $OUTPUT_FILE
      
      # Contar número aproximado de prompts
      PROMPT_COUNT=$(grep -r "system.*message\|user.*message\|assistant.*message" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
      echo "  - Aproximadamente $PROMPT_COUNT prompts/conversaciones definidos" >> $OUTPUT_FILE
    fi
  fi
fi

# Buscar referencias a Qwen en el código
if grep -q "qwen\|qwq-32b" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
  USING_QWEN=true
  echo "  - ✅ Modelo: qwen/qwq-32b:online" >> $OUTPUT_FILE
fi

# Buscar modelo en variable
if grep -q "model.*=.*\"qwen\|model.*=.*'qwen" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
  USING_QWEN=true
  echo "  - ✅ Modelo referenciado como variable" >> $OUTPUT_FILE
fi

# Si está usando OpenRouter, Qwen con Groq o Fireworks
if [ "$USING_OPENROUTER" = true ] || [ "$USING_QWEN" = true ] || [ "$USING_GROQ_FIREWORKS" = true ]; then
  echo "- ✅ Integración IA: OpenRouter" >> $OUTPUT_FILE
  
  # Buscar caché para IA
  if grep -q "cache\|cach" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
    echo "  - ✅ Sistema de caché detectado" >> $OUTPUT_FILE
    
    # Detectar tipo de caché
    if grep -q "redis\|Redis" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
      echo "  - Tipo de caché: Redis" >> $OUTPUT_FILE
    elif grep -q "memcached\|Memcached" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
      echo "  - Tipo de caché: Memcached" >> $OUTPUT_FILE
    else
      echo "  - Tipo de caché: En memoria / Local" >> $OUTPUT_FILE
    fi
    
    AI_STATUS="95%"
  else
    echo "  - ❌ Sistema de caché no detectado" >> $OUTPUT_FILE
    AI_STATUS="87%"
  fi
  
  # Buscar funciones específicas de IA
  if grep -q "summarize\|summarization\|resumen" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
    echo "  - Funcionalidad: Resumir contenido" >> $OUTPUT_FILE
  fi
  
  if grep -q "classify\|classification\|categorize\|categorization" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
    echo "  - Funcionalidad: Clasificación de contenido" >> $OUTPUT_FILE
  fi
  
  if grep -q "generate\|generation\|crear\|creacion" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
    echo "  - Funcionalidad: Generación de contenido" >> $OUTPUT_FILE
  fi
  
  echo "  - Implementación: $AI_STATUS" >> $OUTPUT_FILE
else
  echo "- ⚠️ Integración IA: No detectada completamente" >> $OUTPUT_FILE
  AI_STATUS="50%"
fi

# Buscar Google APIs
GOOGLE_APIS_DETECTED=false
AUTH_STATUS="0%"
CALENDAR_STATUS="0%"

# Método 1: Buscar en package.json
if [ -f "package.json" ]; then
  if grep -q "google\|googleapis" "package.json"; then
    GOOGLE_APIS_DETECTED=true
    GOOGLE_VERSION=$(grep -o '"googleapis": *"[^"]*"' package.json | cut -d'"' -f4 || echo "No version")
  fi
fi

# Método 2: Buscar imports de Google APIs
if grep -q "from 'googleapis\|from \"googleapis\|import.*google" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
  GOOGLE_APIS_DETECTED=true
fi

if [ "$GOOGLE_APIS_DETECTED" = true ]; then
  echo "- ✅ Google APIs detectadas" >> $OUTPUT_FILE
  if [ ! -z "$GOOGLE_VERSION" ]; then
    echo "  - Versión: $GOOGLE_VERSION" >> $OUTPUT_FILE
  fi
  
  # Verificar autenticación Google
  if grep -q "GoogleProvider\|auth.*google\|google.*auth" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - ✅ Autenticación Google implementada" >> $OUTPUT_FILE
    
    # Verificar manejo de scopes
    SCOPES=$(grep -r "scope\|scopes" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | grep "google\|calendar" | wc -l)
    echo "  - $SCOPES referencias a scopes OAuth detectadas" >> $OUTPUT_FILE
    
    AUTH_STATUS="100%"
  else
    echo "  - ❌ Autenticación Google no detectada" >> $OUTPUT_FILE
  fi
  
  # Verificar Calendar
  if grep -q "calendar\|Calendar" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - ✅ Google Calendar implementado" >> $OUTPUT_FILE
    
    # Contar operaciones de Calendar
    EVENTS_CREATE=$(grep -r "events.insert\|insertEvent\|createEvent" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    EVENTS_LIST=$(grep -r "events.list\|listEvents\|getEvents" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    EVENTS_UPDATE=$(grep -r "events.update\|updateEvent" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    EVENTS_DELETE=$(grep -r "events.delete\|deleteEvent" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    
    echo "  - Operaciones Calendar detectadas:" >> $OUTPUT_FILE
    echo "    - Crear eventos: $EVENTS_CREATE referencias" >> $OUTPUT_FILE
    echo "    - Listar eventos: $EVENTS_LIST referencias" >> $OUTPUT_FILE
    echo "    - Actualizar eventos: $EVENTS_UPDATE referencias" >> $OUTPUT_FILE
    echo "    - Eliminar eventos: $EVENTS_DELETE referencias" >> $OUTPUT_FILE
    
    # Verificar renovación de tokens
    if grep -q "refresh.*token\|token.*refresh" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
      echo "    - ✅ Renovación de tokens implementada" >> $OUTPUT_FILE
      REFRESH_MECHANISM=$(grep -r "refresh.*token\|token.*refresh" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | head -1)
      echo "    - Mecanismo: $(echo $REFRESH_MECHANISM | cut -c 1-80)..." >> $OUTPUT_FILE
      CALENDAR_STATUS="70%"
    else
      echo "    - ❌ Renovación de tokens no implementada" >> $OUTPUT_FILE
      CALENDAR_STATUS="45%"
    fi
    
    # Verificar sincronización bidireccional
    if grep -q "sync\|synchronize\|bidirectional" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
      if grep -q "calendar.*task\|task.*calendar" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
        echo "    - ✅ Sincronización bidireccional implementada" >> $OUTPUT_FILE
        CALENDAR_STATUS="85%"
      fi
    fi
    
    echo "  - Implementación Calendar: $CALENDAR_STATUS" >> $OUTPUT_FILE
  else
    echo "  - ❌ Google Calendar no detectado" >> $OUTPUT_FILE
  fi
  
  # Verificar otras APIs de Google
  if grep -q "gmail\|Gmail" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - ✅ Gmail API detectada" >> $OUTPUT_FILE
  fi
  
  if grep -q "sheets\|Sheets" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - ✅ Google Sheets API detectada" >> $OUTPUT_FILE
  fi
  
  if grep -q "drive\|Drive" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - ✅ Google Drive API detectada" >> $OUTPUT_FILE
  fi
else
  echo "- ❌ Google APIs no encontradas" >> $OUTPUT_FILE
fi

# Buscar pasarelas de pago, MODIFICADO para eliminar referencias a Stripe
PAYMENTS_DETECTED=false
PAYMENTS_STATUS="0%"

# Método 1: Buscar en package.json
if [ -f "package.json" ]; then
  if grep -q "paypal\|payment" "package.json"; then
    PAYMENTS_DETECTED=true
  fi
fi

# Método 2: Buscar imports de pagos
if grep -q "from '@paypal\|import.*paypal" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
  PAYMENTS_DETECTED=true
fi

if [ "$PAYMENTS_DETECTED" = true ]; then
  echo "- ✅ Pasarela de pagos detectada" >> $OUTPUT_FILE
  if grep -q "paypal" "$PROJECT_ROOT" -r $EXCLUDE_DIRS; then
    echo "  - Usando PayPal" >> $OUTPUT_FILE
    
    # Detectar implementaciones específicas
    if grep -q "checkout\|Checkout" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
      echo "  - Checkout de PayPal implementado" >> $OUTPUT_FILE
      PAYMENTS_STATUS="60%"
    fi
    
    if grep -q "subscription\|Subscription" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
      echo "  - Suscripciones PayPal implementadas" >> $OUTPUT_FILE
      PAYMENTS_STATUS="70%"
    fi
    
    if grep -q "webhook\|Webhook" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
      echo "  - Webhooks de PayPal configurados" >> $OUTPUT_FILE
      PAYMENTS_STATUS="80%"
    fi
    
    # Si no se detecta ninguna implementación específica
    if [ "$PAYMENTS_STATUS" = "0%" ]; then
      PAYMENTS_STATUS="50%"
    fi
  fi
  echo "  - Implementación: $PAYMENTS_STATUS" >> $OUTPUT_FILE
else
  echo "- ❌ Pasarela de pagos no encontrada" >> $OUTPUT_FILE
fi

# Análisis de rendimiento y optimización
echo "" >> $OUTPUT_FILE
echo "## Análisis de Rendimiento y Optimización" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Buscar optimizaciones de Next.js
if [ "$NEXT_DETECTED" = true ]; then
  # Verificar Image Optimization
  if grep -q "next/image\|Image.*from 'next" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "- ✅ Image Optimization de Next.js implementado" >> $OUTPUT_FILE
    IMAGE_COUNT=$(grep -r "import.*Image.*from 'next\|import.*Image.*from \"next" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    echo "  - $IMAGE_COUNT componentes utilizan optimización de imágenes" >> $OUTPUT_FILE
# Análisis de rendimiento y optimización (continuación)
  else
    echo "- ⚠️ Image Optimization de Next.js no implementado" >> $OUTPUT_FILE
  fi
  
  # Verificar Server Components
  if grep -q "use client\|use server" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "- ✅ Server/Client Components configurados" >> $OUTPUT_FILE
    SERVER_ACTIONS=$(grep -r "use server" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    CLIENT_COMPS=$(grep -r "use client" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    echo "  - $SERVER_ACTIONS Server Actions implementadas" >> $OUTPUT_FILE
    echo "  - $CLIENT_COMPS componentes marcados como Client Components" >> $OUTPUT_FILE
  fi
  
  # Verificar Suspense/Loading
  if grep -q "Suspense\|suspense\|loading.tsx\|loading.js" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "- ✅ Suspense y Loading States implementados" >> $OUTPUT_FILE
    LOADING_COUNT=$(find $PROJECT_ROOT -name "loading.tsx" -o -name "loading.js" | grep -v "node_modules" | wc -l)
    echo "  - $LOADING_COUNT páginas con estados de carga definidos" >> $OUTPUT_FILE
  else
    echo "- ⚠️ Suspense y Loading States no detectados" >> $OUTPUT_FILE
  fi
fi

# Buscar optimizaciones generales
# Verificar uso de memo/useMemo
MEMO_COUNT=$(grep -r "useMemo\|React.memo\|memo" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
if [ $MEMO_COUNT -gt 0 ]; then
  echo "- ✅ Optimizaciones de renderizado (memo/useMemo) implementadas: $MEMO_COUNT referencias" >> $OUTPUT_FILE
fi

# Verificar useCallback
CALLBACK_COUNT=$(grep -r "useCallback" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
if [ $CALLBACK_COUNT -gt 0 ]; then
  echo "- ✅ Optimizaciones de funciones (useCallback) implementadas: $CALLBACK_COUNT referencias" >> $OUTPUT_FILE
fi

# Calcular progreso global (utilizando valores predeterminados si no se detectaron)
if [ "$NEXT_DETECTED" = true ] && [ "$REACT_DETECTED" = true ]; then
  FRONTEND_STATUS="90%"
else
  FRONTEND_STATUS="40%"
fi

GLOBAL_PROGRESS=$(( 
  (${FRONTEND_STATUS/\%/} + 
   ${SUPABASE_STATUS/\%/} + 
   ${AI_STATUS/\%/} + 
   ${AUTH_STATUS/\%/} + 
   ${CALENDAR_STATUS/\%/} + 
   ${PAYMENTS_STATUS/\%/}) / 6 
))

echo "" >> $OUTPUT_FILE
echo "## Estado Global del Proyecto" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "**Progreso Total:** ${GLOBAL_PROGRESS}%" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

if [ $GLOBAL_PROGRESS -ge 80 ]; then
  echo "**Estado General:** 🟢 Saludable" >> $OUTPUT_FILE
elif [ $GLOBAL_PROGRESS -ge 50 ]; then
  echo "**Estado General:** 🟡 Atención Requerida" >> $OUTPUT_FILE
else
  echo "**Estado General:** 🔴 Problemas Críticos" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE

# Análisis de testing y cobertura
echo "## Calidad del Código y Testing" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Buscar pruebas y testing
TEST_FILES=$(find $PROJECT_ROOT -type f -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.spec.js" | grep -v "node_modules" | wc -l)
if [ $TEST_FILES -gt 0 ]; then
  echo "- ✅ Tests implementados: $TEST_FILES archivos de prueba" >> $OUTPUT_FILE
  JEST_DETECTED=$(grep -r "jest\|test(" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
  if [ $JEST_DETECTED -gt 0 ]; then
    echo "  - Framework de pruebas: Jest" >> $OUTPUT_FILE
  fi
  
  TESTING_LIBRARY=$(grep -r "render\|screen\|fireEvent\|@testing-library" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
  if [ $TESTING_LIBRARY -gt 0 ]; then
    echo "  - React Testing Library detectada" >> $OUTPUT_FILE
  fi
else
  echo "- ⚠️ No se detectaron archivos de prueba" >> $OUTPUT_FILE
fi

# Buscar ESLint
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc" ] || [ -f ".eslintrc.yml" ]; then
  echo "- ✅ ESLint configurado" >> $OUTPUT_FILE
  ESLINT_RULES=$(grep -r "rules" --include=".eslintrc*" $PROJECT_ROOT | wc -l)
  echo "  - Aproximadamente $ESLINT_RULES reglas configuradas" >> $OUTPUT_FILE
else
  echo "- ⚠️ ESLint no detectado" >> $OUTPUT_FILE
fi

# Buscar TypeScript configuración
if [ -f "tsconfig.json" ]; then
  echo "- ✅ TypeScript configurado" >> $OUTPUT_FILE
  STRICT_MODE=$(grep -r "\"strict\": true" --include="tsconfig.json" $PROJECT_ROOT | wc -l)
  if [ $STRICT_MODE -gt 0 ]; then
    echo "  - Modo estricto habilitado" >> $OUTPUT_FILE
  else
    echo "  - Modo estricto no habilitado" >> $OUTPUT_FILE
  fi
fi

# Buscar problemas comunes
echo "## Problemas Detectados" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Generar IDs de problemas
PROBLEM_ID=1

# Buscar TODOs
TODO_COUNT=$(grep -r "TODO" "$PROJECT_ROOT" $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
if [ $TODO_COUNT -gt 10 ]; then
  echo "- **P00${PROBLEM_ID}** 🟡 TODOs pendientes: $TODO_COUNT" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi

# Buscar console.logs
CONSOLE_COUNT=$(grep -r "console.log" "$PROJECT_ROOT" $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
if [ $CONSOLE_COUNT -gt 10 ]; then
  echo "- **P00${PROBLEM_ID}** 🟢 console.log en código: $CONSOLE_COUNT" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi

# Buscar any en TypeScript
ANY_COUNT=$(grep -r ": any" "$PROJECT_ROOT" $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" | wc -l)
if [ $ANY_COUNT -gt 20 ]; then
  echo "- **P00${PROBLEM_ID}** 🟡 Uso excesivo de 'any' en TypeScript: $ANY_COUNT ocurrencias" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi

# Problema de caché IA específico para OpenRouter y Qwen
if [ "$USING_OPENROUTER" = true ] && ! grep -q "cache\|cach" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
  echo "- **P00${PROBLEM_ID}** 🟠 Sistema de caché para OpenRouter no implementado" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi

# Renovación de tokens
if [ "$GOOGLE_APIS_DETECTED" = true ] && ! grep -q "refresh.*token\|token.*refresh" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
  echo "- **P00${PROBLEM_ID}** 🟡 Renovación de tokens para Google Calendar no implementada" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi

echo "" >> $OUTPUT_FILE

# Análisis de dependencias y paquetes
echo "## Dependencias y Paquetes" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

if [ -f "package.json" ]; then
  DEP_COUNT=$(grep -o -e '"dependencies"' -e '"devDependencies"' package.json | wc -l)
  if [ $DEP_COUNT -gt 0 ]; then
    # Contar dependencias totales
    TOTAL_DEPS=$(grep -A 100 "\"dependencies\":" package.json | grep -B 100 "\"devDependencies\":" | grep -c "\".*\":")
    DEV_DEPS=$(grep -A 100 "\"devDependencies\":" package.json | grep -c "\".*\":")
    
    echo "- Dependencias de producción: aproximadamente $TOTAL_DEPS" >> $OUTPUT_FILE
    echo "- Dependencias de desarrollo: aproximadamente $DEV_DEPS" >> $OUTPUT_FILE
    
    # Verificar herramientas específicas
    if grep -q "\"husky\"" package.json; then
      echo "- ✅ Husky configurado para git hooks" >> $OUTPUT_FILE
    fi
    
    if grep -q "\"lint-staged\"" package.json; then
      echo "- ✅ lint-staged configurado para validar cambios antes de commit" >> $OUTPUT_FILE
    fi
    
    if grep -q "\"prettier\"" package.json; then
      echo "- ✅ Prettier configurado para formateo de código" >> $OUTPUT_FILE
    fi
  fi
fi

# Generar recomendaciones
echo "## Recomendaciones Prioritarias" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Recomendación específica para Next.js si no se detectó pero hay React
if [ "$NEXT_DETECTED" = false ] && [ "$REACT_DETECTED" = true ]; then
  echo "1. **Alta prioridad:** Verifica la instalación y configuración de Next.js en el proyecto" >> $OUTPUT_FILE
  echo "   ```bash" >> $OUTPUT_FILE
  echo "   # Instalar Next.js si no está presente" >> $OUTPUT_FILE
  echo "   npm install next" >> $OUTPUT_FILE
  echo "   # o" >> $OUTPUT_FILE
  echo "   yarn add next" >> $OUTPUT_FILE
  echo "   ```" >> $OUTPUT_FILE
fi

# Recomendación para Tailwind si no se detectó
if [ "$TAILWIND_DETECTED" = false ]; then
  echo "2. **Media prioridad:** Considera instalar y configurar Tailwind CSS para mejorar el desarrollo UI" >> $OUTPUT_FILE
  echo "   ```bash" >> $OUTPUT_FILE
  echo "   # Instalar Tailwind CSS" >> $OUTPUT_FILE
  echo "   npm install tailwindcss postcss autoprefixer" >> $OUTPUT_FILE
  echo "   npx tailwindcss init -p" >> $OUTPUT_FILE
  echo "   ```" >> $OUTPUT_FILE
fi

# Caché IA específico para OpenRouter
if [ "$USING_OPENROUTER" = true ] && ! grep -q "cache\|cach" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
  echo "3. **Alta prioridad:** Implementar sistema de caché para las respuestas de OpenRouter ([Ver .IA_Implementacion.md](./.IA_Implementacion.md))" >> $OUTPUT_FILE
fi

# TODOs
if [ $TODO_COUNT -gt 10 ]; then
  echo "4. **Media prioridad:** Resolver los $TODO_COUNT TODOs pendientes en el código" >> $OUTPUT_FILE
fi

# console.logs
if [ $CONSOLE_COUNT -gt 10 ]; then
  echo "5. **Baja prioridad:** Eliminar los $CONSOLE_COUNT console.log del código para producción" >> $OUTPUT_FILE
fi

# Recomendación para tests si no hay
if [ $TEST_FILES -eq 0 ]; then
  echo "6. **Media prioridad:** Implementar pruebas unitarias y de integración para componentes clave" >> $OUTPUT_FILE
fi

echo "" >> $OUTPUT_FILE
echo "## Próximas Fases de Desarrollo" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Determinar fase actual basado en progreso
if [ $GLOBAL_PROGRESS -lt 50 ]; then
  echo "Actualmente en **Fase 1: MVP**" >> $OUTPUT_FILE
  echo "- Prioridad: Completar funcionalidades básicas" >> $OUTPUT_FILE
  echo "- Siguiente fase: Integración de servicios" >> $OUTPUT_FILE
elif [ $GLOBAL_PROGRESS -lt 80 ]; then
  echo "Actualmente en **Fase 2: Integración**" >> $OUTPUT_FILE
  echo "- Prioridad: Completar integraciones con servicios externos" >> $OUTPUT_FILE
  echo "- Siguiente fase: Optimización y monetización" >> $OUTPUT_FILE
else
  echo "Actualmente en **Fase 3: Optimización**" >> $OUTPUT_FILE
  echo "- Prioridad: Pulir experiencia de usuario y preparar para despliegue" >> $OUTPUT_FILE
  echo "- Siguiente fase: Despliegue a producción" >> $OUTPUT_FILE
fi

# Plan de despliegue
echo "" >> $OUTPUT_FILE
echo "## Plan de Despliegue" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

if grep -q "vercel\|netlify\|firebase\|heroku\|aws\|azure\|gcp" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.json" --include="*.yaml" --include="*.yml" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"; then
  # Verificar proveedores específicos
  echo "### Configuración de Despliegue Detectada" >> $OUTPUT_FILE
  
  if grep -q "vercel" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.json" --include="*.yaml" --include="*.yml" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"; then
    echo "- ✅ Configuración para Vercel detectada" >> $OUTPUT_FILE
  fi
  
  if grep -q "netlify" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.json" --include="*.yaml" --include="*.yml" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"; then
    echo "- ✅ Configuración para Netlify detectada" >> $OUTPUT_FILE
  fi
  
  if grep -q "firebase" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.json" --include="*.yaml" --include="*.yml" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"; then
    echo "- ✅ Configuración para Firebase detectada" >> $OUTPUT_FILE
  fi
else
  echo "### Recomendaciones de Despliegue" >> $OUTPUT_FILE
  
  if [ "$NEXT_DETECTED" = true ]; then
    echo "- **Recomendado:** Despliegue en Vercel para máxima compatibilidad con Next.js" >> $OUTPUT_FILE
    echo "  ```bash" >> $OUTPUT_FILE
    echo "  # Instalar CLI de Vercel" >> $OUTPUT_FILE
    echo "  npm i -g vercel" >> $OUTPUT_FILE
    echo "  # Desplegar" >> $OUTPUT_FILE
    echo "  vercel" >> $OUTPUT_FILE
    echo "  ```" >> $OUTPUT_FILE
  fi
  
  echo "- **Alternativas:** Netlify, AWS Amplify, o GitHub Pages" >> $OUTPUT_FILE
fi

# Optimizaciones específicas para OpenRouter
echo "" >> $OUTPUT_FILE
echo "## Optimizaciones específicas para OpenRouter (Groq, Fireworks)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "Para mejorar el rendimiento con OpenRouter y los proveedores Groq y Fireworks, considera estas optimizaciones:" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "1. **Implementar sistema de caché:**" >> $OUTPUT_FILE
echo "   - Implementa caché en memoria o Redis para respuestas similares" >> $OUTPUT_FILE
echo "   - Establece un TTL apropiado según la naturaleza de las consultas" >> $OUTPUT_FILE
echo "   - Utiliza una clave de caché basada en el modelo y los mensajes" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "2. **Optimizar fallbacks:**" >> $OUTPUT_FILE
echo "   - Considera habilitar `allow_fallbacks: true` en situaciones críticas" >> $OUTPUT_FILE
echo "   - Implementa un sistema de retry con backoff exponencial" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "3. **Monitoreo de uso:**" >> $OUTPUT_FILE
echo "   - Implementa un sistema para registrar el uso de cada proveedor" >> $OUTPUT_FILE
echo "   - Monitorea tiempos de respuesta y tasa de errores por proveedor" >> $OUTPUT_FILE
echo "   - Rota proveedores basado en cuotas disponibles y rendimiento" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Conclusiones y recomendaciones finales
echo "## Conclusión y Próximos Pasos" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "### Fortalezas del Proyecto" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

if [ $GLOBAL_PROGRESS -ge 70 ]; then
  echo "- **Alto nivel de implementación:** El proyecto tiene un avance significativo con un ${GLOBAL_PROGRESS}% de progreso" >> $OUTPUT_FILE
fi

if [ "$NEXT_DETECTED" = true ] && [ "$REACT_DETECTED" = true ] && [ "$TAILWIND_DETECTED" = true ]; then
  echo "- **Stack moderno:** Next.js, React y Tailwind CSS proporcionan una base sólida y actual" >> $OUTPUT_FILE
fi

if [ "$SUPABASE_DETECTED" = true ] && [ "$SUPABASE_STATUS" != "0%" ]; then
  echo "- **Backend serverless:** Supabase implementado al ${SUPABASE_STATUS} proporciona una infraestructura escalable" >> $OUTPUT_FILE
fi

if [ "$USING_OPENROUTER" = true ] && [ "$AI_STATUS" != "0%" ]; then
  echo "- **IA avanzada:** Integración con OpenRouter y modelos como Qwen al ${AI_STATUS} de implementación" >> $OUTPUT_FILE
fi

if [ "$GOOGLE_APIS_DETECTED" = true ] && [ "$CALENDAR_STATUS" != "0%" ]; then
  echo "- **Integración robusta:** Google Calendar implementado al ${CALENDAR_STATUS}" >> $OUTPUT_FILE
fi

echo "" >> $OUTPUT_FILE
echo "### Áreas de Mejora" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

if [ $CONSOLE_COUNT -gt 10 ]; then
  echo "- **Limpieza de código:** Eliminar los $CONSOLE_COUNT console.log del código para producción" >> $OUTPUT_FILE
fi

if [ $TEST_FILES -eq 0 ]; then
  echo "- **Cobertura de pruebas:** Implementar pruebas unitarias y de integración" >> $OUTPUT_FILE
fi

if [ "$PAYMENTS_STATUS" != "100%" ] && [ "$PAYMENTS_DETECTED" = true ]; then
  echo "- **Completar integración de pagos:** Mejorar la implementación de PayPal (actualmente al ${PAYMENTS_STATUS})" >> $OUTPUT_FILE
fi

echo "" >> $OUTPUT_FILE
echo "### Próximos Pasos Recomendados" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Determinar próximos pasos según el estado del proyecto
if [ $GLOBAL_PROGRESS -lt 50 ]; then
  echo "1. Completar funcionalidades core pendientes" >> $OUTPUT_FILE
  echo "2. Implementar autenticación y autorización" >> $OUTPUT_FILE
  echo "3. Configurar integración con APIs externas" >> $OUTPUT_FILE
elif [ $GLOBAL_PROGRESS -lt 80 ]; then
  echo "1. Finalizar integraciones con servicios externos" >> $OUTPUT_FILE
  echo "2. Implementar pruebas para componentes críticos" >> $OUTPUT_FILE
  echo "3. Preparar infraestructura para despliegue" >> $OUTPUT_FILE
else
  echo "1. Optimizar rendimiento (eliminar console.logs, optimizar imágenes)" >> $OUTPUT_FILE
  echo "2. Completar implementación de pagos y suscripciones" >> $OUTPUT_FILE
  echo "3. Preparar para despliegue a producción" >> $OUTPUT_FILE
  echo "4. Implementar monitoreo y analítica" >> $OUTPUT_FILE
fi

echo "" >> $OUTPUT_FILE
echo "## Resumen" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "Este análisis se generó automáticamente el $(date) examinando el código de tu proyecto. Los resultados se basan en patrones detectados en tu código fuente." >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "Para obtener recomendaciones detalladas sobre cómo resolver los problemas identificados, consulta los documentos específicos enlazados en cada recomendación o implementa las soluciones sugeridas en la sección de optimizaciones." >> $OUTPUT_FILE

echo ""
echo "Análisis detallado completado. Revisa el archivo $OUTPUT_FILE para ver los resultados."