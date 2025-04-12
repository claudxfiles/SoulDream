#!/bin/bash

# Script para configurar CursorRules en el proyecto AI Assistant

echo "Configuración de CursorRules para el proyecto AI Assistant"
echo "=========================================================="
echo

# Verificar si Cursor está instalado
if command -v cursor &> /dev/null; then
    echo "✅ Cursor ya está instalado en el sistema."
else
    echo "❌ Cursor no está instalado en el sistema."
    echo "Por favor, instala Cursor desde: https://cursor.sh"
    echo
fi

# Verificar si el archivo cursor-rules.json existe
if [ -f "cursor-rules.json" ]; then
    echo "✅ El archivo cursor-rules.json ya existe en el proyecto."
else
    echo "❌ No se encontró el archivo cursor-rules.json"
    echo "Asegúrate de que estás ejecutando este script desde la raíz del proyecto."
    echo
fi

echo
echo "Para utilizar CursorRules en tu proyecto:"
echo "----------------------------------------"
echo "1. Asegúrate de tener Cursor instalado (https://cursor.sh)"
echo "2. Abre el proyecto con Cursor"
echo "3. El archivo cursor-rules.json ya está configurado en el proyecto"
echo "4. Para interactuar con el asistente, usa Ctrl+K (o Cmd+K en Mac)"
echo
echo "Para más información, consulta:"
echo "- CURSOR_RULES.md: guía completa sobre cómo usar CursorRules"
echo "- EXAMPLES.md: ejemplos concretos de cómo usar CursorRules en este proyecto"
echo

echo "Recursos adicionales:"
echo "--------------------"
echo "- Documentación oficial de Cursor: https://cursor.sh/docs"
echo "- Tutoriales de CursorRules: https://cursor.sh/docs/cursor-rules"
echo

echo "¿Deseas abrir la documentación sobre CursorRules ahora? (s/n)"
read -r respuesta

if [[ $respuesta == "s" || $respuesta == "S" ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open CURSOR_RULES.md
    elif command -v open &> /dev/null; then
        open CURSOR_RULES.md
    else
        echo "No se pudo abrir automáticamente. Por favor, abre CURSOR_RULES.md manualmente."
    fi
fi

echo
echo "Configuración completada. ¡Disfruta usando CursorRules en tu proyecto!"
