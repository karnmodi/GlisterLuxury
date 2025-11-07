'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Get or create session ID
 */
const getSessionID = (): string => {
  if (typeof window === 'undefined') return '';
  
  // Try to get from localStorage first
  let sessionID = localStorage.getItem('glister_session_id');
  
  if (!sessionID) {
    // Generate new session ID
    sessionID = uuidv4();
    localStorage.setItem('glister_session_id', sessionID);
  }
  
  return sessionID;
};

/**
 * Get device type from user agent
 */
const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/.test(navigator.userAgent)) {
    return 'mobile';
  }
  return 'desktop';
};

/**
 * Track page visit
 */
const trackVisit = async (pathname: string, searchParams: string) => {
  try {
    const fullPath = searchParams ? `${pathname}?${searchParams}` : pathname;
    const sessionID = getSessionID();
    const deviceType = getDeviceType();
    
    // Get referrer
    const referrer = document.referrer || '';
    
    // Send visit to backend
    await fetch(`${API_BASE_URL}/analytics/track-visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionID,
        page: fullPath,
        referrer,
        deviceType,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // Silently fail - tracking shouldn't break the app
    console.debug('Visit tracking failed:', error);
  }
};

/**
 * Visit Tracker Component
 * Tracks page visits automatically on route changes
 */
export default function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Skip tracking for:
    // - API routes
    // - ALL admin pages (customer-facing pages only)
    // - Static files
    if (
      pathname?.startsWith('/api') ||
      pathname?.startsWith('/admin') ||
      pathname?.includes('.')
    ) {
      return;
    }

    // Track the visit (only customer-facing pages)
    const searchString = searchParams?.toString() || '';
    trackVisit(pathname || '/', searchString);
  }, [pathname, searchParams]);

  // This component doesn't render anything
  return null;
}

