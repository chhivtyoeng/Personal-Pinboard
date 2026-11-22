export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Pinboard';

export const PIN_CATEGORIES_DEFAULT = [
  { id: 1, name: 'Architecture & Spaces', slug: 'architecture' },
  { id: 2, name: 'Art & Design', slug: 'art-design' },
  { id: 3, name: 'Photography', slug: 'photography' },
  { id: 4, name: 'Tech & Setups', slug: 'tech-setups' },
  { id: 5, name: 'Fashion & Style', slug: 'fashion-style' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'views', label: 'Most Viewed' },
];
