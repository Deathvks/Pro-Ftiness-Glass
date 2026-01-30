/* frontend/src/components/StoryViewer.jsx */
import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { X, Heart, Download, Loader2, ImageOff, Volume2, VolumeX, Trash2, ChevronLeft } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import UserAvatar from './UserAvatar';
import ConfirmationModal from './ConfirmationModal';

const DEFAULT_STORY_DURATION = 5000;

// Configuración de puerto
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'; 
const SERVER_URL = API_URL.replace('/api', '');

// --- Subcomponente: Lista de Likes (Con Animaciones) ---
const LikesListModal = ({ likes, onClose }) => {
    const safeLikes = Array.isArray(likes) ? likes : [];
    const [isClosing, setIsClosing] = useState(false);
    
    // Referencias para detección de gestos
    const listRef = useRef(null);
    const touchStartY = useRef(0);
    const touchStartX = useRef(0);

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
    };

    // Función para cerrar con animación
    const triggerClose = () => {
        setIsClosing(true);
        // Esperar a que termine la animación (0.3s) antes de desmontar
        setTimeout(() => {
            onClose();
        }, 280);
    };

    const handleTouchEnd = (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        
        const deltaY = touchStartY.current - touchEndY; 
        const deltaX = Math.abs(touchStartX.current - touchEndX);

        // Swipe Down para cerrar
        if (deltaY < -50 && deltaX < 50) {
            if (listRef.current && listRef.current.scrollTop <= 0) {
                e.stopPropagation();
                triggerClose();
            }
        }
    };

    return (
        <div 
            className={`absolute inset-0 z-[60] bg-bg-primary flex flex-col ${isClosing ? 'animate-slide-out' : 'animate-slide-in'}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-bg-primary z-10" onClick={(e) => e.stopPropagation()}>
                <button onClick={triggerClose} className="p-1 hover:bg-white/10 rounded-full">
                    <ChevronLeft size={24} className="text-text-primary" />
                </button>
                <h3 className="font-bold text-lg text-text-primary">Me gusta</h3>
            </div>
            <div 
                ref={listRef}
                className="flex-1 overflow-y-auto p-2"
                onClick={(e) => e.stopPropagation()} 
            >
                {safeLikes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-tertiary opacity-60">
                        <Heart size={48} className="mb-2" />
                        <p>Aún no hay me gusta</p>
                    </div>
                ) : (
                    safeLikes.map((user) => (
                        <div key={user.userId} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors">
                            <UserAvatar 
                                user={{ 
                                    username: user.username, 
                                    profile_image_url: user.avatar 
                                }} 
                                size={10} 
                                className="w-10 h-10"
                            />
                            <span className="font-medium text-text-primary">{user.username}</span>
                            <Heart size={16} className="ml-auto text-red-500 fill-current" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Subcomponente: Animación de Corazones y Avatares Flotantes ---
const FloatingHearts = ({ active }) => {
    const [items, setItems] = useState([]);

    const featuredUsers = useMemo(() => {
        if (!Array.isArray(active) || active.length === 0) return [];
        const shuffled = [...active].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }, [active]);

    useEffect(() => {
        if (!Array.isArray(active) || active.length === 0) return;

        const interval = setInterval(() => {
            const id = Date.now();
            const startLeft = Math.random() * 20 + 70;
            const duration = 2.5 + Math.random() * 1.5;
            const wobble = Math.random() * 20 - 10;
            const showAvatar = featuredUsers.length > 0 && Math.random() > 0.5;
            
            let newItem = { 
                id, 
                left: startLeft, 
                duration,
                wobble,
                type: 'heart' 
            };

            if (showAvatar) {
                const randomUser = featuredUsers[Math.floor(Math.random() * featuredUsers.length)];
                newItem.type = 'avatar';
                newItem.avatar = randomUser.avatar || randomUser.profile_image_url;
            }

            setItems(prev => [...prev, newItem]);

            setTimeout(() => {
                setItems(prev => prev.filter(i => i.id !== id));
            }, duration * 1000); 
        }, 500);

        return () => clearInterval(interval);
    }, [active, featuredUsers]);

    return (
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            <style>
                {`
                @keyframes floatUpWithWobble {
                    0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
                    10% { opacity: 1; transform: translateY(-50px) translateX(5px) scale(1.1); }
                    50% { transform: translateY(-250px) translateX(-15px) scale(1); }
                    100% { transform: translateY(-600px) translateX(10px) scale(0.8); opacity: 0; }
                }
                `}
            </style>
            {items.map(item => (
                <div
                    key={item.id}
                    className="absolute bottom-16 flex flex-col items-center"
                    style={{ 
                        left: `${item.left}%`,
                        animation: `floatUpWithWobble ${item.duration}s ease-out forwards`,
                        marginLeft: `${item.wobble}px`
                    }}
                >
                    {item.type === 'avatar' && item.avatar ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/50 shadow-md">
                            <img 
                                src={item.avatar.startsWith('http') ? item.avatar : `${SERVER_URL}${item.avatar}`} 
                                className="w-full h-full object-cover" 
                                alt="" 
                            />
                        </div>
                    ) : (
                        <Heart size={30} className="text-accent fill-accent opacity-90 drop-shadow-md" />
                    )}
                </div>
            ))}
        </div>
    );
};

const StoryViewer = ({ userId, onClose }) => {
  const { 
    stories, 
    myStories, 
    userProfile, 
    markStoryAsViewed, 
    likeStory, 
    deleteMyStory 
  } = useAppStore();

  const [viewingUserId, setViewingUserId] = useState(userId);
  const isMyStory = viewingUserId === userProfile?.id;
  const [isClosingStory, setIsClosingStory] = useState(false); // Estado para animación de cierre

  const getFullImageUrl = useCallback((path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; 
    if (path.startsWith('blob:')) return path; 
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_URL}${cleanPath}`;
  }, []);
  
  const storyData = useMemo(() => {
    if (isMyStory) {
      return { 
        userId: userProfile?.id, 
        username: userProfile?.username || 'Yo', 
        avatar: getFullImageUrl(userProfile?.profile_image_url || userProfile?.avatar), 
        items: myStories 
      };
    }
    
    const group = stories.find(s => s.userId === viewingUserId);
    if (!group) return null;

    const rawUser = group.user || {};
    return {
      userId: group.userId,
      username: group.username || rawUser.username || 'Usuario',
      avatar: getFullImageUrl(group.profile_image_url || rawUser.profile_image_url || group.avatar || rawUser.avatar),
      items: group.items || []
    };
  }, [viewingUserId, isMyStory, stories, myStories, userProfile, getFullImageUrl]);

  const activeStories = useMemo(() => {
    const validStories = (storyData?.items || []).filter(item => {
        const expiry = item.expires_at || item.expiresAt;
        if (!expiry) return true;
        return new Date(expiry) > new Date();
    });

    const uniqueStories = [];
    const seenIds = new Set();
    for (const story of validStories) {
        const id = String(story.id);
        if (!seenIds.has(id)) {
            seenIds.add(id);
            uniqueStories.push(story);
        }
    }
    return uniqueStories;
  }, [storyData]);

  const getInitialIndex = () => {
     const idx = activeStories.findIndex(s => !s.viewed && !isMyStory);
     return idx !== -1 ? idx : 0;
  };

  const [currentIndex, setCurrentIndex] = useState(() => getInitialIndex());
  
  const [isPaused, setIsPaused] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [progress, setProgress] = useState(0);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false); 
  const [isMuted, setIsMuted] = useState(true);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showLikesList, setShowLikesList] = useState(false); 

  const videoRef = useRef(null);
  const animationFrameRef = useRef(null); 
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const pressStartTimeRef = useRef(0);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  
  useEffect(() => {
    if (currentIndex >= activeStories.length && activeStories.length > 0) {
        setCurrentIndex(Math.max(0, activeStories.length - 1));
    }
  }, [activeStories.length, currentIndex]);

  const currentStory = activeStories[currentIndex];
  const nextStory = activeStories[currentIndex + 1];

  const isVideo = useMemo(() => {
    if (!currentStory) return false;
    const type = currentStory.type || '';
    const url = currentStory.url || '';
    return type.startsWith('video') || url.match(/\.(mp4|mov|webm|mkv|m4v)$/i);
  }, [currentStory]);

  const isHDR = currentStory?.isHDR === true || currentStory?.isHDR === 'true';

  const getTimeAgo = (item) => {
    if (!item) return '';
    let dateVal = item.created_at || item.createdAt || item.date || item.timestamp;
    if (!dateVal && (item.expiresAt || item.expires_at)) {
        const expiryDate = new Date(item.expiresAt || item.expires_at);
        dateVal = new Date(expiryDate.getTime() - 86400000);
    }
    if (!dateVal) return '';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return '';
    const now = Date.now();
    const diffMs = now - date.getTime();
    if (diffMs < 0) return '0 seg';
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSecs < 60) return `${diffSecs} seg`;
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    return `${diffDays} d`;
  };

  // Función de cierre animado
  const animateAndClose = useCallback(() => {
      setIsClosingStory(true);
      setTimeout(() => {
          onClose();
      }, 280);
  }, [onClose]);

  const goToNext = useCallback(() => {
    if (currentIndex < activeStories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      if (isMyStory) {
        animateAndClose(); // Cierre animado para mi historia
      } else {
        const currentGroupIndex = stories.findIndex(s => s.userId === viewingUserId);
        let foundNext = false;
        for (let i = currentGroupIndex + 1; i < stories.length; i++) {
            const group = stories[i];
            const validItems = (group.items || []).filter(item => {
               const expiry = item.expires_at || item.expiresAt;
               if (!expiry) return true;
               return new Date(expiry) > new Date();
            });

            if (validItems.length > 0) {
                const firstUnviewed = validItems.findIndex(s => !s.viewed);
                setViewingUserId(group.userId);
                setCurrentIndex(firstUnviewed !== -1 ? firstUnviewed : 0);
                foundNext = true;
                break;
            }
        }
        if (!foundNext) {
            animateAndClose(); // Cierre animado al terminar todas
        }
      }
    }
  }, [currentIndex, activeStories.length, isMyStory, animateAndClose, stories, viewingUserId]);

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  useLayoutEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setIsBuffering(true); 
    setMediaLoaded(false);
    setMediaError(false);
    setShowLikesList(false); 
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
  }, [currentIndex, viewingUserId]);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
        if (!mediaLoaded && !mediaError) {
            setMediaLoaded(true); 
            setIsBuffering(false);
        }
    }, 8000);
    return () => clearTimeout(safetyTimeout);
  }, [currentIndex, mediaLoaded, mediaError]);

  // --- CONTROL DE VIDEO (Play/Pause) ---
  useEffect(() => {
    if (isVideo && videoRef.current) {
        if (isPaused || showDeleteConfirm || showLikesList) {
            videoRef.current.pause();
        } else {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.log("Video play warning:", err);
                });
            }
        }
    }
  }, [isPaused, isVideo, showDeleteConfirm, showLikesList, mediaLoaded]);

  // --- TIMER PRINCIPAL ---
  useEffect(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    if (isPaused || isBuffering || (!mediaLoaded && !mediaError) || showDeleteConfirm || showLikesList) {
      return;
    }

    const animate = () => {
      let shouldContinue = true;

      if (isVideo) {
        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended && videoRef.current.duration > 0) {
            const current = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            const percentage = (current / duration) * 100;
            
            setProgress(percentage);

            if (percentage > 99 || (duration - current) < 0.2 || videoRef.current.ended) {
                shouldContinue = false;
                goToNext();
            }
        }
      } else {
        if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
        }

        const now = Date.now();
        const timeElapsedInThisSegment = now - startTimeRef.current;
        const totalTimeElapsed = timeElapsedInThisSegment + pausedTimeRef.current;
        const newProgress = Math.min((totalTimeElapsed / DEFAULT_STORY_DURATION) * 100, 100);

        setProgress(newProgress);

        if (newProgress >= 100) {
            shouldContinue = false;
            goToNext();
        }
      }

      if (shouldContinue) {
          animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPaused, isBuffering, mediaLoaded, mediaError, isVideo, showDeleteConfirm, showLikesList, goToNext]); 

  const handleVideoLoadedMetadata = () => {
      setMediaLoaded(true);
  };
  
  // Gestos
  const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      handlePauseStart();
  };

  const handleTouchEnd = (e, action) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      
      const deltaY = touchStartY.current - touchEndY; 
      const deltaX = Math.abs(touchStartX.current - touchEndX);

      if (Math.abs(deltaY) > 50 && deltaX < 50) {
          if (deltaY > 0) {
              // Swipe Up
              if (isMyStory) {
                  handleOpenLikesList(e);
              }
              return; 
          } else {
              // Swipe Down
              animateAndClose();
              return;
          }
      }
      handlePauseEnd(e, action);
  };

  const handlePauseStart = () => {
    pressStartTimeRef.current = Date.now(); 
    if (!isPaused && (mediaLoaded || mediaError)) {
        setIsPaused(true);
        if (!isVideo && startTimeRef.current) {
            const now = Date.now();
            pausedTimeRef.current += (now - startTimeRef.current);
            startTimeRef.current = null; 
        }
        if (isVideo && videoRef.current) {
            videoRef.current.pause();
        }
    }
  };

  const handlePauseEnd = (e, action) => {
    if (e && e.cancelable) e.preventDefault();
    if (!showDeleteConfirm && !showLikesList) {
        setIsPaused(false);
        const duration = Date.now() - pressStartTimeRef.current;
        if (duration < 200) {
            if (action === 'prev') goToPrev();
            if (action === 'next') goToNext();
        }
    }
  };

  const handleMouseLeave = () => {
      if (isPaused) setIsPaused(false);
  };

  useEffect(() => {
    if (currentStory && !currentStory.viewed && storyData?.userId) {
      markStoryAsViewed(storyData.userId, currentStory.id);
    }
  }, [currentIndex, currentStory, storyData, markStoryAsViewed]);

  const handleDownload = async (e) => {
    e.stopPropagation();
    const url = getFullImageUrl(currentStory?.url);
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `story-${storyData.username}-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error descargando:", error);
    }
  };

  const handleDeleteClick = (e) => {
      e.stopPropagation();
      setIsPaused(true); 
      setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
      if (currentStory) {
          setIsDeleting(true);
          await deleteMyStory(currentStory.id);
          setIsDeleting(false);
          setShowDeleteConfirm(false);
          setIsPaused(false);
          if (activeStories.length <= 1) {
              animateAndClose();
          }
      }
  };

  const cancelDelete = () => {
      setShowDeleteConfirm(false);
      setIsPaused(false);
      startTimeRef.current = Date.now();
  };

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);
    likeStory(storyData.userId, currentStory.id);
  };

  const toggleMute = (e) => {
      e.stopPropagation();
      setIsMuted(!isMuted);
  };

  const handleOpenLikesList = (e) => {
      if (e) e.stopPropagation();
      setIsPaused(true);
      setShowLikesList(true);
  };

  const handleCloseLikesList = (e) => {
      if(e) e.stopPropagation();
      setShowLikesList(false);
      setIsPaused(false);
      startTimeRef.current = Date.now();
  };

  if (!storyData || activeStories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center text-white">
        <p>No hay historias disponibles</p>
        <button onClick={animateAndClose} className="mt-4 px-4 py-2 bg-white/20 rounded-full">Cerrar</button>
      </div>
    );
  }

  const currentMediaUrl = getFullImageUrl(currentStory?.url);
  const nextMediaUrl = nextStory ? getFullImageUrl(nextStory?.url) : null;
  const isNextVideo = nextStory && (nextStory.type?.startsWith('video') || nextStory.url?.match(/\.(mp4|mov|webm)$/i));

  const hdrStyles = isHDR ? {
      dynamicRangeLimit: 'high',
      filter: 'none', 
  } : {};

  const hasLikes = Array.isArray(currentStory?.likes) && currentStory.likes.length > 0;
  const likesCount = Array.isArray(currentStory?.likes) ? currentStory.likes.length : (typeof currentStory?.likes === 'number' ? currentStory.likes : 0);

  return (
    <div className={`fixed inset-0 z-[80] bg-black/95 flex items-center justify-center ${isClosingStory ? 'animate-slide-out' : 'animate-fade-in'}`}>
      <style>
        {`
          @keyframes slideInUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slideOutDown {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(100%); opacity: 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-slide-in { animation: slideInUp 0.3s ease-out forwards; }
          .animate-slide-out { animation: slideOutDown 0.3s ease-in forwards; }
          .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        `}
      </style>

      <div className="absolute inset-0" onClick={animateAndClose} />

      <div 
        className="relative w-full h-full md:w-[420px] md:h-[85vh] md:max-h-[900px] bg-black md:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barras de Progreso */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2 pt-4 safe-top bg-gradient-to-b from-black/60 to-transparent">
          {activeStories.map((item, index) => {
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;
            
            return (
              <div key={item.id} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden shadow-sm">
                <div 
                  className="h-full bg-white ease-linear" 
                  style={{ 
                    width: isPast ? '100%' : 
                             isCurrent ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Header Usuario */}
        <div className="absolute top-6 left-0 right-0 z-50 flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-3">
              <UserAvatar 
                  user={{
                      username: storyData.username,
                      profile_image_url: storyData.avatar 
                  }} 
                  size={10} 
                  className="w-10 h-10 border border-white/50 shadow-md"
              />
            <div className="flex flex-col drop-shadow-md">
              <span className="text-white font-bold text-sm cursor-default" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  {storyData.username} {isMyStory && '(Tú)'}
              </span>
              <span className="text-white text-xs font-medium opacity-90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  {getTimeAgo(currentStory)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
              {isVideo && (
                  <button onClick={toggleMute} className="p-2 text-white hover:bg-white/10 rounded-full transition drop-shadow-md outline-none focus:outline-none">
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
              )}

              {isMyStory && (
                  <>
                    <button onClick={handleDeleteClick} className="p-2 text-white hover:bg-red-500/20 hover:text-red-400 rounded-full transition drop-shadow-md outline-none focus:outline-none">
                        <Trash2 size={24} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
                    </button>
                    <button onClick={handleDownload} className="p-2 text-white hover:bg-white/10 rounded-full transition drop-shadow-md outline-none focus:outline-none">
                        <Download size={24} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
                    </button>
                  </>
              )}
              <button onClick={animateAndClose} className="p-2 text-white hover:bg-white/10 rounded-full transition drop-shadow-md outline-none focus:outline-none">
                  <X size={28} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
              </button>
          </div>
        </div>

        {/* Controladores Táctiles (Invisibles) con soporte de Swipe */}
        <div className="absolute inset-0 z-20 flex">
          <div 
              className="w-1/3 h-full cursor-pointer" 
              onTouchStart={handleTouchStart} 
              onTouchEnd={(e) => handleTouchEnd(e, 'prev')}
              onMouseDown={handlePauseStart} 
              onMouseUp={(e) => handlePauseEnd(e, 'prev')}
              onMouseLeave={handleMouseLeave}
              style={{ touchAction: 'none' }}
          />
          <div 
              className="w-2/3 h-full cursor-pointer" 
              onTouchStart={handleTouchStart} 
              onTouchEnd={(e) => handleTouchEnd(e, 'next')}
              onMouseDown={handlePauseStart} 
              onMouseUp={(e) => handlePauseEnd(e, 'next')}
              onMouseLeave={handleMouseLeave}
              style={{ touchAction: 'none' }}
          />
        </div>

        {/* --- Media (Imagen o Video) --- */}
        <div className="flex-1 flex items-center justify-center bg-black relative w-full h-full z-10">
          {(!mediaLoaded && !mediaError) || (isVideo && isBuffering) ? (
              <div className="absolute inset-0 flex items-center justify-center z-0">
                  <Loader2 className="text-white/50 animate-spin" size={48} />
              </div>
          ) : null}
          
          {mediaError ? (
             <div className="flex flex-col items-center justify-center text-white/50 gap-2">
                <ImageOff size={48} />
                <p className="text-xs">No se pudo cargar el contenido</p>
             </div>
          ) : (
             currentMediaUrl && (
                isVideo ? (
                    <video
                        ref={videoRef}
                        key={currentStory.id}
                        className={`w-full h-full object-contain transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
                        playsInline
                        webkit-playsinline="true"
                        autoPlay
                        preload="auto"
                        muted={isMuted}
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        onWaiting={() => setIsBuffering(true)} 
                        onPlaying={() => setIsBuffering(false)}
                        onCanPlay={() => setIsBuffering(false)}
                        onError={(e) => { 
                            console.error("Video Error:", e.nativeEvent); 
                            setMediaError(true); 
                            setMediaLoaded(true); 
                            setIsBuffering(false);
                        }}
                        style={hdrStyles}
                    >
                        <source src={currentMediaUrl} type="video/mp4" />
                        <source src={currentMediaUrl} />
                    </video>
                ) : (
                    <img 
                        key={currentStory.id} 
                        src={currentMediaUrl} 
                        alt="Story"
                        className={`w-full h-full object-contain transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setMediaLoaded(true)}
                        onError={() => { setMediaError(true); setMediaLoaded(true); }}
                        style={hdrStyles}
                    />
                )
             )
          )}

          {/* Precarga del siguiente elemento */}
          {nextMediaUrl && (
             isNextVideo ? (
                 <video preload="auto" className="hidden">
                     <source src={nextMediaUrl} type="video/mp4" />
                 </video>
             ) : (
                 <img src={nextMediaUrl} alt="preload" className="hidden" />
             )
          )}
        </div>

        {/* --- Animación Corazones y Avatares Flotantes (Si hay likes y soy yo) --- */}
        {isMyStory && hasLikes && <FloatingHearts active={currentStory.likes} />}

        {/* --- Modal de Lista de Likes --- */}
        {showLikesList && (
            <LikesListModal 
                likes={currentStory.likes || []} 
                onClose={handleCloseLikesList} 
            />
        )}

        {/* --- Modal de Confirmación --- */}
        {showDeleteConfirm && (
            <ConfirmationModal
                message="¿Eliminar esta historia? Esta acción no se puede deshacer."
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                confirmText="Eliminar"
                cancelText="Cancelar"
                isLoading={isDeleting}
            />
        )}

        {/* Footer */}
        {!isMyStory && (
          <div className="absolute bottom-0 left-0 right-0 z-30 p-6 bg-gradient-to-t from-black/60 to-transparent pb-10">
              <div className="flex items-center justify-end">
                  <button 
                      onClick={handleLike}
                      className={`p-3 rounded-full transition-all duration-300 drop-shadow-md z-40 outline-none focus:outline-none 
                          ${currentStory?.isLiked ? 'text-accent' : 'text-white'}
                          ${isLikeAnimating ? 'scale-125' : 'active:scale-90 hover:scale-110'}
                      `}
                  >
                      <Heart 
                        size={32} 
                        fill={currentStory?.isLiked ? "currentColor" : "none"} 
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
                      />
                  </button>
              </div>
          </div>
        )}
        
        {isMyStory && (
          <div className="absolute bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-black/60 to-transparent pb-10 pointer-events-none">
              <div className="flex items-center justify-center gap-2 text-white/90 drop-shadow-md pointer-events-auto">
                  <button 
                    onClick={handleOpenLikesList}
                    className="text-sm font-medium outline-none focus:outline-none animate-pulse" 
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                  >
                      {likesCount} {likesCount === 1 ? 'Me gusta' : 'Me gusta'}
                      <span className="block text-[10px] opacity-70 font-normal">Desliza para ver</span>
                  </button>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;