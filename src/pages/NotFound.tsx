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
        <h1 className="mb-2 font-display text-4xl font-bold tracking-tight">
          <span className="gradient-text">404</span>
        </h1>
        <p className="mb-6 text-muted-foreground">Seite nicht gefunden.</p>
        <a
          href="/"
          className="text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent/90"
        >
          Zurück zur Buchhaltung
        </a>
      </div>
    </div>
  );
};

export default NotFound;
