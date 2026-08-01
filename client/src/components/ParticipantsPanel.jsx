import { X, MicOff, VideoOff, Crown } from 'lucide-react';

export default function ParticipantsPanel({ participants, selfName, onClose }) {
  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-72 glass-panel border-l border-pearl/10 z-30 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-pearl/10">
        <h3 className="font-semibold text-sm">Live People ({participants.length})</h3>
        <button onClick={onClose} className="text-pearl/50 hover:text-pearl">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {participants.map((p, i) => (
          <div key={i} className="flex items-center justify-between bg-graphite/50 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-lime" />
              {p.name}
              {p.name === selfName && <span className="text-pearl/40 text-xs">(you)</span>}
              {p.isHost && <Crown size={13} className="text-violet" />}
            </div>
            <div className="flex items-center gap-1.5 text-pearl/40">
              {!p.micOn && <MicOff size={14} />}
              {!p.cameraOn && <VideoOff size={14} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
