/**
 * Utilidad para logging condicional
 * Solo muestra logs en desarrollo
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Los errores siempre se muestran
    console.error(...args);
  },
  warn: (...args: unknown[]) => {
    // Los warnings siempre se muestran
    console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};


