"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, Download } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Global singleton to ensure only one audio plays at a time across the whole app
let globalAudioInstance: HTMLAudioElement | null = null;
let globalSetIsPlaying: ((v: boolean) => void) | null = null;

// Persistent volume storage
const getPersistedVolume = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('crm_audio_volume');
    if (saved !== null) return parseFloat(saved);
  }
  return 1;
};

export const CallAudioPlayer = ({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(getPersistedVolume());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    // Set initial volume
    audio.volume = volume;
    
    const handlePlay = () => {
      // If another audio is playing, stop it
      if (globalAudioInstance && globalAudioInstance !== audio) {
        globalAudioInstance.pause();
        if (globalSetIsPlaying) globalSetIsPlaying(false);
      }
      
      globalAudioInstance = audio;
      globalSetIsPlaying = setIsPlaying;
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      if (globalAudioInstance === audio) {
        globalAudioInstance = null;
        globalSetIsPlaying = null;
      }
    };
  }, [url]);

  // Sync volume across instances and persist
  useEffect(() => {
    const handleGlobalVolumeChange = (e: any) => {
      const newVolume = e.detail;
      setVolume(newVolume);
      if (audioRef.current) audioRef.current.volume = newVolume;
    };

    window.addEventListener('crm_volume_change', handleGlobalVolumeChange);
    return () => window.removeEventListener('crm_volume_change', handleGlobalVolumeChange);
  }, []);

  const updateVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    localStorage.setItem('crm_audio_volume', v.toString());
    window.dispatchEvent(new CustomEvent('crm_volume_change', { detail: v }));
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * duration;
  };

  return (
    <div className="bg-slate-900 dark:bg-muted border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
      <div className="flex items-center gap-5 relative z-10">
        <Button
          size="icon"
          onClick={togglePlay}
          className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 shrink-0 transition-transform active:scale-95"
        >
          {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-1" />}
        </Button>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex justify-between items-center mb-2 gap-2">
            <div className="flex flex-col relative shrink-0">
              <div className="h-3 flex items-center w-24 relative">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isPlaying ? "playing" : "ready"}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    className="text-[8px] font-black uppercase tracking-[0.1em] text-blue-500 whitespace-nowrap absolute left-0"
                  >
                    {isPlaying ? "En curso" : "Listo"}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-black text-white tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <span className="text-[9px] font-bold text-white/30">/ {formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg shrink-0">
                <Volume2 className="h-3 w-3 text-white/40" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => updateVolume(parseFloat(e.target.value))}
                  className="w-12 h-1 bg-blue-600/30 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
                title="Descargar grabación"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer" onClick={handleSeek}>
            <motion.div
              className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          e.currentTarget.volume = volume;
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />
    </div>
  );
};
