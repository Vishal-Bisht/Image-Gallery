# CollegTips Image Gallery

A modern, mobile-responsive React image gallery with a beautiful dark gradient background, interactive masonry layout, infinite scroll, and category filtering.

## Features

- **Layout**: Responsive columns for a Pinterest-style look.
- **Infinite Scroll**: Loads more images as you scroll, with a loader and end-of-gallery message.
- **Category Filters**: Filter images by categories like Team Vibes, Creative Campaigns, Work Hard, Play Hard, and Behind-The-Scenes.
- **Interactive Hover**: Images blur and show a category caption on hover.
- **Fullscreen View**: Click any image to view it in a fullscreen modal/lightbox with next/prev navigation and keyboard support.
- **Mobile Responsive**: Looks great on all devices.

## Project Setup

1. **Clone the repository**

   ```sh
   git clone https://github.com/Vishal-Bisht/Image-Gallery.git
   cd "Image Gallery"

   npm install

   - Place your images in the `public/Images` folder.
   - Update `src/data/images.js` to include all your images with the correct `id`, `src`, `height`, and `category`.

   npm run dev

   Website hosted on vercel: https://image-gallery-liard-gamma.vercel.app/

5. **Build for production**

   ```sh
   npm run build
   ```

## Customization
- To add or change categories, update the filter buttons in `src/App.jsx` and the `category` field in `src/data/images.js`.
- To change hover or modal styles, edit `src/components/Gallery.jsx`.

---

**Made with React, Vite, and Tailwind CSS.**