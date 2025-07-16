// components/skills/ImageCarousel.js
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

const ImageCarousel = ({ images, title }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const scrollContainerRef = useRef(null);

    // Update scroll button states
    const updateScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    // Smooth scroll to specific image
    const scrollToImage = (index) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const imageWidth = container.clientWidth;
            const scrollPosition = index * imageWidth;
            
            container.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
            setCurrentIndex(index);
        }
    };

    // Handle scroll events to update current index
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollLeft = container.scrollLeft;
            const imageWidth = container.clientWidth;
            const newIndex = Math.round(scrollLeft / imageWidth);
            
            setCurrentIndex(newIndex);
            updateScrollButtons();
        }
    };

    // Navigate to previous image
    const goToPrevious = () => {
        if (currentIndex > 0) {
            scrollToImage(currentIndex - 1);
        }
    };

    // Navigate to next image
    const goToNext = () => {
        if (currentIndex < images.length - 1) {
            scrollToImage(currentIndex + 1);
        }
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images.length]);

    // Update scroll buttons on mount
    useEffect(() => {
        updateScrollButtons();
    }, [images]);

    // If no images, show placeholder
    if (!images || images.length === 0) {
        return (
            <div className="relative w-full max-w-4xl mx-auto h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center">
                <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No images available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group w-full max-w-4xl mx-auto">
            {/* Main carousel container with optimized sizing */}
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar rounded-xl"
                style={{ 
                    scrollSnapType: 'x mandatory',
                    aspectRatio: '16 / 9'
                }}
                onScroll={handleScroll}
            >
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="min-w-full relative snap-start"
                        style={{ aspectRatio: '16 / 9' }}
                    >
                        <Image
                            src={image.url}
                            alt={image.alt || `${title} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 900px"
                            priority={index === 0}
                        />
                    </div>
                ))}
            </div>

            {/* Navigation buttons - only show if multiple images */}
            {images.length > 1 && (
                <>
                    {/* Previous button */}
                    <button
                        onClick={goToPrevious}
                        disabled={!canScrollLeft}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg transition-all duration-200 ${
                            canScrollLeft 
                                ? 'opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl' 
                                : 'opacity-0 cursor-not-allowed'
                        }`}
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>

                    {/* Next button */}
                    <button
                        onClick={goToNext}
                        disabled={!canScrollRight}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg transition-all duration-200 ${
                            canScrollRight 
                                ? 'opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl' 
                                : 'opacity-0 cursor-not-allowed'
                        }`}
                    >
                        <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>
                </>
            )}

            {/* Dots indicator - only show if multiple images */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToImage(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                                index === currentIndex
                                    ? 'bg-white shadow-lg scale-125'
                                    : 'bg-white/60 hover:bg-white/80'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Image counter */}
            {images.length > 1 && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
};

export default ImageCarousel;
