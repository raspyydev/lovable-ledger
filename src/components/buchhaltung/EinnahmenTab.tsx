import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Einnahme, Kategorie, ZAHLUNGSARTEN } from '@/lib/types';

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
  beschreibung: '',
  kategorie: '',
  brutto: 0,
  zahlungsart: 'Rechnung',
});

export default function EinnahmenTab({ einnahmen, kategorien, onAdd, onUpdate, onDelete, total }: Props) {
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const incomeKats = kategorien.filter(k => k.typ === 'einnahme');

  const openEdit = (e: Einnahme) => {
    setForm({
      datum: e.datum,
      belegnr: e.belegnr,
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

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Einnahmen</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Hier erfasst du deinen Umsatz. Kleinunternehmer (§19 UStG): Rechnungsbetrag = Umsatz, ohne ausgewiesene USt.
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm()); setShowForm(!showForm); }}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity ease-studio duration-200 hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Einnahme erfassen
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            onSubmit={handleSubmit}
            className="shadow-card grid grid-cols-2 gap-3 overflow-hidden rounded-xl border border-border/40 bg-card p-4 md:grid-cols-3 md:gap-4 md:p-5 lg:grid-cols-6"
          >
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Datum</label>
              <input type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono-nums" required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Belegnr.</label>
              <input type="text" value={form.belegnr} onChange={e => setForm({ ...form, belegnr: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="001" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Beschreibung</label>
              <input type="text" value={form.beschreibung} onChange={e => setForm({ ...form, beschreibung: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Webdesign Projekt" required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kategorie</label>
              <select value={form.kategorie} onChange={e => setForm({ ...form, kategorie: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required>
                <option value="">Wählen...</option>
                {incomeKats.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Brutto €</label>
              <input type="number" step="0.01" value={form.brutto || ''} onChange={e => setForm({ ...form, brutto: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono-nums" placeholder="0,00" required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Zahlungsart</label>
              <select value={form.zahlungsart} onChange={e => setForm({ ...form, zahlungsart: e.target.value as Einnahme['zahlungsart'] })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {ZAHLUNGSARTEN.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="col-span-full flex justify-end gap-2 pt-2">
              <button type="button" onClick={cancelForm}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Abbrechen</button>
              <button type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                {editingId ? 'Änderungen speichern' : 'Speichern'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="shadow-card overflow-hidden rounded-xl border border-border/40 bg-card">
        <div className="grid grid-cols-[100px_80px_1fr_120px_100px_100px_80px] border-b border-border/50 px-3 py-2.5 sm:px-4">
          {['Datum', 'Beleg', 'Beschreibung', 'Kategorie', 'Brutto €', 'Zahlung', ''].map(h => (
            <span key={h} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-border/30">
          <AnimatePresence>
            {einnahmen.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground sm:py-12">
                Noch keine Einnahmen. Tippe auf „Einnahme erfassen“ — der Autopilot oben zählt mit, sobald Einträge da sind.
              </div>
            ) : (
              einnahmen.map(e => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  className="grid grid-cols-[100px_80px_1fr_120px_100px_100px_80px] items-center px-3 py-3 transition-colors duration-200 ease-studio hover:bg-muted/50 sm:px-4"
                >
                  <span className="text-sm font-mono-nums">{e.datum}</span>
                  <span className="text-sm text-muted-foreground">{e.belegnr}</span>
                  <span className="text-sm font-medium">{e.beschreibung}</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground w-fit">{e.kategorie}</span>
                  <span className="text-sm font-mono-nums font-semibold text-success">+{e.brutto.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">{e.zahlungsart}</span>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => openEdit(e)} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Bearbeiten">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => onDelete(e.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Löschen">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        {/* Footer */}
        {einnahmen.length > 0 && (
          <div className="grid grid-cols-[100px_80px_1fr_120px_100px_100px_80px] border-t border-border bg-muted/30 px-3 py-3 sm:px-4">
            <span /><span /><span />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Summe</span>
            <span className="text-sm font-mono-nums text-success font-semibold">{total.toFixed(2)} €</span>
            <span /><span />
          </div>
        )}
      </div>
    </div>
  );
}
