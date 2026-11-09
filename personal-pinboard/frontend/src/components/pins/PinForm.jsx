import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, Textarea, Select, Button, Group, Alert, Badge, Switch } from '@mantine/core';
import {
  IconPhoto,
  IconLink,
  IconSparkles,
  IconUpload,
  IconTrash,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconVideo,
  IconFileText,
  IconBulb,
  IconLock,
  IconWorld,
  IconUsers,
} from '@tabler/icons-react';
import TagSelector from '../tags/TagSelector';
import { categoryService } from '../../services/categoryService';
import { boardService } from '../../services/boardService';
import { useAuth } from '../../hooks/useAuth';
import { validatePin } from '../../validators/pinValidator';
import { detectPinTopic, TOPIC_DEFINITIONS } from '../../utils/topicDetector';

function processPinImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select an image file (JPG, PNG, WEBP, GIF).'));
    }
    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error('File is too large. Please choose an image under 15MB.'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Downscale to max 1200px width/height for fast storage and sharp display
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to parse the selected image file.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file from your device.'));
    reader.readAsDataURL(file);
  });
}

const PIN_TYPES = [
  { value: 'image', label: 'Image', icon: IconPhoto, desc: 'High-res photos & illustrations' },
  { value: 'link', label: 'Link', icon: IconLink, desc: 'Web page & portfolio links' },
  { value: 'note', label: 'Note', icon: IconFileText, desc: 'Guides, notes & recipes' },
  { value: 'idea', label: 'Idea', icon: IconBulb, desc: 'Concepts, prompts & inspiration' },
  { value: 'video', label: 'Video', icon: IconVideo, desc: 'Motion, tutorials & reels' },
];

export default function PinForm({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    image_url: initialData.image_url || '',
    destination_url: initialData.destination_url || '',
    board_id: initialData.board_id ? String(initialData.board_id) : '',
    category_id: initialData.category_id ? String(initialData.category_id) : '',
    tags: initialData.tags || [],
    type: initialData.type || 'image',
    is_private: initialData.is_private || false,
  });

  const [categories, setCategories] = useState([]);
  const [boards, setBoards] = useState([]);
  const [errors, setErrors] = useState({});
  const [imageValid, setImageValid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    // Load categories
    categoryService.getCategories().then((cats) => {
      setCategories(cats.map((c) => ({ value: String(c.id), label: c.name })));
    });

    // Load boards
    if (user) {
      boardService.getUserBoards(user.id).then((bds) => {
        setBoards(bds.map((b) => ({ value: String(b.id), label: b.name })));
      });
    }
  }, [user]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleProcessFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessFile = async (file) => {
    setIsProcessingImage(true);
    setFileError('');
    try {
      const dataUrl = await processPinImageFile(file);
      setFormData((prev) => ({ ...prev, image_url: dataUrl }));
      setImageValid(true);
      setErrors((prev) => ({ ...prev, image_url: undefined }));
    } catch (err) {
      setFileError(err.message || 'Failed to process image');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleProcessFile(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: '' }));
    setImageValid(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = { ...formData };
    // If it's a note or idea without an image, provide a beautiful modern default cover
    if (!submissionData.image_url || !submissionData.image_url.trim()) {
      if (submissionData.type === 'note') {
        submissionData.image_url = 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800';
      } else if (submissionData.type === 'idea') {
        submissionData.image_url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';
      }
    }
    const validation = validatePin(submissionData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    onSubmit(submissionData);
  };

  const SAMPLE_COLLECTIONS = [
    {
      id: 'architecture',
      label: 'Architecture',
      topicId: 'architecture',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      title: 'Monolithic Brutalist Concrete Pavilion',
      tags: ['architecture', 'concrete', 'minimalist'],
    },
    {
      id: 'code',
      label: 'Code & Tech',
      topicId: 'code',
      url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      title: 'Modern C++ High Performance Backend',
      tags: ['code', 'tech', 'programming'],
    },
    {
      id: 'tech',
      label: 'Desk Setup',
      topicId: 'tech',
      url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800',
      title: 'Minimalist Matte Black & Oak Desk Setup',
      tags: ['workspace', 'desk', 'setup'],
    },
    {
      id: 'design',
      label: 'UI & Design',
      topicId: 'design',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
      title: 'Bold Crimson Typography & Poster Design',
      tags: ['design', 'ui', 'typography'],
    },
    {
      id: 'photography',
      label: 'Photography',
      topicId: 'photography',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
      title: '35mm Film Grain in Neon Shinjuku Alley',
      tags: ['photography', '35mm', 'street'],
    },
    {
      id: 'fashion',
      label: 'Fashion',
      topicId: 'fashion',
      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      title: 'Editorial Scarlet Trench Coat & Modern Silhouette',
      tags: ['fashion', 'style', 'editorial'],
    },
    {
      id: 'coffee',
      label: 'Coffee & Cafe',
      topicId: 'coffee',
      url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
      title: 'Artisan Espresso Pourover & Morning Cafe',
      tags: ['coffee', 'cafe', 'living'],
    },
    {
      id: 'travel',
      label: 'Travel & Nature',
      topicId: 'travel',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      title: 'Quiet Emerald Waters & Coastal Wanderlust',
      tags: ['travel', 'nature', 'landscape'],
    },
  ];

  const selectedCatObj = categories.find((c) => c.value === formData.category_id);
  const detectedTopic = detectPinTopic(
    formData.title,
    formData.description,
    selectedCatObj ? selectedCatObj.label : '',
    formData.tags,
    formData.type
  );
  const DynamicHeaderIcon = detectedTopic.icon;

  const hasImage = Boolean(formData.image_url && imageValid);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Image Chooser / Dropzone */}
        <div className="md:col-span-5 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !hasImage && fileInputRef.current?.click()}
            className={`relative aspect-[3/4] w-full rounded-3xl border-2 transition-all duration-200 overflow-hidden shadow-xs flex flex-col items-center justify-center ${
              hasImage
                ? 'border-slate-200 dark:border-slate-800 bg-slate-900'
                : isDragging
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 cursor-pointer scale-[1.01]'
                : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-brand-50/20 cursor-pointer'
            }`}
          >
            {hasImage ? (
              <div className="relative w-full h-full group">
                <img
                  src={formData.image_url}
                  alt="Pin preview"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={() => setImageValid(false)}
                />

                {/* Desktop hover overlay with Change / Remove actions */}
                <div className="hidden sm:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-col items-center justify-center gap-3 p-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full">
                    Image Selected ✓
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="xs"
                      radius="xl"
                      color="brandRed"
                      leftSection={<IconRefresh size={13} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="bg-brand-600 hover:bg-brand-700 font-bold cursor-pointer"
                    >
                      Change Photo
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      radius="xl"
                      variant="default"
                      leftSection={<IconTrash size={13} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Mobile permanent bottom action bar (visible on touch / small screens without hover) */}
                <div className="sm:hidden absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 pt-7 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-600 active:bg-brand-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    <IconRefresh size={13} stroke={2.5} />
                    <span>Change Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-xs active:bg-rose-600 text-white text-xs font-bold border border-white/20 shadow-md cursor-pointer"
                  >
                    <IconTrash size={13} stroke={2.2} />
                    <span>Remove</span>
                  </button>
                </div>

                {/* Top-right ready badge */}
                <div className="absolute top-3 right-3">
                  <Badge color="teal" variant="filled" size="sm" className="shadow-xs font-bold">
                    Ready
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 flex flex-col items-center select-none">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 shadow-2xs">
                  {isProcessingImage ? (
                    <IconRefresh size={26} className="animate-spin" />
                  ) : (
                    <IconUpload size={26} />
                  )}
                </div>
                <p className="font-bold text-slate-800 dark:text-white text-sm mb-1">
                  {isProcessingImage ? 'Optimizing image...' : 'Choose a file or drag and drop'}
                </p>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
                  We recommend using high quality .jpg, .png, or .webp under 15MB
                </p>
                <Button
                  type="button"
                  size="sm"
                  radius="xl"
                  color="brandRed"
                  leftSection={<IconPhoto size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="bg-brand-600 hover:bg-brand-700 font-bold shadow-xs cursor-pointer h-10 px-5 active:scale-95 transition-transform"
                >
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          {fileError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <IconAlertCircle size={15} />
              <span>{fileError}</span>
            </div>
          )}

          {/* Quick Sample Images with Dynamic Topic Icon */}
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5 transition-all">
              <DynamicHeaderIcon size={16} stroke={2.6} className="text-brand-600 animate-in fade-in zoom-in-95 duration-200 shrink-0" />
              <span>Or pick a sample image ({detectedTopic.shortLabel}):</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_COLLECTIONS.map((sample) => {
                const sampleTopic = TOPIC_DEFINITIONS.find((t) => t.id === sample.topicId) || detectedTopic;
                const SampleIcon = sampleTopic.icon;
                const isSelected = formData.image_url === sample.url;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        image_url: sample.url,
                        title: prev.title || sample.title,
                        tags: prev.tags?.length ? prev.tags : sample.tags,
                      }));
                      setImageValid(true);
                      setErrors((prev) => ({ ...prev, image_url: undefined }));
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    <SampleIcon size={13} stroke={2.5} />
                    <span>{sample.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Fields */}
        <div className="md:col-span-7 space-y-5 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Pin Type Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Pin Type
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {PIN_TYPES.find(t => t.value === formData.type)?.desc}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {PIN_TYPES.map((t) => {
                const IconComponent = t.icon;
                const isSelected = formData.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t.value })}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs scale-[1.02]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <IconComponent size={15} />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Toggle: Public vs Secret/Private */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  formData.is_private
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                }`}
              >
                {formData.is_private ? <IconLock size={18} /> : <IconWorld size={18} />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  {formData.is_private ? 'Secret Pin (Only Me)' : 'Public Pin (Visible to Everyone)'}
                  <Badge size="xs" variant="light" color={formData.is_private ? 'yellow' : 'green'}>
                    {formData.is_private ? 'Only Me' : 'Public'}
                  </Badge>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {formData.is_private
                    ? 'Only you can view this pin on your private boards.'
                    : 'Visible to everyone in Explore Pins and visual discovery.'}
                </p>
              </div>
            </div>
            <Switch
              checked={!formData.is_private}
              onChange={(e) => setFormData({ ...formData, is_private: !e.currentTarget.checked })}
              color="green"
              size="md"
              aria-label="Toggle pin privacy"
            />
          </div>

          <div>
            <TextInput
              label="Title"
              placeholder={
                formData.type === 'note'
                  ? 'Note title or topic'
                  : formData.type === 'idea'
                  ? 'Creative idea or concept'
                  : 'Give your pin an inspiring title'
              }
              size="md"
              radius="md"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              styles={{
                input: {
                  fontWeight: 600,
                },
              }}
            />
            {formData.title.trim() && (
              <div className="flex items-center gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Detected blog topic:
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60 shadow-2xs">
                  <DynamicHeaderIcon size={12} stroke={2.8} />
                  <span>{detectedTopic.label}</span>
                </span>
              </div>
            )}
          </div>

          {/* Image Source Status & Optional URL Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Image Source
              </span>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold cursor-pointer"
              >
                {showUrlInput ? 'Hide web URL input' : 'Paste web URL instead'}
              </button>
            </div>

            {hasImage && !showUrlInput && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <IconCheck size={15} stroke={2.5} /> Image selected & ready to publish
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-700 dark:text-emerald-300 underline font-bold cursor-pointer"
                >
                  Replace
                </button>
              </div>
            )}

            {(showUrlInput || !hasImage) && (
              <TextInput
                label={showUrlInput ? 'Direct Image URL' : undefined}
                placeholder="https://images.unsplash.com/..."
                size="md"
                radius="md"
                value={formData.image_url.startsWith('data:') ? '' : formData.image_url}
                onChange={(e) => {
                  setFormData({ ...formData, image_url: e.target.value });
                  setImageValid(true);
                }}
                error={errors.image_url}
                description={
                  formData.image_url.startsWith('data:')
                    ? 'Current image was uploaded directly from your device.'
                    : 'Paste a direct image link or choose a file on the left.'
                }
              />
            )}
          </div>

          <Textarea
            label="Description"
            placeholder="Tell everyone what your pin is about, materials, or style notes..."
            minRows={3}
            maxRows={6}
            radius="md"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Save to Board"
              placeholder="Select a board"
              data={boards}
              value={formData.board_id}
              onChange={(val) => setFormData({ ...formData, board_id: val || '' })}
              clearable
              radius="md"
            />

            <Select
              label="Category"
              placeholder="Select a category"
              data={categories}
              value={formData.category_id}
              onChange={(val) => setFormData({ ...formData, category_id: val || '' })}
              clearable
              radius="md"
              description="You can share with up to 5 people in 1 category."
            />
          </div>

          <TextInput
            label="Destination Link"
            placeholder="https://example.com/source"
            leftSection={<IconLink size={16} />}
            radius="md"
            value={formData.destination_url}
            onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
            error={errors.destination_url}
          />

          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-white mb-1.5">
              Tags
            </label>
            <TagSelector
              tags={formData.tags}
              onChange={(newTags) => setFormData({ ...formData, tags: newTags })}
            />
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="default"
              radius="xl"
              size="md"
              type="button"
              onClick={onCancel || (() => navigate(-1))}
              className="w-full sm:w-auto h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="brandRed"
              radius="xl"
              size="md"
              loading={loading}
              className="w-full sm:w-auto h-11 bg-brand-600 hover:bg-brand-700 font-bold px-8 shadow-sm"
            >
              {isEdit ? 'Save Changes' : 'Publish Pin'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
