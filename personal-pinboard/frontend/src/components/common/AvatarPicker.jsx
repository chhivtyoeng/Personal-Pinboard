import React, { useRef, useState, useEffect } from 'react';
import { Avatar, Button, Tooltip } from '@mantine/core';
import {
  IconCamera,
  IconUpload,
  IconTrash,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';

/**
 * Optimizes an uploaded image file into a lightweight base64 Data URL.
 * Automatically downscales to a max dimension of 400px so it stores smoothly in localStorage.
 */
function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (JPG, PNG, WEBP, or GIF).'));
    }

    // Limit raw file input to 12MB
    if (file.size > 12 * 1024 * 1024) {
      return reject(new Error('Image is too large. Please choose an image under 12MB.'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 400;
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

        // Export as clean compressed JPEG data URL (~30-60KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to parse the selected image.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file from device.'));
    reader.readAsDataURL(file);
  });
}

export default function AvatarPicker({
  value,
  onChange,
  name = 'Curator',
  label = 'Profile Photo',
  size = 84,
  variant = 'default', // 'default' | 'centered'
}) {
  const fileInputRef = useRef(null);
  const photoSetTimerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [showPhotoSet, setShowPhotoSet] = useState(() => Boolean(value));

  const triggerPhotoSetBadge = () => {
    setShowPhotoSet(true);
    if (photoSetTimerRef.current) {
      clearTimeout(photoSetTimerRef.current);
    }
    photoSetTimerRef.current = setTimeout(() => {
      setShowPhotoSet(false);
    }, 5000);
  };

  useEffect(() => {
    if (value) {
      triggerPhotoSetBadge();
    }
    return () => {
      if (photoSetTimerRef.current) {
        clearTimeout(photoSetTimerRef.current);
      }
    };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleProcessFile(file);
    // Reset file input value so re-choosing the same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessFile = async (file) => {
    setProcessing(true);
    setFeedback(null);
    try {
      const dataUrl = await processImageFile(file);
      onChange(dataUrl);
      triggerPhotoSetBadge();
      setFeedback({ type: 'success', message: 'Photo updated!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error processing image.' });
    } finally {
      setProcessing(false);
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

  const handleRemove = () => {
    onChange('');
    setShowPhotoSet(false);
    if (photoSetTimerRef.current) {
      clearTimeout(photoSetTimerRef.current);
    }
    setFeedback({ type: 'success', message: 'Photo removed.' });
    setTimeout(() => setFeedback(null), 2500);
  };

  if (variant === 'centered') {
    return (
      <div className="space-y-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center text-center p-4 sm:p-5 rounded-3xl transition-all duration-200 ${
            isDragging
              ? 'border-2 border-dashed border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01]'
              : 'border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {/* Avatar Preview with Camera Overlay */}
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            title="Click to choose photo"
          >
            <Avatar
              src={value || undefined}
              alt={name}
              size={size || 88}
              radius="xl"
              color="brandRed"
              className="ring-4 ring-white dark:ring-slate-800 shadow-md transition-transform duration-200 group-hover:scale-105"
            >
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </Avatar>

            {/* Hover Camera Overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
              <IconCamera size={22} stroke={2.5} />
              <span className="text-[9px] font-bold mt-0.5">Change</span>
            </div>

            {/* Corner Badge */}
            <div className="absolute -bottom-1 -right-1 w-7.5 h-7.5 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800 group-hover:bg-brand-700 transition-colors">
              <IconCamera size={15} stroke={2.5} />
            </div>
          </div>

          {/* Action Buttons & Status */}
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                <IconUpload size={13} stroke={2.5} />
                <span>{value ? 'Change Photo' : 'Choose Photo'}</span>
              </button>

              {value && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="group inline-flex items-center gap-1.5 h-[30px] px-3.5 rounded-full text-xs font-bold bg-slate-100/90 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200/90 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/60 transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <IconTrash size={13} stroke={2.2} className="text-slate-400 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* 5-second auto-dismiss Photo set badge */}
            {showPhotoSet && value && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs animate-in fade-in zoom-in-95 duration-200">
                <IconCheck size={12} stroke={3} /> Photo set
              </span>
            )}

            {/* Status Feedback / Drag Hint */}
            {feedback ? (
              <div
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  feedback.type === 'success'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {feedback.type === 'success' ? (
                  <IconCheck size={13} stroke={2.8} />
                ) : (
                  <IconAlertCircle size={13} />
                )}
                <span>{feedback.message}</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Drag & drop or tap photo · JPG, PNG, WEBP, GIF
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Avatar Selection Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
          isDragging
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01]'
            : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar Preview with Camera Overlay */}
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            <Avatar
              src={value || undefined}
              alt={name}
              size={size}
              radius="xl"
              color="brandRed"
              className="ring-4 ring-white dark:ring-slate-800 shadow-md transition-transform duration-200 group-hover:scale-105"
            >
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </Avatar>

            {/* Hover Camera Overlay */}
            <div className="absolute inset-0 rounded-full bg-black/45 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
              <IconCamera size={22} />
              <span className="text-[9px] font-bold mt-0.5">Change</span>
            </div>

            {/* Corner Badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800 group-hover:bg-brand-700 transition-colors">
              <IconCamera size={14} />
            </div>
          </div>

          {/* Action & Info Area */}
          <div className="flex-1 text-center sm:text-left space-y-2.5">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {label}
                </h4>
                {showPhotoSet && value && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 animate-in fade-in zoom-in-95 duration-200">
                    <IconCheck size={11} stroke={3} /> Photo set
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose a photo from your computer or phone, or drag and drop an image.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <Button
                type="button"
                size="xs"
                radius="xl"
                color="brandRed"
                leftSection={<IconUpload size={14} />}
                loading={processing}
                onClick={() => fileInputRef.current?.click()}
                className="bg-brand-600 hover:bg-brand-700 font-bold shadow-xs cursor-pointer active:scale-95"
              >
                {value ? 'Change Photo' : 'Choose Photo'}
              </Button>

              {value && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="group inline-flex items-center gap-1.5 h-[30px] px-3.5 rounded-full text-xs font-bold bg-slate-100/90 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200/90 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/60 transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <IconTrash size={13} stroke={2.2} className="text-slate-400 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* Status Feedback */}
            {feedback && (
              <div
                className={`text-xs font-semibold flex items-center justify-center sm:justify-start gap-1.5 pt-0.5 ${
                  feedback.type === 'success'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {feedback.type === 'success' ? (
                  <IconCheck size={14} stroke={2.5} />
                ) : (
                  <IconAlertCircle size={14} />
                )}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Drag & Drop Hint */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Tip: You can also drag and drop an image file directly onto the circle</span>
          <span className="font-semibold uppercase text-[10px]">JPG · PNG · WEBP · GIF</span>
        </div>
      </div>
    </div>
  );
}
