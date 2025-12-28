import { supabase } from "@/lib/supabaseClient";

/**
 * Sube una imagen a Supabase Storage
 * @param file - Archivo de imagen
 * @param folder - Carpeta donde guardar (ej: 'products', 'reviews')
 * @param fileName - Nombre del archivo (opcional, se genera automáticamente si no se proporciona)
 * @returns URL pública de la imagen subida
 */
export async function uploadImageToStorage(
  file: File,
  folder: 'products' | 'reviews' | 'stores',
  fileName?: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  // Generar nombre único si no se proporciona
  const uniqueFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
  const filePath = `${folder}/${uniqueFileName}`;

  // Subir archivo
  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Error al subir imagen: ${uploadError.message}`);
  }

  // Obtener URL pública
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Sube múltiples imágenes a Supabase Storage
 */
export async function uploadMultipleImages(
  files: File[],
  folder: 'products' | 'reviews'
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImageToStorage(file, folder));
  return Promise.all(uploadPromises);
}

