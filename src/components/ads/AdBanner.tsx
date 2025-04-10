
import React, { useEffect, useRef } from 'react';

// Add window.adsbygoogle type declaration
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  adSlot: string;
  adFormat?: string;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  adSlot,
  adFormat = 'auto',
  className = 'w-full overflow-hidden my-4'
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const adInitialized = useRef(false);

  useEffect(() => {
    // Only initialize this ad if it hasn't been initialized yet
    if (adRef.current && !adInitialized.current && window.adsbygoogle) {
      try {
        // Use a random key for each ad instance to avoid duplication issues
        const randomKey = `ad-${Math.random().toString(36).substring(2, 9)}`;
        adRef.current.dataset.adKey = randomKey;
        
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adInitialized.current = true;
      } catch (error) {
        console.error("AdSense initialization error:", error);
      }
    }
    
    return () => {
      // Reset the initialization flag when component unmounts
      adInitialized.current = false;
    };
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-3116464894083582"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        ref={adRef as any}
      />
    </div>
  );
};

export default AdBanner;
