import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { roundMoney } from '@/lib/bookkeepingSort';
import { Ausgabe, Kategorie, ZAHLUNGSARTEN } from '@/lib/types';

interface Props {
  ausgaben: Ausgabe[];
  kategorien: Kategorie[];
  onAdd: (a: Ausgabe) => void;
  onUpdate: (a: Ausgabe) => void;
  onDelete: (id: string) => void;
  totalBrutto: number;
  totalNetto: number;
}

const emptyForm = (): Omit<Ausgabe, 'id'> => ({
  datum: new Date().toISOString().slice(0, 10),
  belegnr: '',
  ausgaben: '',
  beschreibung: '',
  kategorie: '',
  netto: 0,
  ustProzent: 19,
  ustBetrag: 0,
  brutto: 0,
  zahlungsart: 'Stripe',
});

export default function AusgabenTab({ ausgaben, kategorien, onAdd, onUpdate, onDelete, totalBrutto, totalNetto }: Props) {
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const expenseKats = kategorien.filter(k => k.typ === 'ausgabe');

  const openEdit = (a: Ausgabe) => {
    setForm({
      datum: a.datum,
      belegnr: a.belegnr,
      ausgaben: a.ausgaben,
      beschreibung: a.beschreibung,
      kategorie: a.kategorie,
      netto: a.netto,
      ustProzent: a.ustProzent,
      ustBetrag: a.ustBetrag,
      brutto: a.brutto,
      zahlungsart: a.zahlungsart,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const updateNetto = (netto: number, ustProzent: number) => {
    const n = roundMoney(netto);
    const ustBetrag = roundMoney(n * (ustProzent / 100));
    const brutto = roundMoney(n + ustBetrag);
    setForm((f) => ({ ...f, netto: n, ustProzent, ustBetrag, brutto }));
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

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Ausgaben</h2>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm()); setShowForm(!showForm); }}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity ease-studio duration-200 hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Ausgabe erfassen
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            onSubmit={handleSubmit}
            className="grid grid-cols-2 gap-3 overflow-hidden rounded-2xl border border-border/40 bg-card p-5 shadow-card md:grid-cols-3 md:gap-4 md:p-6 lg:grid-cols-5"
          >
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Datum</label>
              <input type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono-nums" required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Belegnr.</label>
              <input type="text" value={form.belegnr} onChange={e => setForm({ ...form, belegnr: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Beschreibung</label>
              <input type="text" value={form.beschreibung} onChange={e => setForm({ ...form, beschreibung: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Kategorie</label>
              <select value={form.kategorie} onChange={e => setForm({ ...form, kategorie: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" required>
                <option value="">Wählen...</option>
                {expenseKats.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Netto €</label>
              <input type="number" step="0.01" value={form.netto || ''} onChange={e => updateNetto(parseFloat(e.target.value) || 0, form.ustProzent)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono-nums" required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">USt %</label>
              <select value={form.ustProzent} onChange={e => updateNetto(form.netto, parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono-nums">
                <option value={0}>0%</option>
                <option value={7}>7%</option>
                <option value={19}>19%</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">USt €</label>
              <input type="text" readOnly value={form.ustBetrag.toFixed(2)}
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md font-mono-nums text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Brutto €</label>
              <input type="text" readOnly value={form.brutto.toFixed(2)}
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md font-mono-nums text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Zahlungsart</label>
              <select value={form.zahlungsart} onChange={e => setForm({ ...form, zahlungsart: e.target.value as Ausgabe['zahlungsart'] })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                {ZAHLUNGSARTEN.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="col-span-full flex justify-end gap-2 pt-2">
              <button type="button" onClick={cancelForm} className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Abbrechen</button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                {editingId ? 'Änderungen speichern' : 'Speichern'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card shadow-card">
        <div className="grid min-w-[900px] grid-cols-[90px_60px_1fr_110px_90px_60px_70px_90px_90px_70px] border-b border-border/40 bg-muted/30 px-3 py-3 sm:px-4">
          {['Datum', 'Beleg', 'Beschreibung', 'Kategorie', 'Netto €', 'USt%', 'USt €', 'Brutto €', 'Zahlung', ''].map(h => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-border/20 min-w-[900px]">
          <AnimatePresence>
            {ausgaben.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <p className="text-sm font-medium text-muted-foreground">Noch keine Ausgaben</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Erstelle deine erste Ausgabe über den Button oben.</p>
              </div>
            ) : (
              ausgaben.map(a => (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  className="grid grid-cols-[90px_60px_1fr_110px_90px_60px_70px_90px_90px_70px] items-start gap-y-1 px-3 py-3.5 transition-colors duration-150 ease-studio hover:bg-muted/40 sm:px-4"
                >
                  <span className="text-sm font-mono-nums text-foreground/80">{a.datum}</span>
                  <span className="text-sm tabular-nums text-muted-foreground/70">{a.belegnr}</span>
                  <span className="min-w-0 break-words text-sm font-medium leading-snug text-foreground/90">{a.beschreibung}</span>
                  <span className="w-fit rounded-lg bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{a.kategorie}</span>
                  <span className="text-sm font-mono-nums text-foreground/80">{a.netto.toFixed(2)}</span>
                  <span className="text-sm font-mono-nums text-muted-foreground/60">{a.ustProzent}%</span>
                  <span className="text-sm font-mono-nums text-muted-foreground/60">{a.ustBetrag.toFixed(2)}</span>
                  <span className="text-sm font-mono-nums font-bold text-destructive">-{a.brutto.toFixed(2)}</span>
                  <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{a.zahlungsart}</span>
                  <div className="flex items-start justify-end gap-1 pt-0.5">
                    <button type="button" onClick={() => openEdit(a)} className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground" title="Bearbeiten">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => onDelete(a.id)} className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive" title="Löschen">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        {ausgaben.length > 0 && (
          <div className="grid min-w-[900px] grid-cols-[90px_60px_1fr_110px_90px_60px_70px_90px_90px_70px] border-t border-border/40 bg-muted/20 px-3 py-3.5 sm:px-4">
            <span /><span /><span />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Summe</span>
            <span className="text-sm font-mono-nums font-bold text-foreground">{totalNetto.toFixed(2)}</span>
            <span /><span />
            <span className="text-sm font-mono-nums font-bold text-destructive">{totalBrutto.toFixed(2)} €</span>
            <span /><span />
          </div>
        )}
      </div>
    </div>
  );
}
