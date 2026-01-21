import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';

interface WindowProps {
  id: string;
  title: string;
  isOpen: boolean;
  isActive: boolean;
  onClose: () => void;
  onFocus: () => void;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({
  title,
  isOpen,
  isActive,
  onClose,
  onFocus,
  children
}) => {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 28
          }}
          className={`
            fixed 
            /* Mobile Layout: Full width, anchored between status bar and dock */
            top-[36px] left-0 right-0 bottom-[88px] 
            rounded-t-2xl rounded-b-none border-x-0 border-b-0
            
            /* Desktop Layout: Fixed Centered Stage */
            /* Using left-0 right-0 + mx-auto avoids conflict with Framer Motion transform */
            md:fixed md:top-12 md:bottom-28 md:left-0 md:right-0 md:mx-auto
            
            /* Width: Wider on desktop for better proportion */
            md:w-[900px] md:max-w-[95vw] 
            
            /* Reset mobile styles for desktop */
            md:rounded-2xl md:border md:shadow-2xl
            
            overflow-hidden border-t border-white/40 backdrop-blur-3xl bg-white/75 flex flex-col 
            ${isActive ? 'z-40' : 'z-10'}
          `}
          onClick={onFocus}
          style={isActive ? { boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.25)' } : {}}
        >
          {/* Title Bar */}
          <div className="h-12 md:h-11 bg-gradient-to-b from-white/60 to-white/40 border-b border-white/30 flex items-center px-4 justify-between shrink-0 select-none cursor-default backdrop-blur-md z-10">
            <div className="flex gap-2 group">
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="w-3.5 h-3.5 md:w-3 md:h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 flex items-center justify-center hover:brightness-90 active:brightness-75 transition-all shadow-sm"
              >
                <X size={8} className="text-black/50 opacity-0 group-hover:opacity-100" />
              </button>
              <button className="w-3.5 h-3.5 md:w-3 md:h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 flex items-center justify-center hover:brightness-90 active:brightness-75 transition-all shadow-sm">
                <Minus size={8} className="text-black/50 opacity-0 group-hover:opacity-100" />
              </button>
              <button className="w-3.5 h-3.5 md:w-3 md:h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 flex items-center justify-center hover:brightness-90 active:brightness-75 transition-all shadow-sm">
                <Maximize2 size={8} className="text-black/50 opacity-0 group-hover:opacity-100" />
              </button>
            </div>
            <div className="text-sm font-semibold text-gray-800/80 tracking-wide drop-shadow-sm truncate px-4">{title}</div>
            <div className="w-14" /> {/* Spacer for centering */}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar relative">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};