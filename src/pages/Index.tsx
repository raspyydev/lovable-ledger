import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowDownUp, Tag, PieChart, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useBookkeepingStore } from '@/lib/store';
import { TabId } from '@/lib/types';
import EinnahmenTab from '@/components/ledger/EinnahmenTab';
import AusgabenTab from '@/components/ledger/AusgabenTab';
import KategorienTab from '@/components/ledger/KategorienTab';
import ZusammenfassungTab from '@/components/ledger/ZusammenfassungTab';
import MonatsuebersichtTab from '@/components/ledger/MonatsuebersichtTab';

const tabs: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: 'einnahmen', label: 'Einnahmen', icon: BookOpen },
  { id: 'ausgaben', label: 'Ausgaben', icon: ArrowDownUp },
  { id: 'kategorien', label: 'Kategorien', icon: Tag },
  { id: 'zusammenfassung', label: 'Zusammenfassung', icon: PieChart },
  { id: 'monatsuebersicht', label: 'Monatsübersicht', icon: BarChart3 },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>('einnahmen');
  const store = useBookkeepingStore();
  const { signOut } = useAuth();

  if (store.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-medium tracking-tight text-foreground" style={{ letterSpacing: '-0.02em' }}>Ledger</h1>
              <p className="text-[11px] text-muted-foreground">Finanzen auf Autopilot</p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-right">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Gewinn</p>
              <p className={`text-xl font-mono-nums font-medium tracking-tight ${store.gewinn >= 0 ? 'text-success' : 'text-destructive'}`}>
                {store.gewinn >= 0 ? '+' : ''}{store.gewinn.toFixed(2)} €
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Rücklage ESt (ca.)</p>
              <p className="text-lg font-mono-nums font-medium tracking-tight text-muted-foreground">
                −{store.steuerRuecklage.toFixed(2)} €
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Verfügbar</p>
              <p className={`text-xl font-mono-nums font-medium tracking-tight ${store.verfuegbarPrivat >= 0 ? 'text-success' : 'text-destructive'}`}>
                {store.verfuegbarPrivat >= 0 ? '+' : ''}{store.verfuegbarPrivat.toFixed(2)} €
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => void signOut()}
                  aria-label="Abmelden"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Abmelden</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-border/50 bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ease-ledger whitespace-nowrap
                  ${activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        >
          {activeTab === 'einnahmen' && (
            <EinnahmenTab einnahmen={store.einnahmen} kategorien={store.kategorien}
              onAdd={store.addEinnahme} onUpdate={store.updateEinnahme} onDelete={store.deleteEinnahme} total={store.totalEinnahmen} />
          )}
          {activeTab === 'ausgaben' && (
            <AusgabenTab ausgaben={store.ausgaben} kategorien={store.kategorien}
              onAdd={store.addAusgabe} onUpdate={store.updateAusgabe} onDelete={store.deleteAusgabe}
              totalBrutto={store.totalAusgabenBrutto} totalNetto={store.totalAusgabenNetto} />
          )}
          {activeTab === 'kategorien' && (
            <KategorienTab kategorien={store.kategorien} onAdd={store.addKategorie} onDelete={store.deleteKategorie} />
          )}
          {activeTab === 'zusammenfassung' && (
            <ZusammenfassungTab
              totalEinnahmen={store.totalEinnahmen}
              totalAusgabenBrutto={store.totalAusgabenBrutto}
              gewinn={store.gewinn}
              steuerRuecklage={store.steuerRuecklage}
              verfuegbarPrivat={store.verfuegbarPrivat}
              einkommensteuerRuecklageProzent={store.einkommensteuerRuecklageProzent}
            />
          )}
          {activeTab === 'monatsuebersicht' && (
            <MonatsuebersichtTab monthlyData={store.getMonthlyData()} />
          )}
        </motion.div>
      </main>
    </div>
  );
}
