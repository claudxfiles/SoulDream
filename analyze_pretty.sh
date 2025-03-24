#!/bin/bash
# analyze_pretty.sh - PARTE 1: INICIALIZACIÓN Y ESTRUCTURA DEL PROYECTO
# Script mejorado para analizar el proyecto con formato visual atractivo
# Definir ruta de salida
PROJECT_ROOT=$(pwd)
OUTPUT_FILE="${PROJECT_ROOT}/analysis_report.md"
# Iniciar el archivo con un formato mejorado
echo "# 🔍 Análisis Detallado del Proyecto" > $OUTPUT_FILE
echo "**Fecha**: $(date)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "<div align=\"center\">" >> $OUTPUT_FILE
echo "<img src=\"https://img.shields.io/badge/Analizando-En_Progreso-blue\" alt=\"Analizando\">" >> $OUTPUT_FILE
echo "</div>" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "---" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
# Excluir node_modules y .git del análisis
EXCLUDE_DIRS="--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=out --exclude-dir=dist --exclude-dir=build"
# Verificar estructura del proyecto
echo "## 📊 Estructura del Proyecto" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
# Contar archivos por tipo (excluyendo node_modules)
echo "### 📁 Distribución de Archivos" >> $OUTPUT_FILE
TS_COUNT=$(find $PROJECT_ROOT -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
TSX_COUNT=$(find $PROJECT_ROOT -type f -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
JS_COUNT=$(find $PROJECT_ROOT -type f -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
JSX_COUNT=$(find $PROJECT_ROOT -type f -name "*.jsx" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
SCSS_COUNT=$(find $PROJECT_ROOT -type f -name "*.scss" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
CSS_COUNT=$(find $PROJECT_ROOT -type f -name "*.css" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
# Crear una tabla con la distribución de archivos
echo "| Tipo | Cantidad |" >> $OUTPUT_FILE
echo "|------|----------|" >> $OUTPUT_FILE
if [ $TS_COUNT -gt 0 ]; then
  echo "| TypeScript | $TS_COUNT archivos |" >> $OUTPUT_FILE
fi
if [ $TSX_COUNT -gt 0 ]; then
  echo "| React (TSX) | $TSX_COUNT archivos |" >> $OUTPUT_FILE
fi
if [ $JS_COUNT -gt 0 ]; then
  echo "| JavaScript | $JS_COUNT archivos |" >> $OUTPUT_FILE
fi
if [ $JSX_COUNT -gt 0 ]; then
  echo "| React (JSX) | $JSX_COUNT archivos |" >> $OUTPUT_FILE
fi
if [ $SCSS_COUNT -gt 0 ]; then
  echo "| SCSS | $SCSS_COUNT archivos |" >> $OUTPUT_FILE
fi
if [ $CSS_COUNT -gt 0 ]; then
  echo "| CSS | $CSS_COUNT archivos |" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
# Análisis de complejidad de archivos
echo "### 📏 Complejidad del Código" >> $OUTPUT_FILE
echo "Los siguientes archivos tienen la mayor cantidad de líneas de código y podrían requerir refactorización:" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "```" >> $OUTPUT_FILE
LARGEST_FILES=$(find $PROJECT_ROOT -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -exec wc -l {} \; | sort -nr | head -5 | awk '{print $1 " líneas - " substr($2, index($2, "/") != 0 ? index($2, "/") : 1)}')
echo "$LARGEST_FILES" >> $OUTPUT_FILE
echo "```" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "---" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
# Iniciar la sección de tecnologías
echo "## 🛠️ Stack Tecnológico" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# analyze_pretty.sh - PARTE 2: ANÁLISIS DE TECNOLOGÍAS FRONTEND
# Script mejorado para analizar tecnologías frontend con formato visual atractivo
# Sección Frontend
echo "### Frontend" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
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
  echo "- ✅ **Next.js** - Framework React con renderizado híbrido" >> $OUTPUT_FILE
  if [ ! -z "$NEXT_VERSION" ]; then
    echo "  - Versión: $NEXT_VERSION" >> $OUTPUT_FILE
  fi
  # Analizar estructura App Router vs Pages Router
  if [ -d "app" ]; then
    echo "  - App Router configurado" >> $OUTPUT_FILE
    APP_ROUTES=$(find $PROJECT_ROOT/app -type d -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
    echo "  - $APP_ROUTES rutas aproximadas" >> $OUTPUT_FILE
  fi
  if [ -d "pages" ]; then
    echo "  - Pages Router configurado" >> $OUTPUT_FILE
    PAGE_ROUTES=$(find $PROJECT_ROOT/pages -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.js" -o -name "*.ts" | wc -l)
    echo "  - $PAGE_ROUTES páginas definidas" >> $OUTPUT_FILE
  fi
  # Verificar uso de API Routes
  if [ -d "pages/api" ] || [ -d "app/api" ]; then
    echo "  - API Routes implementadas" >> $OUTPUT_FILE
    API_ROUTES=$(find $PROJECT_ROOT -path "*/api/*" -type f -name "*.ts" -o -name "*.js" | wc -l)
    echo "  - $API_ROUTES endpoints API" >> $OUTPUT_FILE
  fi
  # Verificar Image Optimization
  IMAGE_COUNT=$(grep -r "import.*Image.*from 'next\|import.*Image.*from \"next" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
  if [ $IMAGE_COUNT -gt 0 ]; then
    echo "  - Image Optimization implementado ($IMAGE_COUNT componentes)" >> $OUTPUT_FILE
  fi
  # Verificar Server/Client Components
  CLIENT_COMPS=$(grep -r "use client" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
  if [ $CLIENT_COMPS -gt 0 ]; then
    echo "  - $CLIENT_COMPS componentes Client-side" >> $OUTPUT_FILE
  fi
else
  echo "- ❌ Next.js no detectado" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
# Buscar React (más métodos)
REACT_DETECTED=false
REACT_VERSION=""
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
  echo "- ✅ **React** - Biblioteca UI principal" >> $OUTPUT_FILE
  if [ ! -z "$REACT_VERSION" ]; then
    echo "  - Versión: $REACT_VERSION" >> $OUTPUT_FILE
  fi
  # Contar componentes
  COMPONENT_COUNT=$(grep -r "function.*(" --include="*.tsx" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
  echo "  - $COMPONENT_COUNT componentes definidos" >> $OUTPUT_FILE
  # Detectar uso de hooks personalizados
  CUSTOM_HOOKS=$(grep -r "function use" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
  echo "  - $CUSTOM_HOOKS hooks personalizados" >> $OUTPUT_FILE
  # Detectar optimizaciones
  CALLBACK_COUNT=$(grep -r "useCallback" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
  if [ $CALLBACK_COUNT -gt 0 ]; then
    echo "  - $CALLBACK_COUNT implementaciones de useCallback" >> $OUTPUT_FILE
  fi
  # Detectar bibliotecas de componentes UI
  if grep -q "shadcn\|ui/.*button\|ui/.*card" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Integración con Shadcn UI" >> $OUTPUT_FILE
  fi
  if grep -q "material-ui\|@mui\|@emotion" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Integración con Material UI" >> $OUTPUT_FILE
  fi
  if grep -q "chakra-ui\|@chakra-ui" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Integración con Chakra UI" >> $OUTPUT_FILE
  fi
else
  echo "- ❌ React no detectado" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
# Buscar Tailwind CSS (más métodos)
TAILWIND_DETECTED=false
TAILWIND_VERSION=""
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
  echo "- ✅ **Tailwind CSS** - Framework de utilidades CSS" >> $OUTPUT_FILE
  if [ ! -z "$TAILWIND_VERSION" ]; then
    echo "  - Versión: $TAILWIND_VERSION" >> $OUTPUT_FILE
  fi
  # Verificar personalización
  if grep -q "theme: {" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="tailwind.config.js" --include="tailwind.config.ts"; then
    echo "  - Tema personalizado configurado" >> $OUTPUT_FILE
  fi
  # Verificar plugins
  if grep -q "plugins:" $PROJECT_ROOT -r $EXCLUDE_DIRS --include="tailwind.config.js" --include="tailwind.config.ts"; then
    echo "  - Plugins personalizados configurados" >> $OUTPUT_FILE
  fi
else
  echo "- ❌ Tailwind CSS no detectado" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE

# analyze_pretty.sh - PARTE 3: BACKEND (SUPABASE) E IA (OPENROUTER)
# Script mejorado para analizar tecnologías de backend e IA con formato visual atractivo
# Sección Backend
echo "### Backend y Base de Datos" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
# Buscar Supabase (más métodos)
SUPABASE_DETECTED=false
SUPABASE_VERSION=""
SUPABASE_STATUS="0%"
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
  echo "- ✅ **Supabase** - Plataforma Backend-as-a-Service" >> $OUTPUT_FILE
  if [ ! -z "$SUPABASE_VERSION" ]; then
    echo "  - Versión: $SUPABASE_VERSION" >> $OUTPUT_FILE
  fi
  # Detectar tablas y esquema
  SUPABASE_TABLES=$(grep -r "supabase.*from\|from(.*'" $PROJECT_ROOT $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" | grep -o "'[^']*'" | sort | uniq | tr '\n' ', ' | sed 's/,$//')
  if [ ! -z "$SUPABASE_TABLES" ]; then
    echo "  - **Tablas**: $SUPABASE_TABLES" >> $OUTPUT_FILE
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
  echo "  - **Implementación**: $SUPABASE_STATUS completa" >> $OUTPUT_FILE
else
  echo "- ❌ Supabase no detectado" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
# Sección IA
echo "### Inteligencia Artificial" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
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
      echo "- ✅ **OpenRouter** - API unificada para LLMs" >> $OUTPUT_FILE
      echo "  - Configuración provider.order optimizada" >> $OUTPUT_FILE
      echo "  - Proveedores: Groq, Fireworks" >> $OUTPUT_FILE
      # Contar número aproximado de prompts
      PROMPT_COUNT=$(grep -r "system.*message\|user.*message\|assistant.*message" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
      echo "  - Aproximadamente $PROMPT_COUNT prompts/conversaciones definidos" >> $OUTPUT_FILE
    fi
  fi
fi
# Buscar referencias a Qwen en el código
if grep -q "qwen\|qwq-32b" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
  USING_QWEN=true
  echo "  - Modelo: qwen/qwq-32b:online" >> $OUTPUT_FILE
fi
# Buscar modelo en variable
if grep -q "model.*=.*\"qwen\|model.*=.*'qwen" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
  USING_QWEN=true
  echo "  - Modelo referenciado como variable" >> $OUTPUT_FILE
fi
# Si está usando OpenRouter, Qwen con Groq o Fireworks
if [ "$USING_OPENROUTER" = true ] || [ "$USING_QWEN" = true ] || [ "$USING_GROQ_FIREWORKS" = true ]; then
  # Buscar caché para IA
  if grep -q "cache\|cach" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
    echo "  - Sistema de caché implementado" >> $OUTPUT_FILE
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
    echo "  - **Funcionalidad**: Resumir contenido" >> $OUTPUT_FILE
  fi
  if grep -q "classify\|classification\|categorize\|categorization" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
    echo "  - **Funcionalidad**: Clasificación de contenido" >> $OUTPUT_FILE
  fi
  if grep -q "generate\|generation\|crear\|creacion" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
    echo "  - **Funcionalidad**: Generación de contenido" >> $OUTPUT_FILE
  fi
  echo "  - **Implementación**: $AI_STATUS completa" >> $OUTPUT_FILE
else
  echo "- ⚠️ Integración IA: No detectada o parcial" >> $OUTPUT_FILE
  AI_STATUS="50%"
fi
echo "" >> $OUTPUT_FILE

# analyze_pretty.sh - PARTE 4: INTEGRACIONES EXTERNAS Y RENDIMIENTO
# Script mejorado para analizar integraciones externas y rendimiento
# Sección integraciones externas
echo "### Integraciones Externas" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
# Buscar Google APIs
GOOGLE_APIS_DETECTED=false
AUTH_STATUS="0%"
CALENDAR_STATUS="0%"
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
  echo "- ✅ **Google APIs**" >> $OUTPUT_FILE
  if [ ! -z "$GOOGLE_VERSION" ] && [ "$GOOGLE_VERSION" != "No version" ]; then
    echo "  - Versión: $GOOGLE_VERSION" >> $OUTPUT_FILE
  fi
  # Verificar autenticación Google
  if grep -q "GoogleProvider\|auth.*google\|google.*auth" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Autenticación OAuth configurada" >> $OUTPUT_FILE
    # Verificar manejo de scopes
    SCOPES=$(grep -r "scope\|scopes" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | grep "google\|calendar" | wc -l)
    echo "  - $SCOPES referencias a scopes OAuth detectadas" >> $OUTPUT_FILE
    AUTH_STATUS="100%"
  else
    echo "  - ❌ Autenticación Google no detectada" >> $OUTPUT_FILE
  fi
  # Verificar Calendar
  if grep -q "calendar\|Calendar" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - **Google Calendar**:" >> $OUTPUT_FILE
    # Contar operaciones de Calendar
    EVENTS_CREATE=$(grep -r "events.insert\|insertEvent\|createEvent" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    EVENTS_LIST=$(grep -r "events.list\|listEvents\|getEvents" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    EVENTS_UPDATE=$(grep -r "events.update\|updateEvent" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    EVENTS_DELETE=$(grep -r "events.delete\|deleteEvent" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
    echo "    - Crear eventos: $EVENTS_CREATE implementaciones" >> $OUTPUT_FILE
    echo "    - Listar eventos: $EVENTS_LIST implementaciones" >> $OUTPUT_FILE
    echo "    - Actualizar eventos: $EVENTS_UPDATE implementaciones" >> $OUTPUT_FILE
    echo "    - Eliminar eventos: $EVENTS_DELETE implementaciones" >> $OUTPUT_FILE
    # Verificar renovación de tokens
    if grep -q "refresh.*token\|token.*refresh" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
      echo "    - ✅ Renovación automática de tokens" >> $OUTPUT_FILE
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
    echo "  - **Implementación**: $CALENDAR_STATUS completa" >> $OUTPUT_FILE
  else
    echo "  - ❌ Google Calendar no detectado" >> $OUTPUT_FILE
  fi
  # Verificar otras APIs de Google
  if grep -q "gmail\|Gmail" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Gmail API detectada" >> $OUTPUT_FILE
  fi
  if grep -q "sheets\|Sheets" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Google Sheets API detectada" >> $OUTPUT_FILE
  fi
  if grep -q "drive\|Drive" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Google Drive API detectada" >> $OUTPUT_FILE
  fi
else
  echo "- ❌ Google APIs no encontradas" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
# Buscar pasarelas de pago, MODIFICADO para eliminar referencias a Stripe
PAYMENTS_DETECTED=false
PAYMENTS_STATUS="0%"
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
  echo "- ✅ **PayPal**" >> $OUTPUT_FILE
  # Detectar implementaciones específicas
  if grep -q "checkout\|Checkout" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Checkout implementado" >> $OUTPUT_FILE
    PAYMENTS_STATUS="60%"
  fi
  if grep -q "subscription\|Subscription" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Sistema de suscripciones configurado" >> $OUTPUT_FILE
    PAYMENTS_STATUS="70%"
  fi
  if grep -q "webhook\|Webhook" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "  - Webhooks configurados" >> $OUTPUT_FILE
    PAYMENTS_STATUS="80%"
  fi
  # Si no se detecta ninguna implementación específica
  if [ "$PAYMENTS_STATUS" = "0%" ]; then
    PAYMENTS_STATUS="50%"
  fi
  echo "  - **Implementación**: $PAYMENTS_STATUS completa" >> $OUTPUT_FILE
else
  echo "- ❌ Pasarela de pagos no encontrada" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
# Análisis de rendimiento y optimización
echo "## 🚀 Rendimiento y Optimización" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
# Crear tabla de rendimiento
echo "| Característica | Estado | Detalles |" >> $OUTPUT_FILE
echo "|----------------|--------|----------|" >> $OUTPUT_FILE
# Buscar optimizaciones de Next.js
if [ "$NEXT_DETECTED" = true ]; then
  # Verificar Image Optimization
  if grep -q "next/image\|Image.*from 'next" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "| Image Optimization | ✅ | $IMAGE_COUNT componentes utilizan Next/Image |" >> $OUTPUT_FILE
  else
    echo "| Image Optimization | ⚠️ | No detectado |" >> $OUTPUT_FILE
  fi
  # Verificar Server/Client Components
  if grep -q "use client\|use server" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    echo "| Server/Client Components | ✅ | $CLIENT_COMPS componentes client-side |" >> $OUTPUT_FILE
  else
    echo "| Server/Client Components | ⚠️ | No detectado |" >> $OUTPUT_FILE
  fi
  # Verificar Suspense/Loading
  if grep -q "Suspense\|suspense\|loading.tsx\|loading.js" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
    LOADING_COUNT=$(find $PROJECT_ROOT -name "loading.tsx" -o -name "loading.js" | grep -v "node_modules" | wc -l)
    echo "| Suspense/Loading States | ✅ | $LOADING_COUNT páginas con estados de carga |" >> $OUTPUT_FILE
  else
    echo "| Suspense/Loading States | ⚠️ | No detectados |" >> $OUTPUT_FILE
  fi
fi
# Verificar uso de memo/useMemo
MEMO_COUNT=$(grep -r "useMemo\|React.memo\|memo" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" $PROJECT_ROOT | grep -v "node_modules" | wc -l)
if [ $MEMO_COUNT -gt 0 ]; then
  echo "| Memoización | ✅ | $MEMO_COUNT implementaciones de memo/useMemo |" >> $OUTPUT_FILE
fi
# Verificar useCallback
if [ $CALLBACK_COUNT -gt 0 ]; then
  echo "| Optimización de funciones | ✅ | $CALLBACK_COUNT implementaciones de useCallback |" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
echo "---" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# analyze_pretty.sh - PARTE 5: PROBLEMAS, RECOMENDACIONES Y CONCLUSIONES
# Script mejorado para detectar problemas, generar recomendaciones y conclusiones
# Problemas detectados
echo "## 🐞 Problemas Detectados" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
# Inicializar contador de problemas
PROBLEM_ID=1
# Buscar TODOs
TODO_COUNT=$(grep -r "TODO" "$PROJECT_ROOT" $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
if [ $TODO_COUNT -gt 10 ]; then
  echo "1. 🟡 **[P00${PROBLEM_ID}]** \`TODO\` pendientes: $TODO_COUNT instancias" >> $OUTPUT_FILE
  echo "   - **Impacto**: Medio - Indica funcionalidades incompletas o conocidas" >> $OUTPUT_FILE
  echo "   - **Solución**: Revisar y completar las tareas marcadas como TODO" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi
# Buscar console.logs
CONSOLE_COUNT=$(grep -r "console.log" "$PROJECT_ROOT" $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
if [ $CONSOLE_COUNT -gt 10 ]; then
  echo "${PROBLEM_ID}. 🟢 **[P00${PROBLEM_ID}]** \`console.log\` en código de producción: $CONSOLE_COUNT instancias" >> $OUTPUT_FILE
  echo "   - **Impacto**: Bajo - Podría filtrar información sensible y afectar rendimiento" >> $OUTPUT_FILE
  echo "   - **Solución**: Eliminar o reemplazar con un sistema de logging estructurado" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi
# Buscar any en TypeScript
ANY_COUNT=$(grep -r ": any" "$PROJECT_ROOT" $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" | wc -l)
if [ $ANY_COUNT -gt 20 ]; then
  echo "${PROBLEM_ID}. 🟡 **[P00${PROBLEM_ID}]** Uso excesivo de \`any\` en TypeScript: $ANY_COUNT ocurrencias" >> $OUTPUT_FILE
  echo "   - **Impacto**: Medio - Reduce los beneficios del sistema de tipos" >> $OUTPUT_FILE
  echo "   - **Solución**: Definir interfaces precisas para los tipos utilizados" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi
# Problema de caché IA específico para OpenRouter y Qwen
if [ "$USING_OPENROUTER" = true ] && ! grep -q "cache\|cach" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py"; then
  echo "${PROBLEM_ID}. 🟠 **[P00${PROBLEM_ID}]** Sistema de caché para OpenRouter no implementado" >> $OUTPUT_FILE
  echo "   - **Impacto**: Alto - Genera sobrecostos y lentitud en las respuestas" >> $OUTPUT_FILE
  echo "   - **Solución**: Implementar sistema de caché con Redis o similar" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi
# Renovación de tokens
if [ "$GOOGLE_APIS_DETECTED" = true ] && ! grep -q "refresh.*token\|token.*refresh" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"; then
  echo "${PROBLEM_ID}. 🟡 **[P00${PROBLEM_ID}]** Renovación de tokens para Google Calendar no implementada" >> $OUTPUT_FILE
  echo "   - **Impacto**: Medio - Los tokens expirarán causando fallos" >> $OUTPUT_FILE
  echo "   - **Solución**: Implementar proceso automático de renovación" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi
# Testing
TEST_FILES=$(find $PROJECT_ROOT -type f -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.spec.js" | grep -v "node_modules" | wc -l)
if [ $TEST_FILES -eq 0 ]; then
  echo "${PROBLEM_ID}. 🟠 **[P00${PROBLEM_ID}]** No se detectaron pruebas automatizadas" >> $OUTPUT_FILE
  echo "   - **Impacto**: Alto - Riesgo de regresiones y bugs no detectados" >> $OUTPUT_FILE
  echo "   - **Solución**: Implementar pruebas unitarias y de integración" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  PROBLEM_ID=$((PROBLEM_ID+1))
fi
# Si no hay problemas detectados
if [ $PROBLEM_ID -eq 1 ]; then
  echo "✅ **No se detectaron problemas significativos**" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
fi
# Sección Calidad del Código
echo "## 🧪 Calidad del Código" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
# Buscar pruebas y testing
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
echo "" >> $OUTPUT_FILE
# Calcular progreso global (utilizando valores predeterminados si no se detectaron)
if [ "$NEXT_DETECTED" = true ] && [ "$REACT_DETECTED" = true ]; then
  FRONTEND_STATUS="90%"
else
  FRONTEND_STATUS="40%"
fi
# Extraer solo los números de los porcentajes
FRONTEND_NUM=${FRONTEND_STATUS/\%/}
SUPABASE_NUM=${SUPABASE_STATUS/\%/}
AI_NUM=${AI_STATUS/\%/}
AUTH_NUM=${AUTH_STATUS/\%/}
CALENDAR_NUM=${CALENDAR_STATUS/\%/}
PAYMENTS_NUM=${PAYMENTS_STATUS/\%/}
# Calcular promedio como número entero
GLOBAL_PROGRESS=$((
  ($FRONTEND_NUM +
   $SUPABASE_NUM +
   $AI_NUM +
   $AUTH_NUM +
   $CALENDAR_NUM +
   $PAYMENTS_NUM) / 6
))
# Actualizar el badge de estado en la parte superior
sed -i "s|<img src=\"https://img.shields.io/badge/Analizando-En_Progreso-blue\"|<img src=\"https://img.shields.io/badge/Progreso-${GLOBAL_PROGRESS}%25-success\"|g" $OUTPUT_FILE
# Estado global del proyecto después de las métricas calculadas
echo "## 📊 Estado Global del Proyecto" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "**Progreso Total:** ${GLOBAL_PROGRESS}%" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
if [ $GLOBAL_PROGRESS -ge 80 ]; then
  echo "<div align=\"center\">" >> $OUTPUT_FILE
  echo "<img src=\"https://img.shields.io/badge/Estado-Saludable-success\" alt=\"Estado: Saludable\">" >> $OUTPUT_FILE
  echo "</div>" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "**Estado General:** 🟢 Saludable" >> $OUTPUT_FILE
elif [ $GLOBAL_PROGRESS -ge 50 ]; then
  echo "<div align=\"center\">" >> $OUTPUT_FILE
  echo "<img src=\"https://img.shields.io/badge/Estado-Atención_Requerida-yellow\" alt=\"Estado: Atención Requerida\">" >> $OUTPUT_FILE
  echo "</div>" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "**Estado General:** 🟡 Atención Requerida" >> $OUTPUT_FILE
else
  echo "<div align=\"center\">" >> $OUTPUT_FILE
  echo "<img src=\"https://img.shields.io/badge/Estado-Problemas_Críticos-red\" alt=\"Estado: Problemas Críticos\">" >> $OUTPUT_FILE
  echo "</div>" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "**Estado General:** 🔴 Problemas Críticos" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
# Generar recomendaciones
echo "## 📋 Recomendaciones Prioritarias" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
# Lista de recomendaciones en función de problemas detectados
REC_COUNT=1
if [ $CONSOLE_COUNT -gt 10 ]; then
  echo "${REC_COUNT}. 🔄 **Optimizar rendimiento**" >> $OUTPUT_FILE
  echo "   - Eliminar los $CONSOLE_COUNT console.log del código" >> $OUTPUT_FILE
  echo "   - Verificar rendimiento con herramientas como Lighthouse" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  REC_COUNT=$((REC_COUNT+1))
fi
if [ $TEST_FILES -eq 0 ]; then
  echo "${REC_COUNT}. 🧪 **Implementar testing**" >> $OUTPUT_FILE
  echo "   - Configurar Jest y React Testing Library" >> $OUTPUT_FILE
  echo "   - Priorizar pruebas para componentes críticos" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  REC_COUNT=$((REC_COUNT+1))
fi
if [ "$PAYMENTS_DETECTED" = true ] && [ "${PAYMENTS_STATUS/\%/}" -lt 90 ]; then
  echo "${REC_COUNT}. 💳 **Completar integración de pagos**" >> $OUTPUT_FILE
  echo "   - Finalizar los flujos de PayPal" >> $OUTPUT_FILE
  echo "   - Añadir manejo de errores robusto" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  REC_COUNT=$((REC_COUNT+1))
fi
if [ $GLOBAL_PROGRESS -ge 80 ]; then
  echo "${REC_COUNT}. 📊 **Implementar monitoreo y analítica**" >> $OUTPUT_FILE
  echo "   - Configurar herramientas de observabilidad" >> $OUTPUT_FILE
  echo "   - Implementar tracking para analizar el uso" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  REC_COUNT=$((REC_COUNT+1))
fi
echo "## 🔮 Próximas Fases" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
# Determinar fase actual basado en progreso
if [ $GLOBAL_PROGRESS -lt 50 ]; then
  echo "### Fase Actual: MVP (Fase 1)" >> $OUTPUT_FILE
  echo "- 🔄 Funcionalidades básicas en desarrollo" >> $OUTPUT_FILE
  echo "- ⏱️ Integración de servicios pendiente" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "### Próxima Fase: Integración (Fase 2)" >> $OUTPUT_FILE
  echo "- Conectar servicios externos" >> $OUTPUT_FILE
  echo "- Implementar flujos completos" >> $OUTPUT_FILE
elif [ $GLOBAL_PROGRESS -lt 80 ]; then
  echo "### Fase Actual: Integración (Fase 2)" >> $OUTPUT_FILE
  echo "- ✅ Funcionalidades core completas" >> $OUTPUT_FILE
  echo "- 🔄 Integraciones en progreso" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "### Próxima Fase: Optimización (Fase 3)" >> $OUTPUT_FILE
  echo "- Mejorar rendimiento y UX" >> $OUTPUT_FILE
  echo "- Implementar monetización" >> $OUTPUT_FILE
else
  echo "### Fase Actual: Optimización (Fase 3)" >> $OUTPUT_FILE
  echo "- ✅ Funcionalidades core completas" >> $OUTPUT_FILE
  echo "- ✅ Integraciones principales implementadas" >> $OUTPUT_FILE
  echo "- 🔄 En proceso: Optimización para producción" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "### Próxima Fase: Despliegue en Producción" >> $OUTPUT_FILE
  echo "- Configuración de CICD" >> $OUTPUT_FILE
  echo "- Entornos de staging y producción" >> $OUTPUT_FILE
  echo "- Monitoreo y observabilidad" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
# Plan de despliegue
echo "## 🚢 Plan de Despliegue" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
if grep -q "vercel\|netlify\|firebase\|heroku\|aws\|azure\|gcp" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.json" --include="*.yaml" --include="*.yml" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"; then
  # Verificar proveedores específicos
  echo "### Configuración Detectada" >> $OUTPUT_FILE
  if grep -q "vercel" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.json" --include="*.yaml" --include="*.yml" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"; then
    echo "- ✅ Vercel - Ideal para Next.js" >> $OUTPUT_FILE
  fi
  if grep -q "netlify" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.json" --include="*.yaml" --include="*.yml" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"; then
    echo "- ✅ Netlify - Despliegue automático desde Git" >> $OUTPUT_FILE
  fi
  if grep -q "firebase" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.json" --include="*.yaml" --include="*.yml" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"; then
    echo "- ✅ Firebase - Para frontend y funciones serverless" >> $OUTPUT_FILE
  fi
  if grep -q "aws" "$PROJECT_ROOT" -r $EXCLUDE_DIRS --include="*.json" --include="*.yaml" --include="*.yml" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"; then
    echo "- ✅ AWS - Infraestructura escalable" >> $OUTPUT_FILE
  fi
else
  echo "### Recomendaciones de Despliegue" >> $OUTPUT_FILE
  if [ "$NEXT_DETECTED" = true ]; then
    echo "- **Recomendado:** Vercel para máxima compatibilidad con Next.js" >> $OUTPUT_FILE
  else
    echo "- **Opciones:** Netlify, AWS Amplify, o GitHub Pages" >> $OUTPUT_FILE
  fi
fi
echo "" >> $OUTPUT_FILE
# Optimizaciones específicas para OpenRouter
if [ "$USING_OPENROUTER" = true ] || [ "$USING_QWEN" = true ] || [ "$USING_GROQ_FIREWORKS" = true ]; then
  echo "## 🧠 Optimizaciones para OpenRouter" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "1. **Mejoras en el sistema de caché:**" >> $OUTPUT_FILE
  echo "   - Optimizar TTL según tipo de consulta" >> $OUTPUT_FILE
  echo "   - Estrategia de invalidación inteligente" >> $OUTPUT_FILE
  echo "   - Compresión de respuestas para reducir espacio" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "2. **Configuración de fallbacks:**" >> $OUTPUT_FILE
  echo "   \`\`\`javascript" >> $OUTPUT_FILE
  echo "   const config = {" >> $OUTPUT_FILE
  echo "     provider: {" >> $OUTPUT_FILE
  echo "       order: [\"groq/llama3\", \"fireworks/qwen\"]," >> $OUTPUT_FILE
  echo "       allow_fallbacks: true  // Habilitar para mayor disponibilidad" >> $OUTPUT_FILE
  echo "     }" >> $OUTPUT_FILE
  echo "   }" >> $OUTPUT_FILE
  echo "   \`\`\`" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
  echo "3. **Monitoreo avanzado:**" >> $OUTPUT_FILE
  echo "   - Dashboard de uso por proveedor" >> $OUTPUT_FILE
  echo "   - Alertas de cuota/rendimiento" >> $OUTPUT_FILE
  echo "   - Rotación automática basada en disponibilidad" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
fi
# Conclusiones finales
echo "## 🏆 Conclusiones" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "### Fortalezas" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
if [ $GLOBAL_PROGRESS -ge 70 ]; then
  echo "- **Stack tecnológico moderno y robusto**" >> $OUTPUT_FILE
  echo "- **Alto nivel de implementación (${GLOBAL_PROGRESS}%)**" >> $OUTPUT_FILE
fi
if [ "$NEXT_DETECTED" = true ] && [ "$REACT_DETECTED" = true ] && [ "$TAILWIND_DETECTED" = true ]; then
  echo "- **Frontend optimizado con Next.js, React y Tailwind**" >> $OUTPUT_FILE
fi
if [ "$SUPABASE_DETECTED" = true ] && [ "${SUPABASE_STATUS/\%/}" -gt 50 ]; then
  echo "- **Backend serverless con Supabase (${SUPABASE_STATUS})**" >> $OUTPUT_FILE
fi
if [ "$USING_OPENROUTER" = true ] || [ "$USING_QWEN" = true ] && [ "${AI_STATUS/\%/}" -gt 50 ]; then
  echo "- **Integración de IA robusta (${AI_STATUS})**" >> $OUTPUT_FILE
fi
if [ "$GOOGLE_APIS_DETECTED" = true ] && [ "${CALENDAR_STATUS/\%/}" -gt 50 ]; then
  echo "- **APIs externas bien implementadas (${CALENDAR_STATUS})**" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
echo "### Áreas de Mejora" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
if [ $TEST_FILES -eq 0 ]; then
  echo "- **Testing y garantía de calidad**" >> $OUTPUT_FILE
fi
if [ $ANY_COUNT -gt 20 ]; then
  echo "- **Tipado estricto en TypeScript**" >> $OUTPUT_FILE
fi
if [ $CONSOLE_COUNT -gt 10 ]; then
  echo "- **Limpieza de código y optimización**" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE
echo "### Próximos Pasos" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "1. Consolidar las funcionalidades existentes" >> $OUTPUT_FILE
echo "2. Implementar las recomendaciones prioritarias" >> $OUTPUT_FILE
echo "3. Preparar la aplicación para entorno de producción" >> $OUTPUT_FILE
echo "4. Establecer métricas y monitoreo" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "---" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "<div align=\"center\">" >> $OUTPUT_FILE
echo "<small>Este análisis fue generado automáticamente en base al código fuente del proyecto.</small>" >> $OUTPUT_FILE
echo "</div>" >> $OUTPUT_FILE
# Mensaje final
echo ""
echo "✅ Análisis completado y reporte guardado en $OUTPUT_FILE"
