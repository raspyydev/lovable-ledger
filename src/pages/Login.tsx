import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

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

function passwordStrength(password: string): { level: number; label: string } {
  if (!password) return { level: 0, label: "" };
  let pts = 0;
  if (password.length >= 6) pts += 1;
  if (password.length >= 10) pts += 1;
  if (/\d/.test(password)) pts += 1;
  if (/[^A-Za-z0-9]/.test(password)) pts += 1;
  const level = Math.min(pts, 4);
  const labels = ["", "Ausbaufähig", "Okay", "Gut", "Stark"];
  return { level, label: labels[level] ?? "" };
}

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

function PasswordStrength({ password }: { password: string }) {
  const { level, label } = useMemo(() => passwordStrength(password), [password]);
  if (!password) return null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full bg-muted transition-colors",
              i <= level && level === 1 && "bg-amber-500/80",
              i <= level && level === 2 && "bg-amber-400/90",
              i <= level && level === 3 && "bg-emerald-500/70",
              i <= level && level === 4 && "bg-emerald-500",
            )}
            initial={false}
            animate={{ scaleY: i <= level ? 1 : 0.6, opacity: i <= level ? 1 : 0.35 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        ))}
      </div>
      {label ? (
        <p className="text-[11px] text-muted-foreground">
          Passwortstärke: <span className="font-medium text-foreground">{label}</span>
        </p>
      ) : null}
    </div>
  );
}

export default function Login() {
  const { signIn, signUp, isConfigured } = useAuth();
  const reduceMotion = useReducedMotion();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState<"signIn" | "signUp" | null>(null);
  const [showPwIn, setShowPwIn] = useState(false);
  const [showPwUp, setShowPwUp] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [shakeId, setShakeId] = useState(0);

  const signInForm = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupPassword = signUpForm.watch("password");

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 32 };

  async function onSignIn(data: CredentialsForm) {
    setSubmitError(null);
    setPending("signIn");
    const { error } = await signIn(data.email, data.password);
    setPending(null);
    if (error) {
      setSubmitError(error.message);
      setShakeId((n) => n + 1);
    }
  }

  async function onSignUp(data: CredentialsForm) {
    setSubmitError(null);
    setPending("signUp");
    const { error } = await signUp(data.email, data.password);
    setPending(null);
    if (error) {
      setSubmitError(error.message);
      setShakeId((n) => n + 1);
      return;
    }
    toast.success("Konto erstellt. Bei aktivierter E-Mail-Bestätigung bitte Postfach prüfen.");
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
        {/* Brand column */}
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

        {/* Form column */}
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
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => {
                    setActiveTab(v as "signin" | "signup");
                    setSubmitError(null);
                    signInForm.clearErrors();
                    signUpForm.clearErrors();
                  }}
                  className="w-full"
                >
                  <CardHeader className="space-y-1 border-b border-border/40 bg-muted/20 px-6 pb-4 pt-6">
                    <CardTitle className="text-xl font-semibold tracking-tight">
                      {activeTab === "signin" ? "Anmelden" : "Konto anlegen"}
                    </CardTitle>
                    <CardDescription>
                      {activeTab === "signin"
                        ? "Gib deine Zugangsdaten ein — wir holen dich sofort ins Dashboard."
                        : "Neu hier? In Sekunden startklar. Danach kannst du direkt buchen."}
                    </CardDescription>
                    <TabsList className="mt-5 grid h-11 w-full grid-cols-2 gap-1 rounded-xl border border-border/40 bg-muted/40 p-1 shadow-inner">
                      <TabsTrigger
                        value="signin"
                        className="rounded-lg text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      >
                        Anmelden
                      </TabsTrigger>
                      <TabsTrigger
                        value="signup"
                        className="rounded-lg text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      >
                        Registrieren
                      </TabsTrigger>
                    </TabsList>
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

                    <TabsContent value="signin" className="mt-0 space-y-5 outline-none" forceMount>
                      <form
                        className={cn("space-y-5", activeTab !== "signin" && "hidden")}
                        onSubmit={signInForm.handleSubmit(onSignIn)}
                        noValidate
                      >
                        <FieldBlock
                          id="signin-email"
                          label="E-Mail"
                          type="email"
                          autoComplete="email"
                          error={signInForm.formState.errors.email?.message}
                          icon={Mail}
                          register={signInForm.register}
                          name="email"
                          showPassword={showPwIn}
                          onTogglePassword={() => setShowPwIn((v) => !v)}
                          disabled={pending !== null}
                        />
                        <FieldBlock
                          id="signin-password"
                          label="Passwort"
                          type="password"
                          autoComplete="current-password"
                          error={signInForm.formState.errors.password?.message}
                          icon={Lock}
                          register={signInForm.register}
                          name="password"
                          showPassword={showPwIn}
                          onTogglePassword={() => setShowPwIn((v) => !v)}
                          disabled={pending !== null}
                        />
                        <Button
                          type="submit"
                          disabled={pending !== null}
                          className="group relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-md transition-all hover:shadow-lg hover:brightness-[1.03] active:scale-[0.99]"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2 font-medium">
                            {pending === "signIn" ? (
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
                    </TabsContent>

                    <TabsContent value="signup" className="mt-0 space-y-5 outline-none" forceMount>
                      <form
                        className={cn("space-y-5", activeTab !== "signup" && "hidden")}
                        onSubmit={signUpForm.handleSubmit(onSignUp)}
                        noValidate
                      >
                        <FieldBlock
                          id="signup-email"
                          label="E-Mail"
                          type="email"
                          autoComplete="email"
                          error={signUpForm.formState.errors.email?.message}
                          icon={Mail}
                          register={signUpForm.register}
                          name="email"
                          showPassword={showPwUp}
                          onTogglePassword={() => setShowPwUp((v) => !v)}
                          disabled={pending !== null}
                        />
                        <div>
                          <FieldBlock
                            id="signup-password"
                            label="Passwort"
                            type="password"
                            autoComplete="new-password"
                            error={signUpForm.formState.errors.password?.message}
                            icon={Lock}
                            register={signUpForm.register}
                            name="password"
                            showPassword={showPwUp}
                            onTogglePassword={() => setShowPwUp((v) => !v)}
                            disabled={pending !== null}
                          />
                          <PasswordStrength password={signupPassword} />
                        </div>
                        <Button
                          type="submit"
                          variant="secondary"
                          disabled={pending !== null}
                          className="h-11 w-full rounded-xl border border-border/60 bg-secondary/80 font-medium shadow-sm backdrop-blur-sm transition-all hover:bg-secondary active:scale-[0.99]"
                        >
                          {pending === "signUp" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Kostenlos registrieren"
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
                      Auth läuft über Supabase — bitte in deinem Projekt Datenschutz &amp; AGB wie gewohnt abbilden.
                    </p>
                  </CardContent>
                </Tabs>
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
