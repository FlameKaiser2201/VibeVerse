import api from '../config/api';

export const postService = {
  getFeed: async (page = 1, limit = 10) => {
    const response = await api.get(`/posts/feed?page=${page}&limit=${limit}`);
    return response.data;
  },

  getExplorePosts: async (page = 1, limit = 20) => {
    const response = await api.get(`/posts/explore?page=${page}&limit=${limit}`);
    return response.data;
  },

  getPostById: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  getUserPosts: async (userId, page = 1) => {
    const response = await api.get(`/posts/user/${userId}?page=${page}`);
    return response.data;
  },

  createPost: async (formData) => {
    const response = await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  likePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  unlikePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}/like`);
    return response.data;
  },

  getComments: async (postId, page = 1) => {
    const response = await api.get(`/posts/${postId}/comments?page=${page}`);
    return response.data;
  },

  addComment: async (postId, text) => {
    const response = await api.post(`/posts/${postId}/comments`, { text });
    return response.data;
  },

  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  searchPosts: async (query, page = 1) => {
    const response = await api.get(`/posts/search?q=${query}&page=${page}`);
    return response.data;
  },
};

export default postService;
