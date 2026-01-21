import React, { useState } from 'react';
import { UserProfile, LinkItem } from '../types';
import { User, AtSign, Image as ImageIcon, Lock, ArrowRight, LogOut, LayoutGrid, Save, Check, Loader2, AlertCircle } from 'lucide-react';
import { LinkManager } from './LinkManager';
import { saveSchoolData } from '../services/api';

interface SettingsProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  links: LinkItem[];
  setLinks: React.Dispatch<React.SetStateAction<LinkItem[]>>;
}

export const Settings: React.FC<SettingsProps> = ({ user, setUser, links, setLinks }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Hardcoded password check for UI login - security is handled by Google Account mostly, 
  // but you could also fetch the real password from the sheet if you wanted.
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple frontend gate
      setIsAuthenticated(true);
      setError(false);
      setPassword('');
    } else {
      setError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await saveSchoolData(links, user);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full pb-20">
        <div className="w-24 h-24 rounded-full bg-gray-200 mb-6 overflow-hidden border-4 border-white shadow-xl">
           <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover opacity-50 blur-sm" onError={(e) => (e.currentTarget.src = 'https://ui-avatars.com/api/?name=Admin')} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Administrator</h2>
        <p className="text-sm text-gray-500 mb-6">Masukkan password untuk mengatur sistem.</p>
        
        <form onSubmit={handleLogin} className="relative w-64">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Password"
            className={`w-full bg-white/50 backdrop-blur-md border ${error ? 'border-red-400 bg-red-50/50' : 'border-gray-300'} rounded-full pl-4 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner`}
            autoFocus
          />
          <button 
            type="submit" 
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-gray-400/50 hover:bg-blue-500 rounded-full text-white transition-colors"
          >
            <ArrowRight size={14} />
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-3 font-medium">Password salah. Coba lagi.</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Admin Header */}
      <div className="flex items-center justify-between p-4 bg-gray-100/50 border-b border-gray-200/50 shrink-0">
        <div className="flex items-center gap-2">
           <LayoutGrid className="w-5 h-5 text-blue-600" />
           <h2 className="font-bold text-gray-700">Admin Dashboard</h2>
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
        >
          <LogOut size={12} /> Logout
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
        
        {/* Section 1: Identity */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">Identitas Sekolah</h3>
          
          <div className="flex items-center gap-4 p-4 bg-white/50 rounded-xl border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
              <img src={user.avatarUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://ui-avatars.com/api/?name=School')} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  placeholder="Nama Sekolah"
                  className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  value={user.bio}
                  onChange={(e) => setUser({ ...user, bio: e.target.value })}
                  placeholder="Deskripsi / Slogan"
                  className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:border-blue-500 transition-all"
                />
              </div>
               <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  value={user.avatarUrl}
                  onChange={(e) => setUser({ ...user, avatarUrl: e.target.value })}
                  placeholder="URL Logo Sekolah"
                  className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-500 outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Link Management */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">Manajemen Menu Digital</h3>
          <p className="text-xs text-gray-500">Tambahkan, ubah urutan, atau hapus menu yang tampil di halaman utama.</p>
          {/* Reusing LinkManager with readOnly={false} (default) */}
          <LinkManager links={links} setLinks={setLinks} readOnly={false} />
        </section>

      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 shrink-0 flex justify-end gap-2">
        {saveStatus === 'error' && (
          <span className="text-xs text-red-500 flex items-center mr-2">Gagal menyimpan. Cek koneksi.</span>
        )}
        <button 
          onClick={handleSave}
          disabled={isSaving || saveStatus === 'success'}
          className={`
            flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-200
            ${saveStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : saveStatus === 'error' ? 'bg-red-500' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30'}
            disabled:opacity-70 disabled:cursor-not-allowed
          `}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <Check className="w-4 h-4" /> Tersimpan!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Simpan Perubahan
            </>
          )}
        </button>
      </div>
    </div>
  );
};