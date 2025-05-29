import data from "../data/data";

// Simulates a dynamic loading process from your data source
export const fetchImages = async (page, category = "all") => {
  // Simulate network delay (remove in production)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  
  // Shuffle images randomly before filtering and slicing
  const shuffledImages = data
    .map(img => ({ ...img, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ sort, ...img }) => img);

  // Filter by category if needed
  const filteredImages = category !== "all"
    ? shuffledImages.filter(img => {
        if (!img.category) return false;
        if (Array.isArray(img.category)) {
          return img.category.map(c => c.toLowerCase()).includes(category.toLowerCase());
        }
        return (img.category || "").toLowerCase() === category.toLowerCase();
      })
    : shuffledImages;
  
  // Get the next batch of images
  return filteredImages.slice(startIndex, startIndex + pageSize);
};