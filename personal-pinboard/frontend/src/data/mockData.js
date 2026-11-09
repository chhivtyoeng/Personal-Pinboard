export const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@pinboard.dev',
    full_name: 'Administrator',
    bio: 'Platform Administrator',
    role: 'admin',
    avatar_url: null,
    pins_count: 0,
    boards_count: 0,
    status: 'active',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  },
];

export const MOCK_FRIENDS = [];

export const MOCK_CATEGORIES = [
  {
    id: 1,
    name: 'Architecture & Spaces',
    slug: 'architecture',
    description: 'Brutalist concrete, modern residential pavilions, minimalist facades, and lighting design.',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    pins_count: 0,
    type: 'personal',
    members: [],
  },
  {
    id: 2,
    name: 'Art & Design',
    slug: 'art-design',
    description: 'Digital art, 3D renders, typographic explorations, and visual branding.',
    image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    pins_count: 0,
    type: 'personal',
    members: [],
  },
  {
    id: 3,
    name: 'Photography',
    slug: 'photography',
    description: 'Monochrome, urban street, architectural perspectives, and natural landscapes.',
    image_url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop&q=80',
    pins_count: 0,
    type: 'personal',
    members: [],
  },
  {
    id: 4,
    name: 'Tech & Setups',
    slug: 'tech-setups',
    description: 'Minimalist workspaces, mechanical keyboards, software engineering tools, and hardware.',
    image_url: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
    pins_count: 0,
    type: 'personal',
    members: [],
  },
  {
    id: 5,
    name: 'Fashion & Style',
    slug: 'fashion-style',
    description: 'Contemporary streetwear, minimal accessories, and functional wardrobe aesthetics.',
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    pins_count: 0,
    type: 'personal',
    members: [],
  },
];

export const MOCK_BOARDS = [];

export const MOCK_PINS = [];

export const MOCK_COMMENTS = [];

export const MOCK_REPORTS = [];

export const MOCK_SETTINGS = {
  platform_name: 'Personal Pinboard',
  allow_registration: true,
  enable_comments: true,
  enable_ratings: true,
  require_moderation_threshold: 3,
  maintenance_mode: false,
};
