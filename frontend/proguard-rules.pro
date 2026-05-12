# Deshabilitar ofuscación para evitar crashes en React Native
-dontobfuscate
-dontoptimize

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Expo
-keep class expo.** { *; }
-keep class host.exp.** { *; }

# Supabase / OkHttp
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Zustand / React Query
-keep class com.swmansion.** { *; }
-keep class com.th3rdwave.** { *; }
