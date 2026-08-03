import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from './store';
import { db } from './firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, X } from 'lucide-react';
import { CallState } from './types';
import Peer, { MediaConnection } from 'peerjs';

let myPeer: Peer | null = null;

export function CallHandler() {
  const { currentUser, activeCall, setActiveCall } = useAppStore();
  const [incomingCall, setIncomingCall] = useState<CallState | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'calling' | 'connected'>('idle');
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const activeConnection = useRef<MediaConnection | null>(null);

  // Initialize PeerJS safely
  useEffect(() => {
    if (!currentUser) return;
    
    try {
      myPeer = new Peer(currentUser.id, {
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
      });
      
      myPeer.on('call', (call) => {
        if (localStream) {
          call.answer(localStream);
        } else if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
              setLocalStream(stream);
              call.answer(stream);
            })
            .catch(err => console.error('Failed to get local stream', err));
        }
        
        call.on('stream', (userVideoStream) => {
          setRemoteStream(userVideoStream);
        });
        
        call.on('close', () => {
          setCallStatus('idle');
          setRemoteStream(null);
          setActiveCall(null);
        });
        
        activeConnection.current = call;
      });

      myPeer.on('error', (err) => {
        console.warn('PeerJS error:', err);
      });
    } catch (err) {
      console.warn("PeerJS initialization failed safely:", err);
    }

    return () => {
      try {
        myPeer?.destroy();
      } catch (e) {}
      myPeer = null;
    };
  }, [currentUser?.id]);

  // Listen for incoming calls in Firestore
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'calls'),
      where('receiverId', '==', currentUser.id),
      where('status', '==', 'ringing')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const callDoc = snapshot.docs[0];
        setIncomingCall(callDoc.data() as CallState);
        setCallStatus('ringing');
      } else {
        setIncomingCall(null);
        if (callStatus === 'ringing') setCallStatus('idle');
      }
    });
    return () => unsub();
  }, [currentUser, callStatus]);

  // Handle activeCall state (outgoing call)
  useEffect(() => {
    if (activeCall && currentUser) {
      if (activeCall.userId === currentUser.id) return; // Can't call self
      
      const callId = `call_${currentUser.id}_${activeCall.userId}`;
      const newCall: CallState = {
        id: callId,
        callerId: currentUser.id,
        receiverId: activeCall.userId!,
        callerName: currentUser.name,
        callerAvatar: currentUser.avatar || '',
        status: 'calling',
        isAudioOnly: true,
        timestamp: Date.now()
      };
      
      setCallStatus('calling');
      
      // Setup local stream
      navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
        setLocalStream(stream);
        
        // Notify via Firestore
        setDoc(doc(db, 'calls', callId), { ...newCall, status: 'ringing' });
        
        // Wait for receiver to answer via PeerJS or Firestore
        const unsub = onSnapshot(doc(db, 'calls', callId), (d) => {
          if (d.exists()) {
            const data = d.data() as CallState;
            if (data.status === 'accepted') {
              setCallStatus('connected');
              // Make PeerJS call
              if (myPeer) {
                const call = myPeer.call(activeCall.userId!, stream);
                activeConnection.current = call;
                call.on('stream', (remoteStream) => {
                  setRemoteStream(remoteStream);
                });
                call.on('close', () => {
                  setCallStatus('idle');
                  setRemoteStream(null);
                  setActiveCall(null);
                });
              }
            } else if (data.status === 'rejected' || data.status === 'ended') {
              endCall();
            }
          }
        });
        
        return () => unsub();
      }).catch(err => {
        console.error("Failed to get microphone", err);
        setCallStatus('idle');
        setActiveCall(null);
      });
    }
  }, [activeCall]);

  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const acceptCall = () => {
    if (incomingCall) {
      updateDoc(doc(db, 'calls', incomingCall.id), { status: 'accepted' });
      setCallStatus('connected');
      
      navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
        setLocalStream(stream);
      });
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      updateDoc(doc(db, 'calls', incomingCall.id), { status: 'rejected' });
      setIncomingCall(null);
      setCallStatus('idle');
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    
    if (activeConnection.current) {
      activeConnection.current.close();
      activeConnection.current = null;
    }
    
    if (activeCall && currentUser) {
      const callId = `call_${currentUser.id}_${activeCall.userId}`;
      updateDoc(doc(db, 'calls', callId), { status: 'ended' }).catch(() => {});
    }
    if (incomingCall) {
      updateDoc(doc(db, 'calls', incomingCall.id), { status: 'ended' }).catch(() => {});
    }
    
    setCallStatus('idle');
    setActiveCall(null);
    setIncomingCall(null);
  };
  
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Render
  return (
    <AnimatePresence>
      {(callStatus !== 'idle' || incomingCall) && (
        <motion.div 
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          className="fixed inset-0 z-[200] bg-gray-950 text-white flex flex-col items-center justify-center p-6"
        >
          <div className="absolute top-8 right-8">
            <button onClick={endCall} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
              <X size={24} />
            </button>
          </div>

          <div className="relative mb-12">
            {(callStatus === 'ringing' || callStatus === 'calling') && (
              <div className="absolute -inset-4 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
            )}
            <img 
              src={incomingCall ? incomingCall.callerAvatar : (activeCall?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=user`)} 
              alt="Avatar" 
              className="w-32 h-32 rounded-full border-4 border-green-500 relative z-10 bg-gray-800 object-cover shadow-2xl" 
            />
          </div>
          
          <h2 className="text-3xl font-extrabold mb-2">
            {incomingCall ? incomingCall.callerName : activeCall?.name}
          </h2>
          <p className="text-gray-400 mb-12">
            {callStatus === 'calling' && "Calling..."}
            {callStatus === 'ringing' && "Incoming Audio Call..."}
            {callStatus === 'connected' && "Connected 00:00"}
          </p>

          <div className="flex items-center gap-6">
            {callStatus === 'ringing' ? (
              <>
                <button onClick={rejectCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <PhoneOff size={28} />
                </button>
                <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce">
                  <Phone size={28} />
                </button>
              </>
            ) : (
              <>
                <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-orange-500' : 'bg-gray-800'}`}>
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <PhoneOff size={28} />
                </button>
                <button className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                  <Volume2 size={24} />
                </button>
              </>
            )}
          </div>

          <audio ref={remoteAudioRef} autoPlay />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
