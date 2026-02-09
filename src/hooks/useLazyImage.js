// hooks/useLazyImage.js
import { useState, useEffect, useRef, useCallback } from 'react';

const useLazyImage = ({
  src,
  id,
  index = 0,
  sizes = { width: 400, height: 225 },
  options = {
    threshold: 0.1,
    rootMargin: '100px',
    priority: false,
    enableBlur: true,
    retryCount: 2
  }
}) => {
  const [state, setState] = useState({
    isLoaded: false,
    isError: false,
    isVisible: false,
    isLoading: false,
    retryAttempt: 0
  });

  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const mountedRef = useRef(true);

  // Generate placeholder color based on video ID
  const getPlaceholderColor = useCallback((id) => {
    const colors = [
      'linear-gradient(135deg, #1a237e 0%, #311b92 100%)',
      'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
      'linear-gradient(135deg, #880e4f 0%, #ad1457 100%)',
      'linear-gradient(135deg, #004d40 0%, #00695c 100%)',
      'linear-gradient(135deg, #bf360c 0%, #e65100 100%)',
    ];
    
    if (!id) return colors[0];
    const hash = id.split('').reduce((acc, char) => 
      ((acc << 5) - acc) + char.charCodeAt(0), 0);
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Optimize image URL for CDN
  const getOptimizedUrl = useCallback((src, width, height, quality = 80) => {
    if (!src) return '';
    
    // Cloudinary
    if (src.includes('cloudinary.com')) {
      const base = src.replace('/upload/', `/upload/q_${quality},w_${width},h_${height},c_fill/`);
      return base;
    }
    
    // Imgix
    if (src.includes('imgix.net')) {
      const url = new URL(src);
      url.searchParams.set('w', width);
      url.searchParams.set('h', height);
      url.searchParams.set('q', quality);
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('auto', 'format,compress');
      return url.toString();
    }
    
    // Generic URL with params
    try {
      const url = new URL(src);
      url.searchParams.set('w', width);
      url.searchParams.set('h', height);
      url.searchParams.set('q', quality);
      return url.toString();
    } catch {
      return src;
    }
  }, []);

  // Preload image with timeout
  const preloadImage = useCallback((url) => {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        resolve({ success: false, error: 'timeout' });
      }, 5000); // 5 second timeout

      img.src = url;
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve({ success: true, url });
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve({ success: false, url });
      };
    });
  }, []);

  // Load image function
  const loadImage = useCallback(async () => {
    if (!src || state.isLoaded || state.isError) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Generate optimized URL
      const optimizedUrl = getOptimizedUrl(
        src, 
        sizes.width, 
        sizes.height, 
        75 // Medium quality first
      );

      const result = await preloadImage(optimizedUrl);

      if (!mountedRef.current) return;

      if (result.success) {
        // Load high quality after medium loads
        const highQualityUrl = getOptimizedUrl(
          src,
          sizes.width,
          sizes.height,
          85
        );

        setState(prev => ({
          ...prev,
          isLoaded: true,
          isLoading: false,
          currentSrc: optimizedUrl
        }));

        // Preload high quality in background
        setTimeout(() => {
          if (mountedRef.current) {
            const img = new Image();
            img.src = highQualityUrl;
          }
        }, 300);
      } else {
        throw new Error('Failed to load image');
      }
    } catch (error) {
      if (!mountedRef.current) return;

      if (state.retryAttempt < options.retryCount) {
        // Retry logic
        setTimeout(() => {
          if (mountedRef.current) {
            setState(prev => ({
              ...prev,
              retryAttempt: prev.retryAttempt + 1
            }));
            loadImage();
          }
        }, 1000 * (state.retryAttempt + 1));
      } else {
        setState(prev => ({
          ...prev,
          isError: true,
          isLoading: false
        }));
      }
    }
  }, [src, sizes, state.isLoaded, state.isError, state.retryAttempt, options.retryCount]);

  // Setup Intersection Observer
  useEffect(() => {
    if (!src || options.priority) {
      setState(prev => ({ ...prev, isVisible: true }));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState(prev => ({ ...prev, isVisible: true }));
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: options.rootMargin,
        threshold: options.threshold
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [src, options.priority, options.rootMargin, options.threshold]);

  // Load image when visible
  useEffect(() => {
    if (state.isVisible && !state.isLoaded && !state.isError) {
      loadImage();
    }
  }, [state.isVisible, state.isLoaded, state.isError, loadImage]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      observerRef.current?.disconnect();
    };
  }, []);

  // Return values
  return {
    state,
    imgRef,
    placeholderColor: getPlaceholderColor(id),
    optimizedUrl: getOptimizedUrl(src, sizes.width, sizes.height, 85),
    src: state.currentSrc || src
  };
};

export default useLazyImage;