import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllGlobalCorrections,
  verifyAndActivateGlobalCorrection,
  deactivateGlobalCorrection,
  deleteGlobalCorrection,
  type GlobalCorrection,
} from "@/services/globalCorrectionsService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Trash2, Check, X, AlertCircle, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCorrection, setSelectedCorrection] = useState<string | null>(null);

  // Obtener todas las correcciones con actualización automática cada 5 segundos
  const { data: corrections, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["globalCorrections"],
    queryFn: getAllGlobalCorrections,
    retry: 2,
    refetchInterval: 5000, // Actualizar cada 5 segundos
    refetchOnWindowFocus: true, // Actualizar cuando la ventana recupera el foco
  });

  // Mutaciones
  const verifyAndActivateMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      verifyAndActivateGlobalCorrection(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalCorrections"] });
      toast.success("Corrección verificada y activada");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateGlobalCorrection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalCorrections"] });
      toast.success("Corrección desactivada");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGlobalCorrection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalCorrections"] });
      toast.success("Corrección eliminada");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleVerifyAndActivate = (correctionId: string) => {
    if (!user) {
      toast.error("Debes estar autenticado");
      return;
    }
    verifyAndActivateMutation.mutate({ id: correctionId, userId: user.id });
  };

  const handleDeactivate = (correctionId: string) => {
    deactivateMutation.mutate(correctionId);
  };

  const handleDelete = (correctionId: string) => {
    deleteMutation.mutate(correctionId);
  };

  // Filtrar correcciones por estado
  const pendingCorrections = corrections?.filter((c) => !c.verified) || [];
  const activeCorrections = corrections?.filter((c) => c.verified && c.is_active) || [];
  const inactiveCorrections = corrections?.filter((c) => c.verified && !c.is_active) || [];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Debes iniciar sesión para acceder al panel de administración.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar las correcciones: {queryError instanceof Error ? queryError.message : "Error desconocido"}
            <br />
            <br />
            <strong>Posibles causas:</strong>
            <ul className="list-disc list-inside mt-2">
              <li>La tabla bot_global_corrections no existe. Ejecuta el script SQL: CREAR_TABLA_BOT_CORRECTIONS_GLOBALES.sql</li>
              <li>Problemas de permisos RLS en Supabase</li>
              <li>Error de conexión a la base de datos</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona las correcciones globales del bot que aplican a todos los usuarios
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetch();
            toast.info("Actualizando correcciones...");
          }}
          disabled={isLoading}
          className="ml-4"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pendientes ({pendingCorrections.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Activas ({activeCorrections.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactivas ({inactiveCorrections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <CorrectionsList
            corrections={pendingCorrections}
            isLoading={isLoading}
            onVerifyAndActivate={handleVerifyAndActivate}
            onDelete={handleDelete}
            userId={user.id}
          />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <CorrectionsList
            corrections={activeCorrections}
            isLoading={isLoading}
            onDeactivate={handleDeactivate}
            onDelete={handleDelete}
            userId={user.id}
            showActiveBadge
          />
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          <CorrectionsList
            corrections={inactiveCorrections}
            isLoading={isLoading}
            onVerifyAndActivate={handleVerifyAndActivate}
            onDelete={handleDelete}
            userId={user.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CorrectionsListProps {
  corrections: GlobalCorrection[];
  isLoading: boolean;
  onVerifyAndActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onDelete: (id: string) => void;
  userId: string;
  showActiveBadge?: boolean;
}

function CorrectionsList({
  corrections,
  isLoading,
  onVerifyAndActivate,
  onDeactivate,
  onDelete,
  userId,
  showActiveBadge = false,
}: CorrectionsListProps) {
  if (isLoading) {
    return <div className="text-center py-8">Cargando correcciones...</div>;
  }

  if (corrections.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No hay correcciones en esta categoría</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {corrections.map((correction) => (
        <Card key={correction.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">Corrección #{correction.id.slice(0, 8)}</CardTitle>
                  {showActiveBadge && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Activa
                    </Badge>
                  )}
                  {!correction.verified && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Creada el {new Date(correction.created_at).toLocaleString("es-ES")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                  ❌ Error detectado:
                </h4>
                <p className="text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                  {correction.what_was_wrong}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                  ✅ Corrección:
                </h4>
                <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                  {correction.correct_info}
                </p>
              </div>

              {correction.context && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    📝 Contexto:
                  </h4>
                  <p className="text-sm text-muted-foreground">{correction.context}</p>
                </div>
              )}

              {correction.verification_timestamp && (
                <div className="text-xs text-muted-foreground">
                  Verificada el {new Date(correction.verification_timestamp).toLocaleString("es-ES")}
                </div>
              )}

              <Separator />

              <div className="flex gap-2 flex-wrap">
                {onVerifyAndActivate && !correction.verified && (
                  <Button
                    size="sm"
                    onClick={() => onVerifyAndActivate(correction.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Verificar y Activar
                  </Button>
                )}

                {onDeactivate && correction.is_active && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeactivate(correction.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Desactivar
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar corrección?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La corrección será eliminada permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(correction.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

