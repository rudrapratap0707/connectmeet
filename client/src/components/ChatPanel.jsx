import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';

export default function ChatPanel({ messages, onSend, onClose, selfName }) {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-80 glass-panel border-l border-pearl/10 z-30 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-pearl/10">
        <h3 className="font-semibold text-sm">Meeting Conversation</h3>
        <button onClick={onClose} className="text-pearl/50 hover:text-pearl">
          <X size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && <p className="text-xs text-pearl/40">No messages yet. Say hello!</p>}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] ${m.sender === selfName ? 'ml-auto text-right' : ''}`}>
            <p className="text-[11px] text-pearl/40 mb-0.5">{m.sender}</p>
            <div
              className={`inline-block px-3 py-2 rounded-xl text-sm ${
                m.sender === selfName ? 'bg-coral text-obsidian' : 'bg-graphite text-pearl'
              }`}
            >
              {m.message}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-pearl/10 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="flex-1 bg-graphite/70 border border-pearl/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-coral transition-colors"
        />
        <button type="submit" className="p-2 rounded-lg bg-coral text-obsidian hover:brightness-110 transition">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
