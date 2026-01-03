// Video Call Service
// WebRTC tabanlı görüntülü/sesli arama

import { supabase } from '../lib/supabase';

export interface CallSession {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'video' | 'audio';
  status: 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected';
  started_at?: string;
  ended_at?: string;
  duration?: number;
  created_at: string;
}

export const videoCallService = {
  // Arama başlat
  initiateCall: async (
    callerId: string, 
    receiverId: string, 
    callType: 'video' | 'audio'
  ): Promise<{ data: CallSession | null; error: string | null }> => {
    const { data, error } = await supabase
      .from('call_sessions')
      .insert({
        caller_id: callerId,
        receiver_id: receiverId,
        call_type: callType,
        status: 'ringing',
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  // Aramayı kabul et
  acceptCall: async (sessionId: string): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('call_sessions')
      .update({
        status: 'connected',
        started_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return { error: error?.message || null };
  },

  // Aramayı reddet
  rejectCall: async (sessionId: string): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('call_sessions')
      .update({
        status: 'rejected',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return { error: error?.message || null };
  },

  // Aramayı sonlandır
  endCall: async (sessionId: string): Promise<{ error: string | null }> => {
    // Önce başlangıç zamanını al
    const { data: session } = await supabase
      .from('call_sessions')
      .select('started_at')
      .eq('id', sessionId)
      .single();

    let duration = 0;
    if (session?.started_at) {
      duration = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
    }

    const { error } = await supabase
      .from('call_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration,
      })
      .eq('id', sessionId);

    return { error: error?.message || null };
  },

  // Cevapsız arama olarak işaretle
  markAsMissed: async (sessionId: string): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('call_sessions')
      .update({
        status: 'missed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return { error: error?.message || null };
  },

  // Arama geçmişini getir
  getCallHistory: async (userId: string, limit: number = 20): Promise<{ data: CallSession[] | null; error: string | null }> => {
    const { data, error } = await supabase
      .from('call_sessions')
      .select(`
        *,
        caller:profiles!caller_id(id, full_name, avatar_url),
        receiver:profiles!receiver_id(id, full_name, avatar_url)
      `)
      .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  // Aktif aramayı getir
  getActiveCall: async (userId: string): Promise<{ data: CallSession | null; error: string | null }> => {
    const { data, error } = await supabase
      .from('call_sessions')
      .select('*')
      .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
      .in('status', ['ringing', 'connected'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  // Gelen arama dinle (realtime)
  subscribeToIncomingCalls: (
    userId: string, 
    callback: (call: CallSession) => void
  ) => {
    return supabase
      .channel(`calls:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as CallSession);
        }
      )
      .subscribe();
  },

  // Arama durumu değişikliği dinle
  subscribeToCallStatus: (
    sessionId: string,
    callback: (call: CallSession) => void
  ) => {
    return supabase
      .channel(`call:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as CallSession);
        }
      )
      .subscribe();
  },

  // WebRTC signaling için mesaj gönder
  sendSignalingMessage: async (
    sessionId: string,
    senderId: string,
    type: 'offer' | 'answer' | 'ice-candidate',
    data: any
  ): Promise<{ error: string | null }> => {
    // Supabase Realtime broadcast kullan
    const channel = supabase.channel(`signaling:${sessionId}`);
    
    await channel.send({
      type: 'broadcast',
      event: type,
      payload: { senderId, data },
    });

    return { error: null };
  },

  // WebRTC signaling mesajlarını dinle
  subscribeToSignaling: (
    sessionId: string,
    userId: string,
    callbacks: {
      onOffer?: (data: any) => void;
      onAnswer?: (data: any) => void;
      onIceCandidate?: (data: any) => void;
    }
  ) => {
    const channel = supabase.channel(`signaling:${sessionId}`);

    if (callbacks.onOffer) {
      channel.on('broadcast', { event: 'offer' }, ({ payload }) => {
        if (payload.senderId !== userId) {
          callbacks.onOffer!(payload.data);
        }
      });
    }

    if (callbacks.onAnswer) {
      channel.on('broadcast', { event: 'answer' }, ({ payload }) => {
        if (payload.senderId !== userId) {
          callbacks.onAnswer!(payload.data);
        }
      });
    }

    if (callbacks.onIceCandidate) {
      channel.on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        if (payload.senderId !== userId) {
          callbacks.onIceCandidate!(payload.data);
        }
      });
    }

    return channel.subscribe();
  },
};

export default videoCallService;
