import { motion } from 'framer-motion';
import { memo } from 'react';
import './VideoCard.css';

const VideoCard = memo(({ video, categoryName, onClick, index }) => {
  return (
    <motion.div
      className="video-card"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="video-card__thumbnail">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title}
          loading="lazy"
        />
        <div className="video-card__duration">{video.duration}</div>
        <div className="video-card__overlay">
          <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      <div className="video-card__info">
        <h3 className="video-card__title">{video.title}</h3>
        <span className="video-card__category">{categoryName}</span>
      </div>
    </motion.div>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;