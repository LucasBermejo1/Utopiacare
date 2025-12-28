import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { insertReviewToSupabase } from "@/services/supabaseReviews";
import { uploadMultipleImages } from "@/services/storageService";
import { useAuth } from "@/hooks/useAuth";
import { LoginDialog } from "./LoginDialog";
import { Star, Upload, X, Image as ImageIcon, LogIn } from "lucide-react";
import { toast } from "sonner";

interface AddReviewDialogProps {
  productId: string;
  onReviewAdded?: () => void;
}

export function AddReviewDialog({ productId, onReviewAdded }: AddReviewDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [skinType, setSkinType] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar nombre de usuario desde el perfil si está logueado
  const loadUserProfile = async () => {
    if (user) {
      try {
        const { getUserProfile } = await import("@/services/supabaseUserProfile");
        const profile = await getUserProfile(user.id);
        if (profile) {
          // Usar el email del usuario como nombre por defecto
          setUserName(user.email?.split("@")[0] || "");
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      }
    }
  };

  // Cargar perfil cuando se abre el diálogo y el usuario está logueado
  useEffect(() => {
    if (open && user) {
      loadUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const handlePhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validar tipos de archivo
    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }

    // Validar tamaño (max 5MB por imagen)
    const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Las imágenes deben ser menores a 5MB cada una");
      return;
    }

    // Limitar a 5 fotos máximo
    const filesToAdd = files.slice(0, 5 - photoFiles.length);
    if (filesToAdd.length < files.length) {
      toast.warning("Solo se pueden subir hasta 5 fotos");
    }

    setPhotoFiles(prev => [...prev, ...filesToAdd]);
    
    // Crear previews
    const newPreviews = await Promise.all(
      filesToAdd.map(file => 
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
      )
    );
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false);
      return;
    }

    // Si intenta abrir y no está logueado, mostrar login
    if (!user && !authLoading) {
      setShowLoginDialog(true);
      toast.info("Debes iniciar sesión para publicar una reseña");
      return;
    }

    setOpen(isOpen);
    if (isOpen && user) {
      loadUserProfile();
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificación adicional de autenticación
    if (!user) {
      toast.error("Debes iniciar sesión para publicar una reseña");
      setOpen(false);
      setShowLoginDialog(true);
      return;
    }

    setLoading(true);
    setUploadingPhotos(true);
    
    try {
      let photoUrls: string[] = [];
      
      // Subir fotos si hay
      if (photoFiles.length > 0) {
        photoUrls = await uploadMultipleImages(photoFiles, 'reviews');
      }

      await insertReviewToSupabase(productId, {
        userName: userName || user.email?.split("@")[0] || "Usuario",
        userSkinType: skinType,
        rating,
        textFull: text,
        photos: photoUrls,
        lang: "es",
        userId: user.id,
      });
      toast.success("Reseña añadida correctamente");
      setOpen(false);
      setUserName("");
      setSkinType("");
      setRating(5);
      setText("");
      setPhotoFiles([]);
      setPhotoPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Delay para asegurar que Supabase procese la actualización
      setTimeout(() => {
        console.log("Recargando producto después de añadir reseña...");
        onReviewAdded?.();
      }, 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al añadir reseña");
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button 
            variant="secondary" 
            disabled={authLoading}
            onClick={(e) => {
              if (!user && !authLoading) {
                e.preventDefault();
                setShowLoginDialog(true);
                toast.info("Debes iniciar sesión para publicar una reseña");
              }
            }}
          >
            {user ? (
              <>
                <Star className="w-4 h-4 mr-2" /> Añadir reseña
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" /> Inicia sesión para reseñar
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva reseña</DialogTitle>
            <DialogDescription>
              {user 
                ? "Comparte tu experiencia con el producto."
                : "Debes iniciar sesión para publicar una reseña."}
            </DialogDescription>
          </DialogHeader>
          {user ? (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input 
              id="name" 
              value={userName || user.email?.split("@")[0] || ""} 
              onChange={(e) => setUserName(e.target.value)} 
              required 
              placeholder={user.email?.split("@")[0] || "Tu nombre"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="skin">Tipo de piel</Label>
            <Input id="skin" value={skinType} onChange={(e) => setSkinType(e.target.value)} placeholder="Normal, Grasa, Seca..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rating">Puntuación (1-5, ej: 4.8)</Label>
            <Input 
              id="rating" 
              type="number" 
              min="1" 
              max="5" 
              step="0.1"
              value={rating} 
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= 5) {
                  setRating(value);
                } else if (e.target.value === "") {
                  setRating(0);
                }
              }} 
              required 
              placeholder="4.8"
            />
            <p className="text-xs text-muted-foreground">
              Puedes usar valores decimales como 4.5, 4.8, etc.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="text">Tu reseña</Label>
            <Textarea id="text" value={text} onChange={(e) => setText(e.target.value)} required rows={4} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="photos">Fotos (opcional, máximo 5)</Label>
            <Input
              ref={fileInputRef}
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotosChange}
              className="cursor-pointer"
              disabled={uploadingPhotos || photoFiles.length >= 5}
            />
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-5 w-5 p-0"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {uploadingPhotos && (
              <p className="text-xs text-muted-foreground">Subiendo fotos...</p>
            )}
            {photoFiles.length >= 5 && (
              <p className="text-xs text-muted-foreground">Límite de 5 fotos alcanzado</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? "Enviando…" : "Guardar reseña"}</Button>
          </DialogFooter>
        </form>
          ) : (
            <div className="py-8 text-center space-y-4">
              <p className="text-muted-foreground">
                Debes iniciar sesión para poder publicar reseñas.
              </p>
              <LoginDialog 
                onLoginSuccess={() => {
                  setShowLoginDialog(false);
                  setOpen(true);
                }}
              />
            </div>
          )}
      </DialogContent>
    </Dialog>
    </>
  );
}


