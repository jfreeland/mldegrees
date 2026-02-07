'use client';

import { useEffect, useRef } from 'react';

interface AdUnitProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdUnit({
  slot,
  format = 'auto',
  responsive = true,
  className = ''
}: AdUnitProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch {
      // AdSense not ready or ad blocked
    }
  }, []);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (!clientId) return null;

  // In development, show placeholder
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        <p className="text-sm">Ad Placeholder{slot ? ` (${slot})` : ''}</p>
      </div>
    );
  }

  // If no specific slot ID, rely on AdSense auto-ads (enabled via the script in layout)
  if (!slot) return null;

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  );
}
