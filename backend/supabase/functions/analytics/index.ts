// Edge Function: analytics para el panel admin
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

    // Verificar que es admin
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token!);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // Libros más leídos
    const { data: topBooks } = await supabase
      .from("activity_log")
      .select("book_id, books(title, author, cover_url)")
      .eq("action", "open_book")
      .not("book_id", "is", null)
      .limit(10);

    // Usuarios activos (últimos 7 días)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeUsers } = await supabase
      .from("activity_log")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    // Total de libros
    const { count: totalBooks } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Total de usuarios
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Libros completados
    const { count: completedBooks } = await supabase
      .from("reading_progress")
      .select("*", { count: "exact", head: true })
      .eq("completed", true);

    return new Response(
      JSON.stringify({
        topBooks,
        activeUsers,
        totalBooks,
        totalUsers,
        completedBooks,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
