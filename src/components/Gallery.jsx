import { useState, useEffect, useRef, useCallback } from "react";
import images from "../data/images.js";

const Gallery = ({ filterCategory = "all" }) => {
  const [allImages, setAllImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentCategory, setCurrentCategory] = useState(filterCategory);
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

  return (
    <>
      <div className="pt-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {masonryColumns.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4 min-w-0">
              {col.map((image, imgIdx) => (
                <div
                  key={`${image.id}-${imgIdx}`}
                  className="group cursor-pointer break-inside-avoid mb-4"
                >
                  <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] block">
                    <img
                      src={image.src}
                      alt=""
                      className={
                        "w-full object-cover transition-transform duration-300 group-hover:scale-110 object-center " +
                        (image.height || "h-48") +
                        " w-full max-w-full"
                      }
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                        display: "block",
                        maxWidth: "100%"
                      }}
                    />
                  </div>
                </div>
              ))}
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
    </>
  );
};

export default Gallery;