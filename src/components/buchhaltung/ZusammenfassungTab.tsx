import { TrendingUp, TrendingDown, Wallet, Landmark, PiggyBank } from 'lucide-react';

interface Props {
  totalEinnahmen: number;
  totalAusgabenBrutto: number;
  gewinn: number;
  steuerRuecklage: number;
  verfuegbarPrivat: number;
  einkommensteuerRuecklageProzent: number;
  /** Federal Grundfreibetrag cap (e.g. 12.348 € ESt 2026 Alleinstehende). */
  einkommensteuerGrundfreibetragEuro: number;
  /** Portion actually deducted from Gewinn (min(Gewinn, cap)). */
  einkommensteuerGrundfreibetragAbziehbar: number;
  /** Gewinn minus Grundfreibetrag; ESt-Rücklage % applies here (planning estimate). */
  einkommensteuerBemessungsgrundlage: number;
}

export default function ZusammenfassungTab({
  totalEinnahmen,
  totalAusgabenBrutto,
  gewinn,
  steuerRuecklage,
  verfuegbarPrivat,
  einkommensteuerRuecklageProzent,
  einkommensteuerGrundfreibetragEuro,
  einkommensteuerGrundfreibetragAbziehbar,
  einkommensteuerBemessungsgrundlage,
}: Props) {
  const cards = [
    { label: 'Einnahmen', value: totalEinnahmen, icon: TrendingUp, positive: true },
    { label: 'Ausgaben', value: totalAusgabenBrutto, icon: TrendingDown, positive: false },
    { label: 'Gewinn', value: gewinn, icon: Wallet, positive: gewinn >= 0 },
    { label: `ESt-Rücklage (${einkommensteuerRuecklageProzent}%)`, value: steuerRuecklage, icon: Landmark, positive: false },
    { label: 'Verfügbar', value: verfuegbarPrivat, icon: PiggyBank, positive: verfuegbarPrivat >= 0 },
  ];

  const detailRows: { label: string; value: number; cls: string }[] = [
    { label: 'Einnahmen', value: totalEinnahmen, cls: 'text-success' },
    { label: '− Ausgaben', value: -totalAusgabenBrutto, cls: 'text-destructive' },
    { label: '= Gewinn', value: gewinn, cls: gewinn >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold' },
  ];
  if (gewinn > 0) {
    detailRows.push(
      {
        label: `− Grundfreibetrag ESt 2026 (max. ${einkommensteuerGrundfreibetragEuro.toLocaleString('de-DE')} €, Alleinstehende)`,
        value: -einkommensteuerGrundfreibetragAbziehbar,
        cls: 'text-muted-foreground',
      },
      {
        label: '= Bemessungsgrundlage (Schätzung nach Grundfreibetrag)',
        value: einkommensteuerBemessungsgrundlage,
        cls: 'text-foreground/90',
      },
    );
  }
  detailRows.push(
    {
      label: `− ESt-Rücklage (${einkommensteuerRuecklageProzent} % der Bemessungsgrundlage)`,
      value: -steuerRuecklage,
      cls: 'text-muted-foreground',
    },
    {
      label: '= Verfügbar',
      value: verfuegbarPrivat,
      cls: verfuegbarPrivat >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold',
    },
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Überblick</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
        {cards.map(c => (
          <div key={c.label} className="shadow-card space-y-2 rounded-xl border border-border/40 bg-card p-4 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground sm:text-[11px]">{c.label}</span>
              <c.icon className={`h-5 w-5 shrink-0 sm:h-6 sm:w-6 ${c.positive ? 'text-success' : 'text-destructive'}`} />
            </div>
            <p className={`font-mono-nums text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl ${c.positive ? 'text-success' : 'text-destructive'}`}>
              {c.value >= 0 ? '+' : ''}{c.value.toFixed(2)} €
            </p>
          </div>
        ))}
      </div>

      <div className="shadow-card overflow-hidden rounded-xl border border-border/40 bg-card">
        <div className="grid grid-cols-[1fr_150px] border-b border-border/50 px-4 py-2.5 sm:px-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Position</span>
          <span className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Betrag €</span>
        </div>
        {detailRows.map(row => (
          <div key={row.label} className="grid grid-cols-[1fr_150px] border-b border-border/30 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50 sm:px-5">
            <span className="text-sm sm:text-base">{row.label}</span>
            <span className={`text-right font-mono-nums text-sm sm:text-base ${row.cls}`}>{row.value >= 0 ? '+' : ''}{row.value.toFixed(2)} €</span>
          </div>
        ))}
      </div>
    </div>
  );
}
