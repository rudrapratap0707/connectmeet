import { useState } from 'react';
import { Plus, X, Brain } from 'lucide-react';

function ListEditor({ label, items, setItems, placeholder }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    if (!draft.trim()) return;
    setItems([...items, draft.trim()]);
    setDraft('');
  };

  const remove = (idx) => setItems(items.filter((_, i) => i !== idx));

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-pearl/40 font-semibold mb-2">{label}</p>
      <div className="flex gap-2 mb-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 bg-graphite/70 border border-pearl/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-coral"
        />
        <button type="button" onClick={add} className="p-2 rounded-lg bg-graphite text-pearl hover:bg-pearl/10">
          <Plus size={16} />
        </button>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between bg-graphite/40 rounded-lg px-3 py-1.5 text-sm">
            {item}
            <button onClick={() => remove(i)} className="text-pearl/30 hover:text-coral">
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MeetingMemoryModal({ onSave, onSkip }) {
  const [discussion, setDiscussion] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [actions, setActions] = useState([]);

  return (
    <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="glass-panel rounded-xl2 p-6 w-full max-w-lg shadow-panel">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={20} className="text-violet" />
          <h2 className="text-lg font-bold">Save this meeting's memory</h2>
        </div>
        <p className="text-sm text-pearl/50 mb-6">
          Capture what mattered before it fades — future you will thank you.
        </p>

        <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
          <ListEditor label="Discussion" items={discussion} setItems={setDiscussion} placeholder="What was discussed?" />
          <ListEditor label="Decisions" items={decisions} setItems={setDecisions} placeholder="What was decided?" />
          <ListEditor label="Actions" items={actions} setItems={setActions} placeholder="What needs to happen next?" />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 rounded-lg border border-pearl/15 text-pearl/70 hover:bg-graphite transition"
          >
            Skip
          </button>
          <button
            onClick={() => onSave({ discussion, decisions, actions })}
            className="flex-1 py-2.5 rounded-lg bg-violet text-pearl font-semibold hover:brightness-110 transition"
          >
            Save memory
          </button>
        </div>
      </div>
    </div>
  );
}
