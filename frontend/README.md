# Frontend - Biblioteca Digital

App mobile con **React Native + Expo + TypeScript**.

## Stack

| Tecnología | Uso |
|-----------|-----|
| React Native + Expo | Framework mobile |
| TypeScript | Tipado estático |
| React Navigation | Navegación |
| Zustand | Estado global |
| TanStack Query | Cache y fetching |
| Supabase JS | Backend client |
| Expo AV | Reproducción de audio |
| Expo SecureStore | Tokens seguros |

## Estructura

```
frontend/
├── src/
│   ├── types/          # Tipos TypeScript globales
│   ├── services/       # Clientes de API (Supabase)
│   │   ├── supabase.ts
│   │   ├── auth.service.ts
│   │   ├── books.service.ts
│   │   └── progress.service.ts
│   ├── store/          # Estado global (Zustand)
│   │   ├── auth.store.ts
│   │   ├── theme.store.ts
│   │   └── reader.store.ts
│   ├── hooks/          # Custom hooks (React Query)
│   │   ├── useTheme.ts
│   │   ├── useBooks.ts
│   │   └── useSections.ts
│   ├── theme/          # Colores, tipografía, espaciado
│   │   ├── colors.ts
│   │   └── index.ts
│   ├── components/     # Componentes reutilizables
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   └── Input.tsx
│   │   └── books/
│   │       ├── BookCard.tsx
│   │       └── SectionCard.tsx
│   ├── screens/        # Pantallas
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── main/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── SectionsScreen.tsx
│   │   │   ├── BookDetailsScreen.tsx
│   │   │   ├── SearchScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── AudioPlayerScreen.tsx
│   │   └── admin/
│   │       ├── DashboardScreen.tsx
│   │       └── UploadBookScreen.tsx
│   └── navigation/     # Navegadores
│       ├── RootNavigator.tsx
│       ├── AuthNavigator.tsx
│       ├── MainNavigator.tsx
│       └── AdminNavigator.tsx
├── assets/
├── App.tsx
├── app.json
└── .env.example
```

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### 3. Correr la app
```bash
# Expo Go (desarrollo rápido)
npm start

# Android
npm run android

# iOS
npm run ios
```

## Flujo de autenticación

```
App inicia
  └── RootNavigator
        ├── isLoading → Spinner
        ├── !isAuthenticated → AuthNavigator (Login/Register/ForgotPassword)
        └── isAuthenticated
              ├── role === 'admin' → AdminNavigator + MainNavigator
              └── role !== 'admin' → MainNavigator
```

## Roles y acceso

| Rol | Acceso |
|-----|--------|
| `admin` | Panel admin + app completa |
| `editor` | Subir libros + app completa |
| `reader` | Solo secciones asignadas |

## Librerías adicionales recomendadas

Para habilitar el lector de libros:
```bash
# PDF
npx expo install react-native-pdf react-native-blob-util

# EPUB
npm install epubjs
```

Para notificaciones push:
```bash
npx expo install expo-notifications
```

## Dark Mode

El tema se controla desde `useThemeStore`:
- `light` → siempre claro
- `dark` → siempre oscuro  
- `system` → sigue el sistema operativo

Se persiste en AsyncStorage y se aplica automáticamente en toda la app.
