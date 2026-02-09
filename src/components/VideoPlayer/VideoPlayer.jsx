import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { closePlayer, setCurrentVideo } from '../../store/index';
import { formatTime } from '../../utils/index';
import Button from '../../components/Button/Button';
import RelatedVideos from '../RelatedVideos/RelatedVideos';
import './VideoPlayer.css';
import Hls from "hls.js";
// Add this import near the other imports
const VideoPlayer = () => {
  const htmlVideoRef = useRef(null);
const hlsRef = useRef(null);

  const dispatch = useDispatch();
  const { currentVideo, categories } = useSelector((state) => state.player);
  
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const [showVideoList, setShowVideoList] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showRelated, setShowRelated] = useState(false);
  const [skipFeedback, setSkipFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Get related videos
  const relatedVideos = currentVideo ? 
    categories.find(c => c.category.slug === currentVideo.category.slug)?.contents
      .filter(v => v.slug !== currentVideo.slug) || []
    : [];
const handleSwipeUp = () => {
  if (relatedVideos.length > 0) {
    setShowVideoList(true);
    setShowControls(true); // Keep controls visible when list is shown
  }
};

const handleVideoSelectFromList = (video) => {
  dispatch(setCurrentVideo({ ...video, category: currentVideo.category }));
  setShowVideoList(false);
  setError(null);
  setIsLoading(true);
};
  // Extract YouTube ID from embed URL
  const extractYouTubeId = (url) => {
    if (!url) return null;
    
    // Handle embed URLs: https://youtube.com/embed/VIDEO_ID
    if (url.includes('embed/')) {
      const parts = url.split('embed/');
      return parts[1]?.split('?')[0];
    }
    
    // Handle watch URLs: https://youtube.com/watch?v=VIDEO_ID
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      return urlParams.get('v');
    }
    
    // Handle youtu.be URLs: https://youtu.be/VIDEO_ID
    if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/');
      return parts[1]?.split('?')[0];
    }
    
    return null;
  };
const getVideoType = (url) => {
  if (!url) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.endsWith(".m3u8")) return "hls";
  return "mp4";
};
useEffect(() => {
  if (!currentVideo?.mediaUrl) return;

  const url = currentVideo.mediaUrl;
  const type = getVideoType(url);

  setIsLoading(true);
  setError(null);

  // Cleanup old players
  if (youtubePlayerRef.current) {
    youtubePlayerRef.current.destroy();
    youtubePlayerRef.current = null;
  }

  if (hlsRef.current) {
    hlsRef.current.destroy();
    hlsRef.current = null;
  }

  if (type === "youtube") {
    const videoId = extractYouTubeId(url);
    if (!videoId) return setError("Invalid YouTube URL");

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => initializeYouTubePlayer(videoId);
    } else {
      initializeYouTubePlayer(videoId);
    }
  }

  else if (type === "hls") {
    const video = htmlVideoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play();
    }
  }

  else {
    // MP4
    const video = htmlVideoRef.current;
    video.src = url;
    video.load();
    video.play();
  }

}, [currentVideo]);

  // Initialize YouTube player
  const initializeYouTubePlayer = (videoId) => {
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.destroy();
    }

    youtubePlayerRef.current = new window.YT.Player('youtube-player', {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0, // Hide YouTube's default controls
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        fs: 0, // Disable fullscreen button
        playsinline: 1
      },
      events: {
        onReady: (event) => {
          console.log('YouTube player ready');
          setIsLoading(false);
          setDuration(event.target.getDuration());
          setVolume(event.target.getVolume());
          setIsMuted(event.target.isMuted());
          
          // Start progress tracking
          startProgressTracking();
        },
        onStateChange: (event) => {
          switch(event.data) {
            case window.YT.PlayerState.PLAYING:
              setIsPlaying(true);
              setIsLoading(false);
              break;
            case window.YT.PlayerState.PAUSED:
              setIsPlaying(false);
              break;
            case window.YT.PlayerState.ENDED:
              setIsPlaying(false);
              if (relatedVideos.length > 0) {
                setShowRelated(true);
              }
              break;
            case window.YT.PlayerState.BUFFERING:
              setIsLoading(true);
              break;
          }
        },
        onError: (event) => {
          console.error('YouTube player error:', event.data);
          setIsLoading(false);
          setError('Failed to load YouTube video');
        }
      }
    });
  };

  // Track video progress
  const startProgressTracking = () => {
    const updateProgress = () => {
      if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
        setCurrentTime(youtubePlayerRef.current.getCurrentTime());
        setDuration(youtubePlayerRef.current.getDuration());
      }
    };
    
    // Update every 250ms for smooth progress bar
    const interval = setInterval(updateProgress, 250);
    
    return () => clearInterval(interval);
  };
useEffect(() => {
  const video = htmlVideoRef.current;
  if (!video) return;

  const onLoaded = () => {
    setDuration(video.duration);
    setIsLoading(false);
  };

  const onTimeUpdate = () => setCurrentTime(video.currentTime);
  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);
  const onEnded = () => {
    setIsPlaying(false);
    if (relatedVideos.length) setShowRelated(true);
  };

  video.addEventListener("loadedmetadata", onLoaded);
  video.addEventListener("timeupdate", onTimeUpdate);
  video.addEventListener("play", onPlay);
  video.addEventListener("pause", onPause);
  video.addEventListener("ended", onEnded);

  return () => {
    video.removeEventListener("loadedmetadata", onLoaded);
    video.removeEventListener("timeupdate", onTimeUpdate);
    video.removeEventListener("play", onPlay);
    video.removeEventListener("pause", onPause);
    video.removeEventListener("ended", onEnded);
  };
}, [currentVideo]);

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  // YouTube Player Controls
const togglePlayPause = () => {
  const type = getVideoType(currentVideo.mediaUrl);

  if (type === "youtube" && youtubePlayerRef.current) {
    isPlaying
      ? youtubePlayerRef.current.pauseVideo()
      : youtubePlayerRef.current.playVideo();
  } else if (htmlVideoRef.current) {
    isPlaying
      ? htmlVideoRef.current.pause()
      : htmlVideoRef.current.play();
  }
};


  const skip = (seconds) => {
    if (!youtubePlayerRef.current) return;
    
    const currentTime = youtubePlayerRef.current.getCurrentTime();
    const newTime = Math.max(0, currentTime + seconds);
    youtubePlayerRef.current.seekTo(newTime, true);
    
    setSkipFeedback(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
    setTimeout(() => setSkipFeedback(null), 1000);
    setShowControls(true);
  };

const seek = (time) => {
  const type = getVideoType(currentVideo.mediaUrl);

  if (type === "youtube" && youtubePlayerRef.current) {
    youtubePlayerRef.current.seekTo(time, true);
  } else if (htmlVideoRef.current) {
    htmlVideoRef.current.currentTime = time;
  }
};

  const toggleMute = () => {
    if (!youtubePlayerRef.current) return;
    
    if (isMuted) {
      youtubePlayerRef.current.unMute();
    } else {
      youtubePlayerRef.current.mute();
    }
    setIsMuted(!isMuted);
    setShowControls(true);
  };

const adjustVolume = (delta) => {
  const type = getVideoType(currentVideo.mediaUrl);

  if (type === "youtube" && youtubePlayerRef.current) {
    const newVol = Math.max(0, Math.min(volume + delta, 100));
    youtubePlayerRef.current.setVolume(newVol);
    setVolume(newVol);
  } else if (htmlVideoRef.current) {
    const newVol = Math.max(0, Math.min(volume + delta, 100));
    htmlVideoRef.current.volume = newVol / 100;
    setVolume(newVol);
  }
};


  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    
    setShowControls(true);
  };

  const changePlaybackRate = (rate) => {
    if (!youtubePlayerRef.current) return;
    
    youtubePlayerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
    setShowControls(true);
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    seek(newTime);
  };

  const handleRelatedVideoSelect = (video) => {
    dispatch(setCurrentVideo({ ...video, category: currentVideo.category }));
    setShowRelated(false);
    setError(null);
    setIsLoading(true);
  };

  const handleClose = () => {
    dispatch(closePlayer());
  };

  if (!currentVideo) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="video-player fullscreen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div 
          ref={containerRef}
          className="video-container"
          onDoubleClick={toggleFullscreen}
          onMouseMove={() => setShowControls(true)}
          onTouchStart={() => setShowControls(true)}
        >
          {/* YouTube Player Container */}
{getVideoType(currentVideo.mediaUrl) === "youtube" ? (
  <div id="youtube-player" className="youtube-player-container"></div>
) : (
  <video
    ref={htmlVideoRef}
    className="html5-video-player"
    playsInline
  />
)}


          {/* Loading Indicator */}
          {isLoading && (
            <div className="video-loading">
              <div className="loading-spinner"></div>
              <p>Loading video...</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="video-error">
              <h3>Playback Error</h3>
              <p>{error}</p>
              <div className="error-actions">
                <Button onClick={handleClose} variant="secondary">
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Skip Feedback */}
          {skipFeedback && (
            <div className="skip-feedback">
              {skipFeedback}
            </div>
          )}

          {/* Controls Overlay */}
          <motion.div
            className="controls-overlay"
            initial={{ opacity: 1 }}
            animate={{ opacity: showControls ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => {
              if (isPlaying) {
                setTimeout(() => setShowControls(false), 3000);
              }
            }}
          >
            {/* Top Controls */}
            <div className="controls-top">
              <Button
                variant="icon"
                onClick={handleClose}
                icon="✕"
                className="close-btn"
                aria-label="Close player"
              />
              <h2 className="video-title">{currentVideo.title}</h2>
              <div className="top-right-controls">
                <Button
                  variant="icon"
                  onClick={toggleFullscreen}
                  icon="⛶"
                  aria-label="Toggle fullscreen"
                />
              </div>
            </div>

            {/* Center Controls */}
            <div className="controls-center">
              <Button
                variant="icon"
                onClick={() => skip(-10)}
                icon="⏪"
                className="control-btn skip-btn"
                aria-label="Skip back 10 seconds"
              />
              <Button
                variant="icon"
                onClick={togglePlayPause}
                icon={isPlaying ? '⏸' : '▶'}
                className="control-btn play-btn"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              />
              <Button
                variant="icon"
                onClick={() => skip(10)}
                icon="⏩"
                className="control-btn skip-btn"
                aria-label="Skip forward 10 seconds"
              />
            </div>

            {/* Bottom Controls */}
            <div className="controls-bottom">
              {/* Progress Bar */}
              <div 
                ref={progressRef}
                className="progress-container"
                onClick={handleProgressClick}
              >
                <div 
                  className="progress-bar"
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                />
                <input
                  type="range"
                  className="progress-slider"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  aria-label="Video progress"
                />
              </div>

              {/* Time and Additional Controls */}
              <div className="bottom-controls-row">
                <div className="time-display">
                  <span className="current-time">{formatTime(currentTime)}</span>
                  <span className="duration-separator">/</span>
                  <span className="duration-time">{formatTime(duration)}</span>
                </div>

                <div className="secondary-controls">
                  {/* Playback Speed */}
                  <div className="playback-speed">
                    <select
                      value={playbackRate}
                      onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                      aria-label="Playback speed"
                    >
                      <option value="0.25">0.25x</option>
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">Normal</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                  </div>

                  {/* Volume Control */}
                  <div className="volume-control">
                    <Button
                      variant="icon"
                      onClick={toggleMute}
                      icon={isMuted ? '🔇' : volume > 50 ? '🔊' : '🔉'}
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={volume}
                      onChange={(e) => {
                        const newVol = parseInt(e.target.value);
                        setVolume(newVol);
                        if (youtubePlayerRef.current) {
                          youtubePlayerRef.current.setVolume(newVol);
                          if (newVol > 0 && isMuted) {
                            youtubePlayerRef.current.unMute();
                            setIsMuted(false);
                          }
                        }
                      }}
                      className="volume-slider"
                      aria-label="Volume"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Videos Sidebar */}
        <AnimatePresence>
          {showRelated && relatedVideos.length > 0 && (
            <motion.div
              className="related-videos-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="sidebar-header">
                <h3>Up Next</h3>
                <Button
                  variant="icon"
                  onClick={() => setShowRelated(false)}
                  icon="✕"
                  aria-label="Close related videos"
                />
              </div>
              <RelatedVideos
                videos={relatedVideos}
                category={currentVideo.category}
                onVideoSelect={handleRelatedVideoSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoPlayer;