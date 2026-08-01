import { useEffect, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';

export default function VideoTile({ stream, name, muted, isSpeaking, cameraOn = true, micOn = true, large = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-graphite border ${
        isSpeaking ? 'border-coral' : 'border-pearl/10'
      } ${large ? 'aspect-video' : 'aspect-square'}`}
    >
      {stream && cameraOn ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-graphite">
          <div className="w-14 h-14 rounded-full bg-violet/20 border border-violet/40 flex items-center justify-center font-bold text-violet">
            {initials}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-obsidian/70 backdrop-blur px-2 py-1 rounded-lg text-xs">
        <span>{name}</span>
        {!micOn && <MicOff size={12} className="text-coral" />}
        {!cameraOn && <VideoOff size={12} className="text-coral" />}
      </div>
    </div>
  );
}
