import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { BETA_MODE } from "@/config/constants";
import {
  saveChatMessage,
  extractRelevantDataFromMessage,
  updateUserChatData,
} from "@/services/chatDataService";
import { getChatGPTResponse, convertMessagesToChatGPTFormat } from "@/services/chatGPTService";

// Componente para los ojos animados de Utopia
function UtopiaEyes({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
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
}

export function ChatBot() {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  // Focus en el input cuando se abre el chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Actualizar mensaje inicial cuando el usuario inicia sesión
  useEffect(() => {
    if (!authLoading && isOpen && user && messages.length === 1 && messages[0].id === "1") {
      // Solo actualizar si el mensaje inicial es el que indica que necesita iniciar sesión
      if (messages[0].content.includes("necesito que inicies sesión")) {
        setMessages([getInitialMessage()]);
      }
    }
  }, [user, authLoading, isOpen]);

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
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
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
        .then((extractedData) => {
          if (
            extractedData.mentionedProducts?.length ||
            extractedData.mentionedIngredients?.length ||
            extractedData.concerns?.length ||
            extractedData.skinIssues?.length ||
            extractedData.productInterests?.length ||
            extractedData.preferences
          ) {
            return updateUserChatData(user.id, extractedData);
          }
        })
        .catch((error) => {
          console.error("Error extrayendo datos del mensaje:", error);
        });
    }

      // Conectar con ChatGPT
      try {
        // Convertir historial de mensajes al formato de ChatGPT
        const conversationHistory = convertMessagesToChatGPTFormat(
          messages.map(msg => ({ role: msg.role, content: msg.content }))
        );
        
        // Obtener respuesta de ChatGPT (pasar userId para personalización)
        const response = await getChatGPTResponse(
          userMessage.content, 
          conversationHistory,
          user?.id || null
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

  return (
    <>
      {/* Botón flotante para abrir el chat */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          {/* Pulso animado de fondo - más intenso en producción */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] opacity-30 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] opacity-20 animate-pulse" />
          
          {/* Tooltip en producción */}
          {BETA_MODE && (
            <div className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] text-white rounded-lg shadow-xl whitespace-nowrap animate-bounce">
              <div className="text-sm font-semibold">💬 ¡Haz clic para chatear!</div>
              <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--accent))]"></div>
            </div>
          )}
          
          <Button
            onClick={() => setIsOpen(true)}
            className={`relative rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] hover:shadow-3xl hover:shadow-[hsl(var(--terracotta))]/50 border-2 border-white/20 ${
              BETA_MODE ? "h-20 w-20" : "h-16 w-16"
            }`}
            size="lg"
            aria-label="Hablar con Utopia"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <UtopiaEyes size="lg" />
            </div>
          </Button>
        </div>
      )}

      {/* Ventana del chat */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] h-[calc(100vh-8rem)] max-w-[400px] max-h-[600px] shadow-2xl z-50 flex flex-col border-2 border-[hsl(var(--terracotta))]/20 overflow-hidden md:w-[400px] md:h-[600px] animate-in slide-in-from-bottom-4 fade-in duration-300">
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

          {/* Mensajes */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gradient-to-b from-background to-[hsl(var(--terracotta))]/5">
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
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
            <div className="flex gap-2">
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
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                aria-label="Enviar mensaje"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              Conectado con ChatGPT
            </p>
          </div>
        </Card>
      )}
    </>
  );
}

