import { lazy, Suspense, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentVideo } from '../../store/index';
import { motion } from 'framer-motion';
import './HomePage.css';

const VideoCard = lazy(() => import('../../components/VideoCard/Videocard'));

const HomePage = () => {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.player.categories);
  const [searchQuery, setSearchQuery] = useState('');

  const handleVideoClick = (video) => {
    dispatch(setCurrentVideo(video));
  };

  // Filter videos based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase().trim();
    
    return categories
      .map(categoryData => {
        const filteredVideos = categoryData.contents.filter(video => {
          // Safely check each property
          const title = video.title || '';
          const description = video.description || '';
          
          return (
            title.toLowerCase().includes(query) ||
            description.toLowerCase().includes(query)
          );
        });
        
        if (filteredVideos.length === 0) return null;
        
        return {
          ...categoryData,
          contents: filteredVideos
        };
      })
      .filter(Boolean); // Remove null categories
  }, [categories, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Add loading state for categories
  if (!categories || categories.length === 0) {
    return (
      <div className="home-page">
        <header className="home-header">
          <h1 className="home-title">
            Dino<span className="highlight">Play</span>
          </h1>
        </header>
        <div className="home-content">
          <div className="loading-state">
            <div className="loading-skeleton" style={{ height: '300px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <motion.div 
          className="header-content"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h1 className="home-title">
            Dino<span className="highlight">Play</span>
          </h1>
          
          {/* Search Input */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg 
                className="search-icon" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="var(--color-text-secondary)" 
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={handleSearchChange}
                aria-label="Search videos"
              />
              {searchQuery && (
                <button 
                  className="clear-search-btn"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Search Results Info */}
            {searchQuery && (
              <motion.div 
                className="search-results-info"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="search-count">
                  Found {filteredCategories.reduce((acc, cat) => acc + (cat?.contents?.length || 0), 0)} videos
                </span>
                <button 
                  className="clear-search-text"
                  onClick={handleClearSearch}
                >
                  Clear search
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </header>

      <div className="home-content">
        {filteredCategories && filteredCategories.length > 0 ? (
          filteredCategories.map((categoryData, catIndex) => (
            <section key={categoryData.category.slug} className="category-section">
              <motion.div 
                className="category-header"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: catIndex * 0.1, duration: 0.5 }}
              >
                <div className="category-icon">
                  <img src={categoryData.category.iconUrl} alt="" />
                </div>
                <h2 className="category-title">{categoryData.category.name}</h2>
                <div className="category-line"></div>
              </motion.div>

              <div className="videos-grid">
                <Suspense fallback={<div className="loading-skeleton" />}>
                  {categoryData.contents.map((video, index) => (
                    <VideoCard
                      key={video.slug}
                      video={video}
                      categoryName={categoryData.category.name}
                      onClick={() => handleVideoClick({ ...video, category: categoryData.category })}
                      index={index}
                    />
                  ))}
                </Suspense>
              </div>
            </section>
          ))
        ) : searchQuery ? (
          // No results found
          <motion.div 
            className="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="no-results-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <h2 className="no-results-title">No videos found</h2>
            <p className="no-results-text">
              No results found for "<strong>{searchQuery}</strong>". Try different keywords.
            </p>
            <button 
              className="no-results-clear-btn"
              onClick={handleClearSearch}
            >
              Clear search
            </button>
          </motion.div>
        ) : (
          // Show all categories when no search
          categories.map((categoryData, catIndex) => (
            <section key={categoryData.category.slug} className="category-section">
              <motion.div 
                className="category-header"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: catIndex * 0.1, duration: 0.5 }}
              >
                <div className="category-icon">
                  <img src={categoryData.category.iconUrl} alt="" />
                </div>
                <h2 className="category-title">{categoryData.category.name}</h2>
                <div className="category-line"></div>
              </motion.div>

              <div className="videos-grid">
                <Suspense fallback={<div className="loading-skeleton" />}>
                  {categoryData.contents.map((video, index) => (
                    <VideoCard
                      key={video.slug}
                      video={video}
                      categoryName={categoryData.category.name}
                      onClick={() => handleVideoClick({ ...video, category: categoryData.category })}
                      index={index}
                    />
                  ))}
                </Suspense>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;