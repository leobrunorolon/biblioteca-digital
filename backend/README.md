# Backend - Biblioteca Digital

Backend basado en **Supabase** (PostgreSQL + Auth + Storage + Edge Functions).

## Estructura

```
backend/
├── supabase/
│   ├── config.toml              # Config local de Supabase
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # Tablas y triggers
│   │   ├── 002_rls_policies.sql     # Row Level Security
│   │   ├── 003_storage_policies.sql # Políticas de Storage
│   │   └── 004_seed_data.sql        # Datos iniciales
│   └── functions/
│       ├── get-signed-url/      # URLs firmadas para archivos
│       └── analytics/           # Métricas para admin
└── README.md
```

## Setup

### 1. Instalar Supabase CLI
```bash
npm install -g supabase
```

### 2. Iniciar Supabase local
```bash
supabase start
```

### 3. Aplicar migraciones
```bash
supabase db push
```

### 4. Deploy Edge Functions
```bash
supabase functions deploy get-signed-url
supabase functions deploy analytics
```

## Variables de entorno (para el frontend)

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Extiende auth.users con rol y preferencias |
| `sections` | Categorías de libros |
| `user_section_access` | Qué secciones puede ver cada usuario |
| `books` | Libros con metadata y URLs de archivos |
| `reading_progress` | Progreso de lectura por usuario/libro |
| `bookmarks` | Marcadores por usuario/libro |
| `highlights` | Resaltados de texto |
| `favorites` | Libros favoritos |
| `activity_log` | Log de actividad para analytics |

## Roles

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total |
| `editor` | Subir/editar libros y secciones |
| `reader` | Solo lectura de secciones asignadas |

## Storage Buckets

| Bucket | Acceso | Límite |
|--------|--------|--------|
| `covers` | Público | 5 MB |
| `books` | Privado (por sección) | 100 MB |
| `audiobooks` | Privado (por sección) | 500 MB |
| `avatars` | Público | 2 MB |
