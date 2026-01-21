import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ExternalLink, Wand2, Loader2, Search, Clock, MapPin, ChevronRight, MoonStar, Pencil, Save, X, GripVertical, Smile } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { LinkItem, COLORS } from '../types';
import { suggestEmoji } from '../services/geminiService';

interface LinkManagerProps {
  links: LinkItem[];
  setLinks?: React.Dispatch<React.SetStateAction<LinkItem[]>>;
  readOnly?: boolean;
}

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

const COMMON_EMOJIS = [
  { category: "Umum", items: ["🔗", "🌐", "⭐", "🔥", "💡", "📌", "✅", "❌", "❓", "🔔", "🏠", "🔎"] },
  { category: "Siswa & Ekskul", items: ["👦", "👧", "🎒", "🧢", "🏃", "⚽", "🏀", "🏊", "🎨", "🎭", "🏕️", "🥁"] },
  { category: "Kelas & Mapel", items: ["🏫", "📖", "📚", "📏", "📐", "🔬", "🧪", "🧬", "🌍", "🕌", "🇬🇧", "🔢"] },
  { category: "Guru & Staff", items: ["👨‍🏫", "👩‍🏫", "👔", "👓", "💼", "📢", "🖊️", "📝", "☕", "🗓️", "🤝", "🥇"] },
  { category: "Dokumen & Data", items: ["📄", "📑", "📋", "📊", "📂", "📜", "📥", "🗳️", "📅", "📈", "🗂️", "🖨️"] },
  { category: "Teknologi", items: ["💻", "🖥️", "📱", "🖱️", "⌨️", "☁️", "📶", "🔋", "💾", "📷", "📹", "🎧"] },
  { category: "Fasilitas", items: ["🚌", "🚑", "🏥", "🍽️", "🥤", "🚽", "🌳", "🏢", "🚪", "🔑", "🔧", "🚮"] },
  { category: "Sosmed", items: ["📸", "🎥", "🐦", "💬", "📞", "▶️", "🎵", "🛒", "📧", "🗺️", "🔴", "🔵"] },
];

export const LinkManager: React.FC<LinkManagerProps> = ({ links, setLinks, readOnly = false }) => {
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🔗'); // State for emoji
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Toggle picker
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const pickerRef = useRef<HTMLDivElement>(null);

  // Time and Prayer State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [hijriDateStr, setHijriDateStr] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; countdown: string } | null>(null);

  // Update Clock & Countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (prayerTimes) calculateNextPrayer(now, prayerTimes);
    }, 1000);
    return () => clearInterval(timer);
  }, [prayerTimes]);

  // Click outside listener for emoji picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Prayer Times (Pacet Coordinates: -7.67, 112.53)
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const date = new Date();
        const method = '20'; // Kemenag Indonesia standard
        const resp = await fetch(
          `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=-7.67&longitude=112.53&method=20`
        );
        const data = await resp.json();
        setPrayerTimes(data.data.timings);
        
        // Handle Hijri Date from API for better accuracy
        const h = data.data.date.hijri;
        const monthNames = [
           '', 'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 
           'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Syaban', 
           'Ramadhan', 'Syawal', 'Dzulqaidah', 'Dzulhijjah'
        ];
        const hMonth = monthNames[parseInt(h.month.number)] || h.month.en;
        setHijriDateStr(`${h.day} ${hMonth} ${h.year} H`);

      } catch (error) {
        console.error("Failed to fetch prayer times", error);
      }
    };
    fetchPrayerTimes();
  }, []);

  const calculateNextPrayer = (now: Date, timings: PrayerTimes) => {
    const prayers = [
      { name: 'Subuh', time: timings.Fajr },
      { name: 'Dzuhur', time: timings.Dhuhr },
      { name: 'Asar', time: timings.Asr },
      { name: 'Maghrib', time: timings.Maghrib },
      { name: 'Isya', time: timings.Isha },
    ];

    let next = null;
    let minDiff = Infinity;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    for (const p of prayers) {
      const [h, m] = p.time.split(':').map(Number);
      const prayerMinutes = h * 60 + m;
      const prayerSeconds = h * 3600 + m * 60;

      if (prayerMinutes > nowMinutes) {
        next = p;
        const diffSeconds = prayerSeconds - nowSeconds;
        
        const hours = Math.floor(diffSeconds / 3600);
        const mins = Math.floor((diffSeconds % 3600) / 60);
        const secs = diffSeconds % 60;
        
        const countdownStr = `-${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        setNextPrayer({
          name: p.name,
          time: p.time,
          countdown: countdownStr
        });
        return;
      }
    }

    if (!next) {
      setNextPrayer({ name: 'Subuh', time: timings.Fajr, countdown: 'Besok' });
    }
  };

  // Helper: Get Javanese Pasaran
  const getPasaran = (d: Date) => {
    // Reference: 1 Jan 2023 was Minggu Pahing
    const date = new Date(d);
    date.setHours(0,0,0,0);
    const ref = new Date('2023-01-01T00:00:00');
    const diffTime = date.getTime() - ref.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const pasarans = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
    
    // 1 Jan 2023 was Pahing (index 1 in our array if 0 is Legi)
    let index = (1 + diffDays) % 5;
    if (index < 0) index += 5;
    
    return pasarans[index];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !setLinks) return;
    if (!newLinkTitle || !newLinkUrl) return;

    if (editingId) {
      // Update existing link
      setLinks((prev) => prev.map(l => 
        l.id === editingId 
          ? { 
              ...l, 
              title: newLinkTitle, 
              url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
              emoji: selectedEmoji 
            }
          : l
      ));
      cancelEditing();
    } else {
      // Add new link - Use selectedEmoji directly
      const newLink: LinkItem = {
        id: Date.now().toString(),
        title: newLinkTitle,
        url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
        emoji: selectedEmoji,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };

      setLinks((prev) => [newLink, ...prev]);
      setNewLinkTitle('');
      setNewLinkUrl('');
      setSelectedEmoji('🔗'); // Reset
    }
  };

  const startEditing = (link: LinkItem) => {
    setEditingId(link.id);
    setNewLinkTitle(link.title);
    setNewLinkUrl(link.url);
    setSelectedEmoji(link.emoji);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setSelectedEmoji('🔗');
    setShowEmojiPicker(false);
  };

  const handleMagicIcon = async () => {
    if (!newLinkTitle) return;
    setIsGenerating(true);
    const emoji = await suggestEmoji(newLinkTitle);
    setSelectedEmoji(emoji); // Update state directly
    setIsGenerating(false);
  };

  const deleteLink = (id: string) => {
    if (readOnly || !setLinks) return;
    setLinks((prev) => prev.filter((l) => l.id !== id));
    if (editingId === id) cancelEditing();
  };

  const filteredLinks = links.filter(link => 
    link.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    link.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSearching = searchQuery.length > 0;
  // Enable drag only if: Not readOnly (Admin), Not searching, and we have links
  const isDraggable = !readOnly && !isSearching && setLinks;

  const renderLinkItem = (link: LinkItem) => (
    <div 
      className={`group relative flex items-center gap-3 p-3 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${editingId === link.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white/70 hover:bg-white/95 border-white/50'}`}
      onClick={() => {
         if (!editingId) window.open(link.url, '_blank');
      }}
    >
      {!readOnly && (
        <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 mr-1" onPointerDown={(e) => e.preventDefault()}>
          <GripVertical size={18} />
        </div>
      )}
      
      <div className={`w-11 h-11 md:w-10 md:h-10 ${link.color} rounded-lg flex items-center justify-center text-xl md:text-lg shadow-sm text-white shrink-0`}>
        {link.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-800 truncate text-sm md:text-base">{link.title}</h4>
        <p className="text-[10px] md:text-xs text-gray-500 truncate opacity-80">{link.url.replace(/^https?:\/\//, '')}</p>
      </div>
      
      {!readOnly && (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
           <button 
            onClick={() => startEditing(link)}
            className="opacity-100 p-2 md:p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all h-fit self-center"
            title="Edit"
          >
            <Pencil className="w-4 h-4 md:w-3.5 md:h-3.5" />
          </button>
          <button 
            onClick={() => deleteLink(link.id)}
            className="opacity-100 p-2 md:p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all h-fit self-center"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
          </button>
        </div>
      )}
      
      {readOnly && (
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-4 pb-4">
      
      {/* 1. Header Section: Clock & Date */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center text-center"
      >
        <h2 className="text-4xl md:text-3xl font-bold text-gray-800 tracking-tight flex items-baseline gap-2">
          {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          <span className="text-base md:text-sm font-normal text-gray-400 animate-pulse">: {currentTime.getSeconds().toString().padStart(2, '0')}</span>
        </h2>
        
        <p className="text-sm text-gray-700 font-semibold mt-1">
          {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="flex items-center gap-2 mt-2 text-xs text-blue-600/80 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
           <MoonStar size={10} />
           <span>{hijriDateStr || 'Memuat...'}</span>
           <span className="w-1 h-1 bg-blue-300 rounded-full mx-1"></span>
           <span className="font-medium">{getPasaran(currentTime)}</span>
        </div>
      </motion.div>

      {/* 2. Prayer Times Widget */}
      {prayerTimes && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 md:p-4 text-white shadow-lg relative overflow-hidden group mx-0 md:mx-0"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-1 text-blue-100 text-xs font-medium mb-1">
                <Clock size={12} />
                <span>Menuju {nextPrayer?.name || '...'}</span>
              </div>
              <h3 className="text-2xl md:text-2xl font-bold tabular-nums tracking-tight">
                {nextPrayer?.countdown || '--:--:--'}
              </h3>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-blue-100 text-xs justify-end">
                <MapPin size={10} /> Pacet
              </div>
              <p className="font-semibold text-lg">{nextPrayer?.time || '--:--'}</p>
            </div>
          </div>

          {/* Responsive Grid for Prayer Times */}
          <div className="grid grid-cols-5 gap-1 md:gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((pKey) => {
              const pNameMap:Record<string, string> = { 'Fajr': 'Subuh', 'Dhuhr': 'Dzuhur', 'Asr': 'Asar', 'Maghrib': 'Maghrib', 'Isha': 'Isya' };
              const time = prayerTimes[pKey];
              const isActive = nextPrayer?.time === time;
              return (
                <div key={pKey} className={`flex flex-col items-center justify-center text-center ${isActive ? 'text-yellow-300 font-bold scale-110 transition-transform' : 'text-blue-100/80'}`}>
                  <span className="text-[10px] uppercase opacity-70 mb-0.5">{pNameMap[pKey]}</span>
                  <span className="text-xs md:text-xs font-medium">{time}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* 3. Search Bar */}
      <div className="relative group shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Cari menu..." 
          className="w-full bg-gray-100/80 hover:bg-white border border-transparent hover:border-blue-500/30 focus:bg-white focus:border-blue-500/50 rounded-xl pl-9 pr-4 py-3 md:py-2.5 text-sm outline-none transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 4. Links List */}
      <div className="flex-1 min-h-0">
        {!readOnly && (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit} 
            className={`relative p-3 rounded-xl border shadow-sm flex flex-col gap-2 mb-3 transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white/40 border-white/40'}`}
          >
            {/* Emoji Picker Popover */}
             <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    ref={pickerRef}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute top-14 left-0 z-50 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-xl p-3 w-full md:w-80 max-h-64 overflow-y-auto custom-scrollbar"
                  >
                    <div className="space-y-4">
                      {COMMON_EMOJIS.map((category) => (
                        <div key={category.category}>
                          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200/50 pb-1">{category.category}</h5>
                          <div className="grid grid-cols-6 gap-2">
                            {category.items.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => { setSelectedEmoji(emoji); setShowEmojiPicker(false); }}
                                className="w-9 h-9 flex items-center justify-center text-xl hover:bg-blue-100 rounded-lg transition-colors hover:scale-110 active:scale-95"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>

            <div className="flex gap-2">
              {/* Emoji Trigger Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-10 h-10 md:h-[38px] shrink-0 bg-white/80 border border-gray-200 rounded-lg flex items-center justify-center text-xl hover:bg-white hover:border-blue-400 transition-all shadow-sm"
                title="Pilih Ikon"
              >
                {selectedEmoji}
              </button>

              <input
                type="text"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder="Nama Link"
                className="flex-1 bg-white/80 border border-gray-200 rounded-lg px-2 py-2 md:py-1.5 text-sm md:text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                type="button"
                onClick={handleMagicIcon}
                disabled={!newLinkTitle || isGenerating}
                className="p-2 md:p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                title="Otomatis pilih ikon (AI)"
              >
                {isGenerating ? <Loader2 className="animate-spin w-4 h-4 md:w-3 md:h-3" /> : <Wand2 className="w-4 h-4 md:w-3 md:h-3" />}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="URL (contoh: google.com)"
                className="flex-1 bg-white/80 border border-gray-200 rounded-lg px-2 py-2 md:py-1.5 text-sm md:text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-1">
                {editingId ? (
                  <>
                    <button 
                      type="button"
                      onClick={cancelEditing}
                      className="bg-gray-200 text-gray-600 px-3 md:px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4 md:w-3 md:h-3" />
                    </button>
                    <button 
                      type="submit"
                      disabled={!newLinkTitle || !newLinkUrl || isGenerating}
                      className="bg-green-600 text-white px-3 md:px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Save className="w-4 h-4 md:w-3 md:h-3" />
                    </button>
                  </>
                ) : (
                  <button 
                    type="submit"
                    disabled={!newLinkTitle || !newLinkUrl || isGenerating}
                    className="bg-blue-600 text-white px-3 md:px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 md:w-3 md:h-3" />
                  </button>
                )}
              </div>
            </div>
          </motion.form>
        )}

        <div className="pb-12">
           {/* If Draggable (Admin + Not Searching), use Reorder.Group. Else use normal Grid */}
           {isDraggable ? (
             <Reorder.Group axis="y" values={links} onReorder={setLinks!} className="space-y-3">
                {filteredLinks.map((link) => (
                   <Reorder.Item key={link.id} value={link} whileDrag={{ scale: 1.02 }} className="touch-none">
                      {renderLinkItem(link)}
                   </Reorder.Item>
                ))}
             </Reorder.Group>
           ) : (
             <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredLinks.length === 0 ? (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="col-span-full flex flex-col items-center justify-center py-6 text-gray-400"
                    >
                      <p className="text-sm">Tidak ditemukan</p>
                    </motion.div>
                  ) : (
                    filteredLinks.map((link) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={link.id} 
                      >
                         {renderLinkItem(link)}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
};