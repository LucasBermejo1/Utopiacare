import { Link } from "react-router-dom";
import { Droplet, Sparkles, Wine, Pill, SmilePlus, Flower2, Eye, Heart, Sun } from "lucide-react";

const categories = [
  { name: "Limpiadores", icon: Droplet, path: "/products?c=Cleansers" },
  { name: "Exfoliantes", icon: Sparkles, path: "/products?c=Exfoliators" },
  { name: "Tónicos", icon: Wine, path: "/products?c=Toners" },
  { name: "Tratamientos", icon: Pill, path: "/products?c=Treatments" },
  { name: "Mascarillas", icon: SmilePlus, path: "/products?c=Masks" },
  { name: "Hidratantes", icon: Flower2, path: "/products?c=Moisturizers,Cremas" },
  { name: "Contorno Ojos", icon: Eye, path: "/products?c=Eye+Care" },
  { name: "Labios", icon: Heart, path: "/products?c=Lip+Care" },
  { name: "Solar", icon: Sun, path: "/products?c=Sun+Care" },
];

export function CategoryIconNav() {
  return (
    <div className="flex items-center justify-center gap-8 flex-wrap">
      {categories.map(({ name, icon: Icon, path }) => (
        <Link
          key={name}
          to={path}
          className="flex flex-col items-center gap-2 group transition-transform hover:scale-110"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {name}
          </span>
        </Link>
      ))}
    </div>
  );
}
