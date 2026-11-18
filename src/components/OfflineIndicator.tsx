/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { AnimatePresence, motion } from 'motion/react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-20 lg:bottom-5 left-4 right-4 sm:right-auto z-50 flex items-center gap-2 rounded-xl bg-amber-700 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode — Cached Lahore lab catalog is active.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
