import { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import HomePage from './pages/Homepage/HomePage';
import './App.css';

const VideoPlayer = lazy(() => import('./components/VideoPlayer/VideoPlayer'));

function App() {
  const currentVideo = useSelector((state) => state.player.currentVideo);
  const isMinimized = useSelector((state) => state.player.isMinimized);

  return (
    <div className="app">
      <HomePage />
      
      <Suspense fallback={null}>
        {currentVideo && <VideoPlayer />}
      </Suspense>
      
      {currentVideo && isMinimized && <div className="backdrop-blur" />}
    </div>
  );
}

export default App;