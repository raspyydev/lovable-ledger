import { Calculator, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface Props {
  gewinn: number;
  steuerRuecklage: number;
  sicherheitsRuecklage: number;
  steuerRuecklagePlusSicherheit: number;
  verfuegbarPrivat: number;
  reserveEstProzent: number;
  reserveSicherheitProzent: number;
  setReserveEstProzent: (n: number) => void;
  setReserveSicherheitProzent: (n: number) => void;
  grundfreibetragEuro: number;
  einkommensteuerBemessungsgrundlage: number;
}

function fmt(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)} €`;
}

export default function RuecklagenTab({
  gewinn,
  steuerRuecklage,
  sicherheitsRuecklage,
  steuerRuecklagePlusSicherheit,
  verfuegbarPrivat,
  reserveEstProzent,
  reserveSicherheitProzent,
  setReserveEstProzent,
  setReserveSicherheitProzent,
  grundfreibetragEuro,
  einkommensteuerBemessungsgrundlage,
}: Props) {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-11 md:w-11">
          <Calculator className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Rücklagen-Rechner</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Passe die Prozentsätze an — sie werden im Browser gespeichert. Die Werte sind nur zur groben Planung, keine
            Steuerberatung.
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground',
        )}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Unterhalb des Grundfreibetrags (hier max. {grundfreibetragEuro.toLocaleString('de-DE')} €) entfällt die
          geschätzte ESt-Rücklage — die{' '}
          <span className="font-medium text-foreground">Sicherheits-Rücklage</span> bleibt trotzdem aktiv, damit du z.
          B. für Umsatzsteuer, Krankenkasse oder schwankende Jahre einen Puffer behältst.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="slider-est" className="text-sm font-medium">
                ESt-Rücklage (auf Bemessungsgrundlage nach Grundfreibetrag)
              </Label>
              <span className="font-mono-nums text-sm font-semibold tabular-nums">{reserveEstProzent} %</span>
            </div>
            <Slider
              id="slider-est"
              min={0}
              max={60}
              step={1}
              value={[reserveEstProzent]}
              onValueChange={(v) => setReserveEstProzent(v[0] ?? 0)}
              className="py-1"
            />
            <p className="text-xs text-muted-foreground">
              Gilt nur für den Betrag über dem Grundfreibetrag (aktuell Bemessungsgrundlage:{' '}
              <span className="font-mono-nums tabular-nums">{einkommensteuerBemessungsgrundlage.toFixed(2)} €</span>).
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="slider-sich" className="text-sm font-medium">
                Sicherheits-Rücklage (vom gesamten Gewinn)
              </Label>
              <span className="font-mono-nums text-sm font-semibold tabular-nums">{reserveSicherheitProzent} %</span>
            </div>
            <Slider
              id="slider-sich"
              min={0}
              max={40}
              step={1}
              value={[reserveSicherheitProzent]}
              onValueChange={(v) => setReserveSicherheitProzent(v[0] ?? 0)}
              className="py-1"
            />
            <p className="text-xs text-muted-foreground">
              Wird bei positivem Gewinn immer mitgerechnet — auch wenn die ESt-Rücklage 0 € ist.
            </p>
          </div>
        </div>

        <div className="shadow-card overflow-hidden rounded-xl border border-border/40 bg-card">
          <div className="border-b border-border/50 px-4 py-2.5 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live-Ergebnis</p>
          </div>
          <div className="divide-y divide-border/30">
            {[
              { label: 'Gewinn', value: gewinn, strong: true },
              { label: '− ESt-Rücklage (Schätzung)', value: -steuerRuecklage, strong: false },
              { label: `− Sicherheits-Rücklage (${reserveSicherheitProzent} % v. Gewinn)`, value: -sicherheitsRuecklage, strong: false },
              { label: '= Gesamt-Rücklagen', value: -steuerRuecklagePlusSicherheit, strong: false },
              { label: '= Verfügbar (nach Rücklagen)', value: verfuegbarPrivat, strong: true },
            ].map((row) => {
              const isGewinn = row.label === 'Gewinn';
              const isVerfuegbar = row.label.startsWith('= Verfügbar');
              const valCls = isGewinn
                ? gewinn >= 0
                  ? 'text-success'
                  : 'text-destructive'
                : isVerfuegbar
                  ? verfuegbarPrivat >= 0
                    ? 'text-success'
                    : 'text-destructive'
                  : 'text-muted-foreground';
              return (
                <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <span className={cn('text-sm', row.strong && 'font-medium')}>{row.label}</span>
                  <span
                    className={cn(
                      'font-mono-nums text-sm tabular-nums sm:text-base',
                      row.strong ? 'font-semibold' : '',
                      valCls,
                    )}
                  >
                    {fmt(row.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
