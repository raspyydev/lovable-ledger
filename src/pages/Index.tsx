import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownUp,
  BarChart3,
  BookOpen,
  CalendarDays,
  Landmark,
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

const pageMeta: Record<TabId, { title: string; subtitle?: string }> = {
  einnahmen: { title: "Einnahmen" },
  ausgaben: { title: "Ausgaben" },
  kategorien: { title: "Kategorien" },
  zusammenfassung: { title: "Überblick" },
  monatsuebersicht: { title: "Monate" },
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
      <div className="border-b border-sidebar-border/60 px-5 py-5 lg:px-6 lg:py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-accent/25 ring-1 ring-white/10">
            <BookOpen className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-[15px] font-bold tracking-tight">Better Studio</p>
            <p className="truncate text-xs text-sidebar-foreground/55">Buchhaltung</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 lg:px-4">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/35">
          Navigation
        </p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-accent/20 ring-1 ring-white/10"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border/60 p-4 lg:p-5">
        {user?.email ? (
          <div className="mb-3 rounded-xl border border-sidebar-border/30 bg-sidebar-accent/20 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/35">
              Angemeldet
            </p>
            <p className="mt-1 truncate text-sm font-medium text-sidebar-foreground/90">{user.email}</p>
          </div>
        ) : null}
        <button
          type="button"
          disabled={backupSending || !user?.email}
          onClick={() => onManualBackup()}
          className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <Mail className="h-4.5 w-4.5 shrink-0" strokeWidth={1.75} />
          {backupSending ? "Backup wird gesendet …" : "Backup per E-Mail"}
        </button>
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" strokeWidth={1.75} />
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
        "group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-4 sm:p-5",
        "shadow-card card-hover-studio transition-all duration-300 ease-studio hover:-translate-y-0.5 hover:shadow-elevated",
      )}
    >
      <div className="pointer-events-none absolute -right-3 -top-3 opacity-[0.04] transition-opacity duration-300 group-hover:opacity-[0.07]">
        <Icon className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1} />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={cn("mt-3 font-mono-nums text-xl font-bold tabular-nums sm:text-2xl", valueClass)}>{value}</p>
      {hint ? <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{hint}</p> : null}
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
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card px-8 py-10 shadow-md ring-1 ring-accent/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/20">
            <Sparkles className="h-6 w-6 animate-pulse text-accent" />
          </div>
          <p className="text-center text-sm font-medium">Wird geladen …</p>
          <div className="h-1 w-36 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/5 animate-pulse rounded-full bg-accent/70" />
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
        <header className="flex shrink-0 items-center gap-3 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 sm:gap-4 sm:px-6 sm:py-3.5 md:px-8 md:py-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-lg md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Menü öffnen"
          >
            <Menu className="h-4.5 w-4.5" />
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-xl">{meta.title}</h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-sm shadow-sm sm:flex md:gap-2.5 md:px-3.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="hidden text-sm font-medium text-muted-foreground lg:inline">{dateLong}</span>
            <span className="text-sm font-medium text-muted-foreground lg:hidden">{dateLabel}</span>
          </div>
        </header>

        <main className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 md:px-8 md:py-7 lg:px-10">
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
              />
              <KpiCard
                label="ESt-Rücklage"
                value={`−${store.steuerRuecklage.toFixed(2)} €`}
                valueClass="text-muted-foreground"
                icon={Landmark}
              />
              <KpiCard
                label="Verfügbar"
                value={`${store.verfuegbarPrivat >= 0 ? "+" : ""}${store.verfuegbarPrivat.toFixed(2)} €`}
                valueClass={store.verfuegbarPrivat >= 0 ? "text-success" : "text-destructive"}
                icon={Wallet}
              />
            </motion.div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
              className={cn(
                "rounded-2xl border border-border/40 bg-card p-4 sm:p-5 md:p-6",
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
                  onDeleteAll={store.deleteAllEinnahmen}
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
              {activeTab === "monatsuebersicht" && (
                <MonatsuebersichtTab
                  year={store.monatsBerichtsjahr}
                  monthlyData={store.getMonthlyData(store.monatsBerichtsjahr)}
                />
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
