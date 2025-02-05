import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { slides } from '../data/slides.js';

// Hero images with their content
// const slides = [
//   {
//     image: "data:image/jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAUFBQUFBQUGBgUICAcICAsKCQkKCxEMDQwNDBEP/2Q==",
//     title: "Summer Collection 2024",
//     description: "Discover the latest trends in fashion and explore our new collection.",
//     buttonText: "Shop Now",
//   },
//   {
//     image: "data:image/jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAUFBQUFBQUGBgUICAcICAsKCQkKCxEMDQwNDBEP/2Q==",
//     title: "Spring Essentials",
//     description: "Refresh your wardrobe with our curated selection of spring must-haves.",
//     buttonText: "Explore More",
//   },
// ];

export function Hero() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrent((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  return (
    <div 
      className="relative h-[500px] overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Background Image and Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-start px-8 sm:px-12">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl text-white"
            >
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                {slides[current].title}
              </h1>
              <p className="text-lg mb-8">
                {slides[current].description}
              </p>
              <button className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
                {slides[current].buttonText}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        {slides.map((_slide: any, index: number) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === current 
                ? 'bg-white w-4' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
}