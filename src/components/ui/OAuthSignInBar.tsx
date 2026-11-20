/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface GoogleOAuthButtonProps {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  label = 'Continue with Google',
  loading = false,
  disabled = false,
  onClick,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      className="w-full py-2.5 px-4 bg-white hover:bg-[#F3F7F4] text-[#172C32] border border-[#C8DDD7] hover:border-[#087F8C]/50 rounded-xl font-semibold text-xs flex items-center justify-center gap-2.5 min-h-[44px] shadow-2xs transition-all disabled:opacity-55"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#087F8C]" />
      ) : (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
          />
        </svg>
      )}
      <span>{loading ? 'Connecting Google Account...' : label}</span>
    </motion.button>
  );
};

export const OAuthOrDivider: React.FC<{ text?: string }> = ({ text = 'or continue with verification code' }) => (
  <div className="relative flex items-center py-1">
    <div className="flex-grow border-t border-[#D9E9E5]" />
    <span className="shrink-0 mx-3 text-[10px] font-mono uppercase tracking-wider text-[#556B70]">
      {text}
    </span>
    <div className="flex-grow border-t border-[#D9E9E5]" />
  </div>
);
