import { images as allImagesData } from "..//data/images";

// Simulates a dynamic loading process from your data source
export const fetchImages = async (page, category = "all") => {
  // Simulate network delay (remove in production)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  
  // Filter by category if needed
  const filteredImages = category !== "all"
    ? allImagesData.filter(img => (img.category || "").toLowerCase() === category.toLowerCase())
    : allImagesData;
  
  // Get the next batch of images
  return filteredImages.slice(startIndex, startIndex + pageSize);
};