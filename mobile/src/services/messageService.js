import api from '../config/api';
import { API_BASE_URL } from '../config/api';

const WS_BASE_URL = API_BASE_URL.replace('https', 'wss').replace('http', 'ws').replace('/api', '');

export const messageService = {
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  getMessages: async (conversationId, page = 1) => {
    const response = await api.get(`/messages/${conversationId}?page=${page}`);
    return response.data;
  },

  sendMessage: async (conversationId, content, type = 'text') => {
    const response = await api.post(`/messages/${conversationId}`, { content, type });
    return response.data;
  },

  sendVoiceMessage: async (conversationId, formData) => {
    const response = await api.post(`/messages/${conversationId}/voice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  createConversation: async (userId) => {
    const response = await api.post('/messages/conversations', { userId });
    return response.data;
  },

  /**
   * Create a WebSocket connection for real-time messaging
   */
  createWebSocket: (token) => {
    let ws = null;
    let reconnectTimeout = null;
    let isIntentionallyClosed = false;
    const listeners = new Set();

    const connect = () => {
      try {
        ws = new WebSocket(`${WS_BASE_URL}/ws?token=${token}`);

        ws.onopen = () => {
          console.log('WebSocket connected');
          notify({ type: 'connected' });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            notify({ type: 'message', data });
          } catch (e) {
            console.error('WebSocket parse error:', e);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          notify({ type: 'disconnected' });
          if (!isIntentionallyClosed) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        if (!isIntentionallyClosed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    };

    const notify = (event) => {
      listeners.forEach((listener) => listener(event));
    };

    const send = (data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    };

    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    const close = () => {
      isIntentionallyClosed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };

    connect();

    return { send, subscribe, close };
  },
};

export default messageService;
