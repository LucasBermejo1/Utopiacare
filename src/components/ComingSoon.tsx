import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Sparkles } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
  feature?: string;
}

export function ComingSoon({ 
  title = "Próximamente", 
  description = "Estamos trabajando en esta sección para ofrecerte la mejor experiencia.",
  feature
}: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] rounded-full p-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feature && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Sparkles className="w-4 h-4" />
              <span>{feature}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Mientras tanto, puedes usar nuestro chatbot para obtener recomendaciones personalizadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

