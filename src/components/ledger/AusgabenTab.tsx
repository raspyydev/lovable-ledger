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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-foreground">Ausgaben</h2>
          <p className="text-sm text-muted-foreground">Brutto = Betriebsausgabe (Kleinunternehmer: kein Vorsteuerabzug)</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm()); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity ease-ledger duration-200"
        >
          <Plus className="w-4 h-4" /> Neue Ausgabe
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            onSubmit={handleSubmit}
            className="shadow-card rounded-lg bg-card p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-hidden"
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
              <button type="button" onClick={cancelForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Abbrechen</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
                {editingId ? 'Änderungen speichern' : 'Speichern'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="shadow-card rounded-lg bg-card overflow-x-auto">
        <div className="grid grid-cols-[90px_60px_1fr_110px_90px_60px_70px_90px_90px_70px] min-w-[900px] px-4 py-2 border-b border-border/50">
          {['Datum', 'Beleg', 'Beschreibung', 'Kategorie', 'Netto €', 'USt%', 'USt €', 'Brutto €', 'Zahlung', ''].map(h => (
            <span key={h} className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-border/30 min-w-[900px]">
          <AnimatePresence>
            {ausgaben.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                Noch keine Ausgaben erfasst.
              </div>
            ) : (
              ausgaben.map(a => (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  className="grid grid-cols-[90px_60px_1fr_110px_90px_60px_70px_90px_90px_70px] px-4 py-3 items-center hover:bg-muted/50 transition-colors duration-200 ease-ledger"
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
          <div className="grid grid-cols-[90px_60px_1fr_110px_90px_60px_70px_90px_90px_70px] min-w-[900px] px-4 py-3 border-t border-border bg-muted/30">
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
