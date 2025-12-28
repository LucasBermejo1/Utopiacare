export type Store = {
  id: string;
  name: string;
  area: string;
  image: string;
  preferredCategories?: string[]; // opcional para personalizar curación
  // Nuevos campos importantes
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  rating?: number;
  reviewsCount?: number;
  openingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  tags?: string[]; // ej: "Cruelty-free", "Vegano", "Orgánico"
};

export const featuredStores: Store[] = [
  {
    id: "mina",
    name: "MINA Perfumery",
    area: "Ruzafa",
    image:
      "https://images.unsplash.com/photo-1585384287174-1135df04d4ee?w=800&h=600&fit=crop",
    preferredCategories: ["Fragancias", "Sérums", "Esencias"],
    address: "Calle de Sueca, 45",
    phone: "+34 963 123 456",
    email: "info@minaperfumery.es",
    website: "https://minaperfumery.es",
    description: "Perfumería especializada en fragancias de nicho y productos de cuidado de la piel coreanos. Ambiente acogedor con atención personalizada.",
    rating: 4.7,
    reviewsCount: 142,
    openingHours: {
      monday: "10:00 - 14:00, 16:00 - 20:00",
      tuesday: "10:00 - 14:00, 16:00 - 20:00",
      wednesday: "10:00 - 14:00, 16:00 - 20:00",
      thursday: "10:00 - 14:00, 16:00 - 20:00",
      friday: "10:00 - 14:00, 16:00 - 21:00",
      saturday: "10:00 - 21:00",
      sunday: "Cerrado"
    },
    coordinates: {
      lat: 39.4699,
      lng: -0.3763
    },
    tags: ["Cruelty-free", "Orgánico", "K-Beauty"]
  },
  {
    id: "jose-ribera",
    name: "José Ribera Cosmetics",
    area: "Ciutat Vella",
    image:
      "https://images.unsplash.com/photo-1512203492609-8f7f06f1f2cc?w=800&h=600&fit=crop",
    preferredCategories: ["Hidratantes", "Tratamientos"],
    address: "Plaza del Ayuntamiento, 12",
    phone: "+34 963 234 567",
    email: "contacto@joseriberacosmetics.es",
    website: "https://joseriberacosmetics.es",
    description: "Farmacia y cosmética profesional desde 1985. Especialistas en dermocosmética y marcas premium.",
    rating: 4.5,
    reviewsCount: 89,
    openingHours: {
      monday: "09:00 - 14:00, 16:30 - 20:00",
      tuesday: "09:00 - 14:00, 16:30 - 20:00",
      wednesday: "09:00 - 14:00, 16:30 - 20:00",
      thursday: "09:00 - 14:00, 16:30 - 20:00",
      friday: "09:00 - 14:00, 16:30 - 20:30",
      saturday: "10:00 - 14:00",
      sunday: "Cerrado"
    },
    coordinates: {
      lat: 39.4699,
      lng: -0.3774
    },
    tags: ["Dermocosmética", "Farmacia", "Premium"]
  },
  {
    id: "botanica",
    name: "Botánica Natural",
    area: "El Carmen",
    image:
      "https://images.unsplash.com/photo-1515542706656-8e6c8e84e8aa?w=800&h=600&fit=crop",
    preferredCategories: ["Cuidado facial", "Limpiadores"],
    address: "Calle Caballeros, 28",
    phone: "+34 963 345 678",
    email: "hola@botanicanatural.es",
    website: "https://botanicanatural.es",
    description: "Tienda especializada en productos naturales y orgánicos para el cuidado de la piel. Todos nuestros productos son cruelty-free y veganos.",
    rating: 4.8,
    reviewsCount: 203,
    openingHours: {
      monday: "10:30 - 14:00, 17:00 - 20:00",
      tuesday: "10:30 - 14:00, 17:00 - 20:00",
      wednesday: "10:30 - 14:00, 17:00 - 20:00",
      thursday: "10:30 - 14:00, 17:00 - 20:00",
      friday: "10:30 - 14:00, 17:00 - 20:30",
      saturday: "11:00 - 14:00, 17:00 - 20:00",
      sunday: "11:00 - 14:00"
    },
    coordinates: {
      lat: 39.4785,
      lng: -0.3778
    },
    tags: ["Orgánico", "Vegano", "Cruelty-free", "Natural"]
  },
  {
    id: "marina",
    name: "Marina Beauty Lab",
    area: "El Cabanyal",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&h=600&fit=crop",
    preferredCategories: ["Protección solar", "Sérums"],
    address: "Avenida del Puerto, 156",
    phone: "+34 963 456 789",
    email: "info@marinabeautylab.es",
    website: "https://marinabeautylab.es",
    description: "Centro de belleza y cosmética junto al mar. Especialistas en protección solar y tratamientos faciales.",
    rating: 4.6,
    reviewsCount: 127,
    openingHours: {
      monday: "09:00 - 13:30, 16:00 - 19:30",
      tuesday: "09:00 - 13:30, 16:00 - 19:30",
      wednesday: "09:00 - 13:30, 16:00 - 19:30",
      thursday: "09:00 - 13:30, 16:00 - 19:30",
      friday: "09:00 - 13:30, 16:00 - 20:00",
      saturday: "09:30 - 14:00",
      sunday: "Cerrado"
    },
    coordinates: {
      lat: 39.4740,
      lng: -0.3285
    },
    tags: ["Protección solar", "Tratamientos", "Beach Beauty"]
  },
];


