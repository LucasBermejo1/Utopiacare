import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function LegalNotice() {
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
            <CardTitle className="text-3xl">AVISO LEGAL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Información Identificativa</h2>
              <p className="mb-4">
                En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos:
              </p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>
                  <strong>Titular:</strong> Asociación Juvenil Junior Empresa Axis
                </li>
                <li>
                  <strong>NIF:</strong> G56547938
                </li>
                <li>
                  <strong>Domicilio Social:</strong> C. del Convent dels Carmelites, 1, La Saïdia, 46010 València, Valencia.
                </li>
                <li>
                  <strong>Inscripción Registral:</strong> Inscrita en el Registro de Asociaciones con el número G56547938.
                </li>
                <li>
                  <strong>Correo electrónico de contacto:</strong>{" "}
                  <a href="mailto:info@utopiacare.es" className="text-accent hover:underline">
                    info@utopiacare.es
                  </a>
                </li>
                <li>
                  <strong>Sitio web:</strong>{" "}
                  <a href="https://utopiacare-jwvg.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    https://utopiacare-jwvg.vercel.app/
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Términos de Uso y Restricciones</h2>
              <div className="space-y-4">
                <p>
                  El acceso y uso de UtopiaCare atribuye la condición de usuario. La plataforma está dirigida exclusivamente a mayores de 16 años.
                </p>
                <div>
                  <p className="font-semibold mb-2">Restricción de seguridad:</p>
                  <p>
                    Si el sistema detecta que el usuario es un menor de edad (niño/a), UtopiaCare bloqueará automáticamente la recomendación de activos cosméticos fuertes (como el retinol o ácidos exfoliantes potentes). En estos casos, se sugerirá la supervisión de un adulto o profesional médico.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Responsabilidad:</p>
                  <p>
                    El titular no se hace responsable de los daños derivados del uso indebido de la información facilitada por la IA, la cual tiene carácter meramente informativo y no sustituye el diagnóstico de un dermatólogo.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Propiedad Intelectual</h2>
              <p>
                Todos los contenidos de este sitio web (textos, gráficos, logotipos, etc.) son propiedad de la Asociación Juvenil Junior Empresa Axis o de sus licenciantes, quedando prohibida su reproducción sin autorización expresa.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

