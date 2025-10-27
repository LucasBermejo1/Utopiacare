import { Ingredient, OnlineStatus } from "@/types/product";
import { ingredientsSample } from "@/data/ingredientsSample";
import {
  ENABLE_INGR_ONLINE,
  COSMILI_BASE,
  CREDIT_LIMIT,
  REQUEST_TIMEOUT_MS,
  MAX_RESPONSE_KB
} from "@/config/constants";

class IngredientService {
  private creditLeft = CREDIT_LIMIT;
  private onlineStatus: OnlineStatus = "live";
  private cache: Record<string, Ingredient> = {};

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const stored = localStorage.getItem("ingredients_cache");
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load ingredient cache", e);
    }
  }

  private saveCache() {
    try {
      localStorage.setItem("ingredients_cache", JSON.stringify(this.cache));
    } catch (e) {
      console.warn("Failed to save ingredient cache", e);
    }
  }

  getCreditsLeft() {
    return this.creditLeft;
  }

  getOnlineStatus() {
    return this.onlineStatus;
  }

  resetCredits() {
    this.creditLeft = CREDIT_LIMIT;
    this.onlineStatus = "live";
  }

  async fetchINCI(inci: string): Promise<Ingredient> {
    const key = inci.toLowerCase();

    // Check memory cache
    if (this.cache[key]) {
      return this.cache[key];
    }

    // Check localStorage
    const lsKey = `ing:${key}`;
    const stored = localStorage.getItem(lsKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.cache[key] = parsed;
        return parsed;
      } catch (e) {
        // Invalid cache entry, continue
      }
    }

    // Budget checks
    if (!ENABLE_INGR_ONLINE || this.creditLeft <= 0) {
      this.onlineStatus = "cache";
      return ingredientsSample[inci] || {
        inci,
        risk: "UNKNOWN",
        source: "offline"
      };
    }

    // Fetch from Cosmili
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const url = `${COSMILI_BASE}?s=${encodeURIComponent(inci)}`;
      const response = await fetch(url, {
        signal: controller.signal,
        mode: "cors"
      });

      clearTimeout(timeout);

      const contentLength = response.headers.get("Content-Length");
      const kb = contentLength ? Number(contentLength) / 1024 : 0;
      if (kb > MAX_RESPONSE_KB) {
        throw new Error("Response too large");
      }

      const html = await response.text();
      this.creditLeft -= 1;

      // Parse HTML for ingredient info (heuristic)
      const lower = html.toLowerCase();
      const entry: Ingredient = {
        inci,
        risk: "UNKNOWN",
        functions: [],
        notes: "",
        source: "cosmili"
      };

      // Risk detection
      if (lower.includes("low risk") || lower.includes("bajo riesgo")) {
        entry.risk = "LOW";
      } else if (
        lower.includes("moderate risk") ||
        lower.includes("riesgo moderado")
      ) {
        entry.risk = "MODERATE";
      } else if (
        lower.includes("high risk") ||
        lower.includes("alto riesgo")
      ) {
        entry.risk = "HIGH";
      }

      // Function detection
      if (lower.includes("humectant") || lower.includes("humectante")) {
        entry.functions?.push("Humectant");
      }
      if (
        lower.includes("soothing") ||
        lower.includes("calmante") ||
        lower.includes("centella")
      ) {
        entry.functions?.push("Soothing");
      }
      if (lower.includes("fragrance") || lower.includes("parfum")) {
        entry.notes = (entry.notes || "") + " fragrance";
      }

      // Cache
      this.cache[key] = entry;
      localStorage.setItem(lsKey, JSON.stringify(entry));
      this.saveCache();

      return entry;
    } catch (error) {
      this.onlineStatus = "cache";
      return ingredientsSample[inci] || {
        inci,
        risk: "UNKNOWN",
        source: "offline",
        notes: "fallback"
      };
    }
  }
}

export const ingredientService = new IngredientService();
