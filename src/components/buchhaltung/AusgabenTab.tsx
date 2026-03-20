import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil } from 'lucide-react';
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
  zahlungsart: 'Rechnung',
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
    const ustBetrag = netto * (ustProzent / 100);
    const brutto = netto + ustBetrag;
    setForm(f => ({ ...f, netto, ustProzent, ustBetrag, brutto }));
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
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Ausgaben</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Hier buchst du Betriebsausgaben. Kleinunternehmer: kein Vorsteuerabzug — fürs Studio zählt das Brutto.
          </p>
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
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            onSubmit={handleSubmit}
            className="shadow-card grid grid-cols-2 gap-3 overflow-hidden rounded-xl border border-border/40 bg-card p-4 md:grid-cols-3 md:gap-4 md:p-5 lg:grid-cols-5"
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

      <div className="shadow-card overflow-x-auto rounded-xl border border-border/40 bg-card">
        <div className="grid min-w-[900px] grid-cols-[90px_60px_1fr_110px_90px_60px_70px_90px_90px_70px] border-b border-border/50 px-3 py-2.5 sm:px-4">
          {['Datum', 'Beleg', 'Beschreibung', 'Kategorie', 'Netto €', 'USt%', 'USt €', 'Brutto €', 'Zahlung', ''].map(h => (
            <span key={h} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-border/30 min-w-[900px]">
          <AnimatePresence>
            {ausgaben.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground sm:py-12">
                Noch keine Ausgaben. „Ausgabe erfassen“ — der Co-Pilot rechnet Gewinn und Rücklagen automatisch mit.
              </div>
            ) : (
              ausgaben.map(a => (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  className="grid grid-cols-[90px_60px_1fr_110px_90px_60px_70px_90px_90px_70px] items-center px-3 py-3 transition-colors duration-200 ease-studio hover:bg-muted/50 sm:px-4"
                >
                  <span className="text-sm font-mono-nums">{a.datum}</span>
                  <span className="text-sm text-muted-foreground">{a.belegnr}</span>
                  <span className="text-sm font-medium">{a.beschreibung}</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground w-fit">{a.kategorie}</span>
                  <span className="text-sm font-mono-nums">{a.netto.toFixed(2)}</span>
                  <span className="text-sm font-mono-nums text-muted-foreground">{a.ustProzent}%</span>
                  <span className="text-sm font-mono-nums text-muted-foreground">{a.ustBetrag.toFixed(2)}</span>
                  <span className="text-sm font-mono-nums text-destructive font-medium">-{a.brutto.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">{a.zahlungsart}</span>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => openEdit(a)} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Bearbeiten">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => onDelete(a.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Löschen">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        {ausgaben.length > 0 && (
          <div className="grid min-w-[900px] grid-cols-[90px_60px_1fr_110px_90px_60px_70px_90px_90px_70px] border-t border-border bg-muted/30 px-3 py-3 sm:px-4">
            <span /><span /><span />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Summe</span>
            <span className="text-sm font-mono-nums font-semibold">{totalNetto.toFixed(2)}</span>
            <span /><span />
            <span className="text-sm font-mono-nums text-destructive font-semibold">{totalBrutto.toFixed(2)} €</span>
            <span /><span />
          </div>
        )}
      </div>
    </div>
  );
}
