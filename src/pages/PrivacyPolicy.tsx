import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">POLÍTICA DE PRIVACIDAD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Responsable del Tratamiento</h2>
              <p>
                El responsable del tratamiento de tus datos es la Asociación Juvenil Junior Empresa Axis, con domicilio en C. del Convent dels Carmelites, 1, València y contacto en{" "}
                <a href="mailto:info@utopiacare.es" className="text-accent hover:underline">
                  info@utopiacare.es
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Base Legal y Consentimiento</h2>
              <p>
                El tratamiento de sus datos se basa en el consentimiento explícito que el usuario otorga al aceptar esta política durante el registro o al iniciar una interacción con nuestro sistema de chat. El usuario tiene el derecho de retirar este consentimiento en cualquier momento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Protección de Menores</h2>
              <p>
                Conforme a la LOPDGDD (España), el tratamiento de datos de menores de 14 años sin consentimiento paterno está estrictamente prohibido. Si UtopiaCare identifica que un usuario es menor de dicha edad, procederá a la eliminación inmediata de cualquier dato personal recopilado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Datos Recopilados y Finalidad</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Historial de Chat e IA:</p>
                  <p>
                    Almacenamos las conversaciones para ofrecer recomendaciones personalizadas y recordar sus preferencias.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Comentarios:</p>
                  <p>
                    Recopilamos los datos del formulario, dirección IP y agentes de usuario para la detección de spam.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Infraestructura (Vercel):</p>
                  <p>
                    Nuestro sitio utiliza la infraestructura de Vercel Inc., que puede procesar datos técnicos (IP, logs) para garantizar la seguridad y estabilidad del servicio.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cookies</h2>
              <div className="space-y-2">
                <p>
                  <strong>Comentarios:</strong> Opción de guardar nombre y correo (duración: 1 año).
                </p>
                <p>
                  <strong>Sesión y Acceso:</strong> Cookies temporales para verificar el navegador y cookies de inicio de sesión (2 días a 2 semanas si se selecciona "Recuérdame").
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Tiempo de Conservación y Borrado del Historial</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Derecho al Olvido:</p>
                  <p>
                    El usuario puede solicitar el borrado completo de su historial de chat en cualquier momento enviando un correo a{" "}
                    <a href="mailto:info@utopiacare.es" className="text-accent hover:underline">
                      info@utopiacare.es
                    </a>.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Baja del servicio:</p>
                  <p>
                    Si el usuario elimina su cuenta, toda la información personal y el historial de interacciones con la IA serán eliminados permanentemente en un plazo máximo de 30 días, salvo obligaciones legales.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Ejercicio de Derechos (Derechos ARCO)</h2>
              <p>
                Como usuario, puede ejercer sus derechos de Acceso, Rectificación, Cancelación, Oposición y Supresión enviando una comunicación escrita con copia de su documento de identidad a{" "}
                <a href="mailto:info@utopiacare.es" className="text-accent hover:underline">
                  info@utopiacare.es
                </a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

