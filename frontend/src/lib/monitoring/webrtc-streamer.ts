'use client';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc
} from 'firebase/firestore';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// 1. DESKTOP RECEIVER: Creates session, auto-receives mobile video and fires callbacks
export async function createReceiverSession(
  sessionId: string,
  onRemoteStream: (stream: MediaStream) => void,
  onConnectionStatusChange: (status: 'waiting' | 'connecting' | 'connected' | 'disconnected') => void
): Promise<{ pc: RTCPeerConnection; cleanup: () => void }> {
  const pc = new RTCPeerConnection(STUN_SERVERS);
  const sessionDoc = doc(db, 'remote_camera_sessions', sessionId);
  const offerCandidates = collection(sessionDoc, 'offerCandidates');
  const answerCandidates = collection(sessionDoc, 'answerCandidates');

  // Local BroadcastChannel for instant local testing
  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`webrtc_${sessionId}`) : null;

  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      onRemoteStream(event.streams[0]);
      onConnectionStatusChange('connected');
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      onConnectionStatusChange('connected');
    } else if (pc.connectionState === 'connecting') {
      onConnectionStatusChange('connecting');
    } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      onConnectionStatusChange('disconnected');
    }
  };

  const handleOffer = async (offerData: RTCSessionDescriptionInit) => {
    if (pc.currentRemoteDescription) return;
    try {
      const offer = new RTCSessionDescription(offerData);
      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const answerDescription = {
        type: answer.type,
        sdp: answer.sdp,
      };

      if (bc) {
        bc.postMessage({ type: 'answer', answer: answerDescription });
      }

      await updateDoc(sessionDoc, { answer: answerDescription, status: 'answered' }).catch(() => {});
    } catch (err) {
      console.warn('Error handling WebRTC offer:', err);
    }
  };

  // BroadcastChannel listener
  if (bc) {
    bc.onmessage = async (e) => {
      const msg = e.data;
      if (msg.type === 'offer') {
        await handleOffer(msg.offer);
      } else if (msg.type === 'candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } catch {}
      }
    };
  }

  // Firestore listener
  const unsubSession = onSnapshot(sessionDoc, async (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.offer) {
      await handleOffer(data.offer);
    }
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      if (bc) bc.postMessage({ type: 'candidate', candidate: event.candidate.toJSON() });
      addDoc(answerCandidates, event.candidate.toJSON()).catch(() => {});
    }
  };

  const unsubOfferCandidates = onSnapshot(offerCandidates, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data));
        } catch {}
      }
    });
  });

  await setDoc(sessionDoc, { createdAt: Date.now(), status: 'waiting' }).catch(() => {});

  const cleanup = () => {
    unsubSession();
    unsubOfferCandidates();
    if (bc) bc.close();
    pc.close();
  };

  return { pc, cleanup };
}

// 2. MOBILE PHONE TRANSMITTER: Auto-captures camera and immediately sends stream
export async function createTransmitterSession(
  sessionId: string,
  localStream: MediaStream,
  onConnectionStatusChange: (status: 'waiting' | 'connecting' | 'connected' | 'disconnected') => void
): Promise<{ pc: RTCPeerConnection; cleanup: () => void }> {
  const pc = new RTCPeerConnection(STUN_SERVERS);
  const sessionDoc = doc(db, 'remote_camera_sessions', sessionId);
  const offerCandidates = collection(sessionDoc, 'offerCandidates');
  const answerCandidates = collection(sessionDoc, 'answerCandidates');

  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`webrtc_${sessionId}`) : null;

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      onConnectionStatusChange('connected');
    } else if (pc.connectionState === 'connecting') {
      onConnectionStatusChange('connecting');
    } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      onConnectionStatusChange('disconnected');
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      if (bc) bc.postMessage({ type: 'candidate', candidate: event.candidate.toJSON() });
      addDoc(offerCandidates, event.candidate.toJSON()).catch(() => {});
    }
  };

  const offerDescription = await pc.createOffer({
    offerToReceiveVideo: false,
    offerToReceiveAudio: false,
  });
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  if (bc) {
    bc.postMessage({ type: 'offer', offer });
  }

  await setDoc(sessionDoc, { offer, status: 'offered' }, { merge: true }).catch(() => {});

  const handleAnswer = async (answerData: RTCSessionDescriptionInit) => {
    if (pc.currentRemoteDescription) return;
    try {
      const answer = new RTCSessionDescription(answerData);
      await pc.setRemoteDescription(answer);
      onConnectionStatusChange('connected');
    } catch (err) {
      console.warn('Error handling WebRTC answer:', err);
    }
  };

  if (bc) {
    bc.onmessage = async (e) => {
      const msg = e.data;
      if (msg.type === 'answer') {
        await handleAnswer(msg.answer);
      } else if (msg.type === 'candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } catch {}
      }
    };
  }

  const unsubSession = onSnapshot(sessionDoc, async (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      await handleAnswer(data.answer);
    }
  });

  const unsubAnswerCandidates = onSnapshot(answerCandidates, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data));
        } catch {}
      }
    });
  });

  const cleanup = () => {
    unsubSession();
    unsubAnswerCandidates();
    if (bc) bc.close();
    pc.close();
  };

  return { pc, cleanup };
}
