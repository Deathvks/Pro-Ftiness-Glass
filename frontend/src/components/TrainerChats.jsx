
import React, { useState, useEffect, useRef } from 'react';
import { UserCircleIcon, ChatBubbleLeftRightIcon, ChevronLeftIcon, PaperAirplaneIcon, PaperClipIcon, CheckCircleIcon, ClockIcon, XMarkIcon, BellAlertIcon, EnvelopeIcon, FireIcon, ArchiveBoxXMarkIcon } from '@heroicons/react/24/outline';
import apiClient from '../services/apiClient';
import { initSocket } from '../services/socket';
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
  const [clientToLink, setClientToLink] = useState(null);
  const [showClosedChats, setShowClosedChats] = useState(false);
  const [showBotChats, setShowBotChats] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);
  const [botModalClient, setBotModalClient] = useState(null);
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
  const userRole = useAppStore((state) => state.userProfile?.role);
  const isAdmin = userRole === 'admin';
  const token = useAppStore((state) => state.token);

  useEffect(() => {
    fetchClients();

    const socket = initSocket();
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

  const renderMessageContent = (msg) => {
    if (msg.attachment_type === 'bot_reply') {
      const parts = msg.content.split('[notificaciones push]');
      if (parts.length > 1) {
        return (
          <p className="text-[13px] md:text-[14px] font-medium whitespace-pre-wrap">
            {parts[0]}<span className="font-bold underline">notificaciones push</span>{parts[1]}
          </p>
        );
      }
    }
    return <p className="text-[13px] md:text-[14px] font-medium whitespace-pre-wrap">{msg.content}</p>;
  };

  const handleMessageEdited = (editedMsg) => {
    setMessages((prev) => prev.map((msg) =>
      msg.id === editedMsg.id ? { ...msg, content: editedMsg.content } : msg
    ));
  };

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [activeMessageOptions, setActiveMessageOptions] = useState(null);
  const [fullscreenVideo, setFullscreenVideo] = useState(null);
  const longPressRef = useRef(null);

  const handlePressStart = (msg) => {
    if (msg.attachment_type === 'bot_reply') {
      longPressRef.current = setTimeout(() => {
        setActiveMessageOptions(msg.id);
      }, 500);
    }
  };

  const handlePressEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleEditSubmit = async (msgId) => {
    try {
      const res = await apiClient(`/chat/message/${msgId}`, {
        method: 'PUT',
        body: { content: editContent }
      });
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: res.content } : m));
      setEditingMessageId(null);
      setEditContent('');
    } catch (e) {
      addToast('Error al editar el mensaje', 'error');
    }
  };

  const startEditing = (msg) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  useEffect(() => {
    const socket = initSocket();
    if (socket) {
      socket.on('message_edited', handleMessageEdited);
    }
    return () => {
      if (socket) {
        socket.off('message_edited', handleMessageEdited);
      }
    }
  }, []);

  const markAsRead = async (clientId) => {
    try {
      await apiClient(`/chat/mark-read/${clientId}`, { method: 'POST' });
      setClients((prev) => prev.map((c) => String(c.id) === String(clientId) ? { ...c, unreadCount: 0 } : c));
      const fetchUnreadChats = useAppStore.getState().fetchUnreadChats;
      if (fetchUnreadChats) fetchUnreadChats();
    } catch (e) {
      console.error("Error marcando como leido", e);
    }
  };

    const executeBotReminder = async (e, client) => {
    e.stopPropagation();
    try {
      const levelToExecute = (client.lastMessage?.bot_reminder_level || 0) + 1;
      if (levelToExecute > 3) {
        addToast('El chat se cerrará hoy o ya se ha cerrado.', 'info');
        return;
      }
      
      const response = await apiClient('/chat/trainer/bot-reminder/' + client.id + '/' + levelToExecute, { method: 'POST' });
      const statuses = response.status;
      
      addToast(
        'Push: ' + (statuses.push === 'ok' ? 'OK' : 'Error') + ' | ' +
        'App: ' + (statuses.notification === 'ok' ? 'OK' : 'Error') + ' | ' +
        'Email: ' + (statuses.email === 'ok' ? 'OK' : 'Error'),
        'success'
      );

      // Refresh chat list to update level
      fetchClients();
      if (selectedClient?.id === client.id) {
         setMessages(prev => [...prev, response.newMessage]);
      }
    } catch (err) {
      console.error(err);
      addToast('Error al enviar el aviso', 'error');
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

  const formatLastSeen = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const diffMs = today - date;
    if (diffMs < 2 * 60 * 1000) {
      return 'En línea';
    }

    let timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (date.toDateString() === today.toDateString()) {
      return `hoy a las ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `ayer a las ${timeStr}`;
    } else {
      return `${date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })} a las ${timeStr}`;
    }
  };

  const formatLastMessageDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: date.getFullYear() !== today.getFullYear() ? '2-digit' : undefined });
    }
  };

  const formatDateHeader = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    }
  };
  const totalUnread = clients.reduce((sum, client) => sum + (client.unreadCount || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] md:static md:w-full md:h-full flex flex-col md:flex-row bg-bg-primary overflow-hidden md:relative md:border md:border-glass-border md:rounded-xl md:isolate md:[transform:translateZ(0)]">
      
      {/* LISTA DE CONTACTOS */}
      <div className={`w-full md:w-[320px] lg:w-[360px] h-full md:border-r border-glass-border flex flex-col shrink-0 ${selectedClient ? 'hidden md:flex' : 'flex'}`}>
        
        <div 
          className="flex items-center gap-3 px-4 py-3 md:pt-4 border-b border-glass-border glass rounded-none z-10 shrink-0 shadow-sm"
          style={{ paddingTop: 'calc(max(var(--safe-top, env(safe-area-inset-top, 0px)), 24px) + 12px)' }}
        >
          {onClose &&
          <button
            onClick={onClose}
            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-text-primary hover:bg-white/10 transition-colors bg-bg-secondary md:bg-transparent">
            
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          }
          <h2 className="font-bold text-text-primary text-sm leading-tight flex items-center gap-2">
            Clientes
            {totalUnread > 0 &&
            <span className="text-[10px] font-bold bg-accent text-accent-contrast px-2 py-0.5 rounded-full">
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
                    (() => {
            const activeClients = clients.filter(c => !c.is_chat_closed);
            const closedClients = clients.filter(c => c.is_chat_closed);

            let botClients = [];
            if (isAdmin) {
              botClients = activeClients.filter(c => c.role === 'user').map(client => {
                const level = client.lastMessage?.bot_reminder_level || 0;
                const diffDays = client.lastMessage ? Math.floor((new Date() - new Date(client.lastMessage.created_at)) / (1000 * 60 * 60 * 24)) : 0;
                
                let urgency = 999;
                let label = '';
                let color = '';
                
                if (level === 0) {
                  urgency = 3 - diffDays;
                  label = `Aviso 1 en ${Math.max(0, urgency)}d`;
                  color = 'text-yellow-500 bg-yellow-500/10 ring-yellow-500/30';
                } else if (level === 1) {
                  urgency = 2 - diffDays;
                  label = `Aviso 2 en ${Math.max(0, urgency)}d`;
                  color = 'text-orange-500 bg-orange-500/10 ring-orange-500/30';
                } else if (level === 2) {
                  urgency = 1 - diffDays;
                  label = `Aviso 3 en ${Math.max(0, urgency)}d`;
                  color = 'text-red-500 bg-red-500/10 ring-red-500/30';
                } else if (level === 3) {
                  urgency = 1 - diffDays;
                  label = `Cierre en ${Math.max(0, urgency)}d`;
                  color = 'text-red-600 bg-red-600/20 ring-red-600/50 animate-pulse';
                }
                
                return { ...client, bot_urgency: urgency, bot_label: label, bot_color: color };
              }).filter(c => c.bot_urgency <= 2); // Show those approaching action (<= 2 days)
              
              botClients.sort((a, b) => a.bot_urgency - b.bot_urgency);
            }
            
            return (
              <>
                {isAdmin && (
                  <div className="mb-6">
                    <button 
                      onClick={() => setShowBotChats(!showBotChats)}
                      className="flex items-center justify-between w-full p-4 bg-black/5 dark:bg-white/5 rounded-[20px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-glass-border shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="font-bold text-sm text-text-primary">Secuencia Bot ({botClients.length})</span>
                      </div>
                      <svg className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${showBotChats ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showBotChats ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                      <div className="flex flex-col gap-2">
                        {botClients.length === 0 ? (
                          <div className="p-4 text-center text-xs text-text-secondary opacity-70">
                            Actualmente no hay chats por gestionar por inactividad.
                          </div>
                        ) : botClients.map((client) => {
                          const isSelected = selectedClient?.id === client.id;
                          return (
                            <div
                              key={client.id}
                              onClick={() => setBotModalClient(client)}
                              className={`relative flex items-center gap-4 p-3 cursor-pointer rounded-[16px] transition-all duration-200 group ${isSelected ? 'bg-accent/10 border border-accent/30' : 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}
                            >
                              <div className="relative shrink-0">
                                {client.profile_image_url ? (
                                  <img src={getFullImageUrl(client.profile_image_url)} alt={client.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10" referrerPolicy="no-referrer" />
                                ) : (
                                  <UserCircleIcon className="w-10 h-10 text-text-secondary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-text-primary truncate text-sm mb-0.5">{client.name || client.username}</h3>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ring-1 ${client.bot_color}`}>{client.bot_label}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                
                {activeClients.length === 0 ? (
                  <div className="p-8 text-center text-text-secondary">
                    No tienes clientes activos aún.
                  </div>
                ) : (
                  activeClients.map((client) => {
                    const isSelected = selectedClient?.id === client.id;
                    return (
                      <div
                        key={client.id}
                        onClick={() => openChat(client)}
                        className={`relative flex items-center gap-4 p-3 sm:p-4 cursor-pointer rounded-[20px] transition-all duration-300 group overflow-hidden ${isSelected ? 'bg-accent/10 border border-accent/30 shadow-[0_4px_20px_-5px_rgba(239,68,68,0.15)]' : 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10'}`}
                      >
                        {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-accent rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>}
                        <div className="relative shrink-0">
                          {client.profile_image_url ? (
                            <img src={getFullImageUrl(client.profile_image_url)} alt={client.name} className="w-12 h-12 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10" referrerPolicy="no-referrer" />
                          ) : (
                            <UserCircleIcon className="w-12 h-12 text-text-secondary" />
                          )}
                          {client.unreadCount > 0 && <div className="absolute -top-1 -right-1 bg-accent text-accent-contrast text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-bg-primary animate-pulse-soft">{client.unreadCount}</div>}
                          {client.lastSeen && (new Date() - new Date(client.lastSeen) < 2 * 60 * 1000) && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-bg-primary rounded-full"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 min-w-0">
                            <h3 className="font-bold text-text-primary truncate text-sm">{client.name || client.username}</h3>
                            {client.role === 'trainee' && <span className="shrink-0 px-1.5 py-0.5 bg-accent/20 text-accent text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full ring-1 ring-accent/30">Asesorado</span>}
                          </div>
                          {client.lastMessage && (
                            <p className="text-xs text-text-secondary truncate pr-4 opacity-80 font-medium">
                              {String(client.lastMessage.sender_id) === String(userId) ? 'Tú: ' : ''}{client.lastMessage.attachment_type === 'bot_reply' ? '🤖 Respuesta automática' : client.lastMessage.attachment_url ? '📎 Archivo adjunto' : client.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                                {closedClients.length > 0 && (
                  <div className="mt-6 mb-2">
                    <button 
                      onClick={() => setShowClosedChats(!showClosedChats)}
                      className="flex items-center justify-between w-full p-4 bg-black/5 dark:bg-white/5 rounded-[20px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-glass-border shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-text-secondary/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </div>
                        <span className="font-bold text-sm text-text-primary">Carpeta de Cerrados ({closedClients.length})</span>
                      </div>
                      <svg className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${showClosedChats ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showClosedChats ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                      <div className="flex flex-col gap-2">
                        {closedClients.map((client) => {
                          const isSelected = selectedClient?.id === client.id;
                          return (
                            <div
                              key={client.id}
                              onClick={() => openChat(client)}
                              className={`relative flex items-center gap-4 p-3 cursor-pointer rounded-[16px] transition-all duration-200 group ${isSelected ? 'bg-accent/10 border border-accent/30' : 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}
                            >
                              <div className="relative shrink-0">
                                {client.profile_image_url ? (
                                  <img src={getFullImageUrl(client.profile_image_url)} alt={client.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10 grayscale" referrerPolicy="no-referrer" />
                                ) : (
                                  <UserCircleIcon className="w-10 h-10 text-text-secondary opacity-50" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 opacity-70">
                                <h3 className="font-bold text-text-primary truncate pr-2 text-sm">{client.name || client.username}</h3>
                                {client.lastMessage && (
                                  <p className="text-xs text-text-secondary truncate pr-4">Cerrado por inactividad</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

        {/* ÁREA DE CHAT */}
      <div className={`flex flex-col flex-1 min-w-0 h-full relative ${!selectedClient ? 'hidden md:flex' : 'fixed inset-0 z-[100] bg-bg-primary animate-fade-in md:static md:flex md:bg-transparent'}`}>
        {!selectedClient ?
        <div className="hidden md:flex h-full flex-col items-center justify-center text-center opacity-50 space-y-4">
            <ChatBubbleLeftRightIcon className="w-20 h-20 text-text-muted" />
            <p className="text-text-secondary">Selecciona un cliente para comenzar la asesoría</p>
          </div> :

        <>
            {/* Header Chat */}
            <div 
              className="absolute top-0 left-0 right-0 flex items-center gap-4 px-4 pb-3 border-b border-glass-border bg-bg-primary/80 backdrop-blur-xl z-20 shadow-sm"
              style={{ paddingTop: 'calc(max(var(--safe-top, env(safe-area-inset-top, 0px)), 24px) + 12px)' }}
            >
              <button
              onClick={() => setSelectedClient(null)}
              className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-text-primary hover:bg-white/10 transition-colors">
              
                <ChevronLeftIcon className="w-6 h-6 text-text-primary" />
              </button>
              
              {selectedClient.profile_image_url ?
            <img src={getFullImageUrl(selectedClient.profile_image_url)} alt={selectedClient.name} className="w-10 h-10 rounded-full object-cover border border-accent/30" referrerPolicy="no-referrer" /> :

            <UserCircleIcon className="w-10 h-10 text-text-secondary" />
              }
                <div className="flex-1">
                  <h2 className="font-bold text-text-primary text-sm leading-tight">{selectedClient.name}</h2>
                  <p className={`text-[11px] ${selectedClient.lastSeen && (new Date() - new Date(selectedClient.lastSeen) < 2 * 60 * 1000) ? 'text-accent font-medium' : 'text-text-secondary'}`}>
                    {selectedClient.lastSeen ? formatLastSeen(selectedClient.lastSeen) : `@${selectedClient.username}`}
                  </p>
                </div>
                
                {/* Botón Vincular si no es trainee */}
              {selectedClient.role !== 'trainee' &&
            <button
              onClick={() => setClientToLink(selectedClient)}
              className="shrink-0 px-3 py-1.5 bg-accent text-accent-contrast font-bold text-xs rounded-full hover:bg-accent/90 transition-colors shadow-sm">
              
                  Añadir a Asesoría
                </button>
            }
            </div>

            {/* Mensajes */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
              style={{ paddingTop: 'calc(max(var(--safe-top, env(safe-area-inset-top, 0px)), 20px) + 85px)' }}
            >
              {chatLoading ?
            <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div> :
            messages.length === 0 ?
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <p className="text-sm text-text-secondary">No hay mensajes anteriores.</p>
                </div> :

              messages.map((msg, index) => {
                const isMe = String(msg.sender_id) !== String(selectedClient.id);
                const showDate = index === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();
                return (
                  <React.Fragment key={msg.id || index}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="px-3 py-1 bg-black/20 dark:bg-white/10 rounded-[12px] text-[10px] font-bold text-text-secondary uppercase tracking-wider backdrop-blur-sm shadow-sm border border-glass-border">
                          {formatDateHeader(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-[75%] rounded-2xl px-3 py-2 relative shadow-sm ${isMe ? 'bg-accent text-accent-contrast rounded-tr-sm' : 'glass border border-glass-border text-text-primary rounded-tl-sm'} ${activeMessageOptions === msg.id ? 'ring-2 ring-accent scale-[0.98] transition-transform' : 'transition-transform'}`}
                        onTouchStart={() => handlePressStart(msg)}
                        onTouchEnd={handlePressEnd}
                        onTouchCancel={handlePressEnd}
                        onMouseDown={() => handlePressStart(msg)}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                      >
                        {msg.attachment_type === 'bot_reply' && (
                          <div className={`text-[11px] font-bold opacity-80 mb-1 flex items-center gap-1 ${!isMe ? 'text-accent' : ''}`}>
                            🤖 Bot Coordinador
                          </div>
                        )}
                        {msg.attachment_url && msg.attachment_type?.startsWith('video/') ? (
                          <div className="mb-2 rounded-xl overflow-hidden bg-black/10">
                            <video
                              src={msg.attachment_url}
                              controls
                              className="max-w-full h-auto max-h-[300px] rounded-xl" />
                            <button
                              onClick={() => setFullscreenVideo(msg.attachment_url)}
                              className="text-[11px] w-full block text-center py-1 mt-1 font-bold underline opacity-80 hover:opacity-100">
                              Abrir vídeo en pantalla completa
                            </button>
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] w-full block text-center py-1 mt-1 font-bold underline opacity-80 hover:opacity-100 text-blue-400">
                              Ver archivo en la nube
                            </a>
                          </div>
                        ) : null}
                        
                        <div className="relative">
                          {renderMessageContent(msg)}
                        </div>

                        <div className={`text-[9px] mt-0.5 flex items-center justify-end gap-1 ${isMe ? 'text-accent-contrast/70' : 'text-text-muted'}`}>
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
                  </React.Fragment>
                );
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
                className="w-12 h-12 shrink-0 rounded-full bg-accent text-accent-contrast flex items-center justify-center hover:bg-accent-hover active:scale-95 transition-colors disabled:opacity-50 disabled:grayscale">
                
                  <PaperAirplaneIcon className="w-5 h-5 -ml-0.5" />
                </button>
              </form>
            </div>
          </>
        }
      </div>

      {/* Modal Opciones de Mensaje (Action Sheet) */}
      {activeMessageOptions && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setActiveMessageOptions(null)} />
          <div className="relative bg-bg-secondary rounded-t-3xl p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] animate-[slide-up_0.3s_ease-out] shadow-2xl border-t border-glass-border">
            <div className="w-12 h-1.5 bg-glass-border rounded-full mx-auto mb-6" />
            <button
              onClick={() => {
                const msgToEdit = messages.find(m => m.id === activeMessageOptions);
                if (msgToEdit) startEditing(msgToEdit);
                setActiveMessageOptions(null);
              }}
              className="w-full flex items-center gap-3 p-4 bg-bg-primary hover:bg-black/20 dark:hover:bg-white/5 rounded-2xl transition-colors font-bold text-text-primary mb-3 border border-glass-border shadow-sm active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-accent"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
              Editar Mensaje del Bot
            </button>
            <button
              onClick={() => setActiveMessageOptions(null)}
              className="w-full p-4 rounded-2xl font-bold text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/5 transition-colors active:scale-[0.98]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Edición a Pantalla Completa/Centrado */}
      {editingMessageId && (
        <div className="fixed inset-0 z-[250] flex flex-col justify-end md:justify-center items-center px-4 md:px-0">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setEditingMessageId(null)} />
          <div className="relative w-full max-w-lg bg-bg-secondary md:rounded-3xl rounded-t-3xl p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] md:pb-6 animate-[slide-up_0.3s_ease-out] shadow-2xl border border-glass-border">
            <h3 className="text-lg font-black text-text-primary mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-accent"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
              Editar Mensaje del Bot
            </h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-bg-primary text-text-primary rounded-[20px] p-4 text-base md:text-sm border-2 border-glass-border focus:border-accent outline-none mb-6 min-h-[150px] leading-relaxed shadow-inner resize-none"
              placeholder="Escribe el mensaje..."
            />
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setEditingMessageId(null)} 
                className="flex-1 py-4 rounded-[20px] font-bold text-text-secondary bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleEditSubmit(editingMessageId)} 
                className="flex-1 py-4 rounded-[20px] font-bold text-accent-contrast bg-accent hover:bg-accent-hover active:scale-95 transition-all shadow-lg shadow-accent/20"
              >
                Aplicar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Video Fullscreen */}
      {fullscreenVideo && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center animate-fade-in">
          <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent" style={{ paddingTop: 'calc(max(var(--safe-top, env(safe-area-inset-top, 0px)), 24px) + 12px)' }}>
            <button 
              onClick={() => setFullscreenVideo(null)}
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 backdrop-blur-md transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          </div>
          <video 
            src={fullscreenVideo} 
            controls 
            autoPlay 
            className="w-full max-h-full object-contain"
          />
        </div>
      )}

    
      {/* Modal Confirmacion Anadir a Asesoria */}
      {clientToLink && (
        <div className="fixed inset-0 z-[300] flex flex-col justify-end md:justify-center items-center px-0 md:px-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
            onClick={() => setClientToLink(null)} 
            style={{ opacity: Math.max(0, 1 - dragY / 300) }}
          />
          <div 
            className="relative w-full max-w-sm bg-bg-secondary md:rounded-[24px] rounded-t-3xl p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] md:pb-6 shadow-2xl border-t md:border border-glass-border"
            style={{
              transform: `translateY(${dragY}px)`,
              transition: touchStartY !== null ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
            }}
            onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
            onTouchMove={(e) => {
              if (touchStartY === null) return;
              const diff = e.touches[0].clientY - touchStartY;
              if (diff > 0) setDragY(diff);
            }}
            onTouchEnd={() => {
              if (dragY > 100) {
                setClientToLink(null);
              }
              setDragY(0);
              setTouchStartY(null);
            }}
          >
            {/* Drag Handle para móvil */}
            <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-5 sm:hidden shrink-0" />
            
            <h3 className="text-lg font-bold text-text-primary mb-2">Añadir a Asesoría</h3>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              ¿Estás seguro de que deseas vincular a <span className="font-bold text-text-primary">{clientToLink.name}</span> a tu asesoría? Podrás asignarle rutinas y hacerle seguimiento detallado.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setClientToLink(null)}
                className="flex-1 py-4 bg-black/5 dark:bg-white/5 rounded-2xl font-bold text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  handleLinkClient(clientToLink.id);
                  setClientToLink(null);
                }}
                className="flex-1 py-4 bg-accent text-accent-contrast rounded-2xl font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-95 transition-all"
              >
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}

                  {/* BOT SEQUENCE MODAL */}
      {botModalClient && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end md:justify-center items-center px-4 md:px-0">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setBotModalClient(null)} />
          <div
            className="relative w-full max-w-md bg-bg-secondary md:rounded-[24px] rounded-t-[32px] p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] md:pb-6 shadow-2xl border-t md:border border-glass-border overflow-hidden flex flex-col max-h-[85vh]"
            style={{ transform: 'translateY(' + dragY + 'px)', transition: touchStartY !== null ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}
            onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
            onTouchMove={(e) => {
              if (touchStartY === null) return;
              const diff = e.touches[0].clientY - touchStartY;
              if (diff > 0) setDragY(diff);
            }}
            onTouchEnd={() => {
              if (dragY > 100) setBotModalClient(null);
              setDragY(0);
              setTouchStartY(null);
            }}
          >
            <div className="w-12 h-1.5 bg-glass-border rounded-full mx-auto mb-6 md:hidden shrink-0" />
            
            <div className="flex items-center gap-4 mb-6 shrink-0">
              {botModalClient.profile_image_url ? (
                <img src={getFullImageUrl(botModalClient.profile_image_url)} alt="Profile" className="w-14 h-14 rounded-full object-cover ring-2 ring-accent/20" />
              ) : (
                <UserCircleIcon className="w-14 h-14 text-text-secondary" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-text-primary truncate">{botModalClient.name || botModalClient.username}</h3>
                <p className="text-sm text-text-secondary">Secuencia de Inactividad</p>
              </div>
              <button onClick={() => setBotModalClient(null)} className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 transition-colors hidden md:block">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar relative mb-6">
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-glass-border z-0"></div>
              <div className="space-y-6 relative z-10">
                {(() => {
                                    const level = botModalClient.lastMessage?.bot_reminder_level || 0;
                  const lastDate = botModalClient.lastMessage ? new Date(botModalClient.lastMessage.created_at) : new Date();
                  
                  const getExactTimeLeft = (requiredDays) => {
                    const now = new Date();
                    const targetDate = new Date(lastDate.getTime() + requiredDays * 24 * 60 * 60 * 1000);
                    const diffMs = targetDate - now;
                    if (diffMs <= 0) {
                      const next11AM = new Date();
                      next11AM.setHours(11, 0, 0, 0);
                      if (next11AM < now) {
                        next11AM.setDate(next11AM.getDate() + 1);
                      }
                      const waitMs = next11AM - now;
                      const h = Math.floor(waitMs / (1000 * 60 * 60));
                      const m = Math.floor((waitMs % (1000 * 60 * 60)) / (1000 * 60));
                      return `Sale a las 11:00 AM (en ${h}h ${m}m)`;
                    }
                    
                    const h = Math.floor(diffMs / (1000 * 60 * 60));
                    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    
                    if (h >= 24) {
                      const d = Math.floor(h / 24);
                      const rh = h % 24;
                      return `Se enviará en ${d}d ${rh}h ${m}m`;
                    }
                    return `Se enviará en ${h}h ${m}m`;
                  };
                  
                  const renderStep = (stepLevel, title, description, requiredDays, isFinal = false) => {
                    const isCompleted = level >= stepLevel;
                    const isActive = level === stepLevel - 1;
                    
                    return (
                      <div className="flex items-start gap-4">
                        <div className={'w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm z-10 ' + (isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-accent text-accent-contrast ring-4 ring-accent/20' : 'bg-black/5 dark:bg-white/5 text-text-tertiary border border-glass-border')}>
                          {isCompleted ? <CheckCircleIcon className="w-6 h-6" /> : <ClockIcon className="w-5 h-5" />}
                        </div>
                        <div className={'flex-1 pt-2 ' + (isActive ? 'opacity-100' : 'opacity-70')}>
                          <h4 className={'font-bold text-sm ' + (isCompleted ? 'text-green-500' : 'text-text-primary')}>{title}</h4>
                          <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">{description}</div>
                          {isCompleted ? (
                            !isFinal && (
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-md">
                                  <BellAlertIcon className="w-3 h-3" /> Push Enviado
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-md">
                                  <EnvelopeIcon className="w-3 h-3" /> Email Enviado
                                </div>
                              </div>
                            )
                          ) : isActive ? (
                            <div className="mt-2 text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-lg inline-block">
                              {getExactTimeLeft(requiredDays)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <>
                      {renderStep(1, "Aviso 1", "¿Continuamos con tu cambio?", 3)}
                      {renderStep(2, "Aviso 2", <><span className="mr-1">Aún estás a tiempo de empezar</span> <FireIcon className="w-4 h-4 text-orange-500 shrink-0"/></>, level === 0 ? 5 : 2)}
                      {renderStep(3, "Aviso 3", <><span className="mr-1">Último aviso antes de cerrar</span> <ArchiveBoxXMarkIcon className="w-4 h-4 text-red-500 shrink-0"/></>, level === 0 ? 6 : level === 1 ? 3 : 1)}
                      {renderStep(4, "Cierre", "Se bloqueará la conversación", level === 0 ? 7 : level === 1 ? 4 : level === 2 ? 2 : 1, true)}
                    </>
                  );

                })()}
              </div>
            </div>

            <div className="flex gap-3 shrink-0">
              <button 
                onClick={() => {
                  setBotModalClient(null);
                  openChat(botModalClient);
                }}
                className="flex-1 py-3.5 bg-black/5 dark:bg-white/5 rounded-[16px] font-bold text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                Abrir Chat
              </button>
              {(botModalClient.lastMessage?.bot_reminder_level || 0) < 3 && (
                <button 
                  onClick={(e) => {
                    executeBotReminder(e, botModalClient);
                  }}
                  className="flex-1 py-3.5 bg-accent text-accent-contrast rounded-[16px] font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Forzar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


