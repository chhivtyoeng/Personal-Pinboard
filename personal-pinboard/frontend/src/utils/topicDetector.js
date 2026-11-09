import {
  IconBuildingArch,
  IconCode,
  IconDeviceDesktop,
  IconPalette,
  IconCamera,
  IconShirt,
  IconCoffee,
  IconToolsKitchen2,
  IconCompass,
  IconTrees,
  IconMusic,
  IconBook,
  IconBarbell,
  IconVideo,
  IconLink,
  IconBulb,
  IconSparkles,
} from '@tabler/icons-react';

export const TOPIC_DEFINITIONS = [
  {
    id: 'architecture',
    label: 'Architecture & Spaces',
    shortLabel: 'Architecture',
    icon: IconBuildingArch,
    color: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    keywords: [
      'architect', 'interior', 'concrete', 'pavilion', 'dwelling', 'room',
      'house', 'villa', 'living', 'decor', 'building', 'space', 'spaces',
      'brutalist', 'monolithic', 'courtyard', 'furniture', 'credenza',
      'apartment', 'studio', 'facade', 'structure', 'skylight', 'minimalist'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  },
  {
    id: 'code',
    label: 'Code & Tech',
    shortLabel: 'Code & Tech',
    icon: IconCode,
    color: 'cyan',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    keywords: [
      'code', 'coding', 'programming', 'c++', 'react', 'javascript', 'python',
      'typescript', 'software', 'developer', 'algorithm', 'system', 'terminal',
      'backend', 'frontend', 'git', 'api', 'server', 'linux', 'data structure'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
  },
  {
    id: 'tech',
    label: 'Tech & Setups',
    shortLabel: 'Tech Setup',
    icon: IconDeviceDesktop,
    color: 'blue',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
    keywords: [
      'tech', 'setup', 'workspace', 'desk', 'monitor', 'keyboard', 'hardware',
      'mechanical', 'ultrawide', 'ergonomic', 'pc', 'apple', 'gadget',
      'workstation', 'cyberpunk', 'gaming', 'battlestation', 'screen'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800',
  },
  {
    id: 'design',
    label: 'UI & Design',
    shortLabel: 'UI / Design',
    icon: IconPalette,
    color: 'purple',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
    keywords: [
      'design', 'ui', 'ux', 'figma', 'typography', 'poster', 'swiss', 'graphic',
      'layout', 'vector', 'brand', 'branding', 'crimson', 'color', 'palette',
      'interface', 'token', 'component', 'aesthetic', '3d', 'render', 'abstract'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
  },
  {
    id: 'photography',
    label: 'Photography & Film',
    shortLabel: 'Photography',
    icon: IconCamera,
    color: 'teal',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-400/30',
    keywords: [
      'photo', 'photography', 'camera', '35mm', 'film', 'grain', 'shinjuku',
      'street', 'portrait', 'lens', 'neon', 'reflection', 'tokyo', 'light',
      'exposure', 'monochrome', 'black and white', 'polaroid', 'analog'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
  },
  {
    id: 'fashion',
    label: 'Fashion & Style',
    shortLabel: 'Fashion',
    icon: IconShirt,
    color: 'rose',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
    keywords: [
      'fashion', 'style', 'outfit', 'clothing', 'trench', 'coat', 'leather',
      'model', 'lookbook', 'editorial', 'wear', 'silhouette', 'shoes',
      'sneaker', 'jacket', 'garment', 'runway', 'couture', 'apparel'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
  },
  {
    id: 'coffee',
    label: 'Coffee & Living',
    shortLabel: 'Coffee & Cafe',
    icon: IconCoffee,
    color: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    keywords: [
      'coffee', 'cafe', 'espresso', 'latte', 'roast', 'cappuccino', 'pourover',
      'barista', 'beans', 'mug', 'cozy', 'morning', 'croissant', 'cafe vibes'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
  },
  {
    id: 'food',
    label: 'Food & Culinary',
    shortLabel: 'Food & Recipe',
    icon: IconToolsKitchen2,
    color: 'orange',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
    keywords: [
      'food', 'cooking', 'recipe', 'kitchen', 'baking', 'chef', 'dish',
      'dinner', 'lunch', 'breakfast', 'culinary', 'meal', 'pasta', 'bake'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
  },
  {
    id: 'travel',
    label: 'Travel & Places',
    shortLabel: 'Travel',
    icon: IconCompass,
    color: 'sky',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    keywords: [
      'travel', 'places', 'trip', 'journey', 'destination', 'explore', 'vacation',
      'flight', 'seoul', 'paris', 'japan', 'kyoto', 'island', 'beach', 'wanderlust',
      'hotel', 'resort', 'landscape', 'mountain', 'alps'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  },
  {
    id: 'nature',
    label: 'Nature & Plants',
    shortLabel: 'Nature',
    icon: IconTrees,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    keywords: [
      'nature', 'plant', 'trees', 'forest', 'garden', 'greenery', 'flower',
      'botanical', 'outdoor', 'mountain', 'wildlife', 'ecology', 'sunlight'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800',
  },
  {
    id: 'art',
    label: 'Art & Craft',
    shortLabel: 'Art & Craft',
    icon: IconPalette,
    color: 'pink',
    badgeClass: 'bg-pink-500/15 text-pink-300 border-pink-400/30',
    keywords: [
      'art', 'craft', 'ceramic', 'stoneware', 'pottery', 'clay', 'sculpture',
      'handmade', 'vessel', 'painting', 'canvas', 'illustration', 'wabi-sabi'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
  },
  {
    id: 'music',
    label: 'Music & Sound',
    shortLabel: 'Music',
    icon: IconMusic,
    color: 'violet',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
    keywords: [
      'music', 'audio', 'sound', 'song', 'vinyl', 'record', 'playlist', 'album',
      'synth', 'guitar', 'piano', 'lofi', 'beats', 'headphones', 'concert'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
  },
  {
    id: 'study',
    label: 'Study & Notes',
    shortLabel: 'Study / Notes',
    icon: IconBook,
    color: 'indigo',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
    keywords: [
      'study', 'book', 'books', 'notes', 'learn', 'learning', 'reading',
      'guide', 'education', 'research', 'paper', 'cheat sheet', 'journal'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
  },
  {
    id: 'fitness',
    label: 'Fitness & Wellness',
    shortLabel: 'Fitness',
    icon: IconBarbell,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    keywords: [
      'fitness', 'gym', 'workout', 'training', 'health', 'exercise', 'yoga',
      'wellness', 'muscle', 'crossfit', 'runner', 'running'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
  },
  {
    id: 'video',
    label: 'Video & Motion',
    shortLabel: 'Video',
    icon: IconVideo,
    color: 'rose',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
    keywords: ['video', 'motion', 'animation', 'reel', 'clip', 'film tutorial'],
    sampleImage: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800',
  },
  {
    id: 'link',
    label: 'Link & Resource',
    shortLabel: 'Link',
    icon: IconLink,
    color: 'blue',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
    keywords: ['link', 'website', 'url', 'portfolio', 'resource', 'bookmark'],
    sampleImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
  },
  {
    id: 'idea',
    label: 'Idea & Prompt',
    shortLabel: 'Idea',
    icon: IconBulb,
    color: 'yellow',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    keywords: ['idea', 'concept', 'prompt', 'inspiration', 'thought', 'brainstorm'],
    sampleImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
  },
];

export const DEFAULT_TOPIC = {
  id: 'inspiration',
  label: 'Curated Idea',
  shortLabel: 'Idea',
  icon: IconSparkles,
  color: 'red',
  badgeClass: 'bg-brand-500/15 text-brand-300 border-brand-400/30',
  keywords: [],
  sampleImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800',
};

/**
 * Intelligently determines what a pin or blog is talking/writing about,
 * returning the exact thematic icon, label, and visual styling.
 */
export function detectPinTopic(pinOrTitle, desc = '', category = '', tags = [], type = '') {
  let titleText = '';
  let descText = '';
  let catText = '';
  let tagList = [];
  let pinType = '';

  if (pinOrTitle && typeof pinOrTitle === 'object') {
    titleText = pinOrTitle.title || '';
    descText = pinOrTitle.description || '';

    // Safely extract category string even if category is an object or null
    if (typeof pinOrTitle.category === 'object' && pinOrTitle.category !== null) {
      catText = pinOrTitle.category.name || pinOrTitle.category.slug || '';
    } else if (typeof pinOrTitle.category_data === 'object' && pinOrTitle.category_data !== null) {
      catText = pinOrTitle.category_data.name || pinOrTitle.category_data.slug || '';
    } else if (typeof pinOrTitle.category_name === 'string') {
      catText = pinOrTitle.category_name;
    } else if (typeof pinOrTitle.category === 'string') {
      catText = pinOrTitle.category;
    } else if (typeof pinOrTitle.category_slug === 'string') {
      catText = pinOrTitle.category_slug;
    } else {
      catText = '';
    }

    tagList = Array.isArray(pinOrTitle.tags)
      ? pinOrTitle.tags
      : typeof pinOrTitle.tags === 'string'
      ? pinOrTitle.tags.split(',')
      : [];
    pinType = pinOrTitle.type || '';
  } else {
    titleText = String(pinOrTitle || '');
    descText = String(desc || '');
    catText = typeof category === 'object' && category !== null ? (category.name || category.slug || '') : String(category || '');
    tagList = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',') : [];
    pinType = String(type || '');
  }

  // Ensure catText is always a string
  catText = typeof catText === 'string' ? catText : '';

  // 1. Explicit Pin Type Overrides (if not generic image)
  if (pinType === 'video') return TOPIC_DEFINITIONS.find((t) => t.id === 'video') || DEFAULT_TOPIC;
  if (pinType === 'link') return TOPIC_DEFINITIONS.find((t) => t.id === 'link') || DEFAULT_TOPIC;
  if (pinType === 'idea') return TOPIC_DEFINITIONS.find((t) => t.id === 'idea') || DEFAULT_TOPIC;

  // 2. Build complete searchable text corpus from what the blog talks/writes about
  const rawCorpus = [
    titleText,
    descText,
    catText,
    tagList.join(' '),
  ].join(' ').toLowerCase();

  if (!rawCorpus.trim()) {
    return DEFAULT_TOPIC;
  }

  // 3. Score all topics based on keyword presence
  let bestTopic = null;
  let bestScore = 0;

  for (const topic of TOPIC_DEFINITIONS) {
    let score = 0;

    // Check category matches directly (high weight)
    const catLower = catText.toLowerCase();
    if (catLower && (catLower.includes(topic.id) || topic.label.toLowerCase().includes(catLower))) {
      score += 10;
    }

    // Check keyword hits
    for (const kw of topic.keywords) {
      if (rawCorpus.includes(kw)) {
        if (titleText.toLowerCase().includes(kw)) {
          score += 4;
        } else {
          score += 2;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic || DEFAULT_TOPIC;
}

/**
 * Returns just the component Icon for a given pin/blog.
 */
export function getPinTopicIcon(pinOrTitle) {
  const topic = detectPinTopic(pinOrTitle);
  return topic.icon;
}
