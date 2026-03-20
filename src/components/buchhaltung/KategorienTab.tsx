import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Tag } from 'lucide-react';
import { Kategorie } from '@/lib/types';

interface Props {
  kategorien: Kategorie[];
  onAdd: (k: Kategorie) => void;
  onDelete: (id: string) => void;
}

export default function KategorienTab({ kategorien, onAdd, onDelete }: Props) {
  const [name, setName] = useState('');
  const [typ, setTyp] = useState<'einnahme' | 'ausgabe'>('einnahme');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ id: crypto.randomUUID(), name: name.trim(), typ, farbe: '240 5% 60%' });
    setName('');
  };

  const einnahmeKats = kategorien.filter(k => k.typ === 'einnahme');
  const ausgabeKats = kategorien.filter(k => k.typ === 'ausgabe');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium tracking-tight text-foreground">Kategorien</h2>
        <p className="text-sm text-muted-foreground">
          Better Studio sortiert über Kategorien — dein Co-Pilot bleibt lesbar, egal wie viele Streams du fährst.
        </p>
      </div>

      <form onSubmit={handleAdd} className="shadow-card rounded-lg bg-card p-4 flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" placeholder="z. B. Retusche, Hosting …" required />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Typ</label>
          <select value={typ} onChange={e => setTyp(e.target.value as 'einnahme' | 'ausgabe')}
            className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="einnahme">Einnahme</option>
            <option value="ausgabe">Ausgabe</option>
          </select>
        </div>
        <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Hinzufügen
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {[{ title: 'Einnahmen · Umsatz-Topf', items: einnahmeKats, color: 'text-success' },
          { title: 'Ausgaben · Studio-Kosten', items: ausgabeKats, color: 'text-destructive' }].map(group => (
          <div key={group.title} className="shadow-card rounded-lg bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <h3 className={`text-sm font-medium ${group.color}`}>{group.title}</h3>
            </div>
            <div className="divide-y divide-border/30">
              <AnimatePresence>
                {group.items.map(k => (
                  <motion.div key={k.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm">{k.name}</span>
                    </div>
                    <button onClick={() => onDelete(k.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
