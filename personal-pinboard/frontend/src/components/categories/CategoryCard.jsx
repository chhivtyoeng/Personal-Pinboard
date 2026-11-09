import React from 'react';
import { Link } from 'react-router-dom';
import { IconUsers, IconUser, IconLock } from '@tabler/icons-react';

export default function CategoryCard({ category }) {
  const isGroup = category.type === 'group' || (category.members && category.members.length > 0);
  const members = Array.isArray(category.members) ? category.members : [];

  return (
    <Link
      to={`/pins?category=${category.id}`}
      className="group relative overflow-hidden rounded-2xl sm:rounded-3xl aspect-[16/11] sm:aspect-[4/3] bg-slate-900 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-300 flex flex-col justify-between p-4 sm:p-5 block border border-slate-800/60"
    >
      {/* Background Cover Image */}
      {category.image_url ? (
        <img
          src={category.image_url}
          alt={category.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 group-hover:opacity-90 transition-all duration-500 ease-out"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
      )}

      {/* Multi-stop Gradient Overlay for Crisp Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/20 group-hover:from-slate-950/90 transition-colors" />

      {/* Top Bar: Type Badge & Pin Counter */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Category Type Indicator */}
        {isGroup ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/25 backdrop-blur-md text-rose-100 border border-rose-400/30 shadow-2xs">
            <IconUsers size={12} stroke={2.5} className="text-rose-200" />
            <span>Group Sharing ({members.length}/5)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-md text-slate-100 border border-white/20 shadow-2xs">
            <IconUser size={12} stroke={2.5} className="text-slate-300" />
            <span>Personal</span>
          </span>
        )}

        {/* Pins Count Pill */}
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-brand-600/90 backdrop-blur-md text-white shadow-2xs">
          {category.pins_count || 0} Pins
        </span>
      </div>

      {/* Bottom Area: Name, Description & Member Preview */}
      <div className="relative z-10">
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug group-hover:text-red-200 transition-colors">
          {category.name}
        </h3>

        {category.description && (
          <p className="text-xs text-slate-300 line-clamp-1 mt-1 opacity-90 font-normal">
            {category.description}
          </p>
        )}

        {/* Dynamic Footer: Collaborators Stack for Group vs Solo Tag for Personal */}
        {isGroup ? (
          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/15">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden py-0.5">
                {members.length > 0 ? (
                  members.slice(0, 5).map((m, idx) => (
                    m.avatar_url ? (
                      <img
                        key={m.id || idx}
                        src={m.avatar_url}
                        alt={m.username || 'Member'}
                        title={m.full_name || `@${m.username}`}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-950 object-cover"
                      />
                    ) : (
                      <div
                        key={m.id || idx}
                        title={m.full_name || `@${m.username}`}
                        className="inline-flex h-6 w-6 rounded-full ring-2 ring-slate-950 bg-brand-600 text-white items-center justify-center text-[10px] font-bold"
                      >
                        {(m.full_name || m.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )
                  ))
                ) : (
                  <div className="w-6 h-6 rounded-full bg-rose-500/30 text-rose-200 flex items-center justify-center text-[10px] font-bold ring-2 ring-slate-950">
                    <IconUsers size={11} />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-300">
                {members.length === 0
                  ? 'No members yet'
                  : members.length === 1
                  ? '1 member'
                  : `${members.length} members`}
              </span>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200/90 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/20">
              Shared
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/15 text-[11px] font-medium text-slate-300">
            <span className="flex items-center gap-1.5 opacity-80">
              <IconLock size={12} />
              <span>Private to your workspace</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
              Solo
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
