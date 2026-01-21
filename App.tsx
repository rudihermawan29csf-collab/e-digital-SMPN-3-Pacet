import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Link as LinkIcon, Info, Loader2, WifiOff } from 'lucide-react';
import { Dock } from './components/Dock';
import { Window } from './components/Window';
import { LinkManager } from './components/LinkManager';
import { Settings } from './components/Settings';
import { LinkItem, UserProfile, AppId } from './types';
import { fetchSchoolData } from './services/api';

// Default Data (Fallback if offline)
const INITIAL_LINKS: LinkItem[] = [
  { id: '1', title: 'Website Sekolah', url: 'https://smpn3pacet.sch.id', emoji: '🏫', color: 'bg-blue-600' },
  { id: '2', title: 'E-Learning', url: 'https://elearning.smpn3pacet.sch.id', emoji: '💻', color: 'bg-indigo-500' },
  { id: '3', title: 'Perpustakaan', url: '#', emoji: '📚', color: 'bg-orange-500' },
];

const INITIAL_USER: UserProfile = {
  name: 'SMPN 3 Pacet',
  bio: 'Sistem Informasi & Data Terpadu Digital',
  avatarUrl: 'https://ui-avatars.com/api/?name=SMPN+3&background=0D8ABC&color=fff&size=256&rounded=true&bold=true',
};

export default function App() {
  const [links, setLinks] = useState<LinkItem[]>(INITIAL_LINKS);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [activeApp, setActiveApp] = useState<AppId | null>('links');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  // Date time for status bar
  const [date, setDate] = useState(new Date());

  // Fetch Data on Mount
  useEffect(() => {
    const loadData = async () => {
      // Don't set loading to true immediately if we have local data, to prevent flicker
      const savedLinks = localStorage.getItem('local_links');
      const savedUser = localStorage.getItem('local_user');
      
      if (savedLinks) {
        setLinks(JSON.parse(savedLinks));
        setIsLoading(false); // We have data, so not technically "loading" visual
      }
      if (savedUser) setUser(JSON.parse(savedUser));

      try {
        const data = await fetchSchoolData();
        if (data) {
          if (data.links && Array.isArray(data.links)) {
            setLinks(data.links);
            localStorage.setItem('local_links', JSON.stringify(data.links));
          }
          if (data.profile) {
            setUser(prev => {
              const newUser = { ...prev, ...data.profile };
              localStorage.setItem('local_user', JSON.stringify(newUser));
              return newUser;
            });
          }
          setIsError(false);
        } else {
          // Fetch failed but handled gracefully
          if (!savedLinks) setIsError(true);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
        if (!savedLinks) setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAppClick = (id: AppId) => {
    if (activeApp === id) {
      setActiveApp(null); // Minimize
    } else {
      setActiveApp(id);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-50 text-gray-900 selection:bg-blue-500 selection:text-white">
      {/* Background Image - Bright Colorful macOS Style */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2560&auto=format&fit=crop" 
          alt="MacBook Wallpaper" 
          className="w-full h-full object-cover select-none pointer-events-none scale-105"
        />
      </div>

      {/* Mac Status Bar - Light Mode */}
      <div className="absolute top-0 left-0 right-0 h-9 md:h-8 bg-white/20 backdrop-blur-xl flex items-center justify-between px-3 md:px-4 z-50 text-gray-900 text-xs font-medium select-none shadow-sm border-b border-white/10">
        <div className="flex items-center gap-3 md:gap-4">
          <span className="font-bold text-sm hover:text-gray-700 cursor-default"></span>
          <span className="font-bold cursor-default">e-digital</span>
          <span className="hidden sm:inline cursor-default opacity-80">{user.name}</span>
        </div>
        <div className="flex items-center gap-3 md:gap-4 cursor-default">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isError ? 'bg-red-500' : 'bg-green-500'} shadow-[0_0_8px_rgba(34,197,94,0.4)]`}></span>
            <span className="hidden sm:inline opacity-80">{isLoading ? 'Syncing...' : isError ? 'Offline' : 'Online'}</span>
          </div>
          <span className="hidden sm:inline opacity-90">{date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <span className="opacity-90">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        </div>
      </div>

      {/* Main Apps Windows */}
      
      {/* Public Links App (View Only) */}
      <Window
        id="links"
        title="Menu Utama"
        isOpen={activeApp === 'links'}
        isActive={activeApp === 'links'}
        onClose={() => setActiveApp(null)}
        onFocus={() => setActiveApp('links')}
      >
        <div className="h-full flex flex-col">
           {isLoading && !links.length && !localStorage.getItem('local_links') ? (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2">
               <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
               <p className="text-sm">Menghubungkan ke Database...</p>
             </div>
           ) : (
             <>
               {/* Profile Header inside App */}
               <div className="flex flex-col items-center mb-6 mt-2">
                  <div className="w-24 h-24 md:w-24 md:h-24 rounded-full p-1.5 bg-white/40 backdrop-blur-md mb-3 shadow-xl border border-white/60">
                     <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover shadow-inner bg-white" alt="Avatar" onError={(e) => (e.currentTarget.src = 'https://ui-avatars.com/api/?name=School&background=random')} />
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800 drop-shadow-sm text-center px-4 leading-tight">{user.name}</h1>
                  <p className="text-gray-700 font-medium text-center bg-white/40 px-4 py-1.5 rounded-full mt-2 text-xs backdrop-blur-md shadow-sm border border-white/30 max-w-[90%] mx-auto">{user.bio}</p>
               </div>
               
               <div className="flex-1">
                  <LinkManager links={links} readOnly={true} />
               </div>
             </>
           )}
        </div>
      </Window>

      {/* Settings / Admin App */}
      <Window
        id="settings"
        title="Pengaturan Sistem"
        isOpen={activeApp === 'settings'}
        isActive={activeApp === 'settings'}
        onClose={() => setActiveApp(null)}
        onFocus={() => setActiveApp('settings')}
      >
         <div className="h-full">
            <Settings user={user} setUser={setUser} links={links} setLinks={setLinks} />
         </div>
      </Window>

      {/* About App */}
      <Window
        id="about"
        title="Tentang Aplikasi"
        isOpen={activeApp === 'about'}
        isActive={activeApp === 'about'}
        onClose={() => setActiveApp(null)}
        onFocus={() => setActiveApp('about')}
      >
         <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-2xl shadow-lg flex items-center justify-center text-white text-4xl">
              🏫
            </div>
            <h2 className="text-2xl font-bold">e-digital</h2>
            <p className="text-gray-500">Versi Cloud 1.0 (Google Sheets)</p>
            <p className="text-sm text-gray-600 max-w-xs">
              Aplikasi Portal Digital SMPN 3 Pacet.
              Data tersimpan aman di Google Cloud.
            </p>
            <div className="mt-8 text-center text-xs text-gray-600 opacity-60">
              &copy; {new Date().getFullYear()} SMPN 3 Pacet. All rights reserved.
            </div>
         </div>
      </Window>


      {/* Dock */}
      <Dock 
        items={[
          { id: 'links', label: 'Menu Utama', icon: <div className="w-full h-full bg-gradient-to-b from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl shadow-inner text-white">🏠</div> },
          { id: 'settings', label: 'Admin', icon: <div className="w-full h-full bg-gradient-to-b from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-inner"><SettingsIcon className="w-5 h-5 text-white" /></div> },
          { id: 'about', label: 'Tentang', icon: <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner border-2 border-gray-100"><Info className="w-5 h-5 text-gray-400" /></div> },
        ]}
        onAppClick={handleAppClick}
      />
    </div>
  );
}