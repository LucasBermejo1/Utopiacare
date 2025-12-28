import { useState, useRef } from "react";
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
import { insertStoreToSupabase } from "@/services/supabaseStores";
import { uploadImageToStorage } from "@/services/storageService";
import { Store } from "@/data/stores";
import { Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface AddStoreDialogProps {
  onStoreAdded?: () => void;
}

export function AddStoreDialog({ onStoreAdded }: AddStoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    area: "",
    image: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    rating: "",
    reviewsCount: "",
    tags: "",
    // Horarios
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
    // Coordenadas
    lat: "",
    lng: "",
    // Categorías preferidas
    preferredCategories: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecciona un archivo de imagen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadingImage(true);

    try {
      // Generar ID único basado en nombre y área
      const id = `${formData.name.toLowerCase().replace(/\s+/g, '-')}-${formData.area.toLowerCase().replace(/\s+/g, '-')}`.replace(/[^a-z0-9-]/g, '');

      let imageUrl = formData.image;

      // Subir imagen si hay archivo
      if (imageFile) {
        imageUrl = await uploadImageToStorage(imageFile, 'stores', `store-${id}`);
      }

      // Construir objeto de horarios
      const openingHours: Store['openingHours'] = {};
      if (formData.monday) openingHours.monday = formData.monday;
      if (formData.tuesday) openingHours.tuesday = formData.tuesday;
      if (formData.wednesday) openingHours.wednesday = formData.wednesday;
      if (formData.thursday) openingHours.thursday = formData.thursday;
      if (formData.friday) openingHours.friday = formData.friday;
      if (formData.saturday) openingHours.saturday = formData.saturday;
      if (formData.sunday) openingHours.sunday = formData.sunday;

      // Construir coordenadas
      const coordinates: Store['coordinates'] | undefined = 
        formData.lat && formData.lng
          ? { lat: Number(formData.lat), lng: Number(formData.lng) }
          : undefined;

      // Normalizar URL del sitio web (añadir https:// si no tiene protocolo)
      let websiteUrl = formData.website?.trim();
      if (websiteUrl && !websiteUrl.match(/^https?:\/\//i)) {
        websiteUrl = `https://${websiteUrl}`;
      }

      // Procesar tags
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      // Procesar categorías preferidas
      const preferredCategories = formData.preferredCategories
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      const storeData: Store = {
        id,
        name: formData.name,
        area: formData.area,
        image: imageUrl || "https://images.unsplash.com/photo-1585384287174-1135df04d4ee?w=800&h=600&fit=crop",
        preferredCategories: preferredCategories.length > 0 ? preferredCategories : undefined,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: websiteUrl || undefined,
        description: formData.description || undefined,
        rating: formData.rating ? Number(formData.rating) : undefined,
        reviewsCount: formData.reviewsCount ? Number(formData.reviewsCount) : undefined,
        openingHours: Object.keys(openingHours).length > 0 ? openingHours : undefined,
        coordinates,
        tags: tags.length > 0 ? tags : undefined,
      };

      console.log("Intentando insertar tienda:", storeData);
      const result = await insertStoreToSupabase(storeData);
      console.log("Tienda insertada exitosamente:", result);

      toast.success("Tienda añadida correctamente");
      setOpen(false);

      // Reset form
      setFormData({
        name: "",
        area: "",
        image: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        description: "",
        rating: "",
        reviewsCount: "",
        tags: "",
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
        friday: "",
        saturday: "",
        sunday: "",
        lat: "",
        lng: "",
        preferredCategories: "",
      });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onStoreAdded?.();
    } catch (error) {
      console.error("Error al añadir tienda:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al añadir la tienda";
      toast.error(errorMessage);
      // Si el error menciona que la tabla no existe, dar instrucciones más claras
      if (errorMessage.includes("does not exist") || errorMessage.includes("relation")) {
        toast.error("La tabla 'stores' no existe en Supabase. Ejecuta el SQL para crearla.", {
          duration: 8000,
        });
      }
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Añadir tienda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir nueva tienda</DialogTitle>
          <DialogDescription>
            Completa la información de la tienda. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la tienda *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="area">Área *</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="Ruzafa, Ciutat Vella, etc."
                required
              />
            </div>
          </div>

          {/* Imagen */}
          <div className="grid gap-2">
            <Label htmlFor="image">Imagen</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
                disabled={uploadingImage}
              />
              <Input
                id="image-url"
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="O introduce una URL de imagen"
                disabled={!!imageFile}
              />
            </div>
            {imagePreview && (
              <div className="relative w-32 h-32 mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg border border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={handleRemoveImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            {uploadingImage && (
              <p className="text-xs text-muted-foreground">Subiendo imagen...</p>
            )}
          </div>

          {/* Descripción */}
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Sitio web</Label>
              <Input
                id="website"
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="utopiacare.es o https://utopiacare.es"
              />
            </div>
          </div>

          {/* Valoraciones */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reviewsCount">Número de reseñas</Label>
              <Input
                id="reviewsCount"
                type="number"
                min="0"
                value={formData.reviewsCount}
                onChange={(e) => setFormData({ ...formData, reviewsCount: e.target.value })}
              />
            </div>
          </div>

          {/* Horarios */}
          <div className="space-y-2">
            <Label>Horarios de apertura</Label>
            <div className="grid grid-cols-2 gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <div key={day} className="grid gap-1">
                  <Label htmlFor={day} className="text-xs capitalize">
                    {day === 'monday' ? 'Lunes' :
                     day === 'tuesday' ? 'Martes' :
                     day === 'wednesday' ? 'Miércoles' :
                     day === 'thursday' ? 'Jueves' :
                     day === 'friday' ? 'Viernes' :
                     day === 'saturday' ? 'Sábado' : 'Domingo'}
                  </Label>
                  <Input
                    id={day}
                    value={formData[day as keyof typeof formData] as string}
                    onChange={(e) => setFormData({ ...formData, [day]: e.target.value })}
                    placeholder="Ej: 10:00 - 14:00, 16:00 - 20:00"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Coordenadas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lat">Latitud</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                placeholder="39.4699"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lng">Longitud</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                placeholder="-0.3763"
              />
            </div>
          </div>

          {/* Tags y categorías */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (separados por comas)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Cruelty-free, Vegano, Orgánico"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="preferredCategories">Categorías preferidas (separadas por comas)</Label>
              <Input
                id="preferredCategories"
                value={formData.preferredCategories}
                onChange={(e) => setFormData({ ...formData, preferredCategories: e.target.value })}
                placeholder="Fragancias, Sérums, Esencias"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Añadiendo…" : "Añadir tienda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

