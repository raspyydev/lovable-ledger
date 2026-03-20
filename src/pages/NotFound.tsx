import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: unbekannte Route", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="text-center max-w-md">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
          Better Studio Buchhaltung
        </p>
        <h1 className="mb-2 text-4xl font-semibold tracking-tight">404</h1>
        <p className="mb-6 text-muted-foreground">
          Diese Seite gibt es in Better Studio nicht. Der Autopilot findet hier keine Route.
        </p>
        <a
          href="/"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/90"
        >
          Zurück zur Buchhaltung
        </a>
      </div>
    </div>
  );
};

export default NotFound;
