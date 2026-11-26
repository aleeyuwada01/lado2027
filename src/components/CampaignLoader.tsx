import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

export const OFFICIAL_LADO_PORTRAIT_URL =
  'https://i.ibb.co/Cp8c3Xnb/Smiling-Nigerian-Man-in-Traditional-Attire.png';

const PDP_CREST_URL = '/src/assets/images/pdp_umbrella_emblem_1795647900978.jpg';

export type CampaignLoaderVariant = 'fullscreen' | 'overlay' | 'inline';

interface CampaignLoaderProps {
  visible?: boolean;
  variant?: CampaignLoaderVariant;
  title?: string;
  statusText?: string;
  progress?: number; // 0-100 optional determinate progress
  portraitUrl?: string | null;
  crestUrl?: string | null;
  tone?: 'auto' | 'dark';
  className?: string;
}

/**
 * Executive branded loading animation featuring Senator Yakubu Lado Dan Marke's
 * official portrait inside precision dual orbital rings and PDP crest seal.
 * Used at initial app boot, shell transitions, module navigation, and Mapbox GL loads.
 */
export const CampaignLoader: React.FC<CampaignLoaderProps> = ({
  visible = true,
  variant = 'fullscreen',
  title = 'Senator Yakubu Lado Dan Marke',
  statusText = 'Initializing Katsina Command Center...',
  progress,
  portraitUrl,
  crestUrl,
  tone = 'auto',
  className = '',
}) => {
  const activePortrait = portraitUrl || OFFICIAL_LADO_PORTRAIT_URL;
  const activeCrest = crestUrl || PDP_CREST_URL;

  const isFullscreen = variant === 'fullscreen';
  const isOverlay = variant === 'overlay';

  const medallionSize = isFullscreen
    ? 'w-32 h-32 sm:w-36 sm:h-36'
    : isOverlay
      ? 'w-20 h-20'
      : 'w-16 h-16';

  const crestSize = isFullscreen
    ? 'w-9 h-9 -bottom-1 -right-1 p-1'
    : isOverlay
      ? 'w-6 h-6 -bottom-0.5 -right-0.5 p-0.5'
      : 'w-5 h-5 -bottom-0.5 -right-0.5 p-0.5';

  const coreContent = (
    <div className="relative flex flex-col items-center text-center max-w-md mx-auto px-6">
      {/* Precision Portrait Medallion with Dual Rotating Orbital Rings */}
      <div className={`relative ${medallionSize} flex items-center justify-center`}>
        {/* Breathing Civic Emerald Ambient Halo */}
        <div
          aria-hidden="true"
          className="absolute -inset-3 rounded-full bg-gradient-to-tr from-emerald-600/25 via-emerald-400/15 to-sky-500/20 blur-xl animate-campaign-breathe"
        />

        {/* Outer Rotating Precision Arc SVG */}
        <svg
          aria-hidden="true"
          viewBox="0 0 140 140"
          className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] animate-campaign-orbit"
        >
          <defs>
            <linearGradient id="ladoOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0D5C38" stopOpacity="1" />
              <stop offset="55%" stopColor="#10B981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="70"
            cy="70"
            r="65"
            fill="none"
            stroke="url(#ladoOrbitGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="175 240"
          />
        </svg>

        {/* Inner Counter-Rotating Dashed Track */}
        <svg
          aria-hidden="true"
          viewBox="0 0 140 140"
          className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] animate-campaign-orbit-reverse opacity-75"
        >
          <circle
            cx="70"
            cy="70"
            r="66"
            fill="none"
            stroke="#0D5C38"
            strokeOpacity="0.28"
            strokeWidth="1.5"
            strokeDasharray="4 8"
          />
        </svg>

        {/* Crisp Circular Portrait Frame */}
        <div className="relative w-full h-full rounded-full p-1 bg-white dark:bg-[#0F172A] shadow-xl ring-1 ring-emerald-700/25 dark:ring-emerald-400/25">
          <div className="w-full h-full rounded-full overflow-hidden bg-sky-600/10">
            <img
              src={activePortrait}
              alt="Senator Yakubu Lado Dan Marke"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top scale-[1.03]"
            />
          </div>
        </div>

        {/* Anchored PDP Crest Seal */}
        <div
          className={`absolute ${crestSize} rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center`}
        >
          <img
            src={activeCrest}
            alt="PDP Crest"
            referrerPolicy="no-referrer"
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>

      {/* Executive Typography & Progress Rail */}
      {isFullscreen ? (
        <div className="mt-7 space-y-2.5 w-full">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            People&apos;s Democratic Party · Katsina 2027
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white font-display tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 min-h-[20px]">
            {statusText}
          </p>

          {/* Precision Progress Rail */}
          <div className="pt-2.5 w-64 sm:w-72 mx-auto space-y-1.5">
            <div className="relative h-1.5 w-full rounded-full bg-slate-200/90 dark:bg-slate-800 overflow-hidden">
              {typeof progress === 'number' ? (
                <motion.div
                  className="relative h-full rounded-full bg-gradient-to-r from-[#0D5C38] via-emerald-600 to-emerald-500 overflow-hidden"
                  initial={{ width: '8%' }}
                  animate={{ width: `${Math.max(8, Math.min(100, progress))}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <div className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-campaign-sheen" />
                </motion.div>
              ) : (
                <div className="relative h-full w-full overflow-hidden">
                  <div className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-[#0D5C38] via-emerald-500 to-[#0D5C38] animate-campaign-sheen" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              <span>Katsina 34 LGAs · 361 Wards</span>
              <span>{typeof progress === 'number' ? `${Math.round(progress)}%` : 'Syncing'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-1">
          <div
            className={`font-bold font-display ${
              tone === 'dark' ? 'text-white' : 'text-slate-950 dark:text-white'
            } ${isOverlay ? 'text-sm' : 'text-xs'}`}
          >
            {statusText}
          </div>
          <div
            className={`text-[11px] font-medium ${
              tone === 'dark' ? 'text-emerald-400' : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            Yakubu Lado Dan Marke Command
          </div>
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    if (!visible) return null;
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        data-testid="campaign-loader-inline"
        className={`flex items-center justify-center p-6 ${className}`}
      >
        {coreContent}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`campaign-loader-${variant}`}
          role="status"
          aria-live="polite"
          aria-busy="true"
          data-testid={`campaign-loader-${variant}`}
          initial={{ opacity: isFullscreen ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: isFullscreen ? 1.02 : 1 }}
          transition={{ duration: isFullscreen ? 0.32 : 0.18, ease: 'easeOut' }}
          className={
            isFullscreen
              ? `fixed inset-0 z-[100] flex items-center justify-center bg-[#F8FAFC]/98 dark:bg-[#070B14]/98 backdrop-blur-md ${className}`
              : `absolute inset-0 z-30 flex items-center justify-center bg-white/80 dark:bg-[#070B14]/80 backdrop-blur-xs rounded-xl ${className}`
          }
        >
          {/* Subtle Architectural Corner Hairlines on Fullscreen Boot */}
          {isFullscreen && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(13,92,56,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_60%)]"
            />
          )}
          {coreContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
