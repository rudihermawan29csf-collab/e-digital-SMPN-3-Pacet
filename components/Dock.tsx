import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { AppId } from '../types';

interface DockItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  mouseX: any;
}

const DockItem: React.FC<DockItemProps> = ({ icon, onClick, mouseX }) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Significantly reduced size for mobile optimization
  // Base size: 35px (was 48), Max zoom: 50px (was 70)
  // Adjusted for better touch targets on mobile: Base 40px
  const widthSync = useTransform(distance, [-100, 0, 100], [40, 55, 40]);
  
  // Stiffer spring for faster settling
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 200, damping: 15 });

  return (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      className="aspect-square rounded-xl bg-white/20 border border-white/30 backdrop-blur-xl shadow-lg flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors relative group"
      onClick={onClick}
      whileTap={{ scale: 0.95, transition: { duration: 0.05 } }}
    >
      <div className="w-full h-full flex items-center justify-center text-white/90 transform transition-transform duration-200">
        {icon}
      </div>
    </motion.div>
  );
};

interface DockProps {
  items: { id: AppId; icon: React.ReactNode; label: string }[];
  onAppClick: (id: AppId) => void;
}

export const Dock: React.FC<DockProps> = ({ items, onAppClick }) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="fixed bottom-4 md:bottom-2 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="pointer-events-auto flex items-end gap-3 px-4 py-3 bg-white/20 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl mb-2 md:mb-1"
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {items.map((item) => (
          <DockItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            onClick={() => onAppClick(item.id)}
            mouseX={mouseX}
          />
        ))}
      </motion.div>
    </div>
  );
};