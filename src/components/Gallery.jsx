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
          className="h-20 mt-8 flex items-center justify-center"
        >
          {imagesToShow < visibleImages.length ? (
            <div className="text-gray-400">Scroll for more</div>
          ) : (
            <div className="text-gray-500">
              All images loaded ({visibleImages.length})
            </div>
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
