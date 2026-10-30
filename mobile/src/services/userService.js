import api from '../config/api';

export const userService = {
  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  searchUsers: async (query, page = 1) => {
    const response = await api.get(`/users/search?q=${query}&page=${page}`);
    return response.data;
  },

  followUser: async (userId) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  unfollowUser: async (userId) => {
    const response = await api.delete(`/users/${userId}/follow`);
    return response.data;
  },

  getFollowers: async (userId, page = 1) => {
    const response = await api.get(`/users/${userId}/followers?page=${page}`);
    return response.data;
  },

  getFollowing: async (userId, page = 1) => {
    const response = await api.get(`/users/${userId}/following?page=${page}`);
    return response.data;
  },

  getSuggestedUsers: async () => {
    const response = await api.get('/users/suggested');
    return response.data;
  },

  updateProfile: async (formData) => {
    const response = await api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default userService;
