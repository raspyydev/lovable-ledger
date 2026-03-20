import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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

export default function Login() {
  const { signIn, signUp, isConfigured } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState<"signIn" | "signUp" | null>(null);

  const signInForm = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSignIn(data: CredentialsForm) {
    setSubmitError(null);
    setPending("signIn");
    const { error } = await signIn(data.email, data.password);
    setPending(null);
    if (error) setSubmitError(error.message);
  }

  async function onSignUp(data: CredentialsForm) {
    setSubmitError(null);
    setPending("signUp");
    const { error } = await signUp(data.email, data.password);
    setPending(null);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    toast.success("Konto erstellt. Bei aktivierter E-Mail-Bestätigung bitte Postfach prüfen.");
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-elevated border-border/60">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl tracking-tight">Konfiguration fehlt</CardTitle>
            <CardDescription>
              Lege <code className="text-xs bg-muted px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code> und{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> in der
              Umgebung an und starte den Dev-Server neu.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-lg font-medium tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
            Ledger
          </p>
          <p className="text-xs text-muted-foreground">Anmelden, um fortzufahren</p>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-elevated border-border/60">
        <Tabs defaultValue="signin" className="w-full">
          <CardHeader className="pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Anmelden</TabsTrigger>
              <TabsTrigger value="signup">Registrieren</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="signin" className="mt-0 space-y-4">
              <form
                className="space-y-4"
                onSubmit={signInForm.handleSubmit(onSignIn)}
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="signin-email">E-Mail</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    {...signInForm.register("email")}
                  />
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Passwort</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    {...signInForm.register("password")}
                  />
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={pending !== null}>
                  {pending === "signIn" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Anmelden"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0 space-y-4">
              <form
                className="space-y-4"
                onSubmit={signUpForm.handleSubmit(onSignUp)}
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-Mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    {...signUpForm.register("email")}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Passwort</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    {...signUpForm.register("password")}
                  />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" variant="secondary" disabled={pending !== null}>
                  {pending === "signUp" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Konto anlegen"}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
