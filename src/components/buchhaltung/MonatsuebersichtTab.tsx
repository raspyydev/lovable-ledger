import { MONATE } from '@/lib/types';

interface Props {
  monthlyData: { einnahmen: number; ausgaben: number }[];
}

export default function MonatsuebersichtTab({ monthlyData }: Props) {
  const maxVal = Math.max(...monthlyData.map(m => Math.max(m.einnahmen, m.ausgaben)), 1);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Monats-Autopilot</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Einnahmen und Ausgaben pro Monat — dein Jahresverlauf im Better-Studio-Cockpit.
        </p>
      </div>

      {/* Bar chart */}
      <div className="shadow-card rounded-xl border border-border/40 bg-card p-4 sm:p-5 md:p-6">
        <div className="flex h-44 items-end gap-1.5 sm:h-48 sm:gap-2 md:h-52">
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
              <span className="text-[11px] font-medium text-muted-foreground md:text-xs">{MONATE[i]}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/50 pt-4 sm:mt-5 sm:gap-5 sm:pt-5">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-sm bg-success/80" />
            <span className="text-sm text-muted-foreground">Einnahmen (Umsatz)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-sm bg-destructive/60" />
            <span className="text-sm text-muted-foreground">Ausgaben (Brutto)</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="shadow-card overflow-hidden rounded-xl border border-border/40 bg-card">
        <div className="grid grid-cols-[100px_1fr_1fr_1fr] border-b border-border/50 px-4 py-2.5 sm:px-5">
          {['Monat', 'Einnahmen', 'Ausgaben', 'Saldo'].map(h => (
            <span key={h} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</span>
          ))}
        </div>
        {monthlyData.map((m, i) => {
          const saldo = m.einnahmen - m.ausgaben;
          return (
            <div key={i} className="grid grid-cols-[100px_1fr_1fr_1fr] border-b border-border/30 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50 sm:px-5">
              <span className="text-sm font-semibold sm:text-base">{MONATE[i]}</span>
              <span className="font-mono-nums text-sm text-success sm:text-base">{m.einnahmen.toFixed(2)} €</span>
              <span className="font-mono-nums text-sm text-destructive sm:text-base">{m.ausgaben.toFixed(2)} €</span>
              <span className={`font-mono-nums text-sm font-semibold sm:text-base ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                {saldo >= 0 ? '+' : ''}{saldo.toFixed(2)} €
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
