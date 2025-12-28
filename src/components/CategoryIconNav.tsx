import { Link } from "react-router-dom";
import {
  IconCleanser,
  IconExfoliant,
  IconToner,
  IconTreatment,
  IconMask,
  IconMoisturizer,
  IconEye,
  IconLips,
  IconSun,
} from "./icons/CategoryIcons";
import { SafeImage } from "@/components/SafeImage";

interface Category {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  image?: string;
  path: string;
}

const categories: Category[] = [
  { name: "Limpiadores", icon: IconCleanser, image: "/icons/cleanser.png", path: "/products?c=Limpiadores" },
  { name: "Exfoliantes", icon: IconExfoliant, image: "/icons/exfoliant.png", path: "/products?c=Exfoliantes" },
  { name: "Tónicos", icon: IconToner, image: "/icons/toner.png", path: "/products?c=Tónicos" },
  { name: "Tratamientos", icon: IconTreatment, image: "/icons/treatment.png", path: "/products?c=Tratamientos" },
  { name: "Mascarillas", icon: IconMask, image: "/icons/mask.png", path: "/products?c=Mascarillas" },
  { name: "Humectantes", icon: IconMoisturizer, image: "/icons/moisturizer.png", path: "/products?c=Hidratantes,Cremas" },
  { name: "Cuidado De Ojos", icon: IconEye, image: "/icons/eye-care.png", path: "/products?c=Cuidado de ojos" },
  { name: "Cuidado De Labios", icon: IconLips, image: "/icons/lip-care.png", path: "/products?c=Cuidado de labios" },
  { name: "Cuidado Solar", icon: IconSun, image: "/icons/sun-care.png", path: "/products?c=Protección solar" },
];

export function CategoryIconNav() {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-6 lg:gap-8 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map(({ name, icon: Icon, image, path }) => (
        <Link
          key={name}
          to={path}
          className="flex flex-col items-center gap-2 group flex-shrink-0"
        >
          <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-card border-2 border-[hsl(var(--border))] flex items-center justify-center shadow-[var(--shadow-sm)] overflow-hidden group-hover:shadow-md transition-shadow">
              {image ? (
                <SafeImage src={image} alt={name} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              ) : (
                <Icon className="w-8 h-8 md:w-10 md:h-10 text-[hsl(var(--terracotta))]" />
              )}
            </div>
          </div>
          <span className="text-sm md:text-base text-foreground text-center whitespace-nowrap">
            {name}
          </span>
        </Link>
      ))}
    </div>
  );
}
