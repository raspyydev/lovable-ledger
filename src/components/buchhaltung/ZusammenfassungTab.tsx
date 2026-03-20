import { TrendingUp, TrendingDown, Wallet, Landmark, PiggyBank } from 'lucide-react';

interface Props {
  totalEinnahmen: number;
  totalAusgabenBrutto: number;
  gewinn: number;
  steuerRuecklage: number;
  verfuegbarPrivat: number;
  einkommensteuerRuecklageProzent: number;
}

export default function ZusammenfassungTab({
  totalEinnahmen,
  totalAusgabenBrutto,
  gewinn,
  steuerRuecklage,
  verfuegbarPrivat,
  einkommensteuerRuecklageProzent,
}: Props) {
  const cards = [
    { label: 'Umsatz (Einnahmen)', value: totalEinnahmen, icon: TrendingUp, positive: true },
    { label: 'Ausgaben (Brutto)', value: totalAusgabenBrutto, icon: TrendingDown, positive: false },
    { label: 'Gewinn / Verlust', value: gewinn, icon: Wallet, positive: gewinn >= 0 },
    { label: `Rücklage Einkommensteuer (ca. ${einkommensteuerRuecklageProzent} %)`, value: steuerRuecklage, icon: Landmark, positive: false },
    { label: 'Verfügbar (Privat / Reinvestition)', value: verfuegbarPrivat, icon: PiggyBank, positive: verfuegbarPrivat >= 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium tracking-tight text-foreground">Co-Pilot · Zusammenfassung</h2>
        <p className="text-sm text-muted-foreground">
          Better Studio Buchhaltung (Kleinunternehmer §19 UStG): umsatzsteuerfrei. Gewinn = Einnahmen − Ausgaben (Brutto).
          Die ESt-Rücklage ist eine Co-Pilot-Schätzung auf den Gewinn — keine Steuerberatung.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(c => (
          <div key={c.label} className="shadow-card rounded-lg bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">{c.label}</span>
              <c.icon className={`w-5 h-5 shrink-0 ml-2 ${c.positive ? 'text-success' : 'text-destructive'}`} />
            </div>
            <p className={`text-2xl font-medium font-mono-nums tracking-tight ${c.positive ? 'text-success' : 'text-destructive'}`}>
              {c.value >= 0 ? '+' : ''}{c.value.toFixed(2)} €
            </p>
          </div>
        ))}
      </div>

      <div className="shadow-card rounded-lg bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_150px] px-4 py-2 border-b border-border/50">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Position</span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-right">Betrag €</span>
        </div>
        {[
          { label: 'Umsatz (Einnahmen)', value: totalEinnahmen, cls: 'text-success' },
          { label: '− Ausgaben (Brutto)', value: -totalAusgabenBrutto, cls: 'text-destructive' },
          { label: '= Gewinn / Verlust', value: gewinn, cls: gewinn >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold' },
          { label: `− Rücklage Einkommensteuer (ca. ${einkommensteuerRuecklageProzent} %)`, value: -steuerRuecklage, cls: 'text-muted-foreground' },
          { label: '= Verfügbar (für dich)', value: verfuegbarPrivat, cls: verfuegbarPrivat >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold' },
        ].map(row => (
          <div key={row.label} className="grid grid-cols-[1fr_150px] px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/50 transition-colors">
            <span className="text-sm">{row.label}</span>
            <span className={`text-sm font-mono-nums text-right ${row.cls}`}>{row.value >= 0 ? '+' : ''}{row.value.toFixed(2)} €</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-muted/50 border border-border/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Co-Pilot · Krankenversicherung</p>
        <p>
          „Verfügbar (Co-Pilot)“ ist nach Abzug der ESt-Rücklage. Plane realistisch zusätzlich mind. ca. 220 €/Monat
          für die GKV (Stand 2026) ein — Better Studio ersetzt keine Beratung.
        </p>
      </div>
    </div>
  );
}
