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

   npm run dev

   Website hosted on vercel: https://image-gallery-liard-gamma.vercel.app/

## Customization
- To add or change categories, update the filter buttons in `src/App.jsx` and the `category` field in `src/data/data.js`.
- To change hover or modal styles, edit `src/components/Gallery.jsx`.

---
## Videos added

### Current Issues with Videos
- Videos are not shown in the modal view; only images are displayed in fullscreen modal.
- When navigating in modal, videos are skipped and cannot be viewed in fullscreen.
- Video playback, mute/unmute, and play/pause controls are not synced with the modal view.

---
# If you would like to contribute improvements or new features for video support in modal view, feel free to open a pull request!

---

**Made with React, Vite and Tailwindcss.**