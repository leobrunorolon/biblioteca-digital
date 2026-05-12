# Biblioteca Digital

App mobile de biblioteca digital con React Native + Expo + Supabase.

## Estructura del proyecto

```
app-biblioteca/
├── frontend/          # React Native + Expo + TypeScript
└── backend/           # Supabase (SQL + Edge Functions)
```

## Inicio rápido

### Backend (Supabase)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar las migraciones en el SQL Editor:
   - `backend/supabase/migrations/001_initial_schema.sql`
   - `backend/supabase/migrations/002_rls_policies.sql`
   - `backend/supabase/migrations/003_storage_policies.sql`
   - `backend/supabase/migrations/004_seed_data.sql`
3. Deploy de Edge Functions (opcional, requiere Supabase CLI)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Completar EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY
npm start
```

## Documentación

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)
