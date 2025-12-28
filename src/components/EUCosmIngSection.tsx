import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, XCircle, ExternalLink, Info } from "lucide-react";
import { CosIngAnalysis, CosIngIngredientAnalysis } from "@/types/product";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface EUCosmIngSectionProps {
  analysis: CosIngAnalysis | null | undefined;
  productName: string;
}

export function EUCosmIngSection({ analysis, productName }: EUCosmIngSectionProps) {
  const [openIngredients, setOpenIngredients] = useState<Set<number>>(new Set());

  if (!analysis || !analysis.ingredients || analysis.ingredients.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              EU
            </div>
            <h3 className="text-xl font-semibold">EU CosmIle</h3>
          </div>
          <Badge variant="outline" className="ml-auto">
            <Info className="w-3 h-3 mr-1" />
            Análisis pendiente
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          El análisis de ingredientes según la base de datos CosIng de la Unión Europea está en proceso o aún no está disponible.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Los ingredientes se analizan automáticamente cuando se sube el producto. Esto puede tardar unos minutos.
        </p>
      </Card>
    );
  }

  const toggleIngredient = (index: number) => {
    const newOpen = new Set(openIngredients);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenIngredients(newOpen);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
            EU
          </div>
          <h3 className="text-xl font-semibold">EU CosmIle</h3>
        </div>
        <Badge variant="outline" className="ml-auto">
          <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
          Análisis completo
        </Badge>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Análisis de ingredientes según la base de datos CosIng (Cosmetic Ingredient Database) de la Unión Europea.
        </p>
        <a
          href="https://ec.europa.eu/growth/tools-databases/cosing/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
        >
          Ver base de datos CosIng <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Resumen */}
      {analysis.summary && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Resumen
          </h4>
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {analysis.summary}
          </p>
        </div>
      )}

      {/* Preocupaciones */}
      {analysis.concerns && analysis.concerns.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-4 h-4" />
            Preocupaciones
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.concerns.map((concern, idx) => (
              <Badge key={idx} variant="outline" className="text-amber-700 border-amber-300">
                {concern}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            Recomendaciones
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <Separator className="my-6" />

      {/* Lista de ingredientes analizados */}
      <div>
        <h4 className="font-semibold mb-4">Ingredientes Analizados ({analysis.ingredients.length})</h4>
        <div className="space-y-3">
          {analysis.ingredients.map((ingredient, index) => (
            <IngredientCard
              key={index}
              ingredient={ingredient}
              index={index}
              isOpen={openIngredients.has(index)}
              onToggle={() => toggleIngredient(index)}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

interface IngredientCardProps {
  ingredient: CosIngIngredientAnalysis;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

function IngredientCard({ ingredient, index, isOpen, onToggle }: IngredientCardProps) {
  const hasInfo = ingredient.found_in_cosing !== false && !ingredient.error;
  const hasError = ingredient.error || ingredient.found_in_cosing === false;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-3 flex-1 text-left">
            {hasInfo ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : hasError ? (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium">{ingredient.name}</div>
              <div className="text-xs text-muted-foreground">
                {ingredient.found_in_cosing === false
                  ? "No encontrado en CosIng"
                  : ingredient.error
                  ? `Error: ${ingredient.error}`
                  : ingredient.cosing_ref_number
                  ? `CosIng Ref: ${ingredient.cosing_ref_number}`
                  : "Información disponible"}
              </div>
            </div>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 flex-shrink-0 ml-2" />
          ) : (
            <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-3">
        <div className="space-y-3 pt-2 border-t">
          {/* Referencias */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {ingredient.cosing_ref_number && (
              <div>
                <span className="text-muted-foreground">CosIng Ref:</span>
                <div className="font-mono">{ingredient.cosing_ref_number}</div>
              </div>
            )}
            {ingredient.cas_number && (
              <div>
                <span className="text-muted-foreground">CAS:</span>
                <div className="font-mono">{ingredient.cas_number}</div>
              </div>
            )}
            {ingredient.ec_number && (
              <div>
                <span className="text-muted-foreground">EC:</span>
                <div className="font-mono">{ingredient.ec_number}</div>
              </div>
            )}
          </div>

          {/* Funciones */}
          {ingredient.function && ingredient.function.length > 0 && (
            <div>
              <span className="text-sm font-semibold">Funciones:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {ingredient.function.map((func, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {func}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Restricciones */}
          {ingredient.restrictions && (
            <div>
              <span className="text-sm font-semibold text-amber-700">Restricciones:</span>
              <p className="text-sm text-muted-foreground mt-1 bg-amber-50 p-2 rounded">
                {ingredient.restrictions}
              </p>
            </div>
          )}

          {/* Advertencias */}
          {ingredient.warnings && (
            <div>
              <span className="text-sm font-semibold text-red-700">Advertencias:</span>
              <p className="text-sm text-muted-foreground mt-1 bg-red-50 p-2 rounded">
                {ingredient.warnings}
              </p>
            </div>
          )}

          {/* Evaluación de seguridad */}
          {ingredient.safety_assessment && (
            <div>
              <span className="text-sm font-semibold">Evaluación de Seguridad:</span>
              <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded">
                {ingredient.safety_assessment}
              </p>
            </div>
          )}

          {/* Error */}
          {ingredient.error && (
            <div>
              <span className="text-sm font-semibold text-red-700">Error:</span>
              <p className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded">
                {ingredient.error}
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}









