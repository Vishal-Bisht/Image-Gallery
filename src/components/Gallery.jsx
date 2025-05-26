import { useState, useEffect, useRef, useCallback } from "react";
import images from "../data/images.js";

const Gallery = ({ filterCategory = "all" }) => {
  const [allImages, setAllImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentCategory, setCurrentCategory] = useState(filterCategory);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const loaderRef = useRef(null);
  const imagesPerPage = 20;

  useEffect(() => {
    if (currentCategory !== filterCategory) {
      setAllImages([]);
      setPage(1);
      setHasMore(true);
      setCurrentCategory(filterCategory);
    }
  }, [filterCategory, currentCategory]);

  const filteredImages = filterCategory && filterCategory !== "all"
    ? images.filter(img => (img.category || "").toLowerCase() === filterCategory.toLowerCase())
    : images;

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      try {
        const startIndex = (page - 1) * imagesPerPage;
        const endIndex = startIndex + imagesPerPage;
        const newImages = filteredImages.slice(startIndex, endIndex);
        if (newImages.length === 0) {
          setHasMore(false);
        } else {
          setAllImages(prev => {
            const existingIds = new Set(prev.map(img => img.id));
            const uniqueNewImages = newImages.filter(img => !existingIds.has(img.id));
            return [...prev, ...uniqueNewImages];
          });
        }
        if (endIndex >= filteredImages.length) {
          setHasMore(false);
        }
      } catch (error) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    loadImages();
  }, [page, filteredImages]);

  useEffect(() => {
    const currentLoaderRef = loaderRef.current;
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading && hasMore) {
          setPage(prevPage => prevPage + 1);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }
    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [loading, hasMore]);

  // Modal: prevent background scroll
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const getDynamicMasonryColumns = useCallback(() => {
    let columns = 2;
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) columns = 4;
      else if (window.innerWidth >= 768) columns = 3;
    }
    const cols = Array.from({ length: columns }, () => []);
    const colHeights = Array(columns).fill(0);
    allImages.forEach((img) => {
      const minCol = colHeights.indexOf(Math.min(...colHeights));
      cols[minCol].push(img);
      colHeights[minCol] += img.height
        ? parseInt(img.height.replace("h-", ""))
        : 1;
    });
    return cols;
  }, [allImages]);

  const masonryColumns = getDynamicMasonryColumns();

  // Modal handlers
  const openModal = (imgIdx) => {
    setModalIndex(imgIdx);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const showPrev = () => setModalIndex((idx) => (idx - 1 + allImages.length) % allImages.length);
  const showNext = () => setModalIndex((idx) => (idx + 1) % allImages.length);

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
  }, [modalOpen, allImages.length]);

  return (
    <>
      <div className="pt-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {masonryColumns.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4 min-w-0">
              {col.map((image, imgIdx) => {
                // Find the index in allImages for modal navigation
                const globalIdx = allImages.findIndex(img => img.id === image.id);
                return (
                  <div
                    key={`${image.id}-${imgIdx}`}
                    className="group cursor-pointer break-inside-avoid mb-4"
                    onClick={() => openModal(globalIdx)}
                  >
                    <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] block">
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
                          maxWidth: "100%"
                        }}
                      />
                      {/* Hover overlay with caption, no blackout, just floating text */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                      </div>
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
          {loading ? (
            <div className="animate-pulse flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-1 animate-bounce"></div>
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-1 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          ) : !hasMore ? (
            <div className="text-gray-500">
              All images loaded ({allImages.length}/{filteredImages.length})
            </div>
          ) : (
            <div className="text-gray-400">Scroll for more</div>
          )}
        </div>
      </div>
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
            src={allImages[modalIndex]?.src}
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
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-lg font-semibold bg-black bg-opacity-40 px-4 py-2 rounded-lg">
            {allImages[modalIndex]?.category
              ? allImages[modalIndex].category.replace("bts", "Behind-The-Scenes").replace("work", "Work Hard, Play Hard").replace("team", "Team Vibes").replace("campaign", "Creative Campaigns").replace("default","")
              : "Image"}
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;