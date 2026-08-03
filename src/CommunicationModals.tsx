import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore, CommunicationTarget } from './store';
import { Phone, MessageSquare, Send, X, Mic, Square } from 'lucide-react';
import { Button } from './components';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { safeFormatTime } from './dateUtils';

export function CommunicationModals() {
  const { activeChat, setActiveChat } = useAppStore();

  return (
    <AnimatePresence>
      {activeChat && <ChatScreen key="chat" user={activeChat} onClose={() => setActiveChat(null)} />}
    </AnimatePresence>
  );
}


interface ChatMessage {
  id: string;
  text: string;
  audioUrl?: string;
  senderId: string;
  senderName: string;
  createdAt: number;
}

function ChatScreen({ user, onClose }: { user: CommunicationTarget; onClose: () => void }) {
  const { currentUser, setActiveCall, isAdminAuthenticated, allUsers } = useAppStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUserId = currentUser?.id || 'guest';
  const currentUserName = currentUser?.name || 'Guest User';

  // Unique Firestore Chat ID for this job/pair
  const chatId = user.jobId 
    ? `job_${user.jobId}` 
    : (user.userId && currentUserId) 
      ? [currentUserId, user.userId].sort().join('_') 
      : 'general_chat';

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordTimerRef = useRef<any>(null);

  const sendAudioMessage = async (audioUrl: string) => {
    if (!chatId) return;
    const now = Date.now();
    const newMsgObj: ChatMessage = {
      id: now.toString(),
      text: "🎵 Voice Message",
      audioUrl,
      senderId: currentUserId,
      senderName: currentUserName,
      createdAt: now
    };

    // Optimistic local update
    setMessages(prev => [...prev, newMsgObj]);

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: "🎵 Voice Message",
        audioUrl,
        senderId: currentUserId,
        senderName: currentUserName,
        createdAt: now
      });

      await setDoc(doc(db, 'chats', chatId), {
        id: chatId,
        lastMessage: "🎵 Voice Message",
        lastMessageTime: now,
        updatedAt: now,
        participants: [currentUserId, user.userId].filter(Boolean)
      }, { merge: true });
    } catch (err) {
      console.error("Error sending audio:", err);
    }
  };

  const startRecording = async () => {
    setRecordTime(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Audio recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Pick best supported mimeType
      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            sendAudioMessage(base64Audio);
          };
        }
        stream.getTracks().forEach(track => track.stop());
      };

      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);

      mediaRecorder.start(200); // Collect slice every 200ms
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setIsRecording(false);
      alert("Microphone permission required! Please allow microphone access in your browser prompt to send voice notes.");
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    if (isRecording) {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const rawPhone = user.phone || '03001234567';
  const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
  const waPhone = cleanPhone.replace(/^\+/, '');

  // Find target user details for admin
  const targetUser = isAdminAuthenticated ? allUsers.find(u => u.id === user.userId) : null;

  // Real-time Firestore message synchronization
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const list: ChatMessage[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<ChatMessage, 'id'>)
        }));
        setMessages(list);
      }, (err) => {
        console.warn("Chat snapshot error fallback:", err);
      });

      return () => unsub();
    } catch (err) {
      console.warn("Firestore query init error:", err);
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const textToSend = message.trim();
    setMessage('');

    const newMsgObj: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      senderId: currentUserId,
      senderName: currentUserName,
      createdAt: Date.now()
    };

    // Optimistic local update
    setMessages(prev => [...prev, newMsgObj]);

    try {
      const now = Date.now();
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: textToSend,
        senderId: currentUserId,
        senderName: currentUserName,
        createdAt: now
      });

      // Update parent document to enable admin querying
      const isSupport = chatId.startsWith('job_support_');
      let targetUserId = '';
      if (isSupport) {
         targetUserId = chatId.replace('job_support_', '');
      } else if (user.userId) {
         targetUserId = user.userId;
      }
      
      await setDoc(doc(db, 'chats', chatId), {
        id: chatId,
        isSupport: isSupport,
        userId: targetUserId || currentUserId, // for support, it's the actual user
        lastMessage: textToSend,
        lastMessageTime: now,
        updatedAt: now,
        participants: [currentUserId, user.userId].filter(Boolean)
      }, { merge: true });

    } catch (err) {
      console.error("Error saving message to Firestore:", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-950 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 px-4 pt-12 pb-4 flex items-center justify-between shadow-sm z-10 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors">
            <X size={22} />
          </button>
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-gray-100 object-cover" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{user.name}</h3>
            <p className="text-xs text-green-500 font-medium">Real-Time Obrago Chat</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveCall(user)}
            className="w-9 h-9 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center font-bold shadow-md shadow-blue-500/30 active:scale-95 transition-transform"
            title="In-App Audio Call"
          >
            <Phone size={16} fill="currentColor" className="text-white" />
          </button>
          
          <button 
            onClick={() => {
              const targetPhone = user.phone || targetUser?.phone || '03001234567';
              const clean = targetPhone.replace(/[^0-9+]/g, '');
              window.location.href = `tel:${clean || '03001234567'}`;
            }}
            className="w-9 h-9 rounded-full bg-green-500 text-white hover:bg-green-600 flex items-center justify-center font-bold shadow-md shadow-green-500/30 active:scale-95 transition-transform"
            title="Direct Mobile Phone Call"
          >
            <Phone size={16} />
          </button>
        </div>
      </div>
      
      {/* Admin Target User Profile Summary */}
      {targetUser && (
        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 mx-4 mt-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm text-xs text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-200 dark:border-blue-800">
            <span className="font-bold text-blue-700 dark:text-blue-400">Admin View: Complete Profile</span>
            <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full font-bold uppercase text-[9px]">{targetUser.role}</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
             <div><span className="font-medium">Full Name:</span> {targetUser.name}</div>
             <div><span className="font-medium">Phone:</span> {targetUser.phone || 'N/A'}</div>
             <div><span className="font-medium">Wallet Balance:</span> {targetUser.points || 0} Points</div>
             <div><span className="font-medium">Completed Jobs:</span> {targetUser.completedJobs || 0}</div>
             <div><span className="font-medium">Rating:</span> {targetUser.rating ? targetUser.rating.toFixed(1) : 'New'} / 5.0</div>
             <div><span className="font-medium">Status:</span> {targetUser.isBlocked ? 'Blocked' : 'Active'}</div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
        {messages.length === 0 && (
          <div className="my-auto text-center text-xs text-gray-400 py-8 bg-white dark:bg-gray-900/60 rounded-3xl p-6 border border-dashed border-gray-200 dark:border-gray-800">
            <MessageSquare size={28} className="mx-auto mb-2 text-green-500" />
            <p className="font-bold text-gray-700 dark:text-gray-300">Direct Chat with {user.name}</p>
            <p className="mt-1">Send a message below or call directly in-app.</p>
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex max-w-[85%] flex-col ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
              <div className={`px-4 py-2.5 rounded-2xl ${
                isMe 
                  ? 'bg-green-500 text-white rounded-tr-sm shadow-sm' 
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-tl-sm'
              }`}>
                {msg.audioUrl ? (
                  <audio src={msg.audioUrl} controls className="max-w-[200px] h-8" />
                ) : (
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                )}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">
                {safeFormatTime(msg.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 border-t border-gray-100 dark:border-gray-800 pb-8 flex gap-2 items-center">
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-full px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              <span className="text-xs font-bold font-mono">
                Recording ({Math.floor(recordTime / 60)}:{('0' + (recordTime % 60)).slice(-2)})
              </span>
            </div>
            <button 
              onClick={stopRecording} 
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow transition-transform active:scale-95"
            >
              <Send size={12} /> Send
            </button>
          </div>
        ) : (
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5 flex items-center">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="w-full bg-transparent border-none focus:outline-none text-xs text-gray-900 dark:text-white placeholder:text-gray-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
          </div>
        )}
        
        {!message.trim() && !isRecording ? (
          <button 
            onClick={startRecording}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 active:scale-95 transition-transform shrink-0"
            title="Record Voice Message"
          >
            <Mic size={18} />
          </button>
        ) : !isRecording ? (
          <button 
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-500/20 active:scale-95 transition-transform shrink-0"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
