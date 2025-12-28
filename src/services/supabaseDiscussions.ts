import { supabase } from "@/lib/supabaseClient";
import { Discussion } from "@/types/discussion";

// Lee discusiones desde la tabla `discussions` en Supabase
// Mapea nombres de columnas snake_case a camelCase
export async function fetchDiscussionsFromSupabase(): Promise<Discussion[]> {
  if (!supabase) {
    throw new Error("Supabase no configurado: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY");
  }

  const { data, error } = await supabase
    .from("discussions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener discusiones:", error);
    throw new Error(error.message);
  }

  // Mapear snake_case a camelCase para el tipo Discussion
  return (data || []).map((item: any) => {
    // Calcular timeAgo desde created_at
    const createdAt = new Date(item.created_at);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    let timeAgo = "";
    if (diffDays > 0) {
      timeAgo = diffDays === 1 ? "hace 1 día" : `hace ${diffDays} días`;
    } else if (diffHours > 0) {
      timeAgo = diffHours === 1 ? "hace 1 hora" : `hace ${diffHours} horas`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      timeAgo = diffMinutes <= 1 ? "hace un momento" : `hace ${diffMinutes} minutos`;
    }

    return {
      id: item.id,
      author: {
        name: item.author_name,
        avatar: item.author_avatar || "",
        skinType: item.author_skin_type || "",
      },
      title: item.title,
      excerpt: item.excerpt || item.content.substring(0, 100) + "...",
      timeAgo: timeAgo,
      views: item.views || 0,
      upvotes: item.upvotes || 0,
      comments: item.comments_count || 0,
      category: item.category,
    } as Discussion;
  });
}

// Lee discusiones filtradas por categoría
export async function fetchDiscussionsByCategoryFromSupabase(category: string): Promise<Discussion[]> {
  if (!supabase) {
    throw new Error("Supabase no configurado: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY");
  }

  let query = supabase
    .from("discussions")
    .select("*")
    .order("created_at", { ascending: false });

  if (category !== "Todas") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener discusiones por categoría:", error);
    throw new Error(error.message);
  }

  // Mapear snake_case a camelCase
  return (data || []).map((item: any) => {
    const createdAt = new Date(item.created_at);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    let timeAgo = "";
    if (diffDays > 0) {
      timeAgo = diffDays === 1 ? "hace 1 día" : `hace ${diffDays} días`;
    } else if (diffHours > 0) {
      timeAgo = diffHours === 1 ? "hace 1 hora" : `hace ${diffHours} horas`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      timeAgo = diffMinutes <= 1 ? "hace un momento" : `hace ${diffMinutes} minutos`;
    }

    return {
      id: item.id,
      author: {
        name: item.author_name,
        avatar: item.author_avatar || "",
        skinType: item.author_skin_type || "",
      },
      title: item.title,
      excerpt: item.excerpt || item.content.substring(0, 100) + "...",
      timeAgo: timeAgo,
      views: item.views || 0,
      upvotes: item.upvotes || 0,
      comments: item.comments_count || 0,
      category: item.category,
    } as Discussion;
  });
}

// Lee una discusión por ID
export async function fetchDiscussionByIdFromSupabase(id: string): Promise<Discussion | null> {
  if (!supabase) {
    console.warn("Supabase no configurado");
    return null;
  }

  const { data, error } = await supabase
    .from("discussions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching discussion from Supabase:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const createdAt = new Date(data.created_at);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  let timeAgo = "";
  if (diffDays > 0) {
    timeAgo = diffDays === 1 ? "hace 1 día" : `hace ${diffDays} días`;
  } else if (diffHours > 0) {
    timeAgo = diffHours === 1 ? "hace 1 hora" : `hace ${diffHours} horas`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    timeAgo = diffMinutes <= 1 ? "hace un momento" : `hace ${diffMinutes} minutos`;
  }

  return {
    id: data.id,
    author: {
      name: data.author_name,
      avatar: data.author_avatar || "",
      skinType: data.author_skin_type || "",
    },
    title: data.title,
    excerpt: data.excerpt || data.content.substring(0, 100) + "...",
    timeAgo: timeAgo,
    views: data.views || 0,
    upvotes: data.upvotes || 0,
    comments: data.comments_count || 0,
    category: data.category,
  } as Discussion;
}

// Inserta una nueva discusión en Supabase
// Mapea camelCase a snake_case para la BD
export async function insertDiscussionToSupabase(discussion: {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  authorSkinType?: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
}): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY");
  }

  // Mapear camelCase a snake_case para insertar en BD
  const discussionData = {
    id: discussion.id,
    user_id: discussion.userId,
    author_name: discussion.authorName,
    author_avatar: discussion.authorAvatar || "",
    author_skin_type: discussion.authorSkinType || null,
    title: discussion.title,
    content: discussion.content,
    excerpt: discussion.excerpt,
    category: discussion.category,
    views: 0,
    upvotes: 0,
    comments_count: 0,
  };

  console.log("Insertando discusión en Supabase:", discussionData);

  const { data, error } = await supabase
    .from("discussions")
    .insert(discussionData)
    .select();

  if (error) {
    console.error("Error insertando discusión:", error);
    console.error("Detalles del error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(error.message || "Error al crear la discusión");
  }

  console.log("Discusión insertada exitosamente:", data);
}

