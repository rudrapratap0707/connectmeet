import { Mic, MicOff, Video, VideoOff, ScreenShare, MessageSquare, Users, PhoneOff } from 'lucide-react';

function ControlButton({ active, onClick, activeIcon, inactiveIcon, label, danger, badge }) {
  const Icon = active ? activeIcon : inactiveIcon;
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
        danger
          ? 'bg-coral text-obsidian hover:brightness-110'
          : active
          ? 'bg-pearl/10 text-pearl hover:bg-pearl/15'
          : 'bg-graphite text-coral hover:bg-graphite/70'
      }`}
      title={label}
    >
      <Icon size={18} />
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-lime text-obsidian text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {badge}
        </span>
      )}
      <span className="text-[10px] uppercase tracking-wide hidden sm:block">{label}</span>
    </button>
  );
}

export default function ControlBar({
  micOn,
  cameraOn,
  sharing,
  chatOpen,
  peopleOpen,
  unreadChat,
  onToggleMic,
  onToggleCamera,
  onToggleShare,
  onToggleChat,
  onTogglePeople,
  onLeave,
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div className="glass-panel rounded-2xl px-3 py-2 flex items-center gap-2 shadow-panel">
        <ControlButton
          active={micOn}
          onClick={onToggleMic}
          activeIcon={Mic}
          inactiveIcon={MicOff}
          label="Voice"
        />
        <ControlButton
          active={cameraOn}
          onClick={onToggleCamera}
          activeIcon={Video}
          inactiveIcon={VideoOff}
          label="Video"
        />
        <ControlButton
          active={sharing}
          onClick={onToggleShare}
          activeIcon={ScreenShare}
          inactiveIcon={ScreenShare}
          label="Share"
        />
        <ControlButton
          active={chatOpen}
          onClick={onToggleChat}
          activeIcon={MessageSquare}
          inactiveIcon={MessageSquare}
          label="Chat"
          badge={unreadChat}
        />
        <ControlButton
          active={peopleOpen}
          onClick={onTogglePeople}
          activeIcon={Users}
          inactiveIcon={Users}
          label="People"
        />
        <button
          onClick={onLeave}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-coral text-obsidian hover:brightness-110 transition-colors"
          title="Exit"
        >
          <PhoneOff size={18} />
          <span className="text-[10px] uppercase tracking-wide hidden sm:block">Exit</span>
        </button>
      </div>
    </div>
  );
}
