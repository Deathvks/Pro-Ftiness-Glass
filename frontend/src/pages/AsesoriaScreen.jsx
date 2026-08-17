/* frontend/src/pages/AsesoriaScreen.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, PaperAirplaneIcon, UserCircleIcon, CheckIcon, PaperClipIcon, VideoCameraIcon, ChatBubbleLeftRightIcon, ClipboardDocumentListIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import apiClient from '../services/apiClient';
import { useToast } from '../hooks/useToast';
import { getSocket } from '../services/socket';
import useAppStore from '../store/useAppStore';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'; 
const SERVER_URL = API_URL.replace('/api', '');

const getFullImageUrl = (path) => {
    if (!path || path === 'null') return null;
    if (path.startsWith('http')) return path; 
    if (path.startsWith('blob:')) return path; 
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_URL}${cleanPath}`;
};

export default function AsesoriaScreen({ onBack }) {
  const [trainer, setTrainer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const { addToast } = useToast();
  const userId = useAppStore(state => state.userProfile?.id);
  const token = useAppStore(state => state.token);

  useEffect(() => {
    fetchData();
    
    const socket = getSocket();
    if (socket) {
      socket.on('chat_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);
    }

    return () => {
      if (socket) {
        socket.off('chat_message', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    // If we receive a message from the trainer while the screen is open, mark it as read
    const currentUserId = useAppStore.getState().userProfile?.id;
    if (String(message.sender_id) !== String(currentUserId)) {
      markAsRead(message.sender_id);
    }
  };

  const handleMessagesRead = ({ byUserId }) => {
    console.log('AsesoriaScreen: Socket messages_read received from:', byUserId);
    const currentUserId = useAppStore.getState().userProfile?.id;
    setMessages(prev => prev.map(msg => 
      String(msg.sender_id) === String(currentUserId) && 
      String(msg.receiver_id) === String(byUserId) && 
      !msg.read_at 
        ? { ...msg, read_at: new Date() } 
        : msg
    ));
  };

  const markAsRead = async (otherId) => {
    try {
      await apiClient(`/chat/mark-read/${otherId}`, { method: 'POST' });
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !trainer) return;

    if (file.size > 150 * 1024 * 1024) {
      addToast('El archivo es demasiado grande. Máximo 150MB.', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', trainer.id);

    try {
      const response = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Error al subir vídeo');
      const sentMessage = await response.json();
      
      setMessages(prev => [...prev, sentMessage]);
      scrollToBottom();
      addToast('Vídeo enviado correctamente', 'success');
    } catch (error) {
      console.error(error);
      addToast('Error al subir el vídeo', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const trainerRes = await apiClient('/chat/trainer-info');
      setTrainer(trainerRes);

      const historyRes = await apiClient(`/chat/history/${trainerRes.id}`);
      setMessages(historyRes);
      
      // Mark as read when loading history unconditionally to guarantee socket event fires
      markAsRead(trainerRes.id);
    } catch (error) {
      console.error('Error fetching chat data:', error);
      addToast('No se pudo cargar la asesoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !trainer) return;

    const content = newMessage.trim();
    setNewMessage(''); // Optimistic clear

    const tempId = 'temp-' + Date.now();
    const optimisticMessage = {
      id: tempId,
      sender_id: userId,
      receiver_id: trainer.id,
      content: content,
      created_at: new Date().toISOString(),
      read_at: null,
      temp: true
    };

    // Optimistic UI update
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const res = await apiClient('/chat/send', {
        method: 'POST',
        body: { receiverId: trainer.id, content }
      });
      
      // Replace temp message, preserving read_at if updated by socket
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...res, read_at: msg.read_at || res.read_at } 
          : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      addToast('Error al enviar el mensaje', 'error');
      setNewMessage(content); // Restore if failed
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const userProfile = useAppStore(state => state.userProfile);
  const isTrainee = userProfile?.role === 'trainee' || userProfile?.role === 'trainer' || userProfile?.role === 'admin';
  
  let isChatBlocked = false;
  let showPromo = false;
  let blockMessage = '';

  if (!isTrainee && !loading && trainer) {
    const lastTrainerMsg = [...messages].reverse().find(m => String(m.sender_id) === String(trainer?.id));
    const lastUserMsg = [...messages].reverse().find(m => String(m.sender_id) === String(userProfile?.id));
    
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    
    const isTrainerRecent = lastTrainerMsg && (now - new Date(lastTrainerMsg.created_at).getTime() < threeDaysMs);
    const isUserRecent = lastUserMsg && (now - new Date(lastUserMsg.created_at).getTime() < threeDaysMs);
    
    if (messages.length === 0) {
      showPromo = true;
      isChatBlocked = true;
    } else if (isTrainerRecent) {
      isChatBlocked = false;
    } else if (isUserRecent) {
      isChatBlocked = true;
      blockMessage = "Esperando respuesta del entrenador...";
    } else {
      showPromo = true;
      isChatBlocked = true;
    }
  }

  const handleRequestInfo = async () => {
    if (!trainer) return;
    const content = "Hola, me gustaría solicitar información sin compromiso sobre la asesoría personal.";
    
    const tempId = 'temp-' + Date.now();
    const optimisticMessage = {
      id: tempId,
      sender_id: userProfile?.id,
      receiver_id: trainer.id,
      content: content,
      created_at: new Date().toISOString(),
      read_at: null,
      temp: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const res = await apiClient('/chat/send', {
        method: 'POST',
        body: { receiverId: trainer.id, content }
      });
      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...res, read_at: msg.read_at || res.read_at } : msg));
      scrollToBottom();
    } catch (error) {
      console.error(error);
      addToast('Error al enviar solicitud', 'error');
    }
  };

  const renderPromo = () => (
    <div className="flex flex-col items-center justify-center space-y-4 px-2 py-4 my-2">
      <div className="glass border border-accent/20 rounded-2xl p-5 sm:p-6 w-full max-w-[400px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <h3 className="text-lg font-bold text-text-primary mb-4 text-center">Da el salto en tu transformación</h3>
        
        <div className="space-y-4 text-[13px] sm:text-sm text-text-secondary">
          <div className="flex items-start gap-3">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <p>El entrenador personal estará siempre disponible para resolver tus dudas y ayudarte a dar un paso más.</p>
          </div>
          <div className="flex items-start gap-3">
            <ClipboardDocumentListIcon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <p>Acceso a rutinas 100% personalizadas o ajustadas por el entrenador según tu caso particular.</p>
          </div>
          <div className="flex items-start gap-3">
            <SparklesIcon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <p>Dieta y comidas: el entrenador se encargará de ajustarlo todo a tus objetivos con opciones personalizadas.</p>
          </div>
          <div className="flex items-start gap-3">
            <ChartBarIcon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <p>Seguimiento continuo mientras mantengas activa la asesoría.</p>
          </div>
        </div>

        <button
          onClick={handleRequestInfo}
          className="w-full mt-6 py-3 px-4 bg-accent text-bg-primary font-bold rounded-xl shadow-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-95"
        >
          Solicitar hablar sin compromiso
        </button>
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-50 md:inset-auto md:top-[100px] md:bottom-[60px] md:left-1/2 md:-translate-x-1/2 w-full md:w-[90%] md:max-w-xl flex flex-col md:border md:border-glass-border md:rounded-[32px] shadow-2xl overflow-hidden bg-bg-primary animate-fade-in isolate"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] md:pt-4 border-b border-glass-border glass rounded-none z-10 shrink-0 shadow-sm">
        <button 
          onClick={onBack}
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-text-primary hover:bg-white/10 transition-colors"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        {loading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-glass-border"></div>
            <div>
              <div className="h-4 w-24 bg-glass-border rounded mb-1"></div>
              <div className="h-3 w-16 bg-glass-border rounded"></div>
            </div>
          </div>
        ) : trainer ? (
          <div className="flex items-center gap-3">
            {trainer.profile_image_url ? (
              <img src={getFullImageUrl(trainer.profile_image_url)} alt={trainer.name} className="w-10 h-10 rounded-full object-cover border border-accent/30" referrerPolicy="no-referrer" />
            ) : (
              <UserCircleIcon className="w-10 h-10 text-text-secondary" />
            )}
            <div>
              <h2 className="font-bold text-text-primary text-sm leading-tight">{trainer.name}</h2>
              <p className="text-xs text-text-secondary">@{trainer.username}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className={`${showPromo ? 'pt-4 pb-2' : 'h-full justify-center'} flex flex-col items-center text-center px-4 space-y-3 opacity-60`}>
            <UserCircleIcon className="w-16 h-16 text-text-muted" />
            <p className="text-sm text-text-secondary font-medium max-w-[250px]">
              Comienza tu asesoría personal con {trainer?.name}.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = String(msg.sender_id) === String(userId);
            return (
              <div key={msg.id || index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 relative shadow-sm ${isMe ? 'bg-accent text-bg-primary rounded-tr-sm' : 'glass border border-glass-border text-text-primary rounded-tl-sm'}`}>
                  {msg.attachment_url && msg.attachment_type?.startsWith('video/') ? (
                    <div className="mb-2 rounded-xl overflow-hidden bg-black/10">
                      <video 
                        src={msg.attachment_url} 
                        controls 
                        className="max-w-full h-auto max-h-[300px] rounded-xl"
                      />
                      <a 
                        href={msg.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] block text-center py-1 mt-1 font-bold underline opacity-80 hover:opacity-100"
                      >
                        Abrir vídeo en pantalla completa
                      </a>
                    </div>
                  ) : null}
                  <p className="text-[13px] sm:text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                  <div className={`text-[9px] mt-0.5 flex items-center justify-end gap-1 ${isMe ? 'text-bg-primary/70' : 'text-text-muted'}`}>
                    <span>{formatTime(msg.created_at || new Date())}</span>
                    {isMe && (
                      <div className={`flex items-center -space-x-1.5 -mt-0.5 ${msg.read_at ? 'text-blue-500' : 'opacity-70'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        {msg.read_at && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Promo View para No-Trainees */}
        {showPromo && renderPromo()}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {isChatBlocked ? (
        <div className="px-4 py-4 md:p-4 bg-bg-primary/80 backdrop-blur-xl border-t border-glass-border shrink-0 flex items-center justify-center z-10">
          <p className="text-sm font-medium text-text-secondary opacity-70 flex items-center gap-2">
            {blockMessage || "El chat se encuentra bloqueado."}
          </p>
        </div>
      ) : (
        <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] md:pb-4 md:p-4 bg-bg-primary/80 backdrop-blur-xl border-t border-glass-border shrink-0 flex items-center gap-2 z-10">

        <div className="relative">
          <input 
            type="file" 
            accept="video/mp4,video/mov,video/avi,video/webm" 
            id="video-upload" 
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={uploading}
          />
          <label 
            htmlFor="video-upload" 
            className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border border-glass-border transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
            title="Adjuntar vídeo"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-text-secondary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PaperClipIcon className="w-5 h-5 text-text-secondary" />
            )}
          </label>
        </div>
        
        <form onSubmit={handleSend} className="flex items-center gap-2 w-full">
          <div className="flex-1 bg-black/5 dark:bg-white/5 border border-glass-border rounded-2xl overflow-hidden focus-within:border-accent/50 focus-within:bg-black/10 dark:focus-within:bg-white/10 transition-colors shadow-inner flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="w-full h-12 px-5 text-[14px] md:text-[15px] text-text-primary bg-transparent focus:outline-none"
              disabled={uploading}
            />
          </div>
          <button 
            type="submit" 
            disabled={!newMessage.trim() || loading || uploading}
            className="w-12 h-12 shrink-0 rounded-full bg-accent text-bg-primary flex items-center justify-center hover:bg-accent-hover active:scale-95 transition-colors disabled:opacity-50 disabled:grayscale"
          >
            <PaperAirplaneIcon className="w-5 h-5 -ml-0.5" />
          </button>
        </form>
        </div>
      )}
    </div>
  );
}
