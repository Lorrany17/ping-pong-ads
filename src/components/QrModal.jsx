import React from 'react';

export default function QrModal({ matchId, onClose }) {
  const confirmationUrl = `${window.location.origin}${window.location.pathname}?confirmMatch=${matchId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(confirmationUrl)}&bgcolor=1e293b&color=34d399`;
  
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 p-6 rounded-2xl max-w-sm w-full text-center border border-slate-700 shadow-2xl animate-in zoom-in-95 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-2">Validação</h2>
        <p className="text-slate-400 mb-4 text-sm">Peça para o convidado escanear no celular <strong className="text-white">DELE</strong>.</p>
        <div className="bg-slate-900 p-4 rounded-xl inline-block border-2 border-emerald-500/30 shadow-lg mx-auto">
          <img src={qrCodeUrl} alt="QR Code" className="rounded-lg" />
        </div>
        <button onClick={onClose} className="block w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">
          Fechar
        </button>
      </div>
    </div>
  );
}
