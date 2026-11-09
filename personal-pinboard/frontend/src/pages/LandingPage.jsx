import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconPin,
  IconSearch,
  IconBookmark,
  IconHeart,
  IconHeartFilled,
  IconTag,
  IconCategory,
  IconMenu2,
  IconArrowRight,
  IconArrowUpRight,
  IconSparkles,
  IconCheck,
  IconShield,
  IconStarFilled,
  IconMessageCircle,
  IconEye,
  IconFolder,
  IconSun,
  IconMoon,
  IconLayersLinked,
  IconFlame,
  IconCompass,
  IconX,
  IconBuildingArch,
  IconPalette,
  IconBook,
  IconDeviceLaptop,
  IconCamera,
  IconUsers,
  IconArrowLeft,
  IconLogout,
  IconLogin,
} from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { forceUnlockBodyScroll } from '../utils/scrollLock';
import ThemeToggle from '../components/common/ThemeToggle';
import AuthModal from '../components/common/AuthModal';
import LegalModal from '../components/common/LegalModal';
import LogoutConfirmModal from '../components/common/LogoutConfirmModal';
import { toast } from '../context/ToastContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewLikedId, setPreviewLikedId] = useState(null);
  const [activeSaveTab, setActiveSaveTab] = useState('architecture');
  const [activeCollabBoard, setActiveCollabBoard] = useState('spaces');

  // Preview Pin State
  const [selectedPreviewPin, setSelectedPreviewPin] = useState(null);

  // Smooth Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Legal Modal State
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('privacy');

  // Logout Confirm State
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    forceUnlockBodyScroll();
    logout();
    navigate('/', { replace: true });
    toast.info('You have logged out successfully.');
  };

  // Modal Close Handlers that keep history stack and body scroll clean
  const closeAuthModal = () => {
    setAuthModalOpen(false);
    forceUnlockBodyScroll();
    if (window.history.state?.pinboardModal === 'auth') {
      window.history.back();
    }
  };

  const closePreviewPin = () => {
    setSelectedPreviewPin(null);
    forceUnlockBodyScroll();
    if (window.history.state?.pinboardModal === 'previewPin') {
      window.history.back();
    }
  };

  const closeLegalModal = () => {
    setLegalModalOpen(false);
    forceUnlockBodyScroll();
    if (window.history.state?.pinboardModal === 'legal') {
      window.history.back();
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    forceUnlockBodyScroll();
    if (window.history.state?.pinboardModal === 'mobileMenu') {
      window.history.back();
    }
  };

  // Synchronize browser history with open modals so clicking browser Back closes modals
  useEffect(() => {
    if (authModalOpen) {
      window.history.pushState({ pinboardModal: 'auth' }, '');
    }
  }, [authModalOpen]);

  useEffect(() => {
    if (selectedPreviewPin) {
      window.history.pushState({ pinboardModal: 'previewPin' }, '');
    }
  }, [selectedPreviewPin]);

  useEffect(() => {
    if (mobileMenuOpen) {
      window.history.pushState({ pinboardModal: 'mobileMenu' }, '');
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (legalModalOpen) {
      window.history.pushState({ pinboardModal: 'legal' }, '');
    }
  }, [legalModalOpen]);

  // Handle browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setAuthModalOpen(false);
      setSelectedPreviewPin(null);
      setLegalModalOpen(false);
      setLogoutConfirmOpen(false);
      setMobileMenuOpen(false);
      forceUnlockBodyScroll();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      forceUnlockBodyScroll();
    };
  }, []);

  // Sticky Navbar State & Active Section Tracking
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const navItems = [
    { id: 'hero', label: 'Home', subtitle: 'Feed & inspiration', icon: IconCompass },
    { id: 'what-you-can-save', label: 'Collections', subtitle: 'Architecture, UI, photo', icon: IconFolder },
    { id: 'features', label: 'Core Features', subtitle: 'Smart boards & tools', icon: IconSparkles },
    { id: 'testimonials', label: 'Creators', subtitle: 'Community reviews', icon: IconHeart },
    { id: 'preview', label: 'Live Preview', subtitle: 'Interactive pinboard', icon: IconEye },
  ];

  // Safe reference-counted body scroll lock for preview pin modal & mobile drawer
  useBodyScrollLock(!!selectedPreviewPin || mobileMenuOpen);

  // Throttled sticky navbar scroll listener (runs at most once per animation frame, 0 forced reflows)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const scrolled = currentY > 20;
          setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Zero-reflow active section tracking using IntersectionObserver
  useEffect(() => {
    const sections = ['hero', 'what-you-can-save', 'features', 'testimonials', 'preview'];
    const sectionElements = sections.map((id) => document.getElementById(id)).filter(Boolean);

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const best = visibleEntries.reduce((prev, curr) =>
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          );
          if (best.target.id) {
            setActiveSection((prev) => (prev !== best.target.id ? best.target.id : prev));
          }
        }
      },
      {
        rootMargin: '-80px 0px -40% 0px',
        threshold: [0.1, 0.3, 0.6],
      }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // IntersectionObserver for smooth scroll-driven entrance reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1,
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [activeSaveTab]);




  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    if (!id || id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      });
    }
  };

  const scrollToSection = (id) => scrollTo(id);

  const saveCategories = [
    {
      id: 'architecture',
      label: 'Architecture & Spaces',
      icon: IconBuildingArch,
      title: 'Monolithic Pavilions & Minimal Living',
      description: 'Raw concrete structures, dramatic skylights, Japanese courtyards, and organic textures.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      tags: ['Brutalist', 'Concrete', 'Lightwells', 'Minimal'],
      stats: '1,420+ pins saved',
    },
    {
      id: 'design',
      label: 'UI & Design Systems',
      icon: IconPalette,
      title: 'Clean Interfaces & Typography',
      description: 'Neumorphic card layouts, responsive design tokens, font pairings, and Figma component libraries.',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800',
      tags: ['Figma', 'Typography', 'ColorTheory', 'UIUX'],
      stats: '2,890+ pins saved',
    },
    {
      id: 'study',
      label: 'Study Materials & Tech',
      icon: IconBook,
      title: 'Cheat Sheets & Code Architectures',
      description: 'System design flowcharts, React hooks reference cards, algorithms, and study summaries.',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      tags: ['React', 'SystemDesign', 'StudyNotes', 'Algorithms'],
      stats: '3,150+ pins saved',
    },
    {
      id: 'workspaces',
      label: 'Desk Setups & Gear',
      icon: IconDeviceLaptop,
      title: 'Ergonomic & Minimal Productivity Spaces',
      description: 'Curved ultrawide setups, warm mechanical keyboards, desk mats, and ambient lightbars.',
      image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
      tags: ['DeskSetup', 'Productivity', 'MechanicalKeyboards'],
      stats: '980+ pins saved',
    },
    {
      id: 'photography',
      label: 'Photography & Moods',
      icon: IconCamera,
      title: 'Film Grain, Golden Hour & Street Frames',
      description: '35mm portraits, neon rain reflections, brutalist silhouettes, and rich color grading pallets.',
      image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
      tags: ['StreetPhoto', '35mm', 'GoldenHour', 'Moody'],
      stats: '1,840+ pins saved',
    },
  ];

  const currentSaveItem = saveCategories.find((c) => c.id === activeSaveTab) || saveCategories[0];

  const collaborativeBoards = [
    {
      id: 'spaces',
      tabLabel: 'Interior & Architecture',
      icon: IconBuildingArch,
      boardTitle: 'Earthy Living & Studio Spaces',
      pinCount: '80 Pins',
      category: 'Spatial Design',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
        title: 'Warm Sandstone Living Room & Credenza',
        author: 'Sarah Jenkins',
        tags: ['LivingRoom', 'Interior', 'Earthy'],
        rating: '5.0',
      },
      subImageTop: {
        url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
        title: 'Warm Scandinavian Pendant Lamp',
        author: 'Maya Chen',
        tags: ['Lighting', 'Warm', 'Scandinavian'],
        rating: '4.9',
      },
      subImageBottom: {
        url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80',
        title: 'Sage Linen Bedding & Ceramics',
        author: 'Liam Gallagher',
        tags: ['Ceramics', 'Texture', 'Craft'],
        rating: '4.8',
      },
      collaborators: [
        {
          name: 'Marcus Vance',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          role: 'Interior Architect',
        },
        {
          name: 'Maya Chen',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          role: 'Studio Curatress',
        },
      ],
      extraCollaboratorsCount: 3,
      quote: 'Replaced 5 messy bookmark folders and Slack links for our studio critiques.',
      authorName: 'Maya Chen',
      authorRole: 'RISD Architecture Studio',
    },
    {
      id: 'design',
      tabLabel: 'Design Systems & UI',
      icon: IconPalette,
      boardTitle: 'Design Systems & Component Tokens',
      pinCount: '142 Pins',
      category: 'UI/UX Design',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80',
        title: 'Flowing Iridescent 3D Curves',
        author: 'Elena Rostova',
        tags: ['3DArt', 'DesignTokens', 'Fluid'],
        rating: '5.0',
      },
      subImageTop: {
        url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
        title: 'Mobile App Design System & Prototype Layout',
        author: 'Alex Rivera',
        tags: ['Figma', 'UIUX', 'MobileApp'],
        rating: '5.0',
      },
      subImageBottom: {
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
        title: 'Interactive Metrics Canvas',
        author: 'Liam Gallagher',
        tags: ['Dashboard', 'Analytics', 'DarkUI'],
        rating: '4.9',
      },
      collaborators: [
        {
          name: 'Liam Gallagher',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          role: 'Staff Systems Lead',
        },
        {
          name: 'Elena Rostova',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          role: 'Product Designer',
        },
      ],
      extraCollaboratorsCount: 5,
      quote: 'Preserves pixel-accurate aspect ratios across desktop and mobile frames.',
      authorName: 'Liam Gallagher',
      authorRole: 'Design Systems Lead, London Guild',
    },
    {
      id: 'photo',
      tabLabel: 'Editorial & Photography',
      icon: IconCamera,
      boardTitle: 'Tokyo Neon & 35mm Street Moods',
      pinCount: '96 Pins',
      category: 'Photography',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=900&auto=format&fit=crop&q=80',
        title: 'Tokyo Rainy Neon Reflections',
        author: 'Kenji Sato',
        tags: ['35mm', 'Tokyo', 'Street'],
        rating: '5.0',
      },
      subImageTop: {
        url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
        title: 'Ambient Concert Lightbeam',
        author: 'Sarah Jenkins',
        tags: ['Concert', 'Atmospheric', 'Stage'],
        rating: '4.8',
      },
      subImageBottom: {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        title: 'Editorial 35mm Portrait',
        author: 'Priya Patel',
        tags: ['Portrait', 'FilmGrain', 'Editorial'],
        rating: '4.9',
      },
      collaborators: [
        {
          name: 'Kenji Sato',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
          role: 'Photographer',
        },
        {
          name: 'Priya Patel',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          role: 'Creative Director',
        },
      ],
      extraCollaboratorsCount: 2,
      quote: 'Our remote production team compiles visual decks and moodboards in minutes.',
      authorName: 'Priya Patel',
      authorRole: 'Creative Director, Studio North',
    },
  ];

  const currentCollabBoard =
    collaborativeBoards.find((b) => b.id === activeCollabBoard) || collaborativeBoards[0];

  const features = [
    {
      title: 'Save Anything in 1-Click',
      description: 'Tap once to save a photo, link, note, or idea. No more losing things you find online.',
      icon: IconPin,
      tag: 'Fast Capture',
    },
    {
      title: 'Beautiful Feed Layout',
      description: 'Your saved ideas look great — photos show in their real size, not cut into squares.',
      icon: IconLayersLinked,
      tag: 'Dynamic Grid',
    },
    {
      title: 'Search & Find Fast',
      description: 'Type anything — a title, word, or tag — and find what you need right away.',
      icon: IconSearch,
      tag: 'Instant Filter',
    },
    {
      title: 'Boards & Collections',
      description: 'Group your ideas into boards. Great for school projects, travel plans, or mood boards.',
      icon: IconFolder,
      tag: 'Collections',
    },
    {
      title: 'Share with 5 Friends',
      description: 'Invite up to 5 close friends to see and save together. No strangers, no spam.',
      icon: IconUsers,
      tag: '5 Friends Only',
    },
    {
      title: 'No Ads, Just You',
      description: 'Pinboard is clean and quiet. No ads, no algorithm pushing things at you.',
      icon: IconSparkles,
      tag: 'Clean Experience',
    },
  ];



  const showcasePins = [
    {
      id: 1,
      title: 'React 19 Concurrent Patterns & Hooks',
      category: 'Study & Tech',
      tags: ['React', 'Hooks', 'WebDev'],
      author: 'Alex Rivera',
      rating: '4.9',
      rating_count: 24,
      comments_count: 12,
      likes: 43,
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      title: 'Brutalist Concrete Lightwell Pavilion',
      category: 'Architecture',
      tags: ['Brutalist', 'Concrete', 'Minimal'],
      author: 'Sarah Jenkins',
      rating: '5.0',
      rating_count: 38,
      comments_count: 8,
      likes: 88,
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      title: 'Matte Black & Solid Oak Desk Setup',
      category: 'Workspaces',
      tags: ['DeskSetup', 'Productivity'],
      author: 'Sarah Jenkins',
      rating: '4.8',
      rating_count: 19,
      comments_count: 5,
      likes: 56,
      image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const heroPins = [
    // Column 1
    {
      id: 'hero-arch',
      title: 'Warm Minimalist Villa',
      category: 'Architecture',
      tags: ['Architecture', 'Modern', 'Minimalist'],
      author: 'Sarah Jenkins',
      rating: '5.0',
      rating_count: 42,
      comments_count: 14,
      likes: 142,
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
      aspectClass: 'h-48 sm:h-60',
    },
    {
      id: 'hero-desk',
      title: 'Clean Oak Desk Setup',
      category: 'Workspace',
      tags: ['Productivity', 'DeskSetup', 'Minimal'],
      author: 'Liam Gallagher',
      rating: '4.9',
      rating_count: 28,
      comments_count: 9,
      likes: 89,
      image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80',
      aspectClass: 'h-36 sm:h-44',
    },
    // Column 2
    {
      id: 'hero-3dart',
      title: 'Flowing Iridescent Curves',
      category: '3D & Visual Art',
      tags: ['3DArt', 'Abstract', 'Fluid'],
      author: 'Elena Rostova',
      rating: '5.0',
      rating_count: 57,
      comments_count: 22,
      likes: 238,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      aspectClass: 'h-52 sm:h-68',
    },
    {
      id: 'hero-uiux',
      title: 'Mobile App Design System & Prototype Layout',
      category: 'UI/UX Design',
      tags: ['DesignSystems', 'UIUX', 'MobileApp'],
      author: 'Alex Rivera',
      rating: '5.0',
      rating_count: 64,
      comments_count: 18,
      likes: 148,
      image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
      aspectClass: 'h-48 sm:h-64',
    },
    // Column 3
    {
      id: 'hero-photo',
      title: 'Tokyo Rainy Neon',
      category: 'Photography',
      tags: ['35mmFilm', 'Street', 'Tokyo'],
      author: 'Kenji Sato',
      rating: '4.8',
      rating_count: 23,
      comments_count: 7,
      likes: 167,
      image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80',
      aspectClass: 'h-44 sm:h-48',
    },
    {
      id: 'hero-ceramics',
      title: 'Wabi-Sabi Stoneware',
      category: 'Art & Craft',
      tags: ['Ceramics', 'Craft', 'Pottery'],
      author: 'Maya Chen',
      rating: '4.9',
      rating_count: 18,
      comments_count: 6,
      likes: 94,
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80',
      aspectClass: 'h-52 sm:h-64',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-blue-600 selection:text-white font-sans transition-colors duration-200 relative">

      {/* 1. NAVBAR - Modern Sticky Navbar with Letter Underline Cover on Hover */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs py-3'
            : 'bg-white/75 dark:bg-slate-900/75 backdrop-blur-xs py-3.5 border-b border-slate-200/50 dark:border-slate-800/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer select-none shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30 ring-2 ring-brand-500/20 group-hover:scale-105 group-active:scale-95 transition-all duration-200 shrink-0">
              <IconPin size={23} stroke={2.6} className="text-white shrink-0" />
            </div>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-brand-600 transition-colors duration-200 flex items-center leading-none">
              Pinboard<span className="text-brand-600">.</span>
            </span>
          </Link>


          {/* Desktop Nav Links with Modern Hover Cover Under the Letter */}
          <nav className="hidden lg:flex items-center gap-6 lg:gap-8">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`group relative py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer select-none ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
                  }`}
                >
                  <span>{item.label}</span>
                  {/* Underline cover under the letter */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-brand-600 dark:bg-brand-500 transition-all duration-300 ease-out origin-left ${
                      isActive
                        ? 'opacity-100 scale-x-100'
                        : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Desktop Auth Buttons & Theme Toggle */}
          <div className="hidden lg:flex items-center gap-2.5">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center justify-center gap-2 h-9 px-4 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap group"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'User'}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-white/60 shrink-0"
                    />
                  ) : (
                    <IconShield size={16} stroke={2.2} />
                  )}
                  <span>{user.role === 'admin' ? 'Admin Portal' : 'Dashboard'}</span>
                  <IconArrowRight size={15} stroke={2.2} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
                  title="Log out"
                  aria-label="Log out"
                  className="flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full bg-slate-100/90 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200/80 dark:border-slate-700 text-xs font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <IconLogout size={15} />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="flex items-center justify-center h-9 px-4 rounded-full bg-white hover:bg-rose-50/50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-600 text-slate-800 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400 font-semibold text-xs sm:text-sm shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  Log in
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="flex items-center justify-center h-9 px-5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  Sign up
                </button>
              </>
            )}
          </div>

          {/* Mobile & Tablet Auth Buttons & Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:hidden shrink-0">
            {/* Theme Toggle: Visible on tablet/desktop, in drawer on mobile */}
            <div className="hidden sm:inline-flex">
              <ThemeToggle />
            </div>

            {user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  aria-label={user.role === 'admin' ? 'Open Admin Portal' : 'Open Dashboard'}
                  className="flex items-center gap-1.5 h-9 pl-1.5 pr-3 rounded-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'Admin'}
                      className="w-6 h-6 rounded-full object-cover ring-1.5 ring-white/60 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                      <IconShield size={13} stroke={2.5} />
                    </div>
                  )}
                  <span>{user.role === 'admin' ? 'Admin' : 'Dashboard'}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
                  title="Log out"
                  aria-label="Log out"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200/80 dark:border-slate-700 shadow-2xs active:scale-90 transition-all cursor-pointer shrink-0"
                >
                  <IconLogout size={16} />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="flex items-center justify-center h-9 px-3.5 rounded-full bg-slate-100/90 hover:bg-slate-200/90 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.1] font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="flex items-center justify-center h-9 px-3.5 sm:px-4 rounded-full bg-gradient-to-r from-brand-600 to-rose-600 hover:from-brand-700 hover:to-rose-700 active:bg-brand-800 text-white font-bold text-xs shadow-xs hover:shadow-sm shadow-brand-600/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  Sign up
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100/90 hover:bg-slate-200/90 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/[0.1] shadow-2xs active:scale-90 transition-all cursor-pointer shrink-0"
            >
              <IconMenu2 size={19} stroke={2.4} />
            </button>
          </div>
        </div>
      </header>


      {/* Pure Tailwind Mobile Menu Drawer - Senior Front-End Architecture */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop with Smooth Blur */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-80 max-w-[88vw] sm:w-96 bg-white/95 dark:bg-[#0c0f18]/95 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.3)] p-5 sm:p-6 flex flex-col justify-between z-10 border-l border-slate-200/80 dark:border-white/10 rounded-l-3xl animate-in slide-in-from-right duration-300 overflow-y-auto modal-scrollbar">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollTo('hero');
                  }}
                  className="flex items-center gap-2.5 cursor-pointer group text-left select-none"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30 ring-2 ring-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
                    <IconPin size={23} stroke={2.6} className="text-white shrink-0" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white text-lg leading-none tracking-tight flex items-center">
                      Pinboard<span className="text-brand-600">.</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-0.5">
                      Explore
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100/90 hover:bg-rose-50 dark:bg-slate-800/90 dark:hover:bg-rose-950/60 text-slate-500 hover:text-brand-600 dark:text-slate-300 dark:hover:text-rose-300 border border-slate-200/80 hover:border-rose-200 dark:border-white/10 dark:hover:border-rose-500/40 shadow-2xs hover:shadow-xs dark:hover:shadow-[0_0_16px_rgba(225,29,72,0.35)] ring-1 ring-inset ring-transparent dark:ring-white/[0.08] transition-all duration-300 cursor-pointer active:scale-90 group"
                    aria-label="Close menu"
                  >
                    <IconX size={16} stroke={2.2} className="transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110" />
                  </button>
                </div>
              </div>

              {/* Navigation Items with Icons & Subtitles */}
              <nav className="mt-5 flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  const NavIcon = item.icon || IconPin;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        scrollTo(item.id);
                      }}
                      className={`w-full group text-left px-3 py-2.5 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer flex items-center justify-between border ${
                        isActive
                          ? 'bg-slate-100/90 dark:bg-white/[0.08] border-slate-200/90 dark:border-white/[0.12] text-slate-900 dark:text-white shadow-2xs'
                          : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            isActive
                              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/35 ring-2 ring-brand-500/25'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-colors'
                          }`}
                        >
                          <NavIcon size={16} stroke={2.4} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm truncate leading-tight ${isActive ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      {isActive ? (
                        <div className="flex items-center pr-1">
                          <span className="w-2 h-2 rounded-full bg-brand-600 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
                        </div>
                      ) : (
                        <IconArrowRight size={14} className="text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mr-1" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Trending Discovery & Support Micro-Section */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Trending Topics
                  </span>
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                    Popular
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { name: 'Architecture', tag: 'Architecture' },
                    { name: 'UI / UX Design', tag: 'UI Design' },
                    { name: 'Minimal Interior', tag: 'Minimal' },
                    { name: 'Photography', tag: 'Photography' },
                  ].map((topic) => (
                    <button
                      key={topic.name}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (!isAuthenticated) {
                          setAuthModalMode('login');
                          setAuthModalOpen(true);
                          return;
                        }
                        navigate(`/pins?search=${encodeURIComponent(topic.tag)}`);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100/70 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/50 dark:border-white/5 transition-all text-left truncate flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span className="text-brand-600 dark:text-brand-400 font-bold">#</span>
                      <span className="truncate">{topic.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Auth & Account Section */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {user ? (
                <>
                  {/* User Profile Card */}
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                    <div className="relative shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || user.username || 'User'}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/40 shadow-2xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                          {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c0f18]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.full_name || user.username || 'User'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-rose-500/10 text-brand-600 dark:text-rose-400 font-bold text-[10px] border border-rose-500/20">
                            <IconShield size={11} stroke={2.5} /> Platform Admin
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Pinboard Member
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enter Portal / Dashboard Button */}
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-between px-4 h-11 rounded-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-sm shadow-xs hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? <IconShield size={16} stroke={2.4} /> : <IconPin size={16} />}
                      <span>{user.role === 'admin' ? 'Open Admin Portal' : 'Open My Dashboard'}</span>
                    </div>
                    <IconArrowRight size={16} stroke={2.4} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* Quick Logout option */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLogoutConfirmOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <IconLogout size={13} stroke={2.2} />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthModalMode('register');
                      setAuthModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-sm shadow-xs hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <IconSparkles size={16} stroke={2.4} />
                    <span>Create Free Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthModalMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="group w-full flex items-center justify-center gap-2.5 h-11 px-4 rounded-full bg-white dark:bg-slate-800/90 hover:bg-rose-50/50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-rose-400 border border-slate-200/90 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/60 font-bold text-sm shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700/80 group-hover:bg-rose-100/80 dark:group-hover:bg-rose-950/80 text-slate-500 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-rose-400 flex items-center justify-center transition-all duration-200">
                      <IconLogin size={13} stroke={2.4} />
                    </div>
                    <span>Log in to existing account</span>
                  </button>
                  <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                    Free forever • No credit card required
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. LARGE VISUAL HERO SECTION */}
      <section id="hero" className="relative pt-12 pb-24 sm:pt-16 sm:pb-32 overflow-hidden scroll-mt-20">
        {/* Soft Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-brand-50/70 dark:bg-brand-950/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-rose-100/40 dark:bg-rose-950/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-14 items-center">
            {/* Left Hero Text: Centered on Tablet & Mobile (below lg), Left-aligned on Desktop (lg) */}
            <div className="lg:col-span-6 xl:col-span-5 text-center lg:text-left flex flex-col items-center lg:items-start max-w-2xl mx-auto lg:max-w-none z-10">
              {/* Modern Interactive Announcement Pill */}
              <button
                type="button"
                onClick={() => scrollTo('testimonials')}
                className="group inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-brand-500/50 dark:hover:border-brand-500/50 hover:-translate-y-0.5 active:scale-98 transition-all duration-200 mb-6 mx-auto lg:mx-0 cursor-pointer"
              >
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-600 text-white shadow-2xs">
                  New
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  Shared Team Boards &amp; Real-Time Sync
                </span>
                <IconArrowRight
                  size={13}
                  className="text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-1 transition-all shrink-0"
                />
              </button>

              {/* Clean High-Impact Typography: Balanced Without Orphaned Words */}
              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.12] sm:leading-[1.08] text-center lg:text-left">
                <span className="block">Save It. Organize It.</span>
                <span className="block mt-1.5 text-brand-600 dark:text-rose-500">
                  Make It Yours.
                </span>
              </h1>

              {/* Punchy Subtitle */}
              <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed font-normal text-center lg:text-left mx-auto lg:mx-0">
                Your personal digital pinboard for collecting ideas, study notes, design references, resources, and everything worth remembering.
              </p>

              {/* Action Buttons: Clean, Modern Pair (Primary CTA + Explore Ideas) */}
              <div className="mt-8 flex flex-row items-center justify-center lg:justify-start gap-3 flex-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="group flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm md:text-base shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span className="hidden sm:inline">Start Curating Free</span>
                  <span className="sm:hidden">Start Curating</span>
                  <IconArrowRight
                    size={17}
                    className="transition-transform duration-200 group-hover:translate-x-1.5 shrink-0 text-white"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo('preview')}
                  className="flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-white hover:bg-rose-50/50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400 border border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-600 font-semibold text-xs sm:text-sm md:text-base shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <IconCompass size={17} className="text-slate-400 dark:text-slate-500" />
                  <span>Explore Ideas</span>
                </button>
              </div>

            </div>

            {/* Right: Large Masonry Pin Showcase - Clean, Floating Pinterest Grid */}
            <div className="lg:col-span-6 xl:col-span-7 relative mt-8 lg:mt-0 max-w-2xl sm:max-w-3xl mx-auto lg:max-w-none">
              {/* Soft ambient backlight */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-rose-100/30 via-purple-50/20 to-amber-50/30 dark:from-rose-950/20 dark:via-purple-950/10 dark:to-amber-950/10 rounded-3xl blur-2xl -z-10 pointer-events-none" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
                {/* Column 1 */}
                <div className="space-y-3.5 sm:space-y-4 animate-float hover:[animation-play-state:paused]">
                  {heroPins.slice(0, 2).map((card) => (
                    <div
                      key={card.id}
                      className="group relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-2 hover:border-rose-400/60 dark:hover:border-rose-500/40 active:scale-[0.98] select-none"
                    >
                      <img
                        src={card.image}
                        alt={card.title || 'Inspiration pin'}
                        className={`w-full ${card.aspectClass} object-cover transition-transform duration-500 ease-out group-hover:scale-108`}
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>

                {/* Column 2 (Staggered) */}
                <div className="space-y-3.5 sm:space-y-4 pt-4 sm:pt-6 animate-float-delayed hover:[animation-play-state:paused]">
                  {heroPins.slice(2, 4).map((card) => (
                    <div
                      key={card.id}
                      className="group relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-2 hover:border-rose-400/60 dark:hover:border-rose-500/40 active:scale-[0.98] select-none"
                    >
                      <img
                        src={card.image}
                        alt={card.title || 'Inspiration pin'}
                        className={`w-full ${card.aspectClass} object-cover transition-transform duration-500 ease-out group-hover:scale-108`}
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>

                {/* Column 3 (Desktop & Tablet) */}
                <div className="hidden sm:block space-y-3.5 sm:space-y-4 pt-1 sm:pt-2 animate-float-slow hover:[animation-play-state:paused]">
                  {heroPins.slice(4, 6).map((card) => (
                    <div
                      key={card.id}
                      className="group relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-2 hover:border-rose-400/60 dark:hover:border-rose-500/40 active:scale-[0.98] select-none"
                    >
                      <img
                        src={card.image}
                        alt={card.title || 'Inspiration pin'}
                        className={`w-full ${card.aspectClass} object-cover transition-transform duration-500 ease-out group-hover:scale-108`}
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "WHAT CAN YOU SAVE?" VISUAL SECTION */}
      <section id="what-you-can-save" className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800 transition-colors scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 reveal-on-scroll">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
              Visual Discovery
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              What Can You Save on Pinboard?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              From study cheat sheets and UI tokens to architectural lightwells and workspace setups—organize whatever fuels your creativity.
            </p>
          </div>

          {/* Category Chips Bar */}
          <div className="flex flex-wrap justify-center items-center gap-2.5 mb-10 reveal-on-scroll delay-100">
            {saveCategories.map((cat) => {
              const isSelected = activeSaveTab === cat.id;
              const CategoryIcon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveSaveTab(cat.id)}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs scale-105 ring-1 ring-brand-500/25'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:-translate-y-0.5 border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <CategoryIcon
                    size={17}
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6 ${
                      isSelected ? 'text-brand-400 dark:text-brand-600' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Visual Showcase Card for Selected Category */}
          <div className="rounded-3xl bg-[#FAFAFA] dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md grid grid-cols-1 lg:grid-cols-12 max-w-5xl mx-auto transition-all duration-300 reveal-on-scroll delay-200 group">
            {/* Image Preview */}
            <div className="lg:col-span-7 h-72 sm:h-96 relative overflow-hidden bg-slate-900">
              <img
                src={currentSaveItem.image}
                alt={currentSaveItem.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-600 text-white shadow-xs">
                  {(() => {
                    const CardIcon = currentSaveItem.icon;
                    return <CardIcon size={14} className="shrink-0" />;
                  })()}
                  <span>{currentSaveItem.label}</span>
                </span>
              </div>
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                {currentSaveItem.stats}
              </div>
            </div>

            {/* Info & Tags */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-brand-600 via-rose-600 to-rose-500 text-white flex items-center justify-center mb-4 shadow-md shadow-brand-600/30 ring-2 ring-brand-500/25 group-hover:scale-105 transition-all duration-300 shrink-0">
                  {(() => {
                    const CurrentIcon = currentSaveItem.icon;
                    return <CurrentIcon size={20} stroke={2.4} className="text-white" />;
                  })()}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                  {currentSaveItem.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {currentSaveItem.description}
                </p>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Popular Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSaveItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-brand-300 hover:text-brand-600 transition-colors cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 mt-6 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to start saving?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="group/btn flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-150 cursor-pointer"
                >
                  <span>Create Pinboard</span>
                  <IconArrowRight size={13} className="transition-transform duration-150 group-hover/btn:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION (6 Interactive Cards with Icon Glow) */}
      <section id="features" className="py-20 bg-[#FAFAFA] dark:bg-slate-950 transition-colors scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal-on-scroll">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
              Everything You Need
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Simple Tools, Big Results
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Pinboard is easy to use for anyone — students, creators, or anyone who loves saving ideas.
            </p>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              const delayClass = ['delay-100', 'delay-200', 'delay-300'][index % 3];
              return (
                <div
                  key={index}
                  className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 sm:hover:border-brand-300/80 sm:dark:hover:border-brand-700/80 shadow-2xs hover:shadow-md transition-all duration-300 sm:hover:-translate-y-1.5 flex flex-col justify-between group cursor-default reveal-on-scroll ${delayClass}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/30 ring-2 ring-brand-500/20 group-hover:scale-108 group-hover:shadow-lg group-hover:shadow-brand-600/40 transition-all duration-300 shrink-0">
                        <Icon size={20} stroke={2.4} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 px-2.5 py-1 rounded-full shadow-2xs transition-colors">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. COLLABORATE WITH SHARED BOARDS (Company-Grade 2-Sided Showcase) */}
      <section id="testimonials" className="py-20 lg:py-28 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800 transition-colors overflow-hidden scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">

            {/* Left Side (Side 1): Editorial copy & What makes Pinboard unique */}
            <div className="lg:col-span-5 space-y-7 reveal-on-scroll">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50 text-brand-600 dark:text-brand-400 text-xs font-bold shadow-2xs mb-4">
                  <IconUsers size={15} />
                  <span>Private Friend Circle</span>
                </div>

                <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                  Share privately with up to 5 friends
                </h2>

                <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Curate visual ideas, compile design tokens, and build living project boards exclusively with your inner circle of up to 5 close friends or teammates—in total privacy.
                </p>
              </div>

              {/* Interactive Board Archetype Switchers */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
                  Explore 5-Friend Shared Boards:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {collaborativeBoards.map((b) => {
                    const isActive = activeCollabBoard === b.id;
                    const Icon = b.icon;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setActiveCollabBoard(b.id)}
                        className={`group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                          isActive
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs scale-[1.02]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:-translate-y-0.5'
                        }`}
                      >
                        {Icon && (
                          <Icon
                            size={14}
                            stroke={2.2}
                            className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                              isActive
                                ? 'text-brand-400 dark:text-brand-600'
                                : 'text-slate-400 dark:text-slate-400 group-hover:text-brand-500'
                            }`}
                          />
                        )}
                        <span>{b.tabLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Unique Value Propositions (What makes this website unique) */}
              <div className="space-y-3 pt-1 border-t border-slate-200/70 dark:border-slate-800/80">
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <IconCheck size={12} stroke={2.5} />
                  </div>
                  <div>
                    <strong className="font-bold text-slate-900 dark:text-white">Smart Visual Curation &amp; Tagging:</strong>{' '}
                    Organize references with multi-level tags, custom categories, and personal notes so your inspiration is always easy to find.
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <IconCheck size={12} stroke={2.5} />
                  </div>
                  <div>
                    <strong className="font-bold text-slate-900 dark:text-white">True Dynamic Aspect-Ratio View:</strong>{' '}
                    Widescreen Figma frames, vertical mobile screens, and architecture blueprints preserve their original proportions without cropping.
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <IconCheck size={12} stroke={2.5} />
                  </div>
                  <div>
                    <strong className="font-bold text-slate-900 dark:text-white">Max 5 Friends Circle Limit:</strong>{' '}
                    Strictly capped at 5 members per circle. No public broadcasts or spam—only genuine visual exchange with your closest peers.
                  </div>
                </div>
              </div>

              {/* Red Signature Pill Button (Matching the Reference Image) */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="group inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-6 sm:px-8 w-auto self-start sm:self-auto rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm md:text-base shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  <span>Start a Shared Board</span>
                  <IconArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1.5 shrink-0" />
                </button>

                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Instant team setup · Invite unlimited peers
                </span>
              </div>
            </div>

            {/* Right Side (Side 2): Soft Curved Canvas Container + Floating 3-Photo Collage Card */}
            <div className="lg:col-span-7 flex justify-center reveal-on-scroll">
              <div className="w-full bg-[#F2F0EB] dark:bg-slate-800/80 rounded-[40px] sm:rounded-[52px] p-6 sm:p-12 lg:p-14 flex flex-col items-center justify-center border border-stone-200/70 dark:border-slate-700/60 relative transition-colors shadow-2xs">

                {/* Floating Multi-Photo Collage Board Card */}
                <div
                  className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1.5 border border-stone-200/80 dark:border-slate-800 max-w-[440px] w-full cursor-pointer group"
                  onClick={() => {
                    setSelectedPreviewPin({
                      id: `collab-${currentCollabBoard.id}-main`,
                      title: currentCollabBoard.mainImage.title,
                      category: currentCollabBoard.category,
                      tags: currentCollabBoard.mainImage.tags,
                      author: currentCollabBoard.mainImage.author,
                      rating: currentCollabBoard.mainImage.rating,
                      rating_count: 48,
                      comments_count: 14,
                      likes: 92,
                      image: currentCollabBoard.mainImage.url,
                    });
                  }}
                >
                  {/* 3-Photo Collage Grid */}
                  <div className="grid grid-cols-5 gap-2.5 sm:gap-3 aspect-[16/11]">
                    {/* Left Tall Image (60% width - 3 cols) */}
                    <div
                      className="col-span-3 h-full rounded-2xl sm:rounded-[20px] overflow-hidden bg-slate-100 dark:bg-slate-800 relative group/left"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPreviewPin({
                          id: `collab-${currentCollabBoard.id}-main`,
                          title: currentCollabBoard.mainImage.title,
                          category: currentCollabBoard.category,
                          tags: currentCollabBoard.mainImage.tags,
                          author: currentCollabBoard.mainImage.author,
                          rating: currentCollabBoard.mainImage.rating,
                          rating_count: 48,
                          comments_count: 14,
                          likes: 92,
                          image: currentCollabBoard.mainImage.url,
                        });
                      }}
                    >
                      <img
                        src={currentCollabBoard.mainImage.url}
                        alt={currentCollabBoard.mainImage.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/left:opacity-100 transition-opacity duration-200 flex items-end p-2.5">
                        <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <span>Expand</span>
                          <IconArrowUpRight size={11} />
                        </span>
                      </div>
                    </div>

                    {/* Right Stacked Images (40% width - 2 cols) */}
                    <div className="col-span-2 flex flex-col gap-2.5 sm:gap-3 h-full">
                      {/* Sub Image Top */}
                      <div
                        className="flex-1 rounded-2xl sm:rounded-[20px] overflow-hidden bg-slate-100 dark:bg-slate-800 relative group/top"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPreviewPin({
                            id: `collab-${currentCollabBoard.id}-sub1`,
                            title: currentCollabBoard.subImageTop.title,
                            category: currentCollabBoard.category,
                            tags: currentCollabBoard.subImageTop.tags,
                            author: currentCollabBoard.subImageTop.author,
                            rating: currentCollabBoard.subImageTop.rating,
                            rating_count: 36,
                            comments_count: 9,
                            likes: 64,
                            image: currentCollabBoard.subImageTop.url,
                          });
                        }}
                      >
                        <img
                          src={currentCollabBoard.subImageTop.url}
                          alt={currentCollabBoard.subImageTop.title}
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/top:opacity-100 transition-opacity duration-200 flex items-end p-2">
                          <span className="text-[9px] font-bold text-white bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                            <span>Expand</span>
                            <IconArrowUpRight size={10} />
                          </span>
                        </div>
                      </div>

                      {/* Sub Image Bottom */}
                      <div
                        className="flex-1 rounded-2xl sm:rounded-[20px] overflow-hidden bg-slate-100 dark:bg-slate-800 relative group/bottom"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPreviewPin({
                            id: `collab-${currentCollabBoard.id}-sub2`,
                            title: currentCollabBoard.subImageBottom.title,
                            category: currentCollabBoard.category,
                            tags: currentCollabBoard.subImageBottom.tags,
                            author: currentCollabBoard.subImageBottom.author,
                            rating: currentCollabBoard.subImageBottom.rating,
                            rating_count: 29,
                            comments_count: 7,
                            likes: 51,
                            image: currentCollabBoard.subImageBottom.url,
                          });
                        }}
                      >
                        <img
                          src={currentCollabBoard.subImageBottom.url}
                          alt={currentCollabBoard.subImageBottom.title}
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/bottom:opacity-100 transition-opacity duration-200 flex items-end p-2">
                          <span className="text-[9px] font-bold text-white bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                            <span>Expand</span>
                            <IconArrowUpRight size={10} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Board Title, Pin Count & Overlapping Collaborator Avatars */}
                  <div className="mt-4 sm:mt-5 flex items-center justify-between px-1">
                    <div className="min-w-0 pr-3">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                        {currentCollabBoard.boardTitle}
                      </h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {currentCollabBoard.pinCount}
                      </p>
                    </div>

                    {/* Overlapping Round Collaborator Avatars */}
                    <div className="flex items-center -space-x-3.5 shrink-0">
                      {currentCollabBoard.collaborators.map((collab, i) => (
                        <img
                          key={i}
                          src={collab.avatar}
                          alt={collab.name}
                          title={`${collab.name} (${collab.role})`}
                          className="w-12 h-12 rounded-full object-cover ring-[3px] ring-white dark:ring-slate-900 shadow-sm"
                        />
                      ))}
                      {currentCollabBoard.extraCollaboratorsCount > 0 && (
                        <span
                          title={`${currentCollabBoard.extraCollaboratorsCount} more collaborators`}
                          className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 ring-[3px] ring-white dark:ring-slate-900 text-sm font-bold flex items-center justify-center shadow-sm"
                        >
                          +{currentCollabBoard.extraCollaboratorsCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verified Creator Workflow Testimonial under the Card */}
                <div className="mt-6 sm:mt-7 text-center max-w-sm px-2">
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-300 italic font-medium leading-relaxed">
                    "{currentCollabBoard.quote}"
                  </p>
                  <p className="text-[11px] font-bold text-stone-900 dark:text-white mt-1.5">
                    {currentCollabBoard.authorName}{' '}
                    <span className="font-normal text-stone-500 dark:text-slate-400">
                      · {currentCollabBoard.authorRole}
                    </span>
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. REALISTIC PIN SHOWCASE / LIVE PREVIEW */}
      <section id="preview" className="py-20 bg-[#FAFAFA] dark:bg-slate-950 transition-colors scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 reveal-on-scroll">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
              Interactive Micro-Interactions
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Experience the Pin Cards
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Hover over pins to try save actions, star ratings, and smooth modal view previews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {showcasePins.map((pin, index) => {
              const isLiked = previewLikedId === pin.id;
              const delayClass = ['delay-100', 'delay-200', 'delay-300'][index % 3];
              return (
                <div
                  key={pin.id}
                  className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-rose-300/80 dark:hover:border-rose-700/80 transition-all duration-300 hover:-translate-y-2 group overflow-hidden cursor-pointer reveal-on-scroll active:scale-[0.99] ${delayClass}`}
                  onClick={() => setSelectedPreviewPin(pin)}
                >
                  {/* Pin Image Container */}
                  <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                    <img
                      src={pin.image}
                      alt={pin.title}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                    />

                    {/* Hover Overlay - Clean Layout */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 p-3.5 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-600 text-white shadow-xs">
                          {pin.category}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              setAuthModalMode('register');
                              setAuthModalOpen(true);
                              return;
                            }
                            setPreviewLikedId(isLiked ? null : pin.id);
                          }}
                          className={`px-3.5 py-1.5 rounded-full font-bold text-xs shadow-xs hover:shadow-sm transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                            isLiked
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-2 ring-rose-500/50 scale-105'
                              : 'bg-brand-600 hover:bg-brand-700 text-white hover:scale-105'
                          }`}
                          aria-label={isLiked ? 'Saved' : 'Save pin'}
                        >
                          {isLiked ? <IconHeartFilled size={13} className="text-rose-400 animate-pulse" /> : <IconHeart size={13} />}
                          <span>{isLiked ? 'Saved ✓' : 'Save'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-end">
                        <span className="text-[11px] text-white/80 font-medium group-hover:text-white inline-flex items-center gap-1">
                          <span>Click to view details</span>
                          <IconArrowUpRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pin Details */}
                  <div className="p-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
                          {pin.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          by {pin.author}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-1">
                        {pin.title}
                      </h4>
                    </div>

                    {/* Tag Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pin.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold hover:bg-rose-50 dark:hover:bg-slate-750 hover:text-brand-600 transition-colors"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* Bottom Metrics: ⭐ Rating, 💬 Comments, ❤️ Favorites */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-amber-500">
                          <IconStarFilled size={14} /> {pin.rating} ({pin.rating_count})
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <IconMessageCircle size={14} /> {pin.comments_count}
                        </span>
                      </div>

                      <span className="flex items-center gap-1 text-brand-600 font-bold">
                        <IconHeartFilled size={13} /> {isLiked ? pin.likes + 1 : pin.likes}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION (CTA) */}
      <section id="cta" className="py-24 bg-gradient-to-b from-white via-rose-50/20 to-brand-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 transition-colors relative overflow-hidden">
        {/* Soft decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-brand-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-8 sm:p-14 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden reveal-on-scroll">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Start Organizing Your World Today
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              Create your free account now and start curating your personal pinboards, inspiration libraries, study notes, and creative ideas in seconds.
            </p>

            <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('register');
                  setAuthModalOpen(true);
                }}
                className="group inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-6 sm:px-8 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm md:text-base shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 w-auto cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Sign Up Free</span>
                <IconArrowRight
                  size={17}
                  className="transition-transform duration-200 group-hover:translate-x-1.5 shrink-0 text-white"
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center justify-center h-11 sm:h-12 px-6 sm:px-8 rounded-full bg-white hover:bg-rose-50/50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-600 text-slate-800 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400 font-semibold text-xs sm:text-sm md:text-base shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 w-auto cursor-pointer whitespace-nowrap shrink-0"
              >
                Log In
              </button>
            </div>

            {/* Clean Company-Grade Value & Trust Indicators */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-y-2.5 gap-x-5 sm:gap-x-7 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="inline-flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                  <IconUsers size={11} stroke={2.5} />
                </span>
                <span>Share boards with friends</span>
              </span>

              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

              <span className="inline-flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <IconSparkles size={11} stroke={2.5} />
                </span>
                <span>Write &amp; organize your ideas</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-[#FAFAFA] dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 select-none">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30 ring-2 ring-brand-500/20 shrink-0">
              <IconPin size={23} stroke={2.6} className="text-white shrink-0" />
            </div>
            <span className="font-black text-slate-900 dark:text-white text-xl tracking-tight flex items-center leading-none">
              Pinboard<span className="text-brand-600">.</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <button onClick={() => scrollTo('hero')} className="hover:text-brand-600 transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => scrollTo('what-you-can-save')} className="hover:text-brand-600 transition-colors cursor-pointer">
              What You Can Save
            </button>
            <button onClick={() => scrollTo('features')} className="hover:text-brand-600 transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollTo('testimonials')} className="hover:text-brand-600 transition-colors cursor-pointer">
              Testimonials
            </button>
            <button onClick={() => scrollTo('preview')} className="hover:text-brand-600 transition-colors cursor-pointer">
              Live Preview
            </button>
            <button
              onClick={() => {
                setAuthModalMode('login');
                setAuthModalOpen(true);
              }}
              className="hover:text-brand-600 transition-colors cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthModalMode('register');
                setAuthModalOpen(true);
              }}
              className="hover:text-brand-600 transition-colors cursor-pointer"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('terms');
                setLegalModalOpen(true);
              }}
              className="hover:text-brand-600 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('privacy');
                setLegalModalOpen(true);
              }}
              className="hover:text-brand-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Personal Pinboard. All rights reserved.
          </p>
        </div>
      </footer>

      {/* 10. INTERACTIVE PIN DETAILS POP-UP MODAL (Pure Tailwind CSS) */}
      {selectedPreviewPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with clean blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={closePreviewPin}
          />
          {/* Modal Dialog */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-200/90 dark:border-slate-800 z-10 overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Close Button - Stays fixed at top right */}
            <button
              type="button"
              onClick={closePreviewPin}
              className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer backdrop-blur-xs shadow-2xs"
              aria-label="Close modal"
            >
              <IconX size={18} />
            </button>

            {/* Dedicated scrollable content with modal-scrollbar and gutter clearance */}
            <div className="flex-1 overflow-y-auto p-6 pr-5 sm:pr-6 modal-scrollbar overscroll-contain">

            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900">
                <img
                  src={selectedPreviewPin.image}
                  alt={selectedPreviewPin.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-600 text-white shadow-xs">
                    {selectedPreviewPin.category}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>By {selectedPreviewPin.author}</span>
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <IconStarFilled size={13} /> {selectedPreviewPin.rating} ({selectedPreviewPin.rating_count} reviews)
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedPreviewPin.title}
                </h3>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedPreviewPin.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      const pinId = selectedPreviewPin.id;
                      closePreviewPin();
                      navigate(`/pins/${pinId}`);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 h-10 px-5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap group"
                  >
                    <span>View Full Pin Details & Comments</span>
                    <IconArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        closePreviewPin();
                        setAuthModalMode('login');
                        setAuthModalOpen(true);
                      }}
                      className="flex items-center justify-center h-9 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 hover:text-slate-900 dark:text-slate-100 dark:hover:text-white font-semibold text-xs shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                    >
                      Sign In to Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closePreviewPin();
                        setAuthModalMode('register');
                        setAuthModalOpen(true);
                      }}
                      className="flex items-center justify-center h-9 px-4 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                    >
                      Get Started Free
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Back to Top Floating Action Button */}
      {isScrolled && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-600/50 shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer group animate-fade-in"
          aria-label="Back to top"
        >
          <IconArrowRight size={18} className="-rotate-90 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Global Modals */}
      <AuthModal
        opened={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
        redirectTo="/pins"
      />

      <LegalModal
        opened={legalModalOpen}
        onClose={closeLegalModal}
        initialTab={legalModalTab}
      />

      <LogoutConfirmModal
        opened={logoutConfirmOpen}
        onClose={() => {
          setLogoutConfirmOpen(false);
          forceUnlockBodyScroll();
        }}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
