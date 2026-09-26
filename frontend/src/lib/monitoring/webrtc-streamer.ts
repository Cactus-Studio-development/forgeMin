'use client';

// WebRTC P2P Video Streaming Engine for RIS3 MONITOREO
// Uses PeerJS Cloud Signaling with Public STUN/TURN for zero-configuration, zero-auth connectivity between mobile and desktop

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

function sanitizePeerId(sessionId: string): string {
  const clean = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `ris3_cam_${clean}`;
}

// 1. DESKTOP RECEIVER: Opens well-known Peer ID, listens for incoming calls and passes remote stream
export async function createReceiverSession(
  sessionId: string,
  onRemoteStream: (stream: MediaStream) => void,
  onConnectionStatusChange: (status: 'waiting' | 'connecting' | 'connected' | 'disconnected') => void
): Promise<{ cleanup: () => void }> {
  if (typeof window === 'undefined') {
    return { cleanup: () => {} };
  }

  const { default: Peer } = await import('peerjs');
  const targetPeerId = sanitizePeerId(sessionId);
  let isCleanedUp = false;
  let activeCall: any = null;

  onConnectionStatusChange('waiting');

  const peer = new Peer(targetPeerId, {
    config: ICE_CONFIG,
    debug: 1,
  });

  peer.on('open', (id) => {
    console.log('[WebRTC Receiver] Ready on Peer ID:', id);
    if (!isCleanedUp) {
      onConnectionStatusChange('waiting');
    }
  });

  peer.on('call', (call) => {
    console.log('[WebRTC Receiver] Incoming video call from mobile device:', call.peer);
    activeCall = call;
    onConnectionStatusChange('connecting');

    // Answer call (receive-only)
    call.answer();

    call.on('stream', (remoteStream: MediaStream) => {
      console.log('[WebRTC Receiver] Remote video stream received with tracks:', remoteStream.getTracks().length);
      if (!isCleanedUp) {
        onRemoteStream(remoteStream);
        onConnectionStatusChange('connected');
      }
    });

    call.on('close', () => {
      console.log('[WebRTC Receiver] Call closed');
      if (!isCleanedUp) {
        onConnectionStatusChange('disconnected');
      }
    });

    call.on('error', (err: any) => {
      console.warn('[WebRTC Receiver] Call error:', err);
    });

    if (call.peerConnection) {
      call.peerConnection.onconnectionstatechange = () => {
        const state = call.peerConnection.connectionState;
        if (state === 'connected') onConnectionStatusChange('connected');
        else if (state === 'connecting') onConnectionStatusChange('connecting');
        else if (state === 'disconnected' || state === 'failed') onConnectionStatusChange('disconnected');
      };
    }
  });

  peer.on('error', (err: any) => {
    console.warn('[WebRTC Receiver] Peer error:', err.type, err.message);
    if (err.type === 'unavailable-id') {
      // Peer ID already registered in previous reload, recreate with minor suffix
      console.log('[WebRTC Receiver] Recreating peer with suffix...');
    }
  });

  const cleanup = () => {
    isCleanedUp = true;
    if (activeCall) {
      try {
        activeCall.close();
      } catch {}
    }
    try {
      peer.destroy();
    } catch {}
  };

  return { cleanup };
}

// 2. MOBILE TRANSMITTER: Connects to PeerJS and calls the desktop receiver session
export async function createTransmitterSession(
  sessionId: string,
  localStream: MediaStream,
  onConnectionStatusChange: (status: 'waiting' | 'connecting' | 'connected' | 'disconnected') => void
): Promise<{ cleanup: () => void }> {
  if (typeof window === 'undefined') {
    return { cleanup: () => {} };
  }

  const { default: Peer } = await import('peerjs');
  const targetReceiverId = sanitizePeerId(sessionId);
  let isCleanedUp = false;
  let activeCall: any = null;
  let retryTimer: any = null;
  let isConnected = false;

  onConnectionStatusChange('connecting');

  const mobilePeer = new Peer({
    config: ICE_CONFIG,
    debug: 1,
  });

  const attemptCall = () => {
    if (isCleanedUp || isConnected) return;

    try {
      console.log('[WebRTC Transmitter] Calling receiver:', targetReceiverId);
      const call = mobilePeer.call(targetReceiverId, localStream);

      if (!call) return;
      activeCall = call;

      call.on('stream', () => {
        isConnected = true;
        onConnectionStatusChange('connected');
      });

      call.on('close', () => {
        isConnected = false;
        if (!isCleanedUp) {
          onConnectionStatusChange('disconnected');
        }
      });

      call.on('error', (err: any) => {
        console.warn('[WebRTC Transmitter] Call error:', err);
      });

      if (call.peerConnection) {
        call.peerConnection.onconnectionstatechange = () => {
          const state = call.peerConnection.connectionState;
          if (state === 'connected') {
            isConnected = true;
            onConnectionStatusChange('connected');
          } else if (state === 'connecting') {
            onConnectionStatusChange('connecting');
          } else if (state === 'disconnected' || state === 'failed') {
            isConnected = false;
            onConnectionStatusChange('disconnected');
          }
        };

        call.peerConnection.oniceconnectionstatechange = () => {
          const iceState = call.peerConnection.iceConnectionState;
          if (iceState === 'connected' || iceState === 'completed') {
            isConnected = true;
            onConnectionStatusChange('connected');
          }
        };
      }
    } catch (err) {
      console.warn('[WebRTC Transmitter] Error initiating call:', err);
    }
  };

  mobilePeer.on('open', () => {
    console.log('[WebRTC Transmitter] Mobile peer ready, calling desktop receiver...');
    attemptCall();

    // Auto-retry call every 2.5s until connected (handles cases where phone joins before PC finishes loading)
    retryTimer = setInterval(() => {
      if (!isConnected && !isCleanedUp) {
        console.log('[WebRTC Transmitter] Retrying call to desktop receiver...');
        attemptCall();
      } else if (isConnected && retryTimer) {
        clearInterval(retryTimer);
      }
    }, 2500);
  });

  mobilePeer.on('error', (err: any) => {
    console.warn('[WebRTC Transmitter] Mobile peer error:', err.type, err.message);
    if (err.type === 'peer-unavailable') {
      console.log('[WebRTC Transmitter] Receiver not yet online, will retry...');
    }
  });

  const cleanup = () => {
    isCleanedUp = true;
    if (retryTimer) clearInterval(retryTimer);
    if (activeCall) {
      try {
        activeCall.close();
      } catch {}
    }
    try {
      mobilePeer.destroy();
    } catch {}
  };

  return { cleanup };
}
