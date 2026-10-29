/**
 * Image filter color matrices for camera/post filters.
 * Each filter is a 4x5 color matrix (20 values) used for color transformations.
 * These can be applied as overlays or via image manipulation.
 */

export const FILTERS = [
  {
    id: 'normal',
    name: 'Normal',
    overlay: 'transparent',
    opacity: 0,
    matrix: null,
  },
  {
    id: 'warm',
    name: 'Warm',
    overlay: '#FF9500',
    opacity: 0.15,
    matrix: [1.2, 0, 0, 0, 10, 0, 1.1, 0, 0, 5, 0, 0, 0.9, 0, -10, 0, 0, 0, 1, 0],
  },
  {
    id: 'cool',
    name: 'Cool',
    overlay: '#007AFF',
    opacity: 0.15,
    matrix: [0.9, 0, 0, 0, -10, 0, 1.0, 0, 0, 0, 0, 0, 1.2, 0, 15, 0, 0, 0, 1, 0],
  },
  {
    id: 'vintage',
    name: 'Vintage',
    overlay: '#D4A574',
    opacity: 0.25,
    matrix: [1.1, 0.1, 0.1, 0, 0, 0.1, 1.0, 0.1, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: 'bw',
    name: 'B&W',
    overlay: '#808080',
    opacity: 0.0,
    matrix: [0.33, 0.33, 0.33, 0, 0, 0.33, 0.33, 0.33, 0, 0, 0.33, 0.33, 0.33, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: 'vivid',
    name: 'Vivid',
    overlay: '#FF2D55',
    opacity: 0.08,
    matrix: [1.3, 0, 0, 0, 0, 0, 1.3, 0, 0, 0, 0, 0, 1.3, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    overlay: '#C77DFF',
    opacity: 0.2,
    matrix: [1.0, 0.1, 0.1, 0, 15, 0.05, 0.95, 0.15, 0, 10, 0.1, 0.05, 1.1, 0, 20, 0, 0, 0, 0.95, 0],
  },
  {
    id: 'neon',
    name: 'Neon',
    overlay: '#39FF14',
    opacity: 0.1,
    matrix: [1.4, 0, 0, 0, 0, 0, 1.1, 0, 0, 10, 0, 0, 1.4, 0, 10, 0, 0, 0, 1, 0],
  },
];

/**
 * Get a filter by ID
 */
export const getFilter = (filterId) => {
  return FILTERS.find((f) => f.id === filterId) || FILTERS[0];
};

/**
 * Get filter style for overlay
 */
export const getFilterStyle = (filter) => {
  if (!filter || filter.id === 'normal') {
    return {};
  }
  return {
    backgroundColor: filter.overlay,
    opacity: filter.opacity,
  };
};
