import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function CookiePolicy() {
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
            <CardTitle className="text-3xl">POLÍTICA DE COOKIES</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 text-foreground">
            <section>
              <p className="mb-4">
                En esta web se utilizan cookies de terceros y propias para conseguir que tengas una mejor experiencia de navegación, puedas guardar tus preferencias de cuidado de la piel y para que podamos obtener estadísticas generales de uso.
              </p>
              <p>
                Según los términos incluidos en el artículo 22.2 de la Ley 34/2002 de Servicios de la Sociedad de la Información y Comercio Electrónico, si continúas navegando, estarás prestando tu consentimiento para el empleo de dichos mecanismos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Entidad Responsable</h2>
              <p>
                La entidad responsable de la recogida, procesamiento y utilización de tus datos personales es la Asociación Juvenil Junior Empresa Axis, con NIF G56547938 y domicilio en C. del Convent dels Carmelites, 1, La Saïdia, 46010 València, Valencia. Contacto:{" "}
                <a href="mailto:info@utopiacare.es" className="text-accent hover:underline">
                  info@utopiacare.es
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. ¿Qué son las cookies?</h2>
              <p>
                Las cookies son pequeños archivos de texto que se almacenan en el navegador del usuario al visitar una web. Su objetivo es registrar la visita y guardar cierta información para que la página funcione de manera más eficiente y personalizada.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Tipos de cookies utilizadas en UtopiaCare</h2>
              <p className="mb-4">
                Las cookies de este sitio web se dividen según su permanencia (sesión o permanentes) y su finalidad:
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">A. Cookies de Rendimiento y Técnicas</h3>
                  <p className="mb-2">Son necesarias para el funcionamiento de la web. En UtopiaCare se utilizan para:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Recordar los ajustes de tu interfaz.</li>
                    <li>Asegurar que el sitio cargue correctamente desde la infraestructura de Vercel.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">B. Cookies de Registro e IA</h3>
                  <p className="mb-2">Se generan una vez que el usuario se ha registrado o ha iniciado sesión:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      <strong>Identificación:</strong> Mantienen al usuario identificado para que no tenga que reintroducir sus datos cada vez que cambia de sección.
                    </li>
                    <li>
                      <strong>Personalización de IA:</strong> Permiten que el chat de UtopiaCare recuerde el contexto de la conversación durante la sesión.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">C. Cookies de Analíticas (Terceros)</h3>
                  <p className="mb-2">
                    Cada vez que visitas UtopiaCare, una herramienta externa (como Google Analytics) genera una cookie analítica. Esta cookie sirve para:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Identificar de forma anónima el navegador y dispositivo.</li>
                    <li>Contabilizar el número de visitantes y su tendencia en el tiempo.</li>
                    <li>Saber qué contenidos de cuidado de la piel son los más consultados.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. ¿Cómo puedo deshabilitar las cookies?</h2>
              <p className="mb-4">
                Puedes configurar tu navegador para ser avisado de la recepción de cookies o para impedir su instalación. Aquí tienes los enlaces de ayuda de los principales navegadores:
              </p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>
                  <strong>Google Chrome:</strong>{" "}
                  <a 
                    href="https://support.google.com/chrome/answer/95647" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-accent hover:underline"
                  >
                    Instrucciones aquí
                  </a>
                </li>
                <li>
                  <strong>Mozilla Firefox:</strong>{" "}
                  <a 
                    href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-accent hover:underline"
                  >
                    Instrucciones aquí
                  </a>
                </li>
                <li>
                  <strong>Safari:</strong>{" "}
                  <a 
                    href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-accent hover:underline"
                  >
                    Instrucciones aquí
                  </a>
                </li>
                <li>
                  <strong>Microsoft Edge:</strong>{" "}
                  <a 
                    href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-accent hover:underline"
                  >
                    Instrucciones aquí
                  </a>
                </li>
              </ul>
              <p className="mt-4">
                Si deseas dejar de ser seguido por Google Analytics, puedes instalar{" "}
                <a 
                  href="https://tools.google.com/dlpage/gaoptout" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-accent hover:underline"
                >
                  este complemento de inhabilitación
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Actualizaciones y cambios</h2>
              <p>
                UtopiaCare puede modificar esta Política de Cookies en función de exigencias legislativas o para adaptarla a las instrucciones de la Agencia Española de Protección de Datos (AEPD). Se recomienda a los usuarios visitarla periódicamente.
              </p>
              <p className="mt-2">
                Cuando existan cambios significativos, se comunicarán mediante la web o por correo electrónico a los usuarios registrados.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

