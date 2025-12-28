#!/bin/bash

# Script para ejecutar la migración de user_id usando psql
# 
# USO:
# 1. Para Supabase local (Docker):
#    ./scripts/ejecutar-migracion-psql.sh localhost 54322 postgres postgres
#
# 2. Para PostgreSQL directo:
#    ./scripts/ejecutar-migracion-psql.sh localhost 5432 tu_usuario tu_password

DB_HOST=${1:-localhost}
DB_PORT=${2:-54322}
DB_USER=${3:-postgres}
DB_PASSWORD=${4:-postgres}
DB_NAME=${5:-postgres}

# Verificar si psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ psql no está instalado"
    echo "📝 Instálalo con: brew install postgresql (en macOS)"
    exit 1
fi

echo "🚀 Ejecutando migración: agregar columna user_id a reviews..."
echo "📡 Conectando a: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Exportar password para evitar prompt
export PGPASSWORD=$DB_PASSWORD

# Ejecutar el SQL
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/ARREGLAR_USER_ID_REVIEWS.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migración completada exitosamente"
    echo ""
    echo "📝 Si usas Supabase local, reinicia los servicios:"
    echo "   supabase stop && supabase start"
else
    echo ""
    echo "❌ Error ejecutando la migración"
    echo "📝 Verifica las credenciales y que PostgreSQL esté corriendo"
    exit 1
fi








