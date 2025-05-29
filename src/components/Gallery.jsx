import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import images from "../data/data.js";

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

  // Only use visibleImages for rendering, not allImages
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
                        <video
                          src={image.src}
                          className={
                            "w-full object-cover transition-transform duration-300 object-center " +
                            (image.height || "h-48") +
                            " w-full max-w-full"
                          }
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                            display: "block",
                            maxWidth: "100%",
                          }}
                          autoPlay
                          muted
                          loop
                          playsInline
                          controls
                          onContextMenu={e => e.preventDefault()}
                        />
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
          <img
            src={pagedImages[modalIndex]?.src}
            alt=""
            className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl object-contain border-4 border-white border-opacity-10"
            style={{ background: "#222" }}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full px-3 py-1 hover:bg-opacity-70 transition"
            onClick={showNext}
            aria-label="Next"
          >
            &#8594;
          </button>
          <div
            className={[
              "absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-lg font-semibold bg-black bg-opacity-40 px-4 py-2 rounded-lg",
              (() => {
                // Use the current filterCategory for color if active, else use firstCat
                const cat = pagedImages[modalIndex]?.category;
                let colorCat = filterCategory && filterCategory !== 'all'
                  ? filterCategory
                  : (Array.isArray(cat) ? cat[0] : cat);
                if (!colorCat) return '';
                if (colorCat === 'team') return 'ring-2 ring-purple-400 shadow-[0_0_16px_4px_rgba(168,85,247,0.5)]';
                if (colorCat === 'campaign') return 'ring-2 ring-pink-400 shadow-[0_0_16px_4px_rgba(244,114,182,0.5)]';
                if (colorCat === 'fun' || colorCat === 'work') return 'ring-2 ring-blue-400 shadow-[0_0_16px_4px_rgba(96,165,250,0.5)]';
                if (colorCat === 'bts') return 'ring-2 ring-gray-400 shadow-[0_0_16px_4px_rgba(156,163,175,0.5)]';
                return 'ring-2 ring-gray-400 shadow-[0_0_16px_4px_rgba(156,163,175,0.3)]';
              })()
            ].join(' ')}
          >
            {(() => {
              const cat = pagedImages[modalIndex]?.category;
              // If a filter is active (not 'all'), only show the display name for the filterCategory
              if (filterCategory && filterCategory !== 'all') {
                // Map filterCategory to display name
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
                // Join all categories, map to display names
                return cat.map(c =>
                  c.replace("bts", "Behind-The-Scenes")
                   .replace("work", "Work Hard, Play Hard")
                   .replace("fun", "Work Hard, Play Hard")
                   .replace("team", "Team Vibes")
                   .replace("campaign", "Creative Campaigns")
                   .replace("default", "")
                ).join(", ");
              }
              return cat
                .replace("bts", "Behind-The-Scenes")
                .replace("work", "Work Hard, Play Hard")
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
