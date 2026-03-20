import { useEffect, useState, type ReactNode } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, useAnimation, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const credentialsSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail eingeben."),
  password: z.string().min(6, "Mindestens 6 Zeichen."),
});

type CredentialsForm = z.infer<typeof credentialsSchema>;

const features = [
  { icon: TrendingUp, title: "Einnahmen & Ausgaben", desc: "Alles an einem Ort, klar strukturiert." },
  { icon: PieChart, title: "Steuer-Rücklagen", desc: "Schätzungen auf einen Blick — ohne Tabellenchaos." },
  { icon: Sparkles, title: "Schnell & ruhig", desc: "Weniger Klicks, mehr Überblick für dein Studio." },
] as const;

function LoginBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.45) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.45) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
      <div
        className="absolute -left-[20%] -top-[30%] h-[70vmin] w-[70vmin] rounded-full bg-primary/15 blur-[100px] animate-login-drift"
      />
      <div
        className="absolute -right-[25%] top-[10%] h-[55vmin] w-[55vmin] rounded-full bg-violet-500/20 blur-[90px] dark:bg-violet-400/10 animate-login-drift-delayed"
      />
      <div
        className="absolute bottom-[-20%] left-[30%] h-[45vmin] w-[45vmin] rounded-full bg-emerald-500/15 blur-[80px] dark:bg-emerald-400/10 animate-login-drift-slow"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  );
}

type FieldBlockProps = {
  id: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  error?: string;
  icon: typeof Mail;
  register: UseFormRegister<CredentialsForm>;
  name: "email" | "password";
  showPassword: boolean;
  onTogglePassword: () => void;
  disabled: boolean;
};

function FieldBlock({
  id,
  label,
  type,
  autoComplete,
  error,
  icon: Icon,
  register,
  name,
  showPassword,
  onTogglePassword,
  disabled,
}: FieldBlockProps) {
  const isPassword = name === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="relative group">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70 transition-colors group-focus-within:text-foreground"
          aria-hidden
        />
        <Input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          disabled={disabled}
          className={cn(
            "h-11 rounded-xl border-border/60 bg-background/60 pl-10 backdrop-blur-sm transition-shadow",
            "placeholder:text-muted-foreground/60",
            "focus-visible:border-primary/40 focus-visible:ring-primary/20",
            isPassword && "pr-11",
          )}
          {...register(name)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            disabled={disabled}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key={error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs font-medium text-destructive"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function Login() {
  const { signIn, isConfigured } = useAuth();
  const reduceMotion = useReducedMotion();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeId, setShakeId] = useState(0);

  const form = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 32 };

  async function onSubmit(data: CredentialsForm) {
    setSubmitError(null);
    setPending(true);
    const { error } = await signIn(data.email, data.password);
    setPending(false);
    if (error) {
      setSubmitError(error.message);
      setShakeId((n) => n + 1);
    }
  }

  if (!isConfigured) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <LoginBackdrop />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={spring}
            className="w-full max-w-md"
          >
            <Card className="border-border/50 bg-card/75 shadow-2xl backdrop-blur-xl">
              <CardHeader className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
                  <BookOpen className="h-7 w-7" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-semibold tracking-tight">Konfiguration fehlt</CardTitle>
                  <CardDescription className="text-pretty pt-2 text-sm leading-relaxed">
                    Lege{" "}
                    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">VITE_SUPABASE_URL</code> und{" "}
                    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                      VITE_SUPABASE_PUBLISHABLE_KEY
                    </code>{" "}
                    in der Umgebung an und starte den Dev-Server neu.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <LoginBackdrop />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <motion.aside
          className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] lg:flex-col lg:justify-between lg:border-r lg:border-border/40 lg:bg-card/20 lg:px-12 lg:py-14 xl:px-16"
          initial={reduceMotion ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spring, delay: reduceMotion ? 0 : 0.05 }}
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight" style={{ letterSpacing: "-0.03em" }}>
                  Ledger
                </p>
                <p className="text-xs text-muted-foreground">Studio-Buchhaltung, die mitdenkt</p>
              </div>
            </div>

            <h2
              className="mt-14 max-w-md text-4xl font-semibold leading-[1.1] tracking-tight text-foreground xl:text-[2.75rem]"
              style={{ letterSpacing: "-0.04em" }}
            >
              Deine Zahlen.
              <br />
              <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent dark:from-white dark:via-white/90 dark:to-white/50">
                Dein ruhiger Kopf.
              </span>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Melde dich an und spring direkt in Einnahmen, Ausgaben und Übersichten — mit einem Look, der sich gut
              anfühlt, nicht nach Excel-Flashback.
            </p>
          </div>

          <ul className="mt-12 space-y-5">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.li
                key={title}
                className="flex gap-4"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.12 + i * 0.06 }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/50 shadow-sm backdrop-blur-sm">
                  <Icon className="h-4 w-4 text-foreground/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Supabase Auth · verschlüsselte Verbindung · Session sicher im Browser</span>
          </div>
        </motion.aside>

        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 lg:py-14">
          <motion.div
            className="mb-8 flex w-full max-w-[420px] items-center gap-3 lg:hidden"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                Ledger
              </p>
              <p className="text-xs text-muted-foreground">Willkommen zurück</p>
            </div>
          </motion.div>

          <motion.div
            className="w-full max-w-[420px]"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: reduceMotion ? 0 : 0.08 }}
          >
            <ShakeWrapper shakeId={shakeId} reduceMotion={Boolean(reduceMotion)}>
              <Card className="relative overflow-hidden border-border/50 bg-card/80 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
                <CardHeader className="space-y-1 border-b border-border/40 bg-muted/20 px-6 pb-5 pt-6">
                  <CardTitle className="text-xl font-semibold tracking-tight">Anmelden</CardTitle>
                  <CardDescription>
                    Gib deine Zugangsdaten ein — wir holen dich sofort ins Dashboard.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-6 pb-8 pt-6">
                  <AnimatePresence mode="wait">
                    {submitError ? (
                      <motion.div
                        key={submitError}
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 4 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                      >
                        <Alert
                          variant="destructive"
                          className="border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/15"
                        >
                          <AlertDescription className="text-sm font-medium">{submitError}</AlertDescription>
                        </Alert>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                    <FieldBlock
                      id="login-email"
                      label="E-Mail"
                      type="email"
                      autoComplete="email"
                      error={form.formState.errors.email?.message}
                      icon={Mail}
                      register={form.register}
                      name="email"
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword((v) => !v)}
                      disabled={pending}
                    />
                    <FieldBlock
                      id="login-password"
                      label="Passwort"
                      type="password"
                      autoComplete="current-password"
                      error={form.formState.errors.password?.message}
                      icon={Lock}
                      register={form.register}
                      name="password"
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword((v) => !v)}
                      disabled={pending}
                    />
                    <Button
                      type="submit"
                      disabled={pending}
                      className="group relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-md transition-all hover:shadow-lg hover:brightness-[1.03] active:scale-[0.99]"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2 font-medium">
                        {pending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Weiter zum Dashboard
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </Button>
                  </form>

                  <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
                    Auth läuft über Supabase — neue Konten legst du im Supabase-Dashboard an.
                  </p>
                </CardContent>
              </Card>
            </ShakeWrapper>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ShakeWrapper({
  children,
  shakeId,
  reduceMotion,
}: {
  children: ReactNode;
  shakeId: number;
  reduceMotion: boolean;
}) {
  const controls = useAnimation();

  useEffect(() => {
    if (shakeId === 0 || reduceMotion) return;
    void controls.start({
      x: [0, -7, 7, -5, 5, 0],
      transition: { duration: 0.45, ease: "easeInOut" },
    });
  }, [shakeId, reduceMotion, controls]);

  return (
    <motion.div animate={controls} initial={{ x: 0 }}>
      {children}
    </motion.div>
  );
}
