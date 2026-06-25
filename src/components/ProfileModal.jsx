import React, { useState, useRef } from 'react';
import { RefreshCw, Camera, Globe } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, getCollectionPath } from '../config/firebase';
import { resizeImage, getRandomAvatar } from '../utils';
import AvatarDisplay from './AvatarDisplay';

export default function ProfileModal({ user, userDoc, onClose }) {
  const [name, setName] = useState(userDoc?.displayName || '');
  const [avatar, setAvatar] = useState(userDoc?.avatar || '👤');
  const [loading, setLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('Imagem muito grande! Máximo 5MB.');
    try { 
      const resizedBase64 = await resizeImage(file); 
      setAvatar(resizedBase64); 
    } catch (error) { 
      alert('Erro ao processar imagem'); 
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, getCollectionPath('users'), user.uid), { displayName: name, avatar: avatar });
      await updateProfile(user, { displayName: name });
      onClose();
    } catch (error) { 
      alert('Erro ao salvar'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl animate-in zoom-in-95 relative z-10">
        <h2 className="text-xl font-bold text-white mb-4 text-center">Editar Perfil</h2>
        <div className="flex flex-col items-center mb-6 gap-4">
          <AvatarDisplay avatar={avatar} size="xl" className="border-4 border-slate-600 shadow-lg" />
          <div className="flex gap-2">
            <button 
              onClick={() => setAvatar(getRandomAvatar())} 
              className="bg-slate-700 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-slate-600"
            >
              <RefreshCw className="w-3 h-3" /> Emoji
            </button>
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-emerald-500"
            >
              <Camera className="w-3 h-3" /> Foto
            </button>
            <button 
              onClick={() => setShowUrlInput(!showUrlInput)} 
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-blue-500"
            >
              <Globe className="w-3 h-3" /> Link
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>
          {showUrlInput && (
            <input 
              type="text" 
              placeholder="Cole o link da imagem (https://...)" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              onChange={(e) => setAvatar(e.target.value)}
            />
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400">SEU NOME</label>
            <input 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mt-1 focus:border-emerald-500 outline-none" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button onClick={onClose} className="w-full text-slate-400 py-2 hover:text-white">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
