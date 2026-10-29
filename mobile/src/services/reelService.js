import api from '../config/api';

export const reelService = {
  getReels: async (page = 1, limit = 10) => {
    const response = await api.get(`/reels?page=${page}&limit=${limit}`);
    return response.data;
  },

  createReel: async (formData) => {
    const response = await api.post('/reels', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  likeReel: async (reelId) => {
    const response = await api.post(`/reels/${reelId}/like`);
    return response.data;
  },

  unlikeReel: async (reelId) => {
    const response = await api.delete(`/reels/${reelId}/like`);
    return response.data;
  },

  getComments: async (reelId, page = 1) => {
    const response = await api.get(`/reels/${reelId}/comments?page=${page}`);
    return response.data;
  },

  addComment: async (reelId, text) => {
    const response = await api.post(`/reels/${reelId}/comments`, { text });
    return response.data;
  },

  getUserReels: async (userId, page = 1) => {
    const response = await api.get(`/reels/user/${userId}?page=${page}`);
    return response.data;
  },

  deleteReel: async (reelId) => {
    const response = await api.delete(`/reels/${reelId}`);
    return response.data;
  },
};

export default reelService;
