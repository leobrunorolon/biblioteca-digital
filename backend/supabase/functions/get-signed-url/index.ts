// Edge Function: genera URLs firmadas para acceso seguro a archivos
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar auth del usuario
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bookId, type } = await req.json(); // type: 'book' | 'audio'

    if (!bookId) {
      return new Response(JSON.stringify({ error: "bookId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener el libro y verificar acceso
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*, sections!inner(id)")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return new Response(JSON.stringify({ error: "Book not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar que el usuario tiene acceso a la sección
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const { data: access } = await supabase
        .from("user_section_access")
        .select("id")
        .eq("user_id", user.id)
        .eq("section_id", book.section_id)
        .single();

      if (!access) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Generar URL firmada (válida por 1 hora)
    const fileUrl = type === "audio" ? book.audio_url : book.file_url;
    const bucket = type === "audio" ? "audiobooks" : "books";

    // Extraer el path del archivo de la URL
    const urlParts = fileUrl.split(`/${bucket}/`);
    const filePath = urlParts[urlParts.length - 1];

    const { data: signedUrl, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600); // 1 hora

    if (signError) {
      throw signError;
    }

    // Registrar actividad
    await supabase.from("activity_log").insert({
      user_id: user.id,
      book_id: bookId,
      action: type === "audio" ? "open_audio" : "open_book",
    });

    return new Response(JSON.stringify({ signedUrl: signedUrl.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
