import { Ingredient, CompatibilityData } from "@/types/product";

export function evaluateCompatibility(
  ingredients: Ingredient[]
): CompatibilityData {
  const result: CompatibilityData = {
    Normal: { good: 0, bad: 0 },
    Oily: { good: 0, bad: 0 },
    Dry: { good: 0, bad: 0 },
    Combination: { good: 0, bad: 0 },
    Sensitive: { good: 0, bad: 0 }
  };

  for (const ing of ingredients) {
    const name = (ing.inci || "").toLowerCase();
    const functions = (ing.functions || []).map((f) => f.toLowerCase());
    const notes = (ing.notes || "").toLowerCase();
    const comedogenic = Number(ing.comedogenic || 0);

    const isDrying =
      notes.includes("alcohol denat") || functions.includes("astringent");
    const isFragrance =
      notes.includes("fragrance") || notes.includes("parfum");

    // Oily & Combination
    if (comedogenic >= 3) {
      result.Oily.bad++;
      result.Combination.bad++;
    } else {
      result.Oily.good++;
      result.Combination.good++;
    }

    // Dry
    if (isDrying) {
      result.Dry.bad++;
      result.Sensitive.bad++;
    } else {
      result.Dry.good++;
    }

    // Sensitive
    if (isFragrance) {
      result.Sensitive.bad++;
    } else {
      result.Sensitive.good++;
    }

    // Soothing ingredients boost sensitive
    if (name.includes("centella") || functions.includes("soothing")) {
      result.Sensitive.good++;
    }

    // Normal always good
    result.Normal.good++;
  }

  return result;
}
