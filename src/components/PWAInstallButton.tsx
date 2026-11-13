/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Suppress automatically when running as an installed standalone mobile app
  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={handleAction}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#0F5132] border border-emerald-200 rounded-lg min-h-[36px] whitespace-nowrap shrink-0 transition-colors"
          title="Install LabConnect Mobile App"
        >
          {isInstallable ? (
            <Download className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="hidden xs:inline sm:inline">
            {isInstallable ? 'Install App' : 'Mobile App'}
          </span>
          <span className="sm:hidden xs:hidden">App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleAction}
          className="px-4 py-2.5 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap shrink-0 transition-colors active:scale-[0.98]"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{isInstallable ? 'Install Mobile App' : isIOS ? 'Add to iPhone Home Screen' : 'Install Android / Desktop App'}</span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 p-6 shadow-xl space-y-4 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0F5132] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  LC
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Install LabConnect App</h3>
                  <p className="text-xs text-slate-500">Standalone iOS & Android Home Screen Experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Close install instructions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
                <div className="font-semibold text-slate-900">iPhone / iPad (Safari) Steps:</div>
                <div className="flex items-center gap-2.5">
                  <Share className="w-4 h-4 text-[#0F5132] shrink-0" />
                  <span>1. Tap the <strong>Share</strong> icon in Safari’s bottom toolbar.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <PlusSquare className="w-4 h-4 text-[#0F5132] shrink-0" />
                  <span>2. Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
                <div className="font-semibold text-slate-900">Android Chrome / Mobile Browser Steps:</div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                  <span>1. Open this app directly in Chrome (not an embedded preview frame).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                  <span>2. Tap the browser menu (<strong>⋮</strong>) and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold min-h-[44px]"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
