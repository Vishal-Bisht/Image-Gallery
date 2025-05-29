import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import images from "../data/data.js";
import "../index.css";
import VideoLoader from "./VideoLoader";

const fadeInStyle = {
  opacity: 0,
  transform: "translateY(40px)",
  transition:
    "opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)",
};
const fadeInActiveStyle = {
  opacity: 1,
  transform: "translateY(0)",
};

const rippleStyle = `
.ripple-bubble {
  background: rgba(100,100,100,0.35);
  border-radius: 9999px;
  padding: 18px;
  animation: ripple-bubble-appear 0.5s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 0 16px 4px rgba(80,80,80,0.18);
  backdrop-filter: blur(4px);
}
@keyframes ripple-bubble-appear {
  0% {
    transform: scale(0.7);
    opacity: 0.7;
  }
  60% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('ripple-bubble-style')) {
  const style = document.createElement('style');
  style.id = 'ripple-bubble-style';
  style.innerHTML = rippleStyle;
  document.head.appendChild(style);
}

const Gallery = ({ filterCategory = "all" }) => {
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentCategory, setCurrentCategory] = useState(filterCategory);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [hiddenImages, setHiddenImages] = useState(new Set());
  const loaderRef = useRef(null);
  const imagesPerPage = 20;
  const imageRefs = useRef({});
  const [visibleSet, setVisibleSet] = useState(new Set());
  //  Per-video state and refs for all videos ---
  const [videoStates, setVideoStates] = useState({}); // { [id]: { isPlaying, isMuted, showCenterIcon } }
  const videoNodeRefs = useRef({}); // { [id]: video DOM node }
  const [playingVideos, setPlayingVideos] = useState(new Set()); // Set of video IDs currently in viewport

  useEffect(() => {
    if (currentCategory !== filterCategory) {
      setPage(1);
      setHasMore(true);
      setCurrentCategory(filterCategory);
    }
  }, [filterCategory, currentCategory]);

  const filteredImages =
    filterCategory && filterCategory !== "all"
      ? images.filter((img) => {
          if (!img.category) return false;
          if (Array.isArray(img.category)) {
            return img.category
              .map((c) => c.toLowerCase())
              .includes(filterCategory.toLowerCase());
          }
          return (img.category || "").toLowerCase() === filterCategory.toLowerCase();
        })
      : images;

  // Shuffle filteredImages only when filter/category changes
  const shuffledImages = useMemo(() => {
    const arr = [...filteredImages];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [filterCategory, filteredImages.length]);

  const visibleImages = shuffledImages.filter(
    (img) => !hiddenImages.has(img.id)
  );

  // Track the number of images to show
  const [imagesToShow, setImagesToShow] = useState(imagesPerPage);

  // When filter/category changes, reset imagesToShow
  useEffect(() => {
    setImagesToShow(imagesPerPage);
  }, [filterCategory, shuffledImages]);

  // Infinite scroll: load more images when loaderRef is visible
  useEffect(() => {
    const currentLoaderRef = loaderRef.current;
    if (!currentLoaderRef) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && imagesToShow < visibleImages.length) {
          setImagesToShow((prev) =>
            Math.min(prev + imagesPerPage, visibleImages.length)
          );
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    observer.observe(currentLoaderRef);
    return () => observer.disconnect();
  }, [imagesToShow, visibleImages.length]);

  // Only show up to imagesToShow images
  const pagedImages = visibleImages.slice(0, imagesToShow);
  const getDynamicMasonryColumns = useCallback(() => {
    let columns = 2;
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) columns = 4;
      else if (window.innerWidth >= 768) columns = 3;
    }
    const cols = Array.from({ length: columns }, () => []);
    const colHeights = Array(columns).fill(0);
    pagedImages.forEach((img) => {
      const minCol = colHeights.indexOf(Math.min(...colHeights));
      cols[minCol].push(img);
      colHeights[minCol] += img.height
        ? parseInt(img.height.replace("h-", ""))
        : 1;
    });
    return cols;
  }, [pagedImages]);
  const masonryColumns = getDynamicMasonryColumns();

  // Modal handlers
  const openModal = (imgIdx) => {
    setModalIndex(imgIdx);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const showPrev = () =>
    setModalIndex((idx) => (idx - 1 + pagedImages.length) % pagedImages.length);
  const showNext = () => setModalIndex((idx) => (idx + 1) % pagedImages.length);

  // Keyboard navigation for modal
  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalOpen, pagedImages.length]);

  const handleImageError = (id) => {
    setHiddenImages((prev) => new Set(prev).add(id));
  };

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.dataset.id;
          if (entry.isIntersecting) {
            // Add to visible set to trigger animation
            setVisibleSet((prev) => {
              const newSet = new Set(prev);
              newSet.add(id);
              return newSet;
            });
          } else {
            // Remove from visible set so animation can re-trigger
            setVisibleSet((prev) => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
            });
          }
        });
      },
      { threshold: 0.2 }
    );
    Object.values(imageRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, [masonryColumns]);

  useEffect(() => {
    const observers = {};
    pagedImages.forEach((img) => {
      if (img.type === 'video') {
        const videoEl = videoNodeRefs.current[img.id];
        if (!videoEl) return;
        if (observers[img.id]) observers[img.id].disconnect();
        observers[img.id] = new window.IntersectionObserver(
          ([entry]) => {
            setPlayingVideos((prev) => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) {
                newSet.add(img.id);
              } else {
                newSet.delete(img.id);
              }
              return newSet;
            });
          },
          { threshold: 0.5 }
        );
        observers[img.id].observe(videoEl);
      }
    });
    return () => {
      Object.values(observers).forEach((observer) => observer.disconnect());
    };
  }, [pagedImages]);

  return (
    <>
      <div className="pt-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {masonryColumns.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4 min-w-0">
              {col.map((image, imgIdx) => {
                const globalIdx = pagedImages.findIndex(
                  (img) => img.id === image.id
                );
                if (hiddenImages.has(image.id)) return null;
                const isVideo = image.type === 'video';
                // Initialize video state if not already set
                let isPlaying = true;
                let isMuted = true;
                let showCenterIcon = false;
                if (isVideo) {
                  isPlaying = videoStates[image.id]?.isPlaying ?? true;
                  isMuted = videoStates[image.id]?.isMuted ?? true;
                  showCenterIcon = videoStates[image.id]?.showCenterIcon ?? false;
                }
                // Video controls handlers
                const handleVideoClick = (e) => {
                  e.stopPropagation();
                  const videoEl = videoNodeRefs.current[image.id];
                  if (!videoEl) return;
                  // Toggle play/pause
                  if (videoEl.paused) {
                    videoEl.play();
                    setVideoStates((prev) => ({
                      ...prev,
                      [image.id]: {
                        ...prev[image.id],
                        isPlaying: true,
                        showCenterIcon: true,
                        iconType: 'play',
                      },
                    }));
                  } else {
                    videoEl.pause();
                    setVideoStates((prev) => ({
                      ...prev,
                      [image.id]: {
                        ...prev[image.id],
                        isPlaying: false,
                        showCenterIcon: true,
                        iconType: 'pause',
                      },
                    }));
                  }
                  // Hide overlay after animation duration
                  setTimeout(() => {
                    setVideoStates((prev) => ({
                      ...prev,
                      [image.id]: {
                        ...prev[image.id],
                        showCenterIcon: false,
                      },
                    }));
                  }, 600); // match animation duration
                };
                const handleMuteToggle = (e) => {
                  e.stopPropagation();
                  const videoEl = videoNodeRefs.current[image.id];
                  if (!videoEl) return;
                  videoEl.muted = !videoEl.muted;
                  setVideoStates((prev) => ({
                    ...prev,
                    [image.id]: {
                      ...prev[image.id],
                      isMuted: videoEl.muted,
                    },
                  }));
                };
                const handleVideoDoubleClick = (e) => {
                  e.stopPropagation();
                  openModal(globalIdx);
                };
                return (
                  <div
                    key={`${image.id}-${imgIdx}`}
                    className="group cursor-pointer break-inside-avoid mb-4"
                    onClick={() => openModal(globalIdx)}
                    ref={(el) => (imageRefs.current[image.id] = el)}
                    data-id={image.id}
                    style={{
                      ...fadeInStyle,
                      ...(visibleSet.has(String(image.id))
                        ? fadeInActiveStyle
                        : {}),
                    }}
                  >
                    <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] block">
                      {isVideo ? (
                        <>
                          <VideoLoader
                            src={image.src}
                            poster={image.poster}
                            isInViewport={playingVideos.has(image.id) && !modalOpen}
                            modalOpen={modalOpen && modalIndex === globalIdx}
                            onDoubleClick={handleVideoDoubleClick}
                            onCloseModal={() => setModalOpen(false)}
                            videoRef={el => { videoNodeRefs.current[image.id] = el; }}
                            // Shared state props
                            isPlaying={videoStates[image.id]?.isPlaying ?? false}
                            setIsPlaying={val => setVideoStates(prev => ({ ...prev, [image.id]: { ...prev[image.id], isPlaying: val } }))}
                            isMuted={videoStates[image.id]?.isMuted ?? true}
                            setIsMuted={val => setVideoStates(prev => ({ ...prev, [image.id]: { ...prev[image.id], isMuted: val } }))}
                          />
                        </>
                      ) : (
                        <img
                          src={image.src}
                          alt=""
                          className={
                            "w-full object-cover transition-transform duration-300 object-center " +
                            (image.height || "h-48") +
                            " w-full max-w-full group-hover:blur-sm"
                          }
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                            display: "block",
                            maxWidth: "100%",
                          }}
                          onError={() => handleImageError(image.id)}
                          onContextMenu={e => e.preventDefault()}
                        />
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div
          ref={loaderRef}
          className="h-40 mt-8 flex items-center justify-center"
        >
          {imagesToShow < visibleImages.length ? (
            <div className="text-gray-400">Scroll for more</div>
          ) : (
            filterCategory === 'all' && (
              <div className="flex flex-col items-center justify-center w-full">
                <div className="text-pink-500 font-extrabold text-3xl md:text-4xl mb-2 animate-bounce text-center">
                  You have reached the end of the gallery!
                </div>
                <div className="text-white font-bold text-2xl md:text-3xl mb-1 text-center">
                  Want More?
                </div>
                <div className="text-gray-300 font-semibold text-xl md:text-2xl mb-2 text-center">
                  Follow us on Instagram
                </div>
                <a href="https://www.instagram.com/collegetips.in/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 text-pink-500 hover:text-pink-400 text-2xl md:text-3xl font-bold">
                  <svg width="36" height="36" viewBox="0 0 448 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="448" height="512" rx="100" fill="url(#ig-gradient)"/>
                    <defs>
                      <linearGradient id="ig-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f58529"/>
                        <stop offset="30%" stopColor="#dd2a7b"/>
                        <stop offset="60%" stopColor="#8134af"/>
                        <stop offset="100%" stopColor="#515bd4"/>
                      </linearGradient>
                    </defs>
                    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9 114.9-51.3 114.9-114.9S287.7 141 224.1 141zm0 186c-39.5 0-71.5-32-71.5-71.5s32-71.5 71.5-71.5 71.5 32 71.5 71.5-32 71.5-71.5 71.5zm146.4-194.3c0 14.9-12 26.9-26.9 26.9s-26.9-12-26.9-26.9 12-26.9 26.9-26.9 26.9 12 26.9 26.9zm76.1 27.2c-1.7-35.3-9.9-66.7-36.2-92.9S388.6 1.7 353.3 0C317.5-1.7 130.5-1.7 94.7 0 59.4 1.7 28 9.9 1.7 36.2S1.7 59.4 0 94.7C-1.7 130.5-1.7 317.5 0 353.3c1.7 35.3 9.9 66.7 36.2 92.9s57.6 34.5 92.9 36.2c35.8 1.7 222.8 1.7 258.6 0 35.3-1.7 66.7-9.9 92.9-36.2s34.5-57.6 36.2-92.9c1.7-35.8 1.7-222.8 0-258.6zM398.8 388c-7.8 19.6-22.9 34.7-42.5 42.5-29.4 11.7-99.2 9-132.3 9s-102.9 2.6-132.3-9c-19.6-7.8-34.7-22.9-42.5-42.5-11.7-29.4-9-99.2-9-132.3s-2.6-102.9 9-132.3c7.8-19.6 22.9-34.7 42.5-42.5C91.9 21.6 161.7 24.2 194.8 24.2s102.9-2.6 132.3 9c19.6 7.8 34.7 22.9 42.5 42.5 11.7 29.4 9 99.2 9 132.3s2.6 102.9-9 132.3z" fill="#fff"/>
                  </svg>
                  @collegetips.in
                </a>
              </div>
            )
          )}
        </div>
      </div>
      <footer className="w-full text-center py-4 text-gray-500 text-sm border-t mt-8">
        &copy; {new Date().getFullYear()} Vishal Bisht. All rights reserved.
      </footer>
      {/* Fullscreen Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 transition-all">
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full px-3 py-1 hover:bg-opacity-70 transition"
            onClick={closeModal}
            aria-label="Close"
          >
            &times;
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full px-3 py-1 hover:bg-opacity-70 transition"
            onClick={showPrev}
            aria-label="Previous"
          >
            &#8592;
          </button>
          {pagedImages[modalIndex]?.type === 'video' ? (
            <div
              className="flex flex-col items-center justify-center"
              style={{
                width: 'min(420px, 90vw)',
                height: 'min(750px, 90vh)',
                background: '#111',
                borderRadius: '1.5rem',
                boxShadow: '0 0 32px 8px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#111',
              }}>
                <VideoLoader
                  src={pagedImages[modalIndex]?.src}
                  poster={pagedImages[modalIndex]?.poster}
                  isInViewport={true}
                  modalOpen={true}
                  onDoubleClick={() => {}}
                  onCloseModal={closeModal}
                  videoRef={el => { videoNodeRefs.current[pagedImages[modalIndex]?.id] = el; }}
                  showModalNav={true}
                  onModalPrev={showPrev}
                  onModalNext={showNext}
                  onModalClose={closeModal}
                  // Shared state props
                  isPlaying={videoStates[pagedImages[modalIndex]?.id]?.isPlaying ?? false}
                  setIsPlaying={val => setVideoStates(prev => ({ ...prev, [pagedImages[modalIndex]?.id]: { ...prev[pagedImages[modalIndex]?.id], isPlaying: val } }))}
                  isMuted={videoStates[pagedImages[modalIndex]?.id]?.isMuted ?? true}
                  setIsMuted={val => setVideoStates(prev => ({ ...prev, [pagedImages[modalIndex]?.id]: { ...prev[pagedImages[modalIndex]?.id], isMuted: val } }))}
                />
              </div>
            </div>
          ) : (
            <img
              src={pagedImages[modalIndex]?.src}
              alt=""
              className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl object-contain border-4 border-white border-opacity-10"
              style={{ background: "#222" }}
            />
          )}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full px-3 py-1 hover:bg-opacity-70 transition"
            onClick={showNext}
            aria-label="Next"
          >
            &#8594;
          </button>
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-lg font-semibold bg-black bg-opacity-40 px-4 py-2 rounded-lg"
            style={filterCategory === 'all' ? { display: 'none' } : {}}
          >
            {(() => {
              if (!filterCategory || filterCategory === 'all') return null;
              const cat = pagedImages[modalIndex]?.category;
              if (filterCategory && filterCategory !== 'all') {
                return filterCategory
                  .replace("bts", "Behind-The-Scenes")
                  .replace("work", "Work Hard, Play Hard")
                  .replace("fun", "Work Hard, Play Hard")
                  .replace("team", "Team Vibes")
                  .replace("campaign", "Creative Campaigns")
                  .replace("default", "");
              }
              if (!cat) return "Image";
              if (Array.isArray(cat)) {
                return cat.map(c =>
                  c.replace("bts", "Behind-The-Scenes")
                   .replace("fun", "Work Hard, Play Hard")
                   .replace("team", "Team Vibes")
                   .replace("campaign", "Creative Campaigns")
                   .replace("default", "")
                ).join(", ");
              }
              return cat
                .replace("bts", "Behind-The-Scenes")
                .replace("fun", "Work Hard, Play Hard")
                .replace("team", "Team Vibes")
                .replace("campaign", "Creative Campaigns")
                .replace("default", "");
            })()}
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;
