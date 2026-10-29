import api from '../config/api';

export const storyService = {
  getStories: async () => {
    const response = await api.get('/stories');
    return response.data;
  },

  createStory: async (formData) => {
    const response = await api.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  viewStory: async (storyId) => {
    const response = await api.post(`/stories/${storyId}/view`);
    return response.data;
  },

  deleteStory: async (storyId) => {
    const response = await api.delete(`/stories/${storyId}`);
    return response.data;
  },

  getUserStories: async (userId) => {
    const response = await api.get(`/stories/user/${userId}`);
    return response.data;
  },
};

export default storyService;
