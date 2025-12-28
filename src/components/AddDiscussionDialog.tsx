import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { LoginDialog } from "./LoginDialog";
import { insertDiscussionToSupabase } from "@/services/supabaseDiscussions";

interface AddDiscussionDialogProps {
  onDiscussionAdded?: () => void;
}

const categories = [
  "Preocupación Cutánea",
  "Ayuda con Rutina",
  "Ayuda con Maquillaje",
  "Cuidado Capilar y Corporal",
  "Info de Producto"
];

export function AddDiscussionDialog({ onDiscussionAdded }: AddDiscussionDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    excerpt: "",
  });

  const generateExcerpt = (content: string): string => {
    // Generar excerpt automático de los primeros 100 caracteres
    const cleanContent = content.trim();
    if (cleanContent.length <= 100) {
      return cleanContent;
    }
    // Buscar el último espacio antes de 100 caracteres para no cortar palabras
    const truncated = cleanContent.substring(0, 100);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  };

  const handleContentChange = (value: string) => {
    setFormData({
      ...formData,
      content: value,
      excerpt: generateExcerpt(value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("handleSubmit llamado", { user, formData, loading, authLoading });

    // Verificar autenticación
    if (!user) {
      console.log("Usuario no autenticado");
      toast.error("Debes iniciar sesión para crear una discusión");
      setShowLoginDialog(true);
      return;
    }

    // Validar campos
    if (!formData.title.trim()) {
      toast.error("Por favor, ingresa un título");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Por favor, ingresa el contenido de la discusión");
      return;
    }

    if (!formData.category) {
      toast.error("Por favor, selecciona una categoría");
      return;
    }

    // Evitar múltiples envíos
    if (loading) {
      console.log("Ya se está procesando una solicitud");
      return;
    }

    setLoading(true);

    try {
      console.log("Iniciando creación de discusión...");
      
      // Obtener información del usuario
      let profile = null;
      try {
        const { getUserProfile } = await import("@/services/supabaseUserProfile");
        profile = await getUserProfile(user.id);
      } catch (profileError) {
        console.warn("No se pudo cargar el perfil del usuario:", profileError);
      }
      
      // Generar ID único basado en título y timestamp
      const timestamp = Date.now();
      const id = `discussion-${timestamp}-${formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 30)}`;

      // Datos del autor
      const authorName = user.email?.split("@")[0] || "Usuario";
      const authorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`;
      const authorSkinType = profile?.skin_type || "";

      const excerpt = formData.excerpt || generateExcerpt(formData.content);

      console.log("Datos a insertar:", {
        id,
        userId: user.id,
        authorName,
        title: formData.title.trim(),
        category: formData.category,
        excerpt,
      });

      // Insertar discusión en Supabase
      await insertDiscussionToSupabase({
        id,
        userId: user.id,
        authorName,
        authorAvatar,
        authorSkinType,
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt,
        category: formData.category,
      });

      console.log("Discusión creada exitosamente");
      toast.success("Discusión creada correctamente");
      
      // Resetear formulario
      setFormData({
        title: "",
        content: "",
        category: "",
        excerpt: "",
      });
      
      setOpen(false);
      
      // Recargar discusiones
      if (onDiscussionAdded) {
        setTimeout(() => {
          onDiscussionAdded();
        }, 500);
      }
    } catch (error) {
      console.error("Error creando discusión:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al crear la discusión";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShowLoginDialog(false);
    }
    setOpen(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Nueva Discusión
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear nueva discusión</DialogTitle>
            <DialogDescription>
              Comparte tus experiencias, haz preguntas o busca consejos de la comunidad.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  Título <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: ¿Qué producto me recomiendan para piel seca?"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">
                  Categoría <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    console.log("Categoría seleccionada:", value);
                    setFormData({ ...formData, category: value });
                  }}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">
                  Contenido <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Describe tu pregunta, experiencia o lo que quieras compartir..."
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  El extracto se generará automáticamente desde tu contenido.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={loading || authLoading}
                className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90"
              >
                {loading ? "Creando..." : "Crear discusión"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showLoginDialog && (
        <LoginDialog
          onLoginSuccess={() => {
            setShowLoginDialog(false);
            // El usuario puede intentar crear la discusión de nuevo
          }}
        />
      )}
    </>
  );
}

