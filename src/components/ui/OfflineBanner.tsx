import { useEffect, useState } from 'react';

export const OfflineBanner = () => {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950"
    >
      You appear to be offline. Payment and API actions may fail until your connection returns.
    </div>
  );
};
