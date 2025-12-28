import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Stores from "./pages/Stores";
import StoreDetail from "./pages/StoreDetail";
import Discussions from "./pages/Discussions";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { ComingSoon } from "./components/ComingSoon";
import { BETA_MODE } from "./config/constants";

const queryClient = new QueryClient();

// En modo beta, solo permitimos acceso a Home (con chat) y reset-password
// El resto muestra "Próximamente"
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Home /> },
      { 
        path: "/products", 
        element: BETA_MODE ? (
          <ComingSoon 
            title="Productos"
            description="Estamos preparando un catálogo completo de productos de belleza para ti."
            feature="Próximamente: Catálogo completo con análisis CosIng"
          />
        ) : <Products />
      },
      { 
        path: "/products/:id", 
        element: BETA_MODE ? (
          <ComingSoon 
            title="Detalle de Producto"
            description="Pronto podrás ver información detallada de cada producto."
          />
        ) : <ProductDetail />
      },
      { 
        path: "/stores", 
        element: BETA_MODE ? (
          <ComingSoon 
            title="Tiendas"
            description="Estamos trabajando en un directorio de tiendas especializadas."
            feature="Próximamente: Encuentra las mejores tiendas cerca de ti"
          />
        ) : <Stores />
      },
      { 
        path: "/stores/:id", 
        element: BETA_MODE ? (
          <ComingSoon 
            title="Detalle de Tienda"
            description="Pronto podrás ver información detallada de cada tienda."
          />
        ) : <StoreDetail />
      },
      { 
        path: "/discussions", 
        element: BETA_MODE ? (
          <ComingSoon 
            title="Discusiones"
            description="Estamos creando una comunidad donde podrás compartir experiencias."
            feature="Próximamente: Comunidad de usuarios y expertos"
          />
        ) : <Discussions />
      },
      { path: "*", element: <NotFound /> }
    ]
  },
  {
    path: "/reset-password",
    element: <ResetPassword />
  }
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider
        router={router}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
