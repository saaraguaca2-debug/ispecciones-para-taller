import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './firebase';
import { fetchRevisions, saveRevision, deleteRevision } from './sheetsService';
import { Revision, SpreadsheetConfig, AppSettings } from './types';

// Components imports
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import RevisionForm from './components/RevisionForm';
import RevisionList from './components/RevisionList';
import RevisionReport from './components/RevisionReport';
import SheetConnector from './components/SheetConnector';
import SettingsPanel from './components/SettingsPanel';

import { getThemeClasses } from './lib/theme';
import { Loader, AlertTriangle, FileSpreadsheet, LogIn, Lock, Info, Landmark, LayoutDashboard, History, Plus, Sliders } from 'lucide-react';

export default function App() {
  // Google Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  // Google Sheet Configuration states
  const [sheetConfig, setSheetConfig] = useState<SpreadsheetConfig | null>(null);
  
  // Customizable settings states
  const [settings, setSettings] = useState<AppSettings>(() => {
    const cached = localStorage.getItem('autodiag_workspace_settings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.workshopName) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed parsing cached settings', e);
      }
    }
    return {
      workshopName: 'AutoDiag Cloud',
      workshopSlogan: 'Captación y Diagnósticos Gratuitos',
      logoType: 'emoji',
      logoEmoji: '🔧',
      logoUrl: '',
      accentColor: 'emerald',
      currency: '$',
      phone: '',
    };
  });

  // App data core states
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState<boolean>(false);
  const [errorSheet, setErrorSheet] = useState<string | null>(null);

  // Navigational states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editingRevision, setEditingRevision] = useState<Revision | null>(null);
  const [viewingRevision, setViewingRevision] = useState<Revision | null>(null);

  // Set page dynamically
  useEffect(() => {
    document.title = `${settings.workshopName} - Control de Diagnósticos`;
  }, [settings.workshopName]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('autodiag_workspace_settings', JSON.stringify(newSettings));
  };


  // 1. Check Session & Auth at load
  useEffect(() => {
    setLoadingAuth(true);
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setNeedsAuth(false);
        setLoadingAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
        setLoadingAuth(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Manage Sheet cache configuration and fetch DB entries
  useEffect(() => {
    // Try to retrieve existing worksheet from localCache
    const cached = localStorage.getItem('autodiag_sheet_config');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) {
          setSheetConfig(parsed);
        }
      } catch (e) {
        console.error('Failed parsing cached config', e);
      }
    }
  }, []);

  // 3. Load database contents upon getting active token AND spreadsheet Configuration
  useEffect(() => {
    if (token && sheetConfig?.id) {
      loadSpreadsheetData(sheetConfig.id, token);
    } else {
      setRevisions([]);
    }
  }, [token, sheetConfig]);

  const loadSpreadsheetData = async (spreadsheetId: string, currentToken: string) => {
    setLoadingRevisions(true);
    setErrorSheet(null);
    try {
      const data = await fetchRevisions(spreadsheetId, currentToken);
      setRevisions(data);
    } catch (err: any) {
      console.error(err);
      setErrorSheet('No se pudo establecer conexión con Google Sheets. Compruebe los permisos o si el archivo fue borrado.');
    } finally {
      setLoadingRevisions(false);
    }
  };

  // Google Login click mechanism
  const handleLogin = async () => {
    setErrorAuth(null);
    setLoadingAuth(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorAuth('No se pudo iniciar sesión con Google. ' + (err.message || ''));
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setSheetConfig(null);
    setRevisions([]);
    localStorage.removeItem('autodiag_sheet_config');
  };

  // Bind a Google Sheet database connection state
  const handleConnectSheet = (config: SpreadsheetConfig) => {
    setSheetConfig(config);
    localStorage.setItem('autodiag_sheet_config', JSON.stringify(config));
    setActiveTab('dashboard');
  };

  // Disconnect a Sheet model
  const handleDisconnectSheet = () => {
    const confirm = window.confirm('¿Desea desvincular la base de datos de Google Sheets del taller? Los datos no se borrarán en Drive, pero ya no se mostrarán aquí.');
    if (!confirm) return;

    setSheetConfig(null);
    setRevisions([]);
    localStorage.removeItem('autodiag_sheet_config');
  };

  // Append or Update DB entry on Google Spreadsheet
  const handleSaveRevision = async (updatedRevision: Revision) => {
    if (!sheetConfig || !token) return;

    try {
      const success = await saveRevision(sheetConfig.id, updatedRevision, token);
      if (success) {
        // Optimistic refresh update local list
        await loadSpreadsheetData(sheetConfig.id, token);
        
        // Reset navigation states
        setEditingRevision(null);
        setActiveTab('revisions');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Erase DB entry row
  const handleDeleteRevision = async (revisionId: string) => {
    if (!sheetConfig || !token) return;

    try {
      const success = await deleteRevision(sheetConfig.id, revisionId, token);
      if (success) {
        await loadSpreadsheetData(sheetConfig.id, token);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Route back to list or details tab helper
  const handleEditClick = (revision: Revision) => {
    setEditingRevision(revision);
    setActiveTab('new_revision');
  };

  const handleViewReportClick = (revision: Revision) => {
    setViewingRevision(revision);
    setActiveTab('report');
  };

  // View state director renderer
  const renderContent = () => {
    if (loadingRevisions) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <Loader className="animate-spin h-9 w-9 text-emerald-600" />
          <p className="font-semibold text-sm">Sincronizando con Google Sheets...</p>
        </div>
      );
    }

    if (errorSheet) {
      return (
        <div className="max-w-2xl mx-auto py-12 p-6 bg-rose-50 border border-rose-105 rounded-2xl text-rose-800 text-left">
          <AlertTriangle className="h-8 w-8 text-rose-500 mb-3" />
          <h4 className="text-lg font-extrabold mb-1">Error de Sincronización</h4>
          <p className="text-sm text-rose-700 leading-relaxed mb-4">{errorSheet}</p>
          <div className="flex gap-3">
            <button
              onClick={() => sheetConfig && token && loadSpreadsheetData(sheetConfig.id, token)}
              className="px-4 py-2 bg-rose-600 text-slate-50 text-xs font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
            >
              Reintentar Conexión
            </button>
            <button
              onClick={() => {
                setSheetConfig(null);
                localStorage.removeItem('autodiag_sheet_config');
              }}
              className="px-4 py-2 border border-rose-300 text-rose-900 text-xs font-bold rounded-lg hover:bg-rose-100 cursor-pointer"
            >
              Vincular otra Planilla
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            revisions={revisions} 
            settings={settings}
            onNavigate={(tab) => {
              setActiveTab(tab);
              if (tab === 'new_revision') {
                setEditingRevision(null);
              }
            }} 
          />
        );
      case 'revisions':
        return (
          <RevisionList
            revisions={revisions}
            settings={settings}
            onEdit={handleEditClick}
            onViewReport={handleViewReportClick}
            onDelete={handleDeleteRevision}
            onNavigateToNew={() => {
              setEditingRevision(null);
              setActiveTab('new_revision');
            }}
          />
        );
      case 'new_revision':
        return (
          <RevisionForm
            revisionToEdit={editingRevision}
            existingRevisions={revisions}
            settings={settings}
            onSave={handleSaveRevision}
            onCancel={() => {
              setEditingRevision(null);
              setActiveTab('revisions');
            }}
            currentUserDisplayName={user?.displayName || ''}
          />
        );
      case 'report':
        return viewingRevision ? (
          <RevisionReport
            revision={viewingRevision}
            settings={settings}
            onBack={() => {
              setViewingRevision(null);
              setActiveTab('revisions');
            }}
          />
        ) : (
          <div className="text-center py-20 text-slate-400">Seleccione un diagnóstico del panel primero para visualizar el reporte.</div>
        );
      case 'settings':
        return (
          <SettingsPanel
            settings={settings}
            onSave={handleSaveSettings}
          />
        );
      default:
        return <div>Ficha de visualización no encontrada</div>;
    }
  };

  // Auth Loader panel on launch
  if (loadingAuth) {
    return (
      <div id="loading-spinner" className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-3">
        <Loader className="animate-spin h-10 w-10 text-emerald-600" />
        <span className="text-sm font-semibold text-slate-500 font-mono text-center">Inicializando AutoDiag Cloud...</span>
      </div>
    );
  }

  // Login Onboarding Form Canvas
  if (needsAuth) {
    return (
      <div id="login-onboarding" className="min-h-screen bg-slate-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-md w-full mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden text-left">
          
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

          <div className="mb-6 flex justify-between items-center">
            <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
              <Landmark className="h-6 w-6 text-emerald-600" />
            </span>
            <span className="text-[10px] uppercase font-black text-slate-405 tracking-wider bg-slate-100 py-1 px-3 rounded-full">
              SaaS Automotriz
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
            Registro de Diagnósticos Automotrices
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Inicie sesión de manera segura con Google. El sistema utilizará Google Sheets de su propia cuenta de Drive para almacenar los datos del cliente, checklists mecánicos y presupuestos de captación.
          </p>

          {errorAuth && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorAuth}</span>
            </div>
          )}

          {/* Sign in with Google branded custom button */}
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-950 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 bg-white p-0.5 rounded-full shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            <span className="text-sm">Iniciar Sesión con Google</span>
          </button>

          <div className="mt-8 border-t border-slate-100 pt-5 text-[10px] text-slate-400 leading-relaxed font-semibold flex items-start gap-2">
            <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Garantizamos control de datos local: AutoDiag procesa peticiones en tiempo real de forma segura y privada conectando directamente con las APIs oficiales de Google Sheets.</span>
          </div>

        </div>
      </div>
    );
  }

  // Active Session Layout Manager
  const theme = getThemeClasses(settings.accentColor);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col relative">
      {/* Dynamic Navigation Header */}
      <Header
        user={user}
        sheetConfig={sheetConfig}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setEditingRevision(null);
          setViewingRevision(null);
        }}
        onLogout={handleLogout}
        onDisconnectSheet={handleDisconnectSheet}
        settings={settings}
      />

      {/* Main Module Layout Container - padded bottom on mobile for thumb navigation bar safety */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 ${sheetConfig ? 'pb-24 md:pb-8' : 'py-8'}`}>
        {sheetConfig ? (
          /* Render main app content when spreadsheet database is connected */
          renderContent()
        ) : (
          /* Onboarding Hub: Invite spreadsheet connection before starting operations */
          token && (
            <SheetConnector
              token={token}
              onConnect={handleConnectSheet}
              onDisconnect={handleLogout}
            />
          )
        )}
      </main>

      {/* Floating native-like Bottom Tab Bar for cellphones */}
      {sheetConfig && (
        <div className="md:hidden fixed bottom-5 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl rounded-3xl z-40 p-2.5 flex justify-around items-center max-w-md mx-auto print:hidden">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setEditingRevision(null);
              setViewingRevision(null);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all active:scale-95 cursor-pointer ${
              activeTab === 'dashboard'
                ? `${theme.text} ${theme.lightBg} font-black`
                : 'text-slate-450 font-bold'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[9px] uppercase tracking-wide">Inicio</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('revisions');
              setEditingRevision(null);
              setViewingRevision(null);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all active:scale-95 cursor-pointer ${
              activeTab === 'revisions' || activeTab === 'report'
                ? `${theme.text} ${theme.lightBg} font-black`
                : 'text-slate-450 font-bold'
            }`}
          >
            <History className="h-5 w-5" />
            <span className="text-[9px] uppercase tracking-wide">Historial</span>
          </button>

          {/* Central Floating Quick Action Circle Plus button */}
          <button
            onClick={() => {
              setEditingRevision(null);
              setActiveTab('new_revision');
            }}
            className={`h-11 w-11 rounded-full text-white flex items-center justify-center -mt-6 shadow-md transition-all active:scale-90 hover:scale-105 cursor-pointer ${theme.bg}`}
            title="Nueva Inspección"
          >
            <Plus className="h-5.5 w-5.5 stroke-[3]" />
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setEditingRevision(null);
              setViewingRevision(null);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all active:scale-95 cursor-pointer ${
              activeTab === 'settings'
                ? `${theme.text} ${theme.lightBg} font-black`
                : 'text-slate-450 font-bold'
            }`}
          >
            <Sliders className="h-5 w-5" />
            <span className="text-[9px] uppercase tracking-wide font-bold">Perfil</span>
          </button>
        </div>
      )}

      <footer className="bg-white border-t border-slate-205 py-6 mt-auto text-center text-[10px] text-slate-400 font-mono print:hidden uppercase tracking-wider">
        <p>© 2026 {settings.workshopName} • Conectado a Drive API</p>
      </footer>
    </div>
  );
}
