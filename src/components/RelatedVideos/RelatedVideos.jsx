import { motion } from 'framer-motion';
import { memo } from 'react';
import './RelatedVideos.css';

const RelatedVideos = memo(({ videos, category, onVideoSelect, onClose }) => {
  return (
    <motion.div
      className="related-videos"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      <div className="related-videos__header">
        <div className="related-videos__header-left">
          <h3 className="related-videos__title">More from {category.name}</h3>
          <span className="related-videos__count">{videos.length} videos</span>
        </div>
        {onClose && (
          <button className="related-videos__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="related-videos__list">
        {videos.map((video, index) => (
          <motion.div
            key={video.slug}
            className="related-video-item"
            onClick={() => onVideoSelect(video)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
          >

            <div className="related-video__thumbnail">
              <img src={video.thumbnailUrl} alt={video.title} loading="lazy" />
              <div className="related-video__duration">{video.duration}</div>
            </div>
            <div className="related-video__info">
              <h4 className="related-video__title">{video.title}</h4>
              <span className="related-video__category">{category.name}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

RelatedVideos.displayName = 'RelatedVideos';

export default RelatedVideos;