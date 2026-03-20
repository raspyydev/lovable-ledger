import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownUp,
  BarChart3,
  BookOpen,
  Landmark,
  LogOut,
  PieChart,
  Sparkles,
  Tag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
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
        "relative overflow-hidden rounded-xl border border-border/50 bg-card/90 p-5 shadow-sm",
        "bg-gradient-to-br from-card via-card to-muted/20 backdrop-blur-sm",
        "transition-all duration-300 hover:border-border hover:shadow-md",
      )}
    >
      <div className="pointer-events-none absolute -right-2 -top-2 opacity-[0.06]">
        <Icon className="h-20 w-20" strokeWidth={1.25} />
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-mono-nums text-2xl font-semibold tracking-tight tabular-nums", valueClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DashboardBody() {
  const [activeTab, setActiveTab] = useState<TabId>("einnahmen");
  const store = useBookkeepingStore();
  const { signOut, user } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const go = (id: TabId) => {
    setActiveTab(id);
    if (isMobile) setOpenMobile(false);
  };

  const meta = pageMeta[activeTab];

  if (store.loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/80 px-10 py-12 shadow-lg backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 animate-pulse text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Dashboard wird geladen …</p>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/60" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border/60 px-3 py-4">
          <div className="flex items-center gap-3 rounded-lg px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="grid min-w-0 flex-1 leading-none group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold tracking-tight">Better Studio</span>
              <span className="truncate text-xs text-sidebar-foreground/65">Buchhaltung</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      onClick={() => go(item.id)}
                      tooltip={item.label}
                      className="h-9"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="gap-2 p-3">
          {user?.email ? (
            <div className="truncate rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              {user.email}
            </div>
          ) : null}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => void signOut()}
                tooltip="Abmelden"
                className="text-sidebar-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span>Abmelden</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-muted/25">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-6" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold tracking-tight text-foreground md:text-base">{meta.title}</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{meta.subtitle}</p>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
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
                hint="Co-Pilot-Schätzung auf den Gewinn"
              />
              <KpiCard
                label="Verfügbar (Co-Pilot)"
                value={`${store.verfuegbarPrivat >= 0 ? "+" : ""}${store.verfuegbarPrivat.toFixed(2)} €`}
                valueClass={store.verfuegbarPrivat >= 0 ? "text-success" : "text-destructive"}
                icon={Wallet}
                hint="Nach ESt-Rücklage — weitere Fixkosten extra planen"
              />
            </motion.div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
              className={cn(
                "rounded-2xl border border-border/50 bg-card/70 p-5 shadow-sm backdrop-blur-sm",
                "md:p-6 lg:p-8",
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
        </div>
      </SidebarInset>
    </>
  );
}

export default function Index() {
  return (
    <SidebarProvider defaultOpen>
      <DashboardBody />
    </SidebarProvider>
  );
}
