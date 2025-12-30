import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Sparkles, Heart, Image as ImageIcon, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { BETA_MODE } from "@/config/constants";
import {
  saveChatMessage,
  extractRelevantDataFromMessage,
  updateUserChatData,
} from "@/services/chatDataService";
import { getChatGPTResponse, convertMessagesToChatGPTFormat } from "@/services/chatGPTService";
import { logger } from "@/utils/logger";

// Componente para el botón del chatbot (reutilizable)
export function ChatBotButton({ 
  onClick, 
  showPresentation = false,
  size = "default"
}: { 
  onClick: () => void;
  showPresentation?: boolean;
  size?: "default" | "large";
}) {
  const buttonSize = size === "large" ? "h-20 w-20" : "h-16 w-16";
  
  return (
    <div className={`flex items-center justify-center relative transition-all duration-1000 ${
      showPresentation ? "opacity-0 scale-0" : "opacity-100 scale-100"
    }`}>
      {/* Pulso animado de fondo - más sutil */}
      <div className={`absolute rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] opacity-20 animate-pulse ${buttonSize}`} />
      
      <Button
        onClick={onClick}
        className={`relative rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] hover:shadow-3xl hover:shadow-[hsl(var(--terracotta))]/50 border-2 border-white/20 ${buttonSize}`}
        size="lg"
        aria-label="Hablar con Utopia"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <UtopiaEyes size="lg" />
        </div>
      </Button>
    </div>
  );
}

// Componente para los ojos animados de Utopia
export function UtopiaEyes({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Parpadeo aleatorio cada 2-5 segundos
    const scheduleBlink = () => {
      const delay = Math.random() * 3000 + 2000; // 2-5 segundos
      return setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          blinkIntervalRef.current = scheduleBlink();
        }, 180); // Duración del parpadeo
      }, delay);
    };

    blinkIntervalRef.current = scheduleBlink();

    return () => {
      if (blinkIntervalRef.current) {
        clearTimeout(blinkIntervalRef.current);
      }
    };
  }, []);

  const eyeSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const irisSize = size === "sm" ? "inset-0.5" : size === "lg" ? "inset-1" : "inset-0.5";
  const pupilSize = size === "sm" ? "w-1.5 h-1.5" : size === "lg" ? "w-2.5 h-2.5" : "w-2 h-2";
  const highlightSize = size === "sm" ? "w-1 h-1" : size === "lg" ? "w-1.5 h-1.5" : "w-1.5 h-1.5";

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1.5">
      {/* Ojo izquierdo */}
      <div className={cn("relative", eyeSize)}>
        <div
          className={cn(
            "w-full rounded-full bg-white border-2 border-white/40 transition-all duration-200 ease-in-out overflow-hidden",
            isBlinking ? "h-0.5" : "h-full"
          )}
        >
          {!isBlinking && (
            <>
              {/* Iris con gradiente más realista */}
              <div className={cn("absolute rounded-full bg-gradient-to-br from-blue-300 via-blue-500 to-blue-700 flex items-center justify-center shadow-inner", irisSize)}>
                {/* Anillo exterior del iris */}
                <div className="absolute inset-0.5 rounded-full border border-blue-800/30" />
                {/* Pupila */}
                <div className={cn("rounded-full bg-black shadow-lg", pupilSize)} />
              </div>
              {/* Brillo principal */}
              <div className={cn("absolute top-0.5 left-0.5 rounded-full bg-white/90 shadow-sm", highlightSize)} />
              {/* Brillo secundario más pequeño */}
              <div className="absolute top-1 right-1 w-0.5 h-0.5 rounded-full bg-white/60" />
            </>
          )}
        </div>
      </div>
      {/* Ojo derecho */}
      <div className={cn("relative", eyeSize)}>
        <div
          className={cn(
            "w-full rounded-full bg-white border-2 border-white/40 transition-all duration-200 ease-in-out overflow-hidden",
            isBlinking ? "h-0.5" : "h-full"
          )}
        >
          {!isBlinking && (
            <>
              {/* Iris con gradiente más realista */}
              <div className={cn("absolute rounded-full bg-gradient-to-br from-blue-300 via-blue-500 to-blue-700 flex items-center justify-center shadow-inner", irisSize)}>
                {/* Anillo exterior del iris */}
                <div className="absolute inset-0.5 rounded-full border border-blue-800/30" />
                {/* Pupila */}
                <div className={cn("rounded-full bg-black shadow-lg", pupilSize)} />
              </div>
              {/* Brillo principal */}
              <div className={cn("absolute top-0.5 left-0.5 rounded-full bg-white/90 shadow-sm", highlightSize)} />
              {/* Brillo secundario más pequeño */}
              <div className="absolute top-1 right-1 w-0.5 h-0.5 rounded-full bg-white/60" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[]; // URLs o base64 de imágenes
}

export function ChatBot() {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  
  // Escuchar evento personalizado para abrir el chat desde otros componentes
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChatBot', handleOpenChat);
    return () => window.removeEventListener('openChatBot', handleOpenChat);
  }, []);

  // Prevenir scroll del body cuando el chat está abierto (especialmente en móvil)
  useEffect(() => {
    if (isOpen) {
      // Guardar la posición actual del scroll
      const scrollY = window.scrollY;
      
      // Bloquear el scroll del body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restaurar el scroll cuando se cierra
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  // Mensaje inicial adaptado según si el usuario está autenticado
  const getInitialMessage = () => {
    if (!user && !authLoading) {
      return {
        id: "1",
        role: "assistant" as const,
        content: "¡Hola! 👋 Soy Utopia, tu asesor de belleza personal ✨\n\n💡 Para darte información más detallada y personalizada, necesito que inicies sesión. Así podré verificar tu historial y recomendarte productos perfectos para tu tipo de piel.\n\n¿Quieres iniciar sesión ahora? Puedes hacerlo desde el icono de usuario en la parte superior. 🚀",
        timestamp: new Date(),
      };
    }
    return {
      id: "1",
      role: "assistant" as const,
      content: "¡Hola! 👋 Soy Utopia, tu asesor de belleza personal ✨\n\n¿En qué puedo ayudarte hoy? Puedo ayudarte a encontrar productos perfectos para tu tipo de piel o explicarte ingredientes. 💕",
      timestamp: new Date(),
    };
  };

  const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  // Cargar historial de conversaciones cuando el usuario está disponible (al montar o al iniciar sesión)
  useEffect(() => {
    if (user && !authLoading) {
      setIsLoadingHistory(true);
      const loadHistory = async () => {
        try {
          const { getChatHistory } = await import("@/services/chatDataService");
          const history = await getChatHistory(user.id, 50); // Cargar más mensajes para contexto completo
          
          if (history.length > 0) {
            logger.log(`📚 Cargando historial: ${history.length} mensajes`);
            // Convertir historial a formato Message
            const historyMessages: Message[] = history.map(msg => ({
              id: msg.messageId,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
            }));
            
            // Reemplazar mensajes con historial completo (incluyendo mensaje inicial)
            setMessages(prev => {
              // Si solo hay el mensaje inicial, reemplazarlo con historial completo
              if (prev.length === 1 && prev[0].id === "1") {
                return [prev[0], ...historyMessages];
              }
              // Si ya hay mensajes, verificar si el historial tiene más mensajes
              const existingIds = new Set(prev.map(m => m.id));
              const newMessages = historyMessages.filter(m => !existingIds.has(m.id));
              if (newMessages.length > 0) {
                return [...prev, ...newMessages];
              }
              return prev;
            });
          } else {
            logger.log("📚 No hay historial previo");
          }
        } catch (error) {
          console.error("Error cargando historial:", error);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      
      loadHistory();
    }
  }, [user, authLoading]); // Cargar cuando el usuario esté disponible, no solo cuando se abre el chat

  // Focus en el input cuando se abre el chat
  useEffect(() => {
    if (isOpen && inputRef.current && !isLoadingHistory) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isLoadingHistory]);

  // Animación de presentación desactivada
  // useEffect(() => {
  //   if (!BETA_MODE) return;

  //   // Mostrar presentación después de 0.5 segundos
  //   const presentationTimer = setTimeout(() => {
  //     setShowPresentation(true);
      
  //     // Ocultar presentación después de 2 segundos y animar vuelta
  //     const hideTimer = setTimeout(() => {
  //       setShowPresentation(false);
  //     }, 2000);

  //     return () => clearTimeout(hideTimer);
  //   }, 500);

  //   return () => clearTimeout(presentationTimer);
  // }, []);

  // Actualizar mensaje inicial cuando el usuario inicia sesión
  useEffect(() => {
    if (!authLoading && isOpen && user && messages.length === 1 && messages[0].id === "1") {
      // Solo actualizar si el mensaje inicial es el que indica que necesita iniciar sesión
      if (messages[0].content.includes("necesito que inicies sesión")) {
        setMessages([getInitialMessage()]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Si el usuario no está autenticado, mostrar mensaje de recordatorio
    if (!user && !authLoading) {
      const reminderMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "🔐 Para darte información más detallada y personalizada, necesito que inicies sesión. Así podré:\n\n✨ Verificar tu historial de conversaciones\n✨ Conocer tu tipo de piel y preocupaciones\n✨ Recomendarte productos específicos para ti\n✨ Recordar tus preferencias\n\nPuedes iniciar sesión desde el icono de usuario (👤) en la parte superior de la página. Una vez que lo hagas, podré ayudarte mucho mejor! 💕",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reminderMessage]);
      setShowLoginPrompt(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
      images: selectedImages.length > 0 ? selectedImages : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setSelectedImages([]); // Limpiar imágenes seleccionadas
    setIsLoading(true);
    setShowLoginPrompt(false); // Resetear el prompt si el usuario envía un mensaje

    // Guardar mensaje del usuario en la base de datos
    if (user) {
      saveChatMessage(user.id, {
        messageId: userMessage.id,
        role: "user",
        content: userMessage.content,
        timestamp: userMessage.timestamp,
      }).catch((error) => {
        console.error("Error guardando mensaje:", error);
      });

      // Extraer y guardar información relevante del mensaje
      extractRelevantDataFromMessage(userMessage.content)
        .then(async (extractedData) => {
          // Guardar datos de chat
          if (
            extractedData.mentionedProducts?.length ||
            extractedData.mentionedIngredients?.length ||
            extractedData.concerns?.length ||
            extractedData.skinIssues?.length ||
            extractedData.productInterests?.length ||
            extractedData.preferences
          ) {
            await updateUserChatData(user.id, extractedData);
          }
          
          // Actualizar perfil del usuario con información importante extraída del chat
          try {
            const { updateUserProfileFromChat } = await import("@/services/chatDataService");
            await updateUserProfileFromChat(user.id, {
              skinType: extractedData.skinType,
              skinSensitivity: extractedData.skinSensitivity,
              concerns: extractedData.concerns,
              climateZone: extractedData.climateZone,
              sunExposure: extractedData.sunExposure,
              routineCommitment: extractedData.routineCommitment,
              lifestyleSmoking: extractedData.lifestyleSmoking,
              lifestyleSleepLessThan7h: extractedData.lifestyleSleepLessThan7h,
              lifestyleMedications: extractedData.lifestyleMedications,
              problematicIngredients: extractedData.problematicIngredients,
              allergies: extractedData.allergies,
              removedProblematicIngredients: extractedData.removedProblematicIngredients,
              removedAllergies: extractedData.removedAllergies,
            });
          } catch (error) {
            console.error("Error actualizando perfil desde chat:", error);
          }
        })
        .catch((error) => {
          console.error("Error extrayendo datos del mensaje:", error);
        });
    }

      // Conectar con ChatGPT
      try {
        // Asegurarse de que tenemos el historial completo antes de enviar
        // Si el historial aún se está cargando, esperar un momento
        if (isLoadingHistory) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Obtener historial completo desde la BD para asegurar que tenemos todo
        let fullHistory: Message[] = [...messages];
        if (user) {
          try {
            const { getChatHistory } = await import("@/services/chatDataService");
            const dbHistory = await getChatHistory(user.id, 50);
            const dbMessages: Message[] = dbHistory.map(msg => ({
              id: msg.messageId,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
            }));
            
            // Combinar historial de BD con mensajes actuales (evitando duplicados)
            const existingIds = new Set(fullHistory.map(m => m.id));
            const newMessages = dbMessages.filter(m => !existingIds.has(m.id));
            fullHistory = [...fullHistory, ...newMessages].sort((a, b) => 
              a.timestamp.getTime() - b.timestamp.getTime()
            );
          } catch (error) {
            console.error("Error obteniendo historial completo:", error);
            // Continuar con el historial del estado si falla
          }
        }
        
        // Convertir historial de mensajes al formato de ChatGPT
        const conversationHistory = convertMessagesToChatGPTFormat(
          fullHistory.map(msg => ({ role: msg.role, content: msg.content }))
        );
        
        logger.log(`💬 Enviando mensaje con historial de ${conversationHistory.length} mensajes`);
        
        // Obtener respuesta de ChatGPT (pasar userId e imágenes para personalización)
        const response = await getChatGPTResponse(
          userMessage.content, 
          conversationHistory,
          user?.id || null,
          userMessage.images
        );
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Guardar mensaje del asistente en la base de datos
      if (user) {
        saveChatMessage(user.id, {
          messageId: assistantMessage.id,
          role: "assistant",
          content: assistantMessage.content,
          timestamp: assistantMessage.timestamp,
        }).catch((error) => {
          console.error("Error guardando mensaje del asistente:", error);
        });
      }
    } catch (error) {
      console.error("Error al obtener respuesta de ChatGPT:", error);
      
      // Mensaje de error más descriptivo
      let errorContent = "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.";
      
      if (error instanceof Error) {
        console.error("Detalles del error:", error.message);
        
        // Errores específicos según el tipo
        if (error.message.includes("VITE_CHATGPT_API_KEY no está configurada")) {
          errorContent = "⚠️ La API key de ChatGPT no está configurada. Por favor, verifica tu archivo .env.local";
        } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorContent = "⚠️ La API key de ChatGPT no es válida. Por favor, verifica tu clave en .env.local";
        } else if (error.message.includes("429") || error.message.includes("Too Many Requests")) {
          errorContent = "⚠️ Has excedido el límite de solicitudes. Por favor, espera unos minutos o verifica tu plan de OpenAI.";
        } else if (error.message.includes("Network")) {
          errorContent = "⚠️ Error de conexión. Verifica tu conexión a internet.";
        } else {
          errorContent = `⚠️ Error: ${error.message}`;
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      // Guardar mensaje de error en la base de datos
      if (user) {
        saveChatMessage(user.id, {
          messageId: errorMessage.id,
          role: "assistant",
          content: errorMessage.content,
          timestamp: errorMessage.timestamp,
        }).catch((error) => {
          console.error("Error guardando mensaje de error:", error);
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    const maxImages = 3; // Máximo 3 imágenes por mensaje
    const remainingSlots = maxImages - selectedImages.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setSelectedImages((prev) => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Animación de presentación - Solo en producción */}
      {showPresentation && BETA_MODE && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm animate-in fade-in duration-500 overflow-hidden">
          <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
            {/* Bot grande animado moviéndose por la pantalla */}
            <div className="relative utopia-presentation-bot">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] opacity-30 animate-ping" />
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] flex items-center justify-center shadow-2xl border-4 border-white/30">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="scale-[2] sm:scale-[2.5] md:scale-[3]">
                      <UtopiaEyes size="lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mensaje de presentación fijo debajo del bot */}
            <div className="mt-6 sm:mt-8 text-center space-y-2 px-4 sm:px-6 animate-in fade-in duration-700 delay-300">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
                ¡Hola! Soy Utopia
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                Tu asistente de Utopiacare
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante para abrir el chat */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <ChatBotButton 
            onClick={() => setIsOpen(true)}
            showPresentation={showPresentation}
            size={BETA_MODE ? "large" : "default"}
          />
        </div>
      )}

      {/* Ventana del chat */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-6 right-6 shadow-2xl z-50 flex flex-col border-2 border-[hsl(var(--terracotta))]/20 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300",
          isExpanded 
            ? "bottom-6 left-6 top-6 md:top-6 md:left-6 w-[calc(100vw-3rem)] h-[calc(100vh-3rem)] md:w-[calc(100vw-3rem)] md:h-[calc(100vh-3rem)]"
            : "w-[calc(100vw-3rem)] h-[calc(100vh-8rem)] max-w-[400px] max-h-[600px] md:w-[400px] md:h-[600px]"
        )}>
          {/* Header con gradiente cute */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[hsl(var(--terracotta))]/10 via-[hsl(var(--accent))]/10 to-[hsl(var(--terracotta))]/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {/* Avatar cute de Utopia - Solo ojos animados */}
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] flex items-center justify-center shadow-lg ring-2 ring-white/30">
                  <div className="relative leading-none">
                    <UtopiaEyes size="md" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-1.5">
                  Utopia
                  <Sparkles className="h-4 w-4 text-[hsl(var(--terracotta))] animate-pulse" />
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  En línea • Lista para ayudarte
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 rounded-full hover:bg-[hsl(var(--terracotta))]/10 transition-colors"
                aria-label={isExpanded ? "Contraer chat" : "Expandir chat"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-[hsl(var(--terracotta))]/10 transition-colors"
                aria-label="Cerrar chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mensajes */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gradient-to-b from-background to-[hsl(var(--terracotta))]/5">
            {isLoadingHistory && (
              <div className="flex items-center justify-center py-8">
                <div className="flex gap-2 items-center text-muted-foreground">
                  <div className="h-2 w-2 bg-[hsl(var(--terracotta))] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 bg-[hsl(var(--terracotta))] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 bg-[hsl(var(--terracotta))] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="ml-2 text-sm">Cargando historial...</span>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    message.role === "user" ? "justify-end" : "justify-start",
                    index === messages.length - 1 && "animation-delay-100"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white/20">
                      <span className="text-white font-bold text-lg">U</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                      message.role === "user"
                        ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/90 text-primary-foreground rounded-br-sm"
                        : "bg-white/80 backdrop-blur-sm border border-[hsl(var(--terracotta))]/20 rounded-bl-sm"
                    )}
                  >
                    {/* Mostrar imágenes si existen */}
                    {message.images && message.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {message.images.map((img, imgIndex) => (
                          <div key={imgIndex} className="relative group">
                            <img
                              src={img}
                              alt={`Imagen ${imgIndex + 1}`}
                              className="w-24 h-24 object-cover rounded-lg border-2 border-white/30"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    )}
                    <p className={cn(
                      "text-xs mt-2",
                      message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {message.timestamp.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 flex items-center justify-center flex-shrink-0 text-primary-foreground shadow-md ring-2 ring-white/20">
                      <span className="text-xs font-bold">👤</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white/20">
                    <span className="text-white font-bold text-lg">U</span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm border border-[hsl(var(--terracotta))]/20 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      <div className="h-2 w-2 bg-[hsl(var(--terracotta))] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 bg-[hsl(var(--terracotta))] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 bg-[hsl(var(--terracotta))] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-gradient-to-r from-[hsl(var(--terracotta))]/5 to-[hsl(var(--accent))]/5 backdrop-blur-sm">
            {/* Vista previa de imágenes seleccionadas */}
            {selectedImages.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <img
                      src={img}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-[hsl(var(--terracotta))]/30"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      aria-label="Eliminar imagen"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                aria-label="Seleccionar imágenes"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || selectedImages.length >= 3}
                size="icon"
                variant="outline"
                className="rounded-full border-[hsl(var(--terracotta))]/20 hover:bg-[hsl(var(--terracotta))]/10 transition-all disabled:opacity-50"
                aria-label="Añadir imagen"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregúntame lo que quieras... 💭"
                disabled={isLoading}
                className="flex-1 border-[hsl(var(--terracotta))]/20 focus:border-[hsl(var(--terracotta))] focus:ring-[hsl(var(--terracotta))]/20 rounded-full"
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && selectedImages.length === 0) || isLoading}
                size="icon"
                className="rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                aria-label="Enviar mensaje"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

