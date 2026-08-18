import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Youtube, Search, Edit, Trash2, Check, X, Loader2, Maximize, Play, Video, GripHorizontal } from 'lucide-react';
import apiClient from '../services/apiClient';
import { getExerciseList, importYouTubePlaylist, updateExercise, deleteExercise } from '../services/exerciseService';
import { getSetting, updateSetting } from '../services/adminService';
import { useToast } from '../hooks/useToast';
import CustomSelect from '../components/CustomSelect';
import ConfirmationModal from '../components/ConfirmationModal';
import Cropper from 'react-easy-crop';
import { Reorder, useDragControls } from 'framer-motion';

// Global SERVER_URL para las imágenes
const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
const SERVER_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL.replace('/api', '');

// --- Helper para extraer la imagen recortada ---
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  image.crossOrigin = 'anonymous'; // Necesario si la imagen viene del servidor
  await new Promise((resolve) => {
    image.onload = resolve;
    image.onerror = resolve; // Prevenir bloqueos si falla
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        file.name = 'cropped.jpg';
        resolve(new File([file], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' }));
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.9);
  });
};

// --- Componente: Modal de Recorte ---
const ImageCropModal = ({ imageSrc, onComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  return createPortal(
    <div className="fixed inset-0 flex flex-col animate-[fade-in_0.2s_ease-out] bg-bg-primary" style={{ zIndex: 99999 }}>
      <div className="relative flex-1 bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={4 / 5}
          cropShape="rect"
          showGrid={true}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      <div className="bg-bg-primary p-5 pb-8 flex justify-between items-center px-6 sm:px-10 border-t border-black/5 dark:border-white/10" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <button type="button" onClick={onCancel} className="text-text-secondary font-bold px-6 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-[16px] transition-colors active:scale-95">
          Cancelar
        </button>
        <button type="button" onClick={() => onComplete(croppedAreaPixels)} className="bg-accent text-white font-bold px-8 py-3.5 rounded-[20px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20">
          Recortar
        </button>
      </div>
    </div>,
    document.body
  );
};

// --- Componente: Item Ordenable (Drag Handle) ---
const SortableImageItem = ({ img, idx, onRemove, onCrop }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={img} 
      dragListener={false} 
      dragControls={controls}
      className="flex-shrink-0 w-28 sm:w-32 aspect-[4/5] rounded-[12px] overflow-hidden relative group border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5"
    >
      {/* Zona de la imagen (Click = Recortar, Swipe = Scroll horizontal nativo) */}
      <div 
        className="w-full h-[80%] cursor-pointer touch-pan-x"
        onClick={onCrop}
      >
        <img 
          src={img.type === 'existing' ? `${SERVER_URL}${img.src}` : img.src} 
          alt="Preview" 
          className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" 
        />
      </div>

      {/* Zona del Handle (Abajo) para arrastrar */}
      <div 
        className="w-full h-[20%] bg-black/80 flex items-center justify-center cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => controls.start(e)}
        style={{ touchAction: 'none' }}
      >
        <GripHorizontal size={18} className="text-white/70" />
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors shadow-sm z-10"
      >
        <X size={14} strokeWidth={3} />
      </button>

      {img.type === 'new' && (
        <div className="absolute top-1.5 left-1.5 bg-accent/80 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm z-10 pointer-events-none">
          Nueva
        </div>
      )}
      {img.type === 'existing' && (
        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm z-10 pointer-events-none">
          {idx + 1}
        </div>
      )}
    </Reorder.Item>
  );
};

// Componente para animar múltiples fotos
const ImageSlideshow = ({ ex, isShort }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  let images = [];
  if (ex.images && Array.isArray(ex.images) && ex.images.length > 0) {
    images = ex.images;
  } else if (ex.image_url_start || ex.image_url_end) {
    if (ex.image_url_start) images.push(ex.image_url_start);
    if (ex.image_url_end) images.push(ex.image_url_end);
  }

  // Ajustar la velocidad en base a la cantidad de imágenes
  const delayMs = Math.max(1500, 3000 - (images.length * 200)); 

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, delayMs);
      return () => clearInterval(interval);
    }
  }, [images.length, delayMs]);

  if (images.length === 0) {
    if (ex.video_url && (ex.video_url.includes('youtube') || ex.video_url?.includes('youtu.be'))) {
      const vidId = getVidId(ex.video_url);
      return (
        <img 
          src={`https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`} 
          alt="Thumbnail" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          onError={(e) => { e.target.src = `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`; }}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/5 group-hover:scale-105 transition-transform duration-700">
        <Video size={32} className="text-black/10 dark:text-white/10" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      {images.map((url, idx) => (
        <img 
          key={idx}
          src={`${SERVER_URL}${url}`} 
          alt={`Slide ${idx}`} 
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`} 
        />
      ))}
    </div>
  );
};

const getVidId = (url) => {
  if (!url) return '';
  if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0];
  if (url.includes('shorts/')) return url.split('shorts/')[1]?.split('?')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
  return '';
};

const AdminExercises = ({ isTrainerMode = false }) => {
  const { showToast: addToast } = useToast();
  


  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  
  // YouTube Import State
  const [playlistId, setPlaylistId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  // Delete State
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [showVideoUI, setShowVideoUI] = useState(true);
  const playerRef = useRef(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [isClosingFullscreen, setIsClosingFullscreen] = useState(false);
  const [isOpeningFullscreen, setIsOpeningFullscreen] = useState(false);

  // Detail Modal State
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [cropTarget, setCropTarget] = useState(null);

  const handleCropComplete = async (croppedAreaPixels) => {
    if (!cropTarget || !croppedAreaPixels) return;
    
    try {
      const croppedFile = await getCroppedImg(cropTarget.src, croppedAreaPixels);
      
      setEditForm(prev => {
        const next = { ...prev };
        const idx = next.images.findIndex(img => img.id === cropTarget.id);
        if (idx !== -1) {
          next.images[idx] = {
            id: `cropped-${Date.now()}`,
            type: 'new',
            file: croppedFile,
            src: URL.createObjectURL(croppedFile)
          };
        }
        return next;
      });
      setCropTarget(null);
    } catch (e) {
      console.error('Error cropping image:', e);
      addToast('Error al recortar la imagen', 'error');
    }
  };

  useEffect(() => {
    if (isOpeningFullscreen) {
      // Usar 50ms para asegurar que el navegador pinte el estado 'fixed' inicial antes de animar
      const timer = setTimeout(() => {
        setIsOpeningFullscreen(false);
        setDragY(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpeningFullscreen]);
  const [editForm, setEditForm] = useState({ name: '', muscle_group: '', equipment: '', description: '', images: [], video_url: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Auto-looping programático para evitar controles de lista de reproducción
  useEffect(() => {
    if (!selectedExercise || !selectedExercise.video_url) return;
    const isYt = selectedExercise.video_url.includes('youtube') || selectedExercise.video_url.includes('youtu.be');
    if (!isYt) return;

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        // Create player instance
        playerRef.current = new window.YT.Player(`yt-player-${selectedExercise.id}`, {
          events: {
            'onStateChange': (event) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                event.target.playVideo();
              }
            }
          }
        });
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      setTimeout(initPlayer, 500);
    }
  }, [selectedExercise]);

  const muscleGroupOptions = [
    { value: 'Bíceps', label: 'Bíceps' },
    { value: 'Tríceps', label: 'Tríceps' },
    { value: 'Pecho', label: 'Pecho' },
    { value: 'Espalda', label: 'Espalda' },
    { value: 'Hombros', label: 'Hombros' },
    { value: 'Cuádriceps', label: 'Cuádriceps' },
    { value: 'Isquiotibiales', label: 'Isquiotibiales' },
    { value: 'Glúteos', label: 'Glúteos' },
    { value: 'Pantorrillas', label: 'Pantorrillas' },
    { value: 'Abdomen', label: 'Abdomen' },
    { value: 'Antebrazos', label: 'Antebrazos' },
    { value: 'Cardio', label: 'Cardio' },
    { value: 'Otro', label: 'Otro' }
  ];

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const data = await getExerciseList();
      setExercises(data);
    } catch (error) {
      addToast('Error al cargar ejercicios', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
    
    // Cargar la playlist global
    const loadSettings = async () => {
      try {
        const res = await getSetting('admin_youtube_playlist');
        if (res && res.value) {
          setPlaylistId(res.value);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleImport = async () => {
    if (!playlistId.trim()) {
      addToast('Introduce un ID de lista de YouTube', 'error');
      return;
    }
    
    setIsImporting(true);
    try {
      const res = await importYouTubePlaylist(playlistId.trim());
      addToast(res.data?.message || res.message || 'Importación completada', 'success');
      
      // Guardar el ID/URL para el futuro de forma persistente en servidor
      setPlaylistId(playlistId.trim()); // Forzar re-render
      await updateSetting('admin_youtube_playlist', playlistId.trim());
      
      fetchExercises();
    } catch (error) {
      addToast(error.response?.data?.message || 'Error al importar la lista', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const openDetailModal = (ex) => {
    setSelectedExercise(ex);
    const isShort = (ex.video_url && ex.video_url.toLowerCase().includes('shorts')) || (ex.name && ex.name.toLowerCase().includes('short'));
    
    let existingImages = [];
    if (ex.images && Array.isArray(ex.images)) {
        existingImages = ex.images;
    } else {
        if (ex.image_url_start) existingImages.push(ex.image_url_start);
        if (ex.image_url_end) existingImages.push(ex.image_url_end);
    }

    const mappedImages = existingImages.map((url, i) => ({
      id: `exist-${i}-${Date.now()}`,
      type: 'existing',
      src: url
    }));
    
    setEditForm({
      name: ex.name,
      muscle_group: ex.muscle_group || '',
      equipment: ex.equipment || '',
      description: ex.description || '',
      images: mappedImages,
      video_url: ex.video_url || '',
      is_short: isShort
    });
  };

  const closeDetailModal = () => {
    setSelectedExercise(null);
    setIsEditingModal(false);
    setIsPseudoFullscreen(false);
    setIsClosingFullscreen(false);
    setShowVideoUI(true);
  };

  const closeFullscreenSmoothly = () => {
    setIsClosingFullscreen(true);
    setTimeout(() => {
      setIsPseudoFullscreen(false);
      setIsClosingFullscreen(false);
      setDragY(0);
    }, 300);
  };

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
    setDragY(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY;
    
    // Si estamos en fullscreen, solo permitir arrastrar hacia abajo. Si no, solo hacia arriba.
    if (isPseudoFullscreen) {
      if (delta > 0) setDragY(delta);
    } else {
      if (delta < 0) setDragY(delta);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY;
    
    if (isPseudoFullscreen) {
      // Si se desliza hacia abajo más de 120px estando en pantalla completa
      if (deltaY > 120) {
        closeFullscreenSmoothly();
      } else {
        setDragY(0);
      }
    } else {
      // Si se desliza hacia arriba más de 60px estando en modo normal
      if (deltaY < -60) {
        setIsPseudoFullscreen(true);
        setIsOpeningFullscreen(true); // Arranca la animación desde el dragY actual
      } else {
        setDragY(0); // Snap back if didn't swipe enough
      }
    }
    
    // Resetear valores de arrastre siempre al soltar
    setTouchStartY(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) return addToast('El nombre no puede estar vacío', 'error');
    setIsUpdating(true);
    try {
      let payload = editForm;
      let finalVideoUrl = editForm.video_url;

      if (finalVideoUrl && (finalVideoUrl.includes('youtube') || finalVideoUrl.includes('youtu.be'))) {
        const vidId = getVidId(finalVideoUrl);
        if (vidId) {
          if (editForm.is_short) {
            finalVideoUrl = `https://www.youtube.com/shorts/${vidId}`;
          } else {
            finalVideoUrl = `https://www.youtube.com/watch?v=${vidId}`;
          }
        }
      }

      payload = new FormData();
      payload.append('name', editForm.name);
      payload.append('muscle_group', editForm.muscle_group);
      payload.append('equipment', editForm.equipment);
      payload.append('description', editForm.description);
      payload.append('video_url', finalVideoUrl);
      const existingUrls = editForm.images.filter(img => img.type === 'existing').map(img => img.src);
      const newFiles = editForm.images.filter(img => img.type === 'new').map(img => img.file);

      payload.append('existing_images', JSON.stringify(existingUrls));
      newFiles.forEach(file => {
        payload.append('images', file);
      });

      let existCount = 0;
      let newCount = 0;
      const imageOrder = editForm.images.map(img => {
        if (img.type === 'existing') return `existing:${existCount++}`;
        return `new:${newCount++}`;
      });
      payload.append('image_order', JSON.stringify(imageOrder));
      
      const updatedEx = await updateExercise(selectedExercise.id, payload);
      addToast('Ejercicio actualizado', 'success');
      setExercises(exercises.map(ex => ex.id === selectedExercise.id ? { ...ex, ...updatedEx } : ex));
      setSelectedExercise(updatedEx);
      setIsEditingModal(false);
    } catch (error) {
      addToast('Error al actualizar', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!exerciseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExercise(exerciseToDelete.id);
      addToast('Ejercicio borrado', 'success');
      setExercises(exercises.filter(ex => ex.id !== exerciseToDelete.id));
      setExerciseToDelete(null);
    } catch (error) {
      addToast('Error al borrar', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Extraer grupos musculares únicos
  const uniqueMuscleGroups = React.useMemo(() => {
    const groups = exercises.map(ex => ex.muscle_group).filter(Boolean);
    const unique = [...new Set(groups)].sort();
    return [
      { value: 'all', label: 'Todos los grupos' },
      ...unique.map(g => ({ value: g, label: g }))
    ];
  }, [exercises]);

  // Función auxiliar para búsqueda insensible a acentos
  const normalizeString = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = 
      normalizeString(ex.name).includes(normalizeString(searchQuery)) || 
      normalizeString(ex.muscle_group).includes(normalizeString(searchQuery));
    
    const matchesGroup = selectedGroupFilter === 'all' || ex.muscle_group === selectedGroupFilter;
    
    return matchesSearch && matchesGroup;
  }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return (
    <div className="flex flex-col gap-8 animate-[fade-in_0.3s_ease-out]">
      {/* Sección Importador YouTube (Solo Admin) */}
      {!isTrainerMode && (
        <div className="bg-black/5 dark:bg-white/5 rounded-[24px] p-6 ring-1 ring-black/5 dark:ring-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Youtube size={120} />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-extrabold text-text-primary mb-2 flex items-center gap-2">
              <Youtube className="text-red" /> Importar desde YouTube
            </h2>
            <p className="text-text-secondary text-sm mb-6 max-w-xl">
              Pega el ID de tu lista de reproducción oculta de YouTube. La app creará automáticamente un ejercicio por cada vídeo en la lista. (Por ejemplo, en la URL `youtube.com/playlist?list=PLxyz123`, el ID es `PLxyz123`).
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <input 
                type="text" 
                placeholder="Ej: PLxXYZ1234567890..."
                value={playlistId}
                onChange={(e) => setPlaylistId(e.target.value)}
                className="flex-1 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/10 dark:ring-white/10 rounded-[16px] px-4 py-3 text-sm font-bold text-text-primary placeholder:text-text-muted focus:ring-accent transition-all outline-none"
              />
              <button
                onClick={handleImport}
                disabled={isImporting || !playlistId.trim()}
                className="bg-[#FF0000] hover:bg-[#CC0000] disabled:bg-red/50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-[16px] flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Youtube size={18} />}
                Importar Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Ejercicios */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
            Librería Global <span className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full">{exercises.length}</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="z-20 w-full sm:w-48">
              <CustomSelect 
                options={uniqueMuscleGroups}
                value={selectedGroupFilter}
                onChange={setSelectedGroupFilter}
              />
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text"
                placeholder="Buscar ejercicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[12px] pl-10 pr-4 py-2.5 text-sm font-bold text-text-primary focus:ring-accent transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-accent" /></div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-12 text-text-muted bg-black/5 dark:bg-white/5 rounded-[24px]">
            No hay ejercicios que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start">
            {filteredExercises.map(ex => {
              const isShort = (ex.video_url && ex.video_url.toLowerCase().includes('shorts')) || (ex.name && ex.name.toLowerCase().includes('short'));
              
              return (
              <div 
                key={ex.id} 
                className="bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 overflow-hidden flex flex-col group cursor-pointer hover:shadow-lg transition-shadow bg-bg-primary"
                onClick={() => openDetailModal(ex)}
              >
                {/* Imagen/Miniatura gigante arriba */}
                <div 
                  className="w-full relative bg-black/10 dark:bg-white/10 flex items-center justify-center overflow-hidden" 
                  style={{ aspectRatio: (ex.images?.length > 0 || ex.image_url_start || ex.image_url_end) ? '4/5' : (isShort ? '9/16' : '16/9') }}
                >
                  <ImageSlideshow ex={ex} isShort={isShort} />
                  
                  {/* Capa oscura superpuesta al hacer hover (BOTÓN PLAY MODERNO) */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center z-10">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 drop-shadow-xl">
                      <Play className="text-white ml-1" size={24} fill="currentColor" />
                    </div>
                  </div>
                  
                  {/* Badge de músculo y Short superpuesto */}
                  <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
                    {(ex.muscle_group || 'Otro').split(',').map((muscle, idx) => (
                      <span key={idx} className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        {muscle.trim()}
                      </span>
                    ))}
                    {isShort && (
                      <span className="bg-[#FF0000] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Youtube size={10} /> Short
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Información abajo */}
                <div className="p-4 flex flex-col gap-1.5 relative">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-text-primary text-[15px] leading-tight group-hover:text-accent transition-colors flex-1 break-words">
                      {ex.name.replace(/#shorts?/gi, '').trim()}
                    </h3>
                    
                    {/* Botón de eliminar, perfectamente alineado con el texto */}
                    {!isTrainerMode && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setExerciseToDelete(ex); }}
                        className="shrink-0 p-2 text-text-muted hover:text-red bg-black/5 dark:bg-white/5 hover:bg-red/10 rounded-full transition-colors active:scale-95 -mt-1 -mr-1"
                        title="Eliminar Ejercicio"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  {ex.equipment && (
                    <p className="text-text-secondary text-[11px] font-bold uppercase tracking-wider truncate">
                      {ex.equipment}
                    </p>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {exerciseToDelete && (
        <ConfirmationModal 
          message={`¿Estás seguro de que quieres borrar el ejercicio "${exerciseToDelete.name}"? Esto afectará a todas las rutinas que lo incluyan.`}
          confirmText="Borrar Ejercicio"
          confirmColor="bg-red hover:bg-red/90"
          onConfirm={handleDelete}
          onCancel={() => setExerciseToDelete(null)}
          isLoading={isDeleting}
        />
      )}

      {selectedExercise && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-md flex items-center justify-center sm:p-6 animate-[fade-in_0.2s_ease-out]"
          onClick={closeDetailModal}
        >
          <div 
            className="w-full h-full sm:h-auto sm:max-w-2xl bg-bg-primary sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative animate-[scale-in_0.3s_ease-out] sm:max-h-[90vh]" 
            onClick={e => e.stopPropagation()}
          >
            {/* Encabezado (Adaptativo para iOS notch y Android) */}
            <div 
              className="w-full flex items-center justify-between px-4 pb-4 bg-bg-primary shrink-0 border-b border-black/5 dark:border-white/5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:!p-4 sm:!pt-4"
            >
              <h3 className="font-bold text-text-primary text-lg truncate pr-4">
                {isEditingModal ? 'Editar Ejercicio' : selectedExercise.name}
              </h3>
              <button 
                onClick={closeDetailModal}
                className="p-2 text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all active:scale-95 shrink-0"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Contenedor Placeholder para evitar saltos de layout al cambiar a fixed */}
            <div className={`relative shrink-0 mx-auto transition-all duration-300 ease-out ${
              isEditingModal 
                ? 'h-[25vh] aspect-[9/16] mt-2 rounded-[16px] overflow-hidden shadow-lg' 
                : 'w-full aspect-[9/16] max-h-[60vh] sm:max-h-[40vh]'
            }`}>
              <div 
                className={`w-full flex items-center justify-center group ${
                  isPseudoFullscreen 
                    ? 'fixed inset-0 z-[100000] h-[100dvh]' 
                    : 'bg-black absolute inset-0 z-10'
                }`}
              style={isPseudoFullscreen ? {
                backgroundColor: `rgba(0,0,0,${isClosingFullscreen || isOpeningFullscreen ? 0 : Math.max(0, 1 - dragY / 300)})`,
                transition: (touchStartY !== null && !isClosingFullscreen && !isOpeningFullscreen) ? 'none' : 'background-color 0.3s ease-out'
              } : {
                transform: `translateY(${dragY}px)`,
                transition: touchStartY !== null ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
              }}
              onClick={() => setShowVideoUI(!showVideoUI)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Contenedor interior configurado para hacer 'cover' del iframe y llenar la pantalla sin franjas negras */}
              <div 
                style={isPseudoFullscreen ? {
                  width: '100%',
                  height: '100dvh',
                  overflow: 'hidden',
                  position: 'relative',
                  transform: `translateY(${isClosingFullscreen ? '100dvh' : (isOpeningFullscreen ? `${Math.min(0, dragY)}px` : `${dragY}px`)})`,
                  transition: (touchStartY !== null && !isClosingFullscreen && !isOpeningFullscreen) ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                } : { width: '100%', height: '100%', position: 'relative' }}
                className="flex items-center justify-center"
              >
              {selectedExercise.video_url && (selectedExercise.video_url.includes('youtube') || selectedExercise.video_url?.includes('youtu.be')) ? (
                <>
                    <iframe
                      id={`yt-player-${selectedExercise.id}`}
                      className="pointer-events-none"
                      style={isPseudoFullscreen ? {
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) scale(1.15)',
                        width: '100%',
                        height: '100%'
                      } : { width: '100%', height: '100%' }}
                    src={`https://www.youtube.com/embed/${getVidId(selectedExercise.video_url)}?autoplay=1&playsinline=1&mute=1&controls=0&modestbranding=1&rel=0&enablejsapi=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  ></iframe>

                  {/* Capa invisible para bloquear todos los clics y evitar que se pause o interactúe con YouTube, 
                      y usada para alternar nuestra propia UI */}
                  <div 
                    className="absolute inset-0 w-full h-full z-[5] bg-black/0 cursor-pointer touch-manipulation" 
                    title="Alternar controles" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVideoUI(!showVideoUI);
                    }}
                  />

                  {/* Botones Flotantes Personalizados */}
                  <div className={`transition-opacity duration-300 ${showVideoUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {!isPseudoFullscreen ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPseudoFullscreen(true);
                          setIsOpeningFullscreen(true);
                        }}
                        className="absolute bottom-3 right-3 p-2.5 bg-black/60 hover:bg-black/90 text-white/90 hover:text-white rounded-[12px] backdrop-blur-md transition-all active:scale-95 shadow-lg z-10"
                        title="Forzar Pantalla Completa"
                      >
                        <Maximize size={18} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFullscreenSmoothly();
                        }}
                        style={{ 
                          top: 'max(env(safe-area-inset-top, 32px), 32px)', 
                          right: 'max(env(safe-area-inset-right, 24px), 24px)' 
                        }}
                        className="absolute p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-full shadow-2xl transition-all active:scale-95 z-20 flex items-center justify-center"
                        title="Cerrar Pantalla Completa"
                      >
                        <X size={24} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center flex-col text-white/50 w-full h-full">
                  <Youtube size={48} className="mb-2 opacity-50" />
                  <p className="font-bold">Sin vídeo disponible</p>
                </div>
              )}
              </div>
            </div>
            </div>

            {/* Panel de Detalles / Edición - Scrolleable */}
            <div className="p-6 sm:p-8 flex flex-col overflow-y-auto hide-scrollbar">
              
              {!isEditingModal ? (
                /* MODO VISUALIZACIÓN */
                <div className="flex flex-col">
                  <div className="flex gap-2 flex-wrap mb-4">
                    {(selectedExercise.muscle_group || 'Otro').split(',').map((muscle, index) => (
                      <span key={index} className="bg-accent/10 text-accent text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ring-1 ring-accent/30">
                        {muscle.trim()}
                      </span>
                    ))}
                    {selectedExercise.equipment && (
                      <span className="bg-black/5 dark:bg-white/5 text-text-secondary text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ring-1 ring-black/10 dark:ring-white/10">
                        {selectedExercise.equipment}
                      </span>
                    )}
                  </div>
                  
                  {/* Nombre oculto aquí porque ya está en el header, pero mantenemos espaciado */}
                  <div className="mb-8">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Descripción</h4>
                    <p className="text-text-secondary text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedExercise.description || <span className="italic opacity-50">Sin descripción. Pulsa editar para añadir instrucciones.</span>}
                    </p>
                    {/* Botón Borrar Ejercicio (Solo Admin) */}
                    {!isTrainerMode && (
                      <button 
                        onClick={() => { closeDetailModal(); setExerciseToDelete(selectedExercise); }}
                        className="w-full mt-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-[16px] transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Trash2 size={18} />
                        Borrar Ejercicio
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => setIsEditingModal(true)}
                    className="w-full py-3.5 bg-black/5 dark:bg-white/5 hover:bg-accent/10 text-text-primary hover:text-accent font-bold rounded-[16px] transition-all flex items-center justify-center gap-2 active:scale-95 ring-1 ring-black/5 dark:ring-white/10 mt-2"
                  >
                    <Edit size={18} />
                    Editar Ejercicio
                  </button>
                </div>
              ) : (
                /* MODO EDICIÓN */
                <div className="flex flex-col animate-[fade-in_0.2s_ease-out]">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Nombre</label>
                      <input 
                        type="text" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/10 dark:ring-white/10 focus:ring-accent rounded-[12px] px-4 py-3 text-sm font-bold text-text-primary outline-none transition-shadow"
                      />
                    </div>
                    
                    <div className="z-20 relative">
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Grupo Muscular</label>
                      <CustomSelect 
                        options={muscleGroupOptions}
                        value={editForm.muscle_group}
                        onChange={(val) => setEditForm({...editForm, muscle_group: val})}
                        multiple={true}
                        placeholder="Selecciona grupos musculares"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Material (Ej: Mancuernas, Barra)</label>
                      <input 
                        type="text" 
                        value={editForm.equipment}
                        onChange={(e) => setEditForm({...editForm, equipment: e.target.value})}
                        placeholder="Opcional..."
                        className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/10 dark:ring-white/10 focus:ring-accent rounded-[12px] px-4 py-3 text-sm font-medium text-text-primary outline-none transition-shadow"
                      />
                    </div>

                    {!isTrainerMode && (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-2">
                          <Video size={16} /> URL del Vídeo (YouTube o Directo)
                        </label>
                        <input 
                          type="text" 
                          value={editForm.video_url}
                          onChange={(e) => setEditForm({...editForm, video_url: e.target.value})}
                          placeholder="https://..."
                          className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/10 dark:ring-white/10 focus:ring-accent rounded-[12px] px-4 py-3 text-sm font-medium text-text-primary outline-none transition-shadow"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Descripción o Instrucciones</label>
                      <textarea 
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        placeholder="Añade consejos sobre la técnica..."
                        rows={3}
                        className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/10 dark:ring-white/10 focus:ring-accent rounded-[12px] px-4 py-3 text-sm font-medium text-text-primary outline-none transition-shadow resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider leading-tight">
                            Fotos de Demostración <br className="sm:hidden" />
                            <span className="normal-case tracking-normal font-medium text-[10px] text-text-secondary mt-0.5 block sm:inline sm:mt-0 sm:ml-1">
                              (Arrastra para reordenar)
                            </span>
                          </label>
                          <span className="bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-md text-xs font-bold text-text-primary whitespace-nowrap shrink-0">
                            {editForm.images.length} / 10
                          </span>
                        </div>
                        
                        <div className="overflow-x-auto custom-scrollbar pb-3" style={{ scrollbarWidth: 'thin' }}>
                          <Reorder.Group 
                            axis="x" 
                            values={editForm.images} 
                            onReorder={(newOrder) => setEditForm({ ...editForm, images: newOrder })}
                            className="flex gap-3 min-w-max"
                          >
                            {editForm.images.map((img, idx) => (
                              <SortableImageItem 
                                key={img.id} 
                                img={img} 
                                idx={idx}
                                onCrop={() => setCropTarget({ id: img.id, type: img.type, src: img.type === 'existing' ? `${SERVER_URL}${img.src}` : img.src })}
                                onRemove={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditForm(prev => ({
                                    ...prev,
                                    images: prev.images.filter(i => i.id !== img.id)
                                  }));
                                }}
                              />
                            ))}
                            
                            {/* Botón añadir más */}
                            {editForm.images.length < 10 && (
                              <div className="flex-shrink-0 w-28 sm:w-32 aspect-[4/5] rounded-[12px] border-2 border-dashed border-black/10 dark:border-white/10 hover:border-accent hover:bg-accent/5 transition-all flex flex-col items-center justify-center relative cursor-pointer group">
                                <div className="text-4xl font-light text-black/20 dark:text-white/20 group-hover:text-accent group-hover:scale-110 transition-transform mb-1">+</div>
                                <span className="text-[10px] font-bold text-text-muted group-hover:text-accent uppercase tracking-wider">Añadir</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => {
                                    if (e.target.files) {
                                      const files = Array.from(e.target.files);
                                      const availableSlots = 10 - editForm.images.length;
                                      const allowedFiles = files.slice(0, availableSlots);
                                      
                                      const newItems = allowedFiles.map((file, i) => ({
                                        id: `new-${Date.now()}-${i}`,
                                        type: 'new',
                                        file: file,
                                        src: URL.createObjectURL(file)
                                      }));
                                      
                                      setEditForm(prev => ({
                                        ...prev,
                                        images: [...prev.images, ...newItems]
                                      }));
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>
                            )}
                          </Reorder.Group>
                        </div>

                        <div className="bg-black/5 dark:bg-white/5 p-3 rounded-[12px] border border-black/5 dark:border-white/5">
                          <p className="text-[11px] text-text-muted leading-relaxed">
                            <strong className="text-text-primary flex items-center gap-1 mb-1">💡 ¿Cómo se verán en la tarjeta?</strong>
                            Las fotos ocuparán el 100% del espacio, y la tarjeta hará una <strong>transición suave (crossfade)</strong> constante secuencialmente por todas ellas para darle vida a la app. <br/>(Formato recomendado: vertical 9:16).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button 
                      onClick={() => setIsEditingModal(false)} 
                      disabled={isUpdating} 
                      className="flex-1 py-3.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary font-bold rounded-[16px] transition-all flex items-center justify-center gap-1 active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      disabled={isUpdating}
                      style={{ color: 'var(--btn-accent-text, #ffffff)' }}
                      className="flex-1 py-3.5 bg-accent font-bold rounded-[16px] transition-all active:scale-95 flex justify-center items-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal de Recorte */}
      {cropTarget && (
        <ImageCropModal 
          imageSrc={cropTarget.src}
          onComplete={handleCropComplete}
          onCancel={() => setCropTarget(null)}
        />
      )}
    </div>
  );
};

export default AdminExercises;
