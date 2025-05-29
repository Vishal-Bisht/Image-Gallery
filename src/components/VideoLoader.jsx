import { useEffect, useRef, useState } from "react";

/**
 * VideoLoader component
 * - Only plays video when in viewport (autoplay/pause)
 * - Shows a Play/Pause button overlay (YouTube style)
 * - Double-click opens video in modal (fullscreen reel style)
 *
 * Props:
 *   src: string (video source)
 *   poster?: string (optional poster image)
 *   isInViewport: boolean (should autoplay if true)
 *   onDoubleClick: function (called to open modal)
 *   modalOpen: boolean (if true, show modal)
 *   onCloseModal: function (close modal)
 */
export default function VideoLoader({
  src,
  poster,
  isInViewport,
  onDoubleClick,
  modalOpen,
  onCloseModal,
  videoRef: externalVideoRef,
  showModalNav = false,
  onModalPrev,
  onModalNext,
  onModalClose,
  isPlaying: externalIsPlaying,
  setIsPlaying: setExternalIsPlaying,
  isMuted: externalIsMuted,
  setIsMuted: setExternalIsMuted,
}) {
  const videoRef = useRef(null);
  // Use external state if provided, else fallback to local
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [localIsMuted, setLocalIsMuted] = useState(true);
  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : localIsPlaying;
  const setIsPlaying = setExternalIsPlaying || setLocalIsPlaying;
  const isMuted = externalIsMuted !== undefined ? externalIsMuted : localIsMuted;
  const setIsMuted = setExternalIsMuted || setLocalIsMuted;
  const [showCenterBtn, setShowCenterBtn] = useState(false);

  // Autoplay/pause based on viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isInViewport && !modalOpen) {
      if (video.paused) video.play();
    } else {
      if (!video.paused) video.pause();
    }
  }, [isInViewport, modalOpen]);

  // Keep isPlaying state in sync with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [setIsPlaying]);

  // Pause grid video when modal is open
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (modalOpen) {
      video.pause();
      setIsPlaying(false);
    }
  }, [modalOpen, setIsPlaying]);

  // Attach external ref if provided
  useEffect(() => {
    if (externalVideoRef) {
      externalVideoRef(videoRef.current);
    }
  }, [externalVideoRef]);

  // Play/pause handler
  const handlePlayPause = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
    setShowCenterBtn(true);
    setTimeout(() => setShowCenterBtn(false), 600);
  };

  // Mute/unmute handler
  const handleMuteToggle = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted; // Set the video element's muted property first
    setIsMuted(video.muted);    // Immediately update state to match the element
  };

  // Double click to open modal
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onDoubleClick) onDoubleClick();
  };

  return (
    <>
      <div className="relative w-full h-full group">
        <video
          ref={video => {
            videoRef.current = video;
            if (externalVideoRef) externalVideoRef(video);
          }}
          src={src}
          poster={poster}
          className="w-full h-full object-cover rounded-xl"
          autoPlay={isInViewport && !modalOpen}
          muted={isMuted}
          loop
          playsInline
          controls={false}
          preload="none"
          onClick={handlePlayPause}
          onDoubleClick={handleDoubleClick}
          onContextMenu={e => e.preventDefault()}
        />
        {/* Mute/Unmute button */}
        <button
          className="absolute top-2 right-2 bg-gray-700 bg-opacity-80 rounded-full p-1.5 hover:bg-opacity-90 transition z-10"
          onClick={handleMuteToggle}
          tabIndex={-1}
        >
          {isMuted ? (
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19 12c0-2.21-1.79-4-4-4"/><path d="M19 12c0 2.21-1.79 4-4 4"/></svg>
          )}
        </button>
        {/* Center Play/Pause Button */}
        {showCenterBtn && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <button
              className="bg-transparent rounded-full focus:outline-none transition-transform transition-opacity duration-300 scale-110 opacity-100 animate-btn-fade flex items-center justify-center pointer-events-auto"
              style={{ minWidth: 0, minHeight: 0, padding: 0 }}
              tabIndex={0}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="22" cy="22" r="20" fill="#e5e7eb" />
                  <rect x="14" y="11" width="5" height="22" rx="2.5" fill="#222" />
                  <rect x="25" y="11" width="5" height="22" rx="2.5" fill="#222" />
                </svg>
              ) : (
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="22" cy="22" r="20" fill="#e5e7eb" />
                  <polygon points="16,11 33,22 16,33" fill="#222" />
                </svg>
              )}
            </button>
            <style>{`
              @keyframes btn-fade {
                0% {
                  opacity: 0;
                  transform: scale(1.6);
                }
                20% {
                  opacity: 1;
                  transform: scale(1.2);
                }
                80% {
                  opacity: 1;
                  transform: scale(1.0);
                }
                100% {
                  opacity: 0;
                  transform: scale(0.9);
                }
              }
              .animate-btn-fade {
                animation: btn-fade 0.6s cubic-bezier(0.4,0,0.2,1);
              }
            `}</style>
          </div>
        )}
        {/* No modal navigation/close buttons here */}
      </div>
    </>
  );
}
