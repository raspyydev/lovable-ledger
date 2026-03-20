import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownUp,
  BarChart3,
  BookOpen,
  CalendarDays,
  Landmark,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  PieChart,
  Sparkles,
  Tag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useBookkeepingStore } from "@/lib/store";
import type { TabId } from "@/lib/types";
import EinnahmenTab from "@/components/buchhaltung/EinnahmenTab";
import AusgabenTab from "@/components/buchhaltung/AusgabenTab";
import KategorienTab from "@/components/buchhaltung/KategorienTab";
import ZusammenfassungTab from "@/components/buchhaltung/ZusammenfassungTab";
import MonatsuebersichtTab from "@/components/buchhaltung/MonatsuebersichtTab";

const navItems: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: "einnahmen", label: "Einnahmen", icon: BookOpen },
  { id: "ausgaben", label: "Ausgaben", icon: ArrowDownUp },
  { id: "kategorien", label: "Kategorien", icon: Tag },
  { id: "zusammenfassung", label: "Überblick", icon: PieChart },
  { id: "monatsuebersicht", label: "Monate", icon: BarChart3 },
];

const pageMeta: Record<TabId, { title: string; subtitle: string }> = {
  einnahmen: {
    title: "Einnahmen · Umsatz",
    subtitle: "Kleinunternehmer-Umsatz erfassen — Autopilot summiert oben mit.",
  },
  ausgaben: {
    title: "Ausgaben",
    subtitle: "Betriebsausgaben mit Netto, USt und Brutto im Blick.",
  },
  kategorien: {
    title: "Kategorien",
    subtitle: "Dein Co-Pilot bleibt sortiert — Einnahmen und Ausgaben getrennt.",
  },
  zusammenfassung: {
    title: "Co-Pilot · Überblick",
    subtitle: "Gewinn, ESt-Rücklage und Verfügbarkeit auf einen Blick.",
  },
  monatsuebersicht: {
    title: "Monats-Autopilot",
    subtitle: "Einnahmen und Ausgaben über das Jahr — visuell und tabellarisch.",
  },
};

function SidebarNavPanel({
  activeTab,
  onSelect,
  user,
  onSignOut,
  afterNavigate,
  backupSending,
  onManualBackup,
}: {
  activeTab: TabId;
  onSelect: (id: TabId) => void;
  user: User | null;
  onSignOut: () => void;
  afterNavigate?: () => void;
  backupSending: boolean;
  onManualBackup: () => void;
}) {
  const go = (id: TabId) => {
    onSelect(id);
    afterNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border/80 px-5 py-4 lg:px-6 lg:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm lg:h-12 lg:w-12">
            <BookOpen className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-base font-semibold tracking-tight lg:text-lg">Better Studio</p>
            <p className="truncate text-sm text-sidebar-foreground/65">Buchhaltung</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 lg:px-4 lg:py-5">
        <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
          Navigation
        </p>
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-base font-medium transition-colors lg:py-3",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border/80 p-4 lg:p-5">
        {user?.email ? (
          <div className="mb-3 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/30 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
              Angemeldet
            </p>
            <p className="mt-1 truncate text-sm font-medium">{user.email}</p>
          </div>
        ) : null}
        <button
          type="button"
          disabled={backupSending || !user?.email}
          onClick={() => onManualBackup()}
          className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-base font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 lg:py-3"
        >
          <Mail className="h-5 w-5 shrink-0" strokeWidth={2} />
          {backupSending ? "Backup wird gesendet …" : "Backup per E-Mail"}
        </button>
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-base font-medium text-sidebar-foreground transition-colors hover:bg-destructive/12 hover:text-destructive lg:py-3"
        >
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
          Abmelden
        </button>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  valueClass,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  valueClass: string;
  icon: typeof TrendingUp;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50 bg-card/90 p-3.5 sm:p-4",
        "shadow-sm transition-shadow duration-200 hover:border-border/70 hover:shadow",
      )}
    >
      <div className="pointer-events-none absolute -right-2 -top-2 opacity-[0.05]">
        <Icon className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={1.25} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-mono-nums text-lg font-semibold tabular-nums sm:text-xl", valueClass)}>{value}</p>
      {hint ? <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>("einnahmen");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [backupSending, setBackupSending] = useState(false);
  const store = useBookkeepingStore();
  const { signOut, user, session } = useAuth();

  const requestManualBackup = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      toast.error("Nicht angemeldet.");
      return;
    }
    setBackupSending(true);
    try {
      const res = await fetch("/api/backup/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Anfrage fehlgeschlagen (${res.status})`);
      }
      toast.success("Backup wurde an deine E-Mail gesendet.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
      toast.error(msg);
    } finally {
      setBackupSending(false);
    }
  }, [session?.access_token]);

  const meta = pageMeta[activeTab];

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("de-DE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const dateLong = useMemo(
    () =>
      new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  if (store.loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-muted/40 p-4">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card px-8 py-10 shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 animate-pulse text-primary" />
          </div>
          <p className="text-center text-sm font-medium">Wird geladen …</p>
          <div className="h-1 w-36 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/5 animate-pulse rounded-full bg-primary/60" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-svh min-h-0 w-full overflow-hidden bg-background">
      {/* Desktop: fixed sidebar, no collapse / rail */}
      <aside
        className="hidden h-svh w-[18rem] shrink-0 flex-col border-r border-sidebar-border md:flex lg:w-[20rem]"
        aria-label="Hauptnavigation"
      >
        <SidebarNavPanel
          activeTab={activeTab}
          onSelect={setActiveTab}
          user={user}
          onSignOut={signOut}
          backupSending={backupSending}
          onManualBackup={() => void requestManualBackup()}
        />
      </aside>

      {/* Mobile: sheet menu only */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="flex w-[min(20.5rem,calc(100vw-2rem))] max-w-none flex-col border-sidebar-border bg-sidebar p-0 [&>button]:right-3 [&>button]:top-3 sm:w-[min(22rem,calc(100vw-2rem))]"
        >
          <SidebarNavPanel
            activeTab={activeTab}
            onSelect={setActiveTab}
            user={user}
            onSignOut={signOut}
            afterNavigate={() => setMobileNavOpen(false)}
            backupSending={backupSending}
            onManualBackup={() => void requestManualBackup()}
          />
        </SheetContent>
      </Sheet>

      <div className="dashboard-canvas flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-background/90 px-4 py-3.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 sm:gap-4 sm:px-5 sm:py-4 md:px-6 md:py-[1.125rem]">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Menü öffnen"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Separator orientation="vertical" className="hidden h-10 md:block" />

          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex md:h-11 md:w-11">
              <LayoutDashboard className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Dashboard
              </p>
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">{meta.title}</h1>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground sm:line-clamp-1 md:text-base">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2.5 rounded-xl border border-border/50 bg-card/90 px-3 py-2 text-sm text-muted-foreground shadow-sm sm:flex md:gap-3 md:px-4 md:py-2.5 md:text-base">
            <CalendarDays className="h-5 w-5 shrink-0 text-primary/80 md:h-6 md:w-6" />
            <span className="hidden font-medium text-foreground/90 lg:inline">{dateLong}</span>
            <span className="font-medium text-foreground/90 lg:hidden">{dateLabel}</span>
          </div>
        </header>

        {/* Single scroll region: only scrolls when content exceeds viewport */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <div className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-4 sm:py-5 md:px-5 md:py-6 lg:px-6">
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3"
            >
              <KpiCard
                label="Gewinn"
                value={`${store.gewinn >= 0 ? "+" : ""}${store.gewinn.toFixed(2)} €`}
                valueClass={store.gewinn >= 0 ? "text-success" : "text-destructive"}
                icon={TrendingUp}
                hint="Einnahmen − Ausgaben (Brutto)"
              />
              <KpiCard
                label="Rücklage ESt (ca.)"
                value={`−${store.steuerRuecklage.toFixed(2)} €`}
                valueClass="text-muted-foreground"
                icon={Landmark}
                hint="Co-Pilot-Schätzung"
              />
              <KpiCard
                label="Verfügbar (Co-Pilot)"
                value={`${store.verfuegbarPrivat >= 0 ? "+" : ""}${store.verfuegbarPrivat.toFixed(2)} €`}
                valueClass={store.verfuegbarPrivat >= 0 ? "text-success" : "text-destructive"}
                icon={Wallet}
                hint="Nach ESt-Rücklage"
              />
            </motion.div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className={cn(
                "rounded-xl border border-border/50 bg-card/90 p-3.5 shadow-sm sm:p-4 md:p-5",
                "dashboard-content-shell",
              )}
            >
              {activeTab === "einnahmen" && (
                <EinnahmenTab
                  einnahmen={store.einnahmen}
                  kategorien={store.kategorien}
                  onAdd={store.addEinnahme}
                  onUpdate={store.updateEinnahme}
                  onDelete={store.deleteEinnahme}
                  total={store.totalEinnahmen}
                />
              )}
              {activeTab === "ausgaben" && (
                <AusgabenTab
                  ausgaben={store.ausgaben}
                  kategorien={store.kategorien}
                  onAdd={store.addAusgabe}
                  onUpdate={store.updateAusgabe}
                  onDelete={store.deleteAusgabe}
                  totalBrutto={store.totalAusgabenBrutto}
                  totalNetto={store.totalAusgabenNetto}
                />
              )}
              {activeTab === "kategorien" && (
                <KategorienTab kategorien={store.kategorien} onAdd={store.addKategorie} onDelete={store.deleteKategorie} />
              )}
              {activeTab === "zusammenfassung" && (
                <ZusammenfassungTab
                  totalEinnahmen={store.totalEinnahmen}
                  totalAusgabenBrutto={store.totalAusgabenBrutto}
                  gewinn={store.gewinn}
                  steuerRuecklage={store.steuerRuecklage}
                  verfuegbarPrivat={store.verfuegbarPrivat}
                  einkommensteuerRuecklageProzent={store.einkommensteuerRuecklageProzent}
                />
              )}
              {activeTab === "monatsuebersicht" && <MonatsuebersichtTab monthlyData={store.getMonthlyData()} />}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
