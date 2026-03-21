import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, Hash } from 'lucide-react';
import { Einnahme, Kategorie, ZAHLUNGSARTEN, EINNAHME_BESCHREIBUNG_PRESETS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  einnahmen: Einnahme[];
  kategorien: Kategorie[];
  onAdd: (e: Einnahme) => void;
  onUpdate: (e: Einnahme) => void;
  onDelete: (id: string) => void;
  total: number;
}

const emptyForm = (): Omit<Einnahme, 'id'> => ({
  datum: new Date().toISOString().slice(0, 10),
  belegnr: '',
  invoiceId: '',
  beschreibung: '',
  kategorie: '',
  brutto: 0,
  zahlungsart: 'Stripe',
});

const TABLE_GRID =
  'grid min-w-[1000px] grid-cols-[100px_72px_minmax(200px,280px)_minmax(160px,1fr)_minmax(100px,120px)_96px_88px_72px]';

const BESCHREIBUNG_SEP = ' · ';

function splitBeschreibung(s: string): string[] {
  return s
    .split(BESCHREIBUNG_SEP)
    .map((x) => x.trim())
    .filter(Boolean);
}

function nextBelegnr(einnahmen: Einnahme[]): string {
  let max = 0;
  for (const e of einnahmen) {
    const digits = e.belegnr.replace(/\D/g, '');
    const n = parseInt(digits, 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return String(max + 1).padStart(3, '0');
}

const BRUTTO_QUICK_ADD = [50, 100, 150, 250, 500] as const;

export default function EinnahmenTab({ einnahmen, kategorien, onAdd, onUpdate, onDelete, total }: Props) {
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const incomeKats = kategorien.filter((k) => k.typ === 'einnahme');

  const beschreibungParts = useMemo(() => splitBeschreibung(form.beschreibung), [form.beschreibung]);

  const toggleBeschreibungPreset = (label: string) => {
    const parts = [...beschreibungParts];
    const i = parts.indexOf(label);
    if (i >= 0) parts.splice(i, 1);
    else parts.push(label);
    setForm({ ...form, beschreibung: parts.join(BESCHREIBUNG_SEP) });
  };

  const applyBelegnrNext = () => {
    setForm({ ...form, belegnr: nextBelegnr(einnahmen) });
  };

  const addBrutto = (delta: number) => {
    setForm((f) => ({
      ...f,
      brutto: Math.round((Number(f.brutto) + delta) * 100) / 100,
    }));
  };

  const openEdit = (e: Einnahme) => {
    setForm({
      datum: e.datum,
      belegnr: e.belegnr,
      invoiceId: e.invoiceId ?? '',
      beschreibung: e.beschreibung,
      kategorie: e.kategorie,
      brutto: e.brutto,
      zahlungsart: e.zahlungsart,
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ ...form, id: editingId });
    } else {
      onAdd({ ...form, id: crypto.randomUUID() });
    }
    setForm(emptyForm());
    setShowForm(false);
    setEditingId(null);
  };

  const toggleFormOpen = () => {
    if (showForm) {
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      return;
    }
    setEditingId(null);
    const next = emptyForm();
    next.belegnr = nextBelegnr(einnahmen);
    setForm(next);
    setShowForm(true);
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Einnahmen</h2>
        </div>
        <button
          type="button"
          onClick={toggleFormOpen}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity ease-studio duration-200 hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Einnahme erfassen
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            onSubmit={handleSubmit}
            className="shadow-card flex flex-col gap-4 overflow-hidden rounded-xl border border-border/40 bg-card p-4 md:gap-5 md:p-5"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Datum</label>
                <input
                  type="date"
                  value={form.datum}
                  onChange={(ev) => setForm({ ...form, datum: ev.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono-nums focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Belegnr.</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.belegnr}
                    onChange={(ev) => setForm({ ...form, belegnr: ev.target.value })}
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    title="Nächste freie Nummer"
                    onClick={applyBelegnrNext}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Hash className="h-3.5 w-3.5" />
                    +1
                  </button>
                </div>
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Invoice ID
                </label>
                <input
                  type="text"
                  value={form.invoiceId}
                  onChange={(ev) => setForm({ ...form, invoiceId: ev.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kategorie</label>
                <select
                  value={form.kategorie}
                  onChange={(ev) => setForm({ ...form, kategorie: ev.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Wählen…</option>
                  {incomeKats.map((k) => (
                    <option key={k.id} value={k.name}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Zahlungsart</label>
                <select
                  value={form.zahlungsart}
                  onChange={(ev) => setForm({ ...form, zahlungsart: ev.target.value as Einnahme['zahlungsart'] })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ZAHLUNGSARTEN.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Beschreibung</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, beschreibung: '' })}
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Text leeren
                </button>
              </div>
              <input
                type="text"
                value={form.beschreibung}
                onChange={(ev) => setForm({ ...form, beschreibung: ev.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
                autoComplete="off"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {EINNAHME_BESCHREIBUNG_PRESETS.map((preset) => {
                  const active = beschreibungParts.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => toggleBeschreibungPreset(preset)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border/80 bg-muted/40 text-foreground hover:bg-muted hover:border-border',
                      )}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Brutto €</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.brutto || ''}
                onChange={(ev) => setForm({ ...form, brutto: parseFloat(ev.target.value) || 0 })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono-nums focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <div className="flex flex-wrap gap-1">
                <span className="mr-1 self-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">+€</span>
                {BRUTTO_QUICK_ADD.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => addBrutto(amt)}
                    className="rounded-md border border-border/80 bg-secondary/50 px-2 py-1 text-xs font-medium tabular-nums text-secondary-foreground transition-colors hover:bg-secondary"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border/40 pt-3">
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {editingId ? 'Änderungen speichern' : 'Speichern'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="shadow-card overflow-x-auto rounded-xl border border-border/40 bg-card">
        <div className={`${TABLE_GRID} border-b border-border/50 px-3 py-2.5 sm:px-4`}>
          {['Datum', 'Beleg', 'Invoice ID', 'Beschreibung', 'Kategorie', 'Brutto €', 'Zahlung', ''].map((h, i) => (
            <span key={`${h}-${i}`} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {h}
            </span>
          ))}
        </div>
        <div className="divide-y divide-border/30">
          <AnimatePresence>
            {einnahmen.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground sm:py-12">Noch keine Einnahmen.</div>
            ) : (
              einnahmen.map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  className={`${TABLE_GRID} items-start gap-y-1 px-3 py-3 transition-colors duration-200 ease-studio hover:bg-muted/50 sm:px-4`}
                >
                  <span className="text-sm font-mono-nums">{e.datum}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{e.belegnr}</span>
                  <span
                    className="min-w-0 truncate font-mono text-xs text-muted-foreground sm:text-sm"
                    title={e.invoiceId || undefined}
                  >
                    {e.invoiceId?.trim() ? e.invoiceId : '—'}
                  </span>
                  <span className="min-w-0 break-words text-sm font-medium leading-snug">{e.beschreibung}</span>
                  <span className="w-fit rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">{e.kategorie}</span>
                  <span className="text-sm font-mono-nums font-semibold text-success">+{e.brutto.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">{e.zahlungsart}</span>
                  <div className="flex items-start justify-end gap-0.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                      title="Bearbeiten"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(e.id)}
                      className="p-1 text-muted-foreground transition-colors hover:text-destructive"
                      title="Löschen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        {einnahmen.length > 0 && (
          <div className={`${TABLE_GRID} border-t border-border bg-muted/30 px-3 py-3 sm:px-4`}>
            <span />
            <span />
            <span />
            <span />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Summe</span>
            <span className="text-sm font-mono-nums font-semibold text-success">{total.toFixed(2)} €</span>
            <span />
            <span />
          </div>
        )}
      </div>
    </div>
  );
}
