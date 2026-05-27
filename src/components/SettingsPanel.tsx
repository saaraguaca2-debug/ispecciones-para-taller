import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, Sparkles, Building2, Phone, Coins, Image, Check, ShoppingBag, Eye, HelpCircle } from 'lucide-react';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export default function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const colors = [
    { name: 'Emeralda', value: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-600', hover: 'hover:bg-emerald-700' },
    { name: 'Azul', value: 'blue', bg: 'bg-indigo-600', text: 'text-indigo-600', hover: 'hover:bg-indigo-700' },
    { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-600', text: 'text-indigo-600', hover: 'hover:bg-indigo-700' },
    { name: 'Naranja', value: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', hover: 'hover:bg-orange-600' },
    { name: 'Rojo', value: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', hover: 'hover:bg-rose-600' },
    { name: 'Ámbar', value: 'amber', bg: 'bg-amber-500', text: 'text-amber-500', hover: 'hover:bg-amber-600' },
    { name: 'Celeste', value: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-500', hover: 'hover:bg-cyan-600' },
  ];

  const presetEmojis = ['🔧', '🚗', '⚡', '⚙️', '🏎️', '🛠️', '🚛', '🏍️', '📅', '📊', '🧼', '🚦', '🏠', '🧰', '🔋', '👨‍🔧'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getThemeBg = (col: string) => {
    switch (col) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-700';
      case 'blue': return 'bg-blue-650 hover:bg-blue-700';
      case 'indigo': return 'bg-indigo-600 hover:bg-indigo-700';
      case 'orange': return 'bg-orange-500 hover:bg-orange-600';
      case 'rose': return 'bg-rose-600 hover:bg-rose-700';
      case 'amber': return 'bg-amber-500 hover:bg-amber-600';
      case 'cyan': return 'bg-cyan-600 hover:bg-cyan-700';
      default: return 'bg-emerald-600 hover:bg-emerald-700';
    }
  };

  const getThemeText = (col: string) => {
    switch (col) {
      case 'emerald': return 'text-emerald-600 bg-emerald-50';
      case 'blue': return 'text-blue-600 bg-blue-50';
      case 'indigo': return 'text-indigo-600 bg-indigo-50';
      case 'orange': return 'text-orange-600 bg-orange-50';
      case 'rose': return 'text-rose-600 bg-rose-50';
      case 'amber': return 'text-amber-600 bg-amber-50';
      case 'cyan': return 'text-cyan-600 bg-cyan-50';
      default: return 'text-emerald-600 bg-emerald-50';
    }
  };

  return (
    <div className="max-w-md mx-auto relative px-1 pb-16">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" /> Personalizar Taller
          </h2>
          <p className="text-xs text-slate-500 font-medium">Modifica la marca que verás tú y tus clientes</p>
        </div>
      </div>

      {saveSuccess && (
        <div id="save-success-banner" className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
          <span>¡Personalización guardada con éxito! Se aplicó al taller.</span>
        </div>
      )}

      {/* Live Preview Card */}
      <div className="border border-slate-200 bg-white shadow-md rounded-3xl p-4 mb-6">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2.5 block flex items-center gap-1">
          <Eye className="h-3 w-3" /> Vista previa en celular
        </span>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <span className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center shadow-sm text-xl font-bold ${getThemeText(formData.accentColor)}`}>
            {formData.logoType === 'emoji' ? (
              formData.logoEmoji || '🔧'
            ) : formData.logoUrl ? (
              <img 
                src={formData.logoUrl} 
                alt="Logo Taller" 
                className="h-full w-full rounded-xl object-cover" 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              '🔧'
            )}
          </span>
          <div className="overflow-hidden">
            <h4 className="font-extrabold text-slate-900 leading-tight text-sm truncate">
              {formData.workshopName || 'Mi Taller'}
            </h4>
            <p className="text-[10px] text-slate-500 truncate leading-none mt-1">
              {formData.workshopSlogan || 'Captación y Diagnósticos Gratuitos'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name & Slogan */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Identidad del Taller
          </h3>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre del Taller / Negocio</label>
            <input
              type="text"
              required
              value={formData.workshopName}
              onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
              className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none p-3 rounded-2xl transition-all"
              placeholder="Ej. Talleres Rojas, AutoDiag Express"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Slogan o Subtítulo del Cabezal</label>
            <input
              type="text"
              value={formData.workshopSlogan}
              onChange={(e) => setFormData({ ...formData, workshopSlogan: e.target.value })}
              className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none p-3 rounded-2xl transition-all"
              placeholder="Ej. Especialistas en frenos y suspensión"
            />
          </div>
        </div>

        {/* LOGO SELECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
            <Image className="h-3.5 w-3.5" /> Logotipo o Perfil
          </h3>

          {/* Toggle Choice */}
          <div className="flex p-0.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, logoType: 'emoji' })}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                formData.logoType === 'emoji' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Emoticono / Icono
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, logoType: 'url' })}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                formData.logoType === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Imagen Web / Enlace
            </button>
          </div>

          {formData.logoType === 'emoji' ? (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Selecciona un icono rápido:</label>
              <div className="grid grid-cols-6 gap-2">
                {presetEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, logoEmoji: emoji })}
                    className={`h-10 text-xl flex items-center justify-center rounded-xl transition-all active:scale-90 border ${
                      formData.logoEmoji === emoji
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">URL del Logotipo / Imagen de Perfil</label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full text-xs font-mono text-slate-650 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none p-3 rounded-2xl transition-all"
                placeholder="https://images.unsplash.com/... o enlace del taller"
              />
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Pega el enlace directo de tu imagen (ej. Unsplash, Imgur o el logo de tu Facebook/Web). Dejar vacío restaurará el icono por defecto.
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Color Theme & Business Defaults */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5" /> Preferencias y Temas
          </h3>

          {/* Accent Colors */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Color de Énfasis del Sistema</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {colors.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, accentColor: col.value as AppSettings['accentColor'] })}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border border-transparent transition-all ${
                    formData.accentColor === col.value 
                      ? 'border-slate-800 bg-slate-50 shadow-sm' 
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full inline-block shrink-0 ${
                    col.value === 'emerald' ? 'bg-emerald-600' :
                    col.value === 'blue' ? 'bg-blue-600' :
                    col.value === 'indigo' ? 'bg-indigo-600' :
                    col.value === 'orange' ? 'bg-orange-500' :
                    col.value === 'rose' ? 'bg-rose-600' :
                    col.value === 'amber' ? 'bg-amber-500' :
                    'bg-cyan-500'
                  }`} />
                  <span className="text-[9px] font-bold text-slate-600">{col.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Símbolo Moneda</label>
              <input
                type="text"
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full text-sm font-extrabold text-slate-800 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center focus:bg-white"
                placeholder="$, S/, Q, L, ARS, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-0.5">
                WhatsApp Taller <HelpCircle className="h-3 w-3 text-slate-400" title="Para envío de PDF/Ficha" />
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:bg-white"
                placeholder="+54911223344"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          className={`w-full text-slate-50 px-5 py-3.5 rounded-2xl font-extrabold shadow-md transform transition-all active:scale-95 cursor-pointer text-sm flex items-center justify-center gap-2 ${getThemeBg(formData.accentColor)}`}
        >
          <Save className="h-5 w-5" />
          <span>Guardar Cambios</span>
        </button>
      </form>
    </div>
  );
}
