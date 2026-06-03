import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Volume2, VolumeX, Lock } from 'lucide-react';

// Shared loader so we don't append the YouTube IFrame API script more than once.
let ytApiPromise = null;
const loadYouTubeAPI = () => {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  });
  return ytApiPromise;
};

const fmt = (s) => {
  if (!isFinite(s)) return '0:00';
  const sec = Math.max(0, Math.floor(s));
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

/**
 * A locked-down YouTube player.
 * - YouTube native chrome (incl. share button, video title, recommendations) is hidden via controls=0.
 * - All interaction goes through our own play/pause + progress bar.
 * - Right-click context menu suppressed.
 * - On first PLAY of the page, calls onFirstPlay() exactly once (used for view counting).
 * - When locked=true (view limit reached), shows a lock overlay instead of the player.
 */
export default function SecurePlayer({
  platform,
  embedId,
  videoKey,        // stable key so we re-init when video changes
  locked = false,
  onFirstPlay,     // () => void — fired once per mount when the user starts playing
  remaining,       // number | null — remaining plays for display
  maxViews,        // number | null
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const playedOnceRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  // Vimeo path is simple — no per-second control needed yet, just a clean iframe with no share.
  // (Vimeo Pro lets you set `pip=0&controls=1` but free embeds still show share. We use plain iframe.)
  if (platform === 'vimeo') {
    return (
      <div className="aspect-video bg-midnight-950 relative" onContextMenu={(e) => e.preventDefault()}>
        {locked ? (
          <LockedOverlay maxViews={maxViews} />
        ) : (
          <iframe
            key={videoKey}
            title="player"
            src={`https://player.vimeo.com/video/${embedId}?title=0&byline=0&portrait=0&pip=0`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  useEffect(() => {
    if (locked) return;
    let cancelled = false;
    let pollId;
    let player;

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !containerRef.current) return;
      player = new YT.Player(containerRef.current, {
        videoId: embedId,
        width: '100%',
        height: '100%',
        playerVars: {
          controls: 0,        // hide ALL native controls (incl. share button)
          rel: 0,             // no related videos at end
          modestbranding: 1,
          showinfo: 0,
          iv_load_policy: 3,  // no annotations
          fs: 0,              // no native fullscreen button (we offer our own)
          disablekb: 1,       // disable keyboard shortcuts
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            setDuration(e.target.getDuration());
            setMuted(e.target.isMuted());
          },
          onStateChange: (e) => {
            const s = e.data;
            if (s === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              if (!playedOnceRef.current) {
                playedOnceRef.current = true;
                onFirstPlay && onFirstPlay();
              }
            } else if (s === YT.PlayerState.PAUSED || s === YT.PlayerState.ENDED) {
              setIsPlaying(false);
            }
            if (s === YT.PlayerState.PLAYING && !pollId) {
              pollId = setInterval(() => {
                if (!playerRef.current) return;
                try {
                  setPosition(playerRef.current.getCurrentTime());
                  if (!duration) setDuration(playerRef.current.getDuration());
                } catch {}
              }, 500);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      try { player?.destroy?.(); } catch {}
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
      playedOnceRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedId, videoKey, locked]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo();
    else p.playVideo();
  };

  const seek = (e) => {
    const p = playerRef.current;
    if (!p || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    p.seekTo(pct * duration, true);
    setPosition(pct * duration);
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) { p.unMute(); setMuted(false); }
    else { p.mute(); setMuted(true); }
  };

  const fullscreen = () => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const restart = () => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0, true);
    p.playVideo();
  };

  if (locked) {
    return (
      <div className="aspect-video bg-midnight-950 relative" onContextMenu={(e) => e.preventDefault()}>
        <LockedOverlay maxViews={maxViews} />
      </div>
    );
  }

  return (
    <div
      className="relative bg-midnight-950 group"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="aspect-video">
        {/* The IFrame fills this container. pointer-events disabled so the user can't click
            into the iframe and trigger YouTube's UI; all input goes through our overlay. */}
        <div ref={containerRef} className="w-full h-full pointer-events-none" />
        {/* Click-anywhere to play/pause overlay */}
        <button
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-transparent hover:bg-midnight-950/10 transition"
        >
          {!isPlaying && (
            <span className="w-20 h-20 rounded-full bg-midnight-900/70 flex items-center justify-center backdrop-blur-sm">
              <Play className="text-gold-400 ml-1" size={36} fill="currentColor" />
            </span>
          )}
        </button>
      </div>

      {/* Custom control bar */}
      <div className="bg-midnight-900 text-white px-3 py-2 flex items-center gap-2 select-none">
        <button onClick={togglePlay} className="p-1.5 hover:bg-white/10 rounded">
          {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
        </button>
        <button onClick={restart} className="p-1.5 hover:bg-white/10 rounded" title="Restart">
          <RotateCcw size={16} />
        </button>
        <span className="text-xs tabular-nums text-midnight-300 w-16">
          {fmt(position)} / {fmt(duration)}
        </span>
        <div className="flex-1 relative cursor-pointer" onClick={seek}>
          <div className="h-1.5 rounded bg-midnight-700 overflow-hidden">
            <div
              className="h-full bg-gold-500 transition-all"
              style={{ width: duration ? `${(position / duration) * 100}%` : '0%' }}
            />
          </div>
        </div>
        <button onClick={toggleMute} className="p-1.5 hover:bg-white/10 rounded">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button onClick={fullscreen} className="p-1.5 hover:bg-white/10 rounded">
          <Maximize2 size={16} />
        </button>
      </div>

      {/* View counter pill */}
      {maxViews ? (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-midnight-900/80 text-gold-400 text-xs font-medium backdrop-blur-sm">
          {remaining != null ? remaining : maxViews} of {maxViews} views left
        </div>
      ) : null}
    </div>
  );
}

function LockedOverlay({ maxViews }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-midnight-900 to-midnight-950 text-white text-center px-6">
      <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
        <Lock className="text-rose-400" size={28} />
      </div>
      <h3 className="font-serif text-xl font-bold mb-2">View limit reached</h3>
      <p className="text-sm text-midnight-200 max-w-sm">
        You've already watched this video the maximum number of times{maxViews ? ` (${maxViews})` : ''}.
        Contact your teacher if you need an extension.
      </p>
    </div>
  );
}
