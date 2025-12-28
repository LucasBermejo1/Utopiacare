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
import { Checkbox } from "@/components/ui/checkbox";
import { ATTRIBUTES, CATEGORIES, CONCERNS } from "@/config/constants";
import { insertProductToSupabase } from "@/services/supabaseProducts";
import { uploadImageToStorage } from "@/services/storageService";
import { Plus, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface AddProductDialogProps {
  onProductAdded?: () => void;
}

export function AddProductDialog({ onProductAdded }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand: "",
    name: "",
    image: "",
    categories: [] as string[],
    attributes: [] as string[],
    concerns: [] as string[],
    ingredients: "" as string | string[],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecciona un archivo de imagen");
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }

    setImageFile(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir imagen automáticamente
    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageToStorage(file, 'products');
      setFormData({ ...formData, image: imageUrl });
      toast.success("Imagen subida correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir imagen");
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
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

    try {
      // Generar ID único basado en marca y nombre
      const id = `${formData.brand.toLowerCase().replace(/\s+/g, '-')}-${formData.name.toLowerCase().replace(/\s+/g, '-')}`.replace(/[^a-z0-9-]/g, '');
      
      // Procesar ingredientes: puede ser string separado por comas o array
      const ingredientsArray = Array.isArray(formData.ingredients)
        ? formData.ingredients
        : formData.ingredients.split(',').map(i => i.trim()).filter(Boolean);

      const productData = {
        id,
        brand: formData.brand,
        name: formData.name,
        image: formData.image || "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
        categories: formData.categories,
        attributes: formData.attributes,
        concerns: formData.concerns,
        ingredients: ingredientsArray,
      };

      await insertProductToSupabase(productData);
      
      toast.success("Producto añadido correctamente");
      setOpen(false);
      
      // Reset form
      setFormData({
        brand: "",
        name: "",
        image: "",
        categories: [],
        attributes: [],
        concerns: [],
        ingredients: "",
      });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refrescar lista de productos
      onProductAdded?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al añadir el producto");
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Añadir producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir nuevo producto</DialogTitle>
          <DialogDescription>
            Completa la información del producto. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="brand">
                Marca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Ej: COSRX"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">
                Nombre del producto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Advanced Snail 96 Mucin Power Essence"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Imagen del producto</Label>
              <div className="space-y-2">
                <Input
                  ref={fileInputRef}
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                  disabled={uploadingImage}
                />
                <p className="text-xs text-muted-foreground">
                  O pega una URL de imagen:
                </p>
                <Input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  disabled={!!imageFile}
                />
                {imagePreview && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-border"
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ingredients">Ingredientes</Label>
              <Textarea
                id="ingredients"
                value={Array.isArray(formData.ingredients) ? formData.ingredients.join(', ') : formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                placeholder="Ingredientes separados por comas"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Categorías</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="flex items-center gap-2">
                    <Checkbox
                      id={`cat-${cat}`}
                      checked={formData.categories.includes(cat)}
                      onCheckedChange={() =>
                        toggleArrayItem(formData.categories, cat, (arr) =>
                          setFormData({ ...formData, categories: arr })
                        )
                      }
                    />
                    <Label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">
                      {cat}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Atributos</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {ATTRIBUTES.map((attr) => (
                  <div key={attr} className="flex items-center gap-2">
                    <Checkbox
                      id={`attr-${attr}`}
                      checked={formData.attributes.includes(attr)}
                      onCheckedChange={() =>
                        toggleArrayItem(formData.attributes, attr, (arr) =>
                          setFormData({ ...formData, attributes: arr })
                        )
                      }
                    />
                    <Label htmlFor={`attr-${attr}`} className="text-sm cursor-pointer">
                      {attr}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Preocupaciones de piel</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {CONCERNS.map((concern) => (
                  <div key={concern} className="flex items-center gap-2">
                    <Checkbox
                      id={`concern-${concern}`}
                      checked={formData.concerns.includes(concern)}
                      onCheckedChange={() =>
                        toggleArrayItem(formData.concerns, concern, (arr) =>
                          setFormData({ ...formData, concerns: arr })
                        )
                      }
                    />
                    <Label htmlFor={`concern-${concern}`} className="text-sm cursor-pointer">
                      {concern}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Añadiendo..." : "Añadir producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



