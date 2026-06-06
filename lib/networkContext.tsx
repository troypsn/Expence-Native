import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

// ─── Types ───────────────────────────────────────────────────────────────────

type NetworkContextType = {
  isOnline: boolean;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const NetworkContext = createContext<NetworkContextType>({ isOnline: true });

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NetworkProvider({
  children,
  onComeOnline,
}: {
  children: React.ReactNode;
  onComeOnline?: () => void;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const prevOnline = useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(connected);

      // Fire callback when transitioning from offline → online
      if (connected && prevOnline.current === false && onComeOnline) {
        onComeOnline();
      }
      prevOnline.current = connected;
    });

    return () => unsubscribe();
  }, [onComeOnline]);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNetwork() {
  return useContext(NetworkContext);
}
