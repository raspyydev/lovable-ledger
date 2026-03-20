import { MONATE } from '@/lib/types';

interface Props {
  monthlyData: { einnahmen: number; ausgaben: number }[];
}

export default function MonatsuebersichtTab({ monthlyData }: Props) {
  const maxVal = Math.max(...monthlyData.map(m => Math.max(m.einnahmen, m.ausgaben)), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium tracking-tight text-foreground">Monats-Autopilot</h2>
        <p className="text-sm text-muted-foreground">
          Einnahmen und Ausgaben pro Monat — dein Jahresverlauf im Better-Studio-Cockpit.
        </p>
      </div>

      {/* Bar chart */}
      <div className="shadow-card rounded-lg bg-card p-6">
        <div className="flex items-end gap-2 h-48">
          {monthlyData.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="flex gap-0.5 items-end w-full justify-center" style={{ height: '80%' }}>
                <div
                  className="w-2.5 bg-success/80 rounded-t-sm transition-all duration-500 ease-studio"
                  style={{ height: `${(m.einnahmen / maxVal) * 100}%`, minHeight: m.einnahmen > 0 ? 4 : 0 }}
                />
                <div
                  className="w-2.5 bg-destructive/60 rounded-t-sm transition-all duration-500 ease-studio"
                  style={{ height: `${(m.ausgaben / maxVal) * 100}%`, minHeight: m.ausgaben > 0 ? 4 : 0 }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{MONATE[i]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-success/80" />
            <span className="text-xs text-muted-foreground">Einnahmen (Umsatz)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-destructive/60" />
            <span className="text-xs text-muted-foreground">Ausgaben (Brutto)</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="shadow-card rounded-lg bg-card overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_1fr_1fr] px-4 py-2 border-b border-border/50">
          {['Monat', 'Einnahmen', 'Ausgaben', 'Saldo'].map(h => (
            <span key={h} className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{h}</span>
          ))}
        </div>
        {monthlyData.map((m, i) => {
          const saldo = m.einnahmen - m.ausgaben;
          return (
            <div key={i} className="grid grid-cols-[100px_1fr_1fr_1fr] px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium">{MONATE[i]}</span>
              <span className="text-sm font-mono-nums text-success">{m.einnahmen.toFixed(2)} €</span>
              <span className="text-sm font-mono-nums text-destructive">{m.ausgaben.toFixed(2)} €</span>
              <span className={`text-sm font-mono-nums font-medium ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                {saldo >= 0 ? '+' : ''}{saldo.toFixed(2)} €
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
