import ModalPortal from './ModalPortal';
import React, { useState, useEffect, useRef } from 'react';
import { UserCircleIcon, ChatBubbleLeftRightIcon, ChevronLeftIcon, PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import apiClient from '../services/apiClient';
import { getSocket } from '../services/socket';
import { useToast } from '../hooks/useToast';
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

export default function TrainerChats({ onClose }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(() => {
    const saved = sessionStorage.getItem('trainer_chats_selected_client');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (selectedClient) {
      sessionStorage.setItem('trainer_chats_selected_client', JSON.stringify(selectedClient));
    } else {
      sessionStorage.removeItem('trainer_chats_selected_client');
    }
  }, [selectedClient]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const { addToast } = useToast();
  const userId = useAppStore((state) => state.userProfile?.id);
  const token = useAppStore((state) => state.token);

  useEffect(() => {
    fetchClients();

    const socket = getSocket();
    if (socket) {
      socket.on('chat_message', handleIncomingMessage);
      socket.on('messages_read', handleMessagesRead);
    }

    return () => {
      if (socket) {
        socket.off('chat_message', handleIncomingMessage);
        socket.off('messages_read', handleMessagesRead);
      }
    };
  }, []);

  const selectedClientRef = useRef(selectedClient);
  useEffect(() => {
    selectedClientRef.current = selectedClient;
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/chat/trainer-chats');
      setClients(res);
    } catch (error) {
      console.error('Error fetching trainer chats:', error);
      addToast('No se pudieron cargar los chats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIncomingMessage = (msg) => {
    const isFromCurrentChat = selectedClientRef.current && String(selectedClientRef.current.id) === String(msg.sender_id);

    setClients((prevClients) => {
      let updated = [...prevClients];
      const clientIndex = updated.findIndex((c) => String(c.id) === String(msg.sender_id) || String(c.id) === String(msg.receiver_id));

      if (clientIndex !== -1) {
        const client = updated[clientIndex];
        client.lastMessage = msg;
        if (String(msg.sender_id) === String(client.id) && !isFromCurrentChat) {
          client.unreadCount = (client.unreadCount || 0) + 1;
        }

        updated.splice(clientIndex, 1);
        updated.unshift(client);
      }
      return updated;
    });

    const currentUserId = useAppStore.getState().userProfile?.id;

    if (isFromCurrentChat || String(msg.sender_id) === String(currentUserId)) {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();

      if (String(msg.sender_id) === String(selectedClientRef.current?.id)) {
        markAsRead(selectedClientRef.current.id);
      }
    }
  };

  const handleMessagesRead = ({ byUserId }) => {
    const currentUserId = useAppStore.getState().userProfile?.id;
    setMessages((prev) => prev.map((msg) =>
    String(msg.sender_id) === String(currentUserId) &&
    String(msg.receiver_id) === String(byUserId) &&
    !msg.read_at ?
    { ...msg, read_at: new Date() } :
    msg
    ));
  };

  const markAsRead = async (clientId) => {
    try {
      await apiClient(`/chat/mark-read/${clientId}`, { method: 'POST' });
      setClients((prev) => prev.map((c) => String(c.id) === String(clientId) ? { ...c, unreadCount: 0 } : c));
    } catch (e) {
      console.error("Error marcando como leido", e);
    }
  };

  const openChat = async (client) => {
    setSelectedClient(client);
    setChatLoading(true);
    try {
      const history = await apiClient(`/chat/history/${client.id}`);
      setMessages(history);
      scrollToBottom();
      await markAsRead(client.id);
    } catch (e) {
      console.error("Error abriendo chat", e);
      addToast("Error al cargar mensajes", "error");
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient) return;

    const content = newMessage;
    setNewMessage('');

    const tempId = 'temp-' + Date.now();
    const optimisticMessage = {
      id: tempId,
      sender_id: userId,
      receiver_id: selectedClient.id,
      content: content,
      created_at: new Date().toISOString(),
      read_at: null,
      temp: true
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const res = await apiClient('/chat/send', {
        method: 'POST',
        body: {
          receiverId: selectedClient.id,
          content: content
        }
      });

      setMessages((prev) => prev.map((msg) =>
      msg.id === tempId ?
      { ...res, read_at: msg.read_at || res.read_at } :
      msg
      ));
      scrollToBottom();

      setClients((prevClients) => {
        let updated = [...prevClients];
        const clientIndex = updated.findIndex((c) => String(c.id) === String(selectedClient.id));
        if (clientIndex !== -1) {
          const client = updated[clientIndex];
          client.lastMessage = res;
          updated.splice(clientIndex, 1);
          updated.unshift(client);
        }
        return updated;
      });
    } catch (error) {
      console.error('Error sending message:', error);
      addToast('Error al enviar mensaje', 'error');
      setNewMessage(content);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClient) return;

    if (file.size > 150 * 1024 * 1024) {
      addToast('El archivo es demasiado grande. Máximo 150MB.', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', selectedClient.id);

    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/api/chat/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Error al subir vídeo');
      const sentMessage = await response.json();

      setMessages((prev) => [...prev, sentMessage]);
      scrollToBottom();
      addToast('Vídeo enviado correctamente', 'success');

      setClients((prev) => prev.map((c) =>
      c.id === selectedClient.id ?
      { ...c, lastMessage: sentMessage } :
      c
      ));
    } catch (error) {
      console.error(error);
      addToast('Error al subir el vídeo', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLinkClient = async (clientId) => {
    try {
      await apiClient(`/trainer/clients/${clientId}/link`, { method: 'PUT' });
      addToast('Cliente vinculado correctamente', 'success');
      // Actualizar estado local
      setClients((prev) => prev.map((c) =>
      String(c.id) === String(clientId) ?
      { ...c, role: 'trainee', trainer_id: userId } :
      c
      ));
      if (selectedClient && String(selectedClient.id) === String(clientId)) {
        setSelectedClient((prev) => ({ ...prev, role: 'trainee', trainer_id: userId }));
      }
    } catch (error) {
      console.error(error);
      addToast('Error al vincular cliente', 'error');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const totalUnread = clients.reduce((sum, client) => sum + (client.unreadCount || 0), 0);

  return <ModalPortal>
    <div className="fixed inset-0 z-[100] md:static md:w-full md:h-full flex flex-col md:flex-row bg-bg-primary overflow-hidden md:relative md:border md:border-glass-border md:rounded-xl md:isolate md:[transform:translateZ(0)]">
      
      {/* LISTA DE CONTACTOS */}
      <div className={`w-full md:w-[320px] lg:w-[360px] h-full md:border-r border-glass-border flex flex-col shrink-0 ${selectedClient ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header para la lista de contactos (Visible en PC y móvil) */}
        <div className="flex items-center gap-3 px-4 py-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] md:pt-4 border-b border-glass-border glass rounded-none z-10 shrink-0 shadow-sm">
          {onClose &&
          <button
            onClick={onClose}
            className="md:hidden w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-text-primary hover:bg-white/10 transition-colors">
            
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          }
          <h2 className="font-bold text-text-primary text-sm leading-tight flex items-center gap-2">
            Clientes
            {totalUnread > 0 &&
            <span className="text-[10px] font-bold bg-accent text-bg-primary px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            }
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
          {loading ?
          <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div> :
          clients.length === 0 ?
          <div className="p-8 text-center text-text-secondary">
              No tienes clientes asignados aún.
            </div> :

          clients.map((client) => {
            const isSelected = selectedClient?.id === client.id;
            return (
              <div
                key={client.id}
                onClick={() => openChat(client)}
                className={`relative flex items-center gap-4 p-3 sm:p-4 cursor-pointer rounded-[20px] transition-all duration-300 group overflow-hidden
                  ${isSelected ?
                'bg-accent/10 border border-accent/30 shadow-[0_4px_20px_-5px_rgba(239,68,68,0.15)]' :
                'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10'}`
                }>
                
                {isSelected &&
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-accent rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                }
                
                <div className="relative shrink-0">
                  {client.profile_image_url ?
                  <img src={getFullImageUrl(client.profile_image_url)} alt={client.name} className="w-12 h-12 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10" referrerPolicy="no-referrer" /> :

                  <UserCircleIcon className="w-12 h-12 text-text-secondary" />
                  }
                  {client.unreadCount > 0 &&
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow">
                      {client.unreadCount}
                    </span>
                  }
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-bold text-[15px] line-clamp-1 flex-1 ${client.unreadCount > 0 ? 'text-accent' : 'text-text-primary'}`}>{client.name}</h3>
                    {client.lastMessage &&
                    <span className="text-[10px] text-text-muted shrink-0 ml-2">
                        {formatTime(client.lastMessage.created_at)}
                      </span>
                    }
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[13px] line-clamp-2 flex-1 ${client.unreadCount > 0 ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
                      {client.lastMessage ?
                      client.lastMessage.sender_id === userId ? `Tú: ${client.lastMessage.content}` : client.lastMessage.content :
                      'Sin mensajes aún'}
                    </p>
                    {client.unreadCount > 0 &&
                    <div className="w-3 h-3 rounded-full bg-accent shrink-0 shadow-sm animate-pulse shadow-accent/50 ml-1"></div>
                    }
                  </div>
                </div>
              </div>);
          })
          }
        </div>
      </div>

      {/* ÁREA DE CHAT */}
      <div className={`flex flex-col flex-1 min-w-0 h-full ${!selectedClient ? 'hidden md:flex' : 'fixed inset-0 z-[100] bg-bg-primary animate-fade-in md:static md:flex md:bg-transparent'}`}>
        {!selectedClient ?
        <div className="hidden md:flex h-full flex-col items-center justify-center text-center opacity-50 space-y-4">
            <ChatBubbleLeftRightIcon className="w-20 h-20 text-text-muted" />
            <p className="text-text-secondary">Selecciona un cliente para comenzar la asesoría</p>
          </div> :

        <>
            {/* Header Chat */}
            <div className="flex items-center gap-4 px-4 py-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] md:pt-4 border-b border-glass-border glass rounded-none z-10 shrink-0 shadow-sm">
              <button
              onClick={() => setSelectedClient(null)}
              className="md:hidden w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-text-primary hover:bg-white/10 transition-colors">
              
                <ChevronLeftIcon className="w-6 h-6 text-text-primary" />
              </button>
              
              {selectedClient.profile_image_url ?
            <img src={getFullImageUrl(selectedClient.profile_image_url)} alt={selectedClient.name} className="w-10 h-10 rounded-full object-cover border border-accent/30" referrerPolicy="no-referrer" /> :

            <UserCircleIcon className="w-10 h-10 text-text-secondary" />
            }
              <div className="flex-1">
                <h2 className="font-bold text-text-primary text-sm leading-tight">{selectedClient.name}</h2>
                <p className="text-xs text-text-secondary">@{selectedClient.username}</p>
              </div>
              
              {/* Botón Vincular si no es trainee */}
              {selectedClient.role !== 'trainee' &&
            <button
              onClick={() => handleLinkClient(selectedClient.id)}
              className="shrink-0 px-3 py-1.5 bg-accent text-bg-primary font-bold text-xs rounded-full hover:bg-accent/90 transition-colors shadow-sm">
              
                  Añadir a Asesoría
                </button>
            }
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {chatLoading ?
            <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div> :
            messages.length === 0 ?
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <p className="text-sm text-text-secondary">No hay mensajes anteriores.</p>
                </div> :

            messages.map((msg, index) => {
              const isMe = String(msg.sender_id) === String(userId);
              return (
                <div key={msg.id || index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 relative shadow-sm ${isMe ? 'bg-accent text-bg-primary rounded-tr-sm' : 'glass border border-glass-border text-text-primary rounded-tl-sm'}`}>
                        {msg.attachment_url && msg.attachment_type?.startsWith('video/') ?
                    <div className="mb-2 rounded-xl overflow-hidden bg-black/10">
                            <video
                        src={msg.attachment_url}
                        controls
                        className="max-w-full h-auto max-h-[300px] rounded-xl" />
                      
                            <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] block text-center py-1 mt-1 font-bold underline opacity-80 hover:opacity-100">
                        
                              Abrir vídeo en pantalla completa
                            </a>
                          </div> :
                    null}
                        <p className="text-[13px] md:text-[14px] font-medium whitespace-pre-wrap">{msg.content}</p>
                        <div className={`text-[9px] mt-0.5 flex items-center justify-end gap-1 ${isMe ? 'text-bg-primary/70' : 'text-text-muted'}`}>
                          <span>{formatTime(msg.created_at || new Date())}</span>
                          {isMe &&
                      <div className={`flex items-center -space-x-1.5 -mt-0.5 ${msg.read_at ? 'text-blue-500' : 'opacity-70'}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                              {msg.read_at &&
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                        }
                            </div>
                      }
                        </div>
                      </div>
                    </div>);

            })
            }
              <div ref={messagesEndRef} />
            </div>

            {/* Input Chat */}
            <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] md:pb-4 md:p-4 bg-bg-primary/80 backdrop-blur-xl border-t border-glass-border shrink-0 flex items-center gap-2 z-10">
              <div className="relative">
                <input
                type="file"
                accept="video/mp4,video/mov,video/avi,video/webm"
                id="video-upload-trainer"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading} />
              
                <label
                htmlFor="video-upload-trainer"
                className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border border-glass-border transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
                title="Adjuntar vídeo">
                
                  {uploading ?
                <div className="w-5 h-5 border-2 border-text-secondary border-t-transparent rounded-full animate-spin"></div> :

                <PaperClipIcon className="w-5 h-5 text-text-secondary" />
                }
                </label>
              </div>
              
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
                <div className="flex-1 bg-black/5 dark:bg-white/5 border border-glass-border rounded-2xl overflow-hidden focus-within:border-accent/50 focus-within:bg-black/10 dark:focus-within:bg-white/10 transition-colors shadow-inner flex items-center">
                  <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Escribe a ${selectedClient.name.split(' ')[0]}...`}
                  className="w-full h-12 px-5 text-[14px] md:text-[15px] text-text-primary bg-transparent focus:outline-none"
                  disabled={uploading} />
                
                </div>
                <button
                type="submit"
                disabled={!newMessage.trim() || uploading}
                className="w-12 h-12 shrink-0 rounded-full bg-accent text-bg-primary flex items-center justify-center hover:bg-accent-hover active:scale-95 transition-colors disabled:opacity-50 disabled:grayscale">
                
                  <PaperAirplaneIcon className="w-5 h-5 -ml-0.5" />
                </button>
              </form>
            </div>
          </>
        }
      </div>

    </div></ModalPortal>;

}