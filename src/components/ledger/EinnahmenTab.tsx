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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-foreground">Einnahmen</h2>
          <p className="text-sm text-muted-foreground">Rechnungsbetrag (Kleinunternehmer: = dein Umsatz, keine USt)</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm()); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity ease-ledger duration-200"
        >
          <Plus className="w-4 h-4" />
          Neue Einnahme
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
            className="shadow-card rounded-lg bg-card p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-hidden"
          >
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Datum</label>
              <input type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono-nums" required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Belegnr.</label>
              <input type="text" value={form.belegnr} onChange={e => setForm({ ...form, belegnr: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" placeholder="001" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Beschreibung</label>
              <input type="text" value={form.beschreibung} onChange={e => setForm({ ...form, beschreibung: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Webdesign Projekt" required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Kategorie</label>
              <select value={form.kategorie} onChange={e => setForm({ ...form, kategorie: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" required>
                <option value="">Wählen...</option>
                {incomeKats.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Brutto €</label>
              <input type="number" step="0.01" value={form.brutto || ''} onChange={e => setForm({ ...form, brutto: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono-nums" placeholder="0,00" required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Zahlungsart</label>
              <select value={form.zahlungsart} onChange={e => setForm({ ...form, zahlungsart: e.target.value as Einnahme['zahlungsart'] })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                {ZAHLUNGSARTEN.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="col-span-full flex justify-end gap-2 pt-2">
              <button type="button" onClick={cancelForm}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Abbrechen</button>
              <button type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
                {editingId ? 'Änderungen speichern' : 'Speichern'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="shadow-card rounded-lg bg-card overflow-hidden">
        <div className="grid grid-cols-[100px_80px_1fr_120px_100px_100px_80px] px-4 py-2 border-b border-border/50">
          {['Datum', 'Beleg', 'Beschreibung', 'Kategorie', 'Brutto €', 'Zahlung', ''].map(h => (
            <span key={h} className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-border/30">
          <AnimatePresence>
            {einnahmen.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                Noch keine Einnahmen. Klicke "Neue Einnahme" oder nutze die Kommandozeile (Cmd+K).
              </div>
            ) : (
              einnahmen.map(e => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  className="grid grid-cols-[100px_80px_1fr_120px_100px_100px_80px] px-4 py-3 items-center hover:bg-muted/50 transition-colors duration-200 ease-ledger"
                >
                  <span className="text-sm font-mono-nums">{e.datum}</span>
                  <span className="text-sm text-muted-foreground">{e.belegnr}</span>
                  <span className="text-sm font-medium">{e.beschreibung}</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground w-fit">{e.kategorie}</span>
                  <span className="text-sm font-mono-nums text-success font-medium">+{e.brutto.toFixed(2)}</span>
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
          <div className="grid grid-cols-[100px_80px_1fr_120px_100px_100px_80px] px-4 py-3 border-t border-border bg-muted/30">
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
