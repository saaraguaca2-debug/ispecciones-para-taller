import React from 'react';
import { User } from 'firebase/auth';
import { SpreadsheetConfig, AppSettings } from '../types';
import { LogOut, Link2, ExternalLink, Wrench, FileSpreadsheet, User as UserIcon, Sliders } from 'lucide-react';
import { getThemeClasses } from '../lib/theme';

interface HeaderProps {
  user: User | null;
  sheetConfig: SpreadsheetConfig | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onDisconnectSheet: () => void;
  settings: AppSettings;
}

export default function Header({ 
  user, 
  sheetConfig, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  onDisconnectSheet,
  settings
}: HeaderProps) {
  const theme = getThemeClasses(settings.accentColor);

  return (
    <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Custom Logo / Brand Name */}
          <div className="flex items-center gap-2.5">
            <span className={`h-10 w-10 shrink-0 rounded-xl inline-flex items-center justify-center shadow-md font-bold text-xl ${theme.lightBg} ${theme.text}`}>
              {settings.logoType === 'emoji' ? (
                settings.logoEmoji || '🔧'
              ) : settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.workshopName} 
                  className="h-full w-full rounded-xl object-cover" 
                  onError={(e) => {
                    // Fallback to emoji if image URL errors
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                '🔧'
              )}
            </span>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none sm:text-base">
                {settings.workshopName || 'Talleres AutoDiag'}
              </h1>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 leading-none">
                {settings.workshopSlogan || 'Captación y Diagnósticos Gratuitos'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links (Only shown on md: screens and above) */}
          {sheetConfig && (
            <nav className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Panel de Control
              </button>
              <button
                onClick={() => setActiveTab('revisions')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'revisions' || activeTab === 'report'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Revisiones
              </button>
              <button
                onClick={() => setActiveTab('new_revision')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'new_revision'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Nueva Inspección
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Personalizar
              </button>
            </nav>
          )}

          {/* User profile & Google Sheets sync action indicators */}
          <div className="flex items-center gap-2.5">
            {/* Sheet Link */}
            {sheetConfig && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-semibold text-emerald-800">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span className="truncate max-w-[120px]">{sheetConfig.title}</span>
                <a
                  href={sheetConfig.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-0.5 hover:bg-emerald-100 rounded transition-colors text-emerald-600 inline-flex items-center ml-0.5"
                  title="Abrir Google Sheet"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Profile info */}
            {user && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Técnico'}
                    className="h-8 w-8 rounded-full border border-slate-350 shadow-inner shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="h-8 w-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center border border-slate-200 shrink-0">
                    <UserIcon className="h-4 w-4" />
                  </span>
                )}
                <div className="hidden sm:block text-left select-none">
                  <p className="text-xs font-extrabold text-slate-800 truncate max-w-[100px]">
                    {user.displayName || 'Técnico'}
                  </p>
                  <button
                    onClick={onLogout}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-extrabold block transition-colors cursor-pointer"
                  >
                    Salir
                  </button>
                </div>
              </div>
            )}

            {sheetConfig && (
              <button
                onClick={onDisconnectSheet}
                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer shrink-0"
                title="Desconectar Planilla"
              >
                <Link2 className="h-4 w-4 rotate-45" />
              </button>
            )}

            {user && !sheetConfig && (
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-xs font-bold shrink-0"
                title="Cerrar Sesión"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
