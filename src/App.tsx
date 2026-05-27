import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './firebase';
import { fetchRevisions, saveRevision, deleteRevision, fetchRevisionsAppsScript, saveRevisionAppsScript, deleteRevisionAppsScript } from './sheetsService';
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
import { Loader, AlertTriangle, FileSpreadsheet, LogIn, Lock, Info, Landmark, LayoutDashboard, History, Plus, Sliders, Wrench, ShieldCheck, Gauge, Sparkles, Database, ArrowLeft, Settings, MessageSquare, ChevronRight, Activity, Car, CheckCircle2, Copy, Check } from 'lucide-react';

export default function App() {
  // Google Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  // Dual Connection / Apps Script direct connection state
  const [appsScriptUrl, setAppsScriptUrl] = useState<string | null>(() => {
    return localStorage.getItem('autodiag_appsscript_url');
  });
  const [loginTab, setLoginTab] = useState<'google' | 'appsscript'>('google');
  const [inputAppsScriptUrl, setInputAppsScriptUrl] = useState<string>('');
  const [showInstruction, setShowInstruction] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [onboardingView, setOnboardingView] = useState<'welcome' | 'setup'>('welcome');

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
    
    // Quick check if configured via direct Apps Script Macro
    const storedUrl = localStorage.getItem('autodiag_appsscript_url');
    if (storedUrl) {
      setAppsScriptUrl(storedUrl);
      setSheetConfig({
        id: 'apps_script',
        title: 'Macro Apps Script',
        url: storedUrl
      });
      setNeedsAuth(false);
      setLoadingAuth(false);
      return;
    }

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
    // Skip if configured with Apps Script
    if (localStorage.getItem('autodiag_appsscript_url')) return;

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
    if (appsScriptUrl) {
      loadSpreadsheetData('apps_script', '');
    } else if (token && sheetConfig?.id) {
      loadSpreadsheetData(sheetConfig.id, token);
    } else {
      setRevisions([]);
    }
  }, [token, sheetConfig, appsScriptUrl]);

  const loadSpreadsheetData = async (spreadsheetId: string, currentToken: string) => {
    setLoadingRevisions(true);
    setErrorSheet(null);
    try {
      let data;
      if (appsScriptUrl) {
        data = await fetchRevisionsAppsScript(appsScriptUrl);
      } else {
        data = await fetchRevisions(spreadsheetId, currentToken);
      }
      setRevisions(data);
    } catch (err: any) {
      console.error(err);
      setErrorSheet('No se pudo establecer conexión con Google Sheets. Compruebe los permisos o la dirección Apps Script.');
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
    setAppsScriptUrl(null);
    setNeedsAuth(true);
    setSheetConfig(null);
    setRevisions([]);
    localStorage.removeItem('autodiag_sheet_config');
    localStorage.removeItem('autodiag_appsscript_url');
  };

  // Bind a Google Sheet database connection state
  const handleConnectSheet = (config: SpreadsheetConfig) => {
    setSheetConfig(config);
    localStorage.setItem('autodiag_sheet_config', JSON.stringify(config));
    setActiveTab('dashboard');
  };

  // Connect Google Apps Script directly
  const handleConnectAppsScript = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = inputAppsScriptUrl.trim();
    if (!cleanUrl || !cleanUrl.startsWith('https://script.google.com/')) {
      setErrorAuth('Por favor ingresa una URL válida de aplicación web de Google Apps Script (Debe iniciar con https://script.google.com/)');
      return;
    }
    setErrorAuth(null);
    localStorage.setItem('autodiag_appsscript_url', cleanUrl);
    setAppsScriptUrl(cleanUrl);
    setSheetConfig({
      id: 'apps_script',
      title: 'Macro Apps Script',
      url: cleanUrl
    });
    setNeedsAuth(false);
  };

  // Disconnect a Sheet model
  const handleDisconnectSheet = () => {
    const confirm = window.confirm('¿Desea desvincular la base de datos de Google Sheets del taller? Los datos no se borrarán en Drive, pero ya no se mostrarán aquí.');
    if (!confirm) return;

    setSheetConfig(null);
    setRevisions([]);
    setAppsScriptUrl(null);
    localStorage.removeItem('autodiag_sheet_config');
    localStorage.removeItem('autodiag_appsscript_url');
  };

  // Append or Update DB entry on Google Spreadsheet
  const handleSaveRevision = async (updatedRevision: Revision) => {
    if (appsScriptUrl) {
      try {
        setLoadingRevisions(true);
        const success = await saveRevisionAppsScript(appsScriptUrl, updatedRevision);
        if (success) {
          await loadSpreadsheetData('apps_script', '');
          setEditingRevision(null);
          setActiveTab('revisions');
        } else {
          throw new Error('La Macro de Apps Script reportó un fallo al guardar.');
        }
      } catch (error) {
        console.error(error);
        alert('Ocurrió un error al guardar usando la Macro de Apps Script. Verifica que esté correctamente implementada (Deploy) y con acceso a "Cualquiera" (Anyone).');
      } finally {
        setLoadingRevisions(false);
      }
      return;
    }

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
    if (appsScriptUrl) {
      try {
        setLoadingRevisions(true);
        const success = await deleteRevisionAppsScript(appsScriptUrl, revisionId);
        if (success) {
          await loadSpreadsheetData('apps_script', '');
        } else {
          alert('La Macro de Apps Script reportó un fallo al eliminar.');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingRevisions(false);
      }
      return;
    }

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
    const masterAppsScriptCode = `function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Revisiones");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  var headers = data[0];
  var revisions = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    
    var checklist = [];
    try {
      if (row[11]) {
        checklist = JSON.parse(row[11]);
      }
    } catch(err) {
      checklist = [];
    }
    
    revisions.push({
      id: String(row[0]),
      fecha: String(row[1] || ''),
      clienteNombre: String(row[2] || ''),
      clienteTelefono: String(row[3] || ''),
      clienteEmail: String(row[4] || ''),
      vehiculoPlaca: String(row[5] || ''),
      vehiculoMarca: String(row[6] || ''),
      vehiculoModelo: String(row[7] || ''),
      vehiculoAnio: String(row[8] || ''),
      vehiculoKilometraje: String(row[9] || ''),
      motivo: String(row[10] || ''),
      checklist: checklist,
      diagnosticoGeneral: String(row[12] || ''),
      presupuestoEstimado: Number(row[13]) || 0,
      detallesPresupuesto: String(row[14] || ''),
      tecnico: String(row[15] || ''),
      estado: String(row[16] || 'pendiente'),
      notasInternas: String(row[17] || '')
    });
  }
  return ContentService.createTextOutput(JSON.stringify(revisions))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

function doPost(e) {
  var responseRaw = { success: false, error: "Invalid action" };
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var revision = postData.revision;
    var revisionId = postData.revisionId;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Revisiones");
    if (!sheet) {
      sheet = ss.insertSheet("Revisiones");
      var headers = [
        "ID", "Fecha", "Nombre Cliente", "Teléfono", "Email", 
        "Placa", "Marca", "Modelo", "Año", "Kilometraje", 
        "Motivo Revisión", "Checklist (JSON)", "Diagnóstico General", 
        "Presupuesto Estimado ($)", "Detalles Presupuesto", "Técnico", 
        "Estado", "Notas Internas"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    if (action === "save") {
      var rowData = [
        revision.id,
        revision.fecha,
        revision.clienteNombre,
        revision.clienteTelefono,
        revision.clienteEmail,
        revision.vehiculoPlaca,
        revision.vehiculoMarca,
        revision.vehiculoModelo,
        revision.vehiculoAnio,
        revision.vehiculoKilometraje,
        revision.motivo,
        JSON.stringify(revision.checklist),
        revision.diagnosticoGeneral,
        revision.presupuestoEstimado,
        revision.detallesPresupuesto,
        revision.tecnico,
        revision.estado,
        revision.notasInternas
      ];
      
      var existingIndex = -1;
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === revision.id) {
          existingIndex = i;
          break;
        }
      }
      
      if (existingIndex !== -1) {
        sheet.getRange(existingIndex + 1, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      responseRaw = { success: true };
    } else if (action === "delete") {
      var existingIndex = -1;
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === revisionId) {
          existingIndex = i;
          break;
        }
      }
      if (existingIndex !== -1) {
        sheet.deleteRow(existingIndex + 1);
        responseRaw = { success: true };
      } else {
        responseRaw = { success: false, error: "Revision not found" };
      }
    }
  } catch (err) {
    responseRaw = { success: false, error: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(responseRaw))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}`;

    const handleCopyCode = () => {
      navigator.clipboard.writeText(masterAppsScriptCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    };

    if (onboardingView === 'welcome') {
      return (
        <div id="login-onboarding-welcome" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-4xl w-full mx-auto bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500"></div>

            {/* Left side: Workshop branding + Graphic Showcase */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-slate-800 border border-slate-755 text-emerald-400 rounded-2xl shadow-inner-lg">
                  <Wrench className="h-7 w-7 animate-pulse text-emerald-450" />
                </span>
                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-900/50">
                    AutoDiag OS v2.1
                  </span>
                  <p className="text-slate-500 text-[11px] font-mono mt-0.5">Diagnósticos Profesionales</p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
                  Gestión integral para tu <span className="text-emerald-400">Taller Mecánico</span>
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md font-medium">
                  Optimiza la recepción de vehículos, marca listas de inspección críticas y genera reportes presupuestados listos para compartir con tus clientes.
                </p>
              </div>

              {/* Mini Diagnostic Scanner simulation */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-3 relative overflow-hidden shadow-xl">
                <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span className="text-[9px] text-amber-500 uppercase font-black tracking-wider">OBD-II ESCÁNER</span>
                </div>
                
                <p className="text-emerald-400 font-bold border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400 animate-bounce" />
                  <span>PLANILLA DE RECEPCIÓN</span>
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded border border-slate-850">
                    <span className="text-emerald-500 font-extrabold">✔</span>
                    <span className="text-slate-400 font-medium">Frenos y Suspensión</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded border border-slate-850">
                    <span className="text-emerald-500 font-extrabold">✔</span>
                    <span className="text-slate-400 font-medium">Niveles de Fluidos</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded border border-slate-850">
                    <span className="text-amber-500 font-extrabold">⚠</span>
                    <span className="text-slate-400 font-medium">Inyección/Electrónica</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded border border-slate-850">
                    <span className="text-emerald-500 font-extrabold">✔</span>
                    <span className="text-slate-400 font-medium">Neumáticos & Presión</span>
                  </div>
                </div>
                
                <div className="text-[9px] text-slate-500 flex justify-between items-center bg-slate-950/70 p-2 rounded border border-slate-850 font-bold">
                  <span>CENTRO DE CONTROL LOCAL</span>
                  <span className="text-emerald-500 font-black">DATOS DESCENTRALIZADOS</span>
                </div>
              </div>
            </div>

            {/* Right side: Interactive Features & CTA button */}
            <div className="flex-1 w-full bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-2xl flex flex-col justify-between self-stretch space-y-6">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>BENEFICIOS CLAVE</span>
              </h3>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="p-2 bg-emerald-950/50 text-emerald-400 rounded-lg h-9 w-9 shrink-0 flex items-center justify-center border border-emerald-900/30">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Flujo Vehicular Rápido</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">Captura datos del cliente, millaje, placa y avería de forma organizada directamente desde tu celular.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-2 bg-indigo-950/50 text-indigo-400 rounded-lg h-9 w-9 shrink-0 flex items-center justify-center border border-indigo-900/30">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Reportes Profesionales</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">Genera listas de verificación, presupuestos estimados y comparte el reporte web con tus clientes.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-2 bg-purple-950/50 text-purple-400 rounded-lg h-9 w-9 shrink-0 flex items-center justify-center border border-purple-900/30">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Sincronización Transparente</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">Guarda todo en una planilla Google Sheets integrada directamente con Google Apps Script sin límites.</p>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-800/80 space-y-3">
                <button
                  type="button"
                  onClick={() => setOnboardingView('setup')}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-4 rounded-xl text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex justify-center items-center gap-2"
                >
                  <Settings className="h-4.5 w-4.5 animate-spin-slow text-slate-950" />
                  <span>Configurar Conexión de Datos</span>
                </button>
                <p className="text-[9px] text-slate-500 text-center font-bold uppercase tracking-wider">
                  No requiere tarjetas de crédito ni suscripción • 100% independiente
                </p>
              </div>

            </div>

          </div>
        </div>
      );
    }

    return (
      <div id="login-onboarding" className="min-h-screen bg-slate-50/50 flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="max-w-xl w-full mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden text-left">
          
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

          <div className="mb-6 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setOnboardingView('welcome')}
              className="px-3 py-1.5 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5 font-bold" />
              <span>Volver</span>
            </button>
            <span className="text-[10px] uppercase font-black text-emerald-600 tracking-wider bg-emerald-50 py-1 px-3 rounded-full border border-emerald-100">
              SaaS Automotriz Directo
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2 flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-600 shrink-0" />
            <span>Configuración de Google Sheets</span>
          </h2>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            Conecta la planilla de Google de tu taller. Los datos se transmitirán directamente desde la aplicación a tu Google Drive de forma privada y sin intermediarios.
          </p>

          {errorAuth && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-855 text-xs flex gap-2 font-semibold">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorAuth}</span>
            </div>
          )}

          <div className="space-y-5">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Pega la URL del ejecutor de <strong>Google Apps Script Web App</strong> para vincular tu planilla de control en segundos.
            </p>

            <form onSubmit={handleConnectAppsScript} className="space-y-3">
              <input
                type="text"
                placeholder="Pegue la URL ejecutora de Apps Script (debe iniciar con https://script.google.com/.../exec)"
                value={inputAppsScriptUrl}
                onChange={(e) => setInputAppsScriptUrl(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-semibold"
              />
              
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer flex justify-center items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Establecer Conexión de Datos</span>
              </button>
            </form>

            {/* Collapsible Steps */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowInstruction(!showInstruction)}
                className="w-full text-left font-bold text-slate-800 text-xs px-4 py-3 bg-slate-100 hover:bg-slate-200/60 flex justify-between items-center transition-colors border-b border-rose-100/10"
              >
                <span>📋 Ver Instrucciones de Configuración (3 minutos)</span>
                <span className="text-[10px] text-emerald-600 font-extrabold">{showInstruction ? '▲ Ocultar' : '▼ Mostrar'}</span>
              </button>

              {showInstruction && (
                <div className="p-4 space-y-4 max-h-[355px] overflow-y-auto text-xs text-slate-600 leading-relaxed border-t border-slate-200">
                  <div>
                    <span className="font-extrabold text-slate-850 block mb-1">Paso 1: Crear Planilla Google Sheet</span>
                    <p>Ve a tu Google Drive, crea una Hoja de Cálculo en blanco y cámbiale el nombre de la primera pestaña (abajo a la izquierda) por: <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">Revisiones</code>.</p>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-850 block mb-1">Paso 2: Abrir el Editor de Código</span>
                    <p>En el menú superior de tu Planilla de Google, haz click en <strong>Extensiones</strong> &gt; <strong>Apps Script</strong>.</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-slate-850">Paso 3: Pegar nuestro Código Maestro</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors cursor-pointer"
                      >
                        {copiedCode ? '✅ ¡Copiado!' : '📋 Copiar Código'}
                      </button>
                    </div>
                    <p className="mb-2">Haz click en el botón de arriba para copiar el código maestro de Apps Script. Luego, borra todo el contenido en el editor de Apps Script, pega esto y guárdalo (archivo <code className="font-mono">Código.gs</code>):</p>
                    
                    <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[9px] font-mono h-24 overflow-y-auto w-full select-all border border-slate-800">
                      {masterAppsScriptCode}
                    </pre>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-850 block mb-1">Paso 4: Publicar e Implementar</span>
                    <p>Haz click arriba a la derecha en <strong>Implementar (Deploy)</strong> &gt; <strong>Nueva implementación</strong>. Selecciona tipo <strong>"Aplicación Web"</strong> (en el engranaje de configuración si no sale).</p>
                    <p className="mt-1">Configura estrictamente lo siguiente:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li><strong>Ejecutar como:</strong> Yo (tuemail@gmail.com)</li>
                      <li><strong>Quién tiene acceso:</strong> Cualquier persona (Anyone)</li>
                    </ul>
                    <p className="mt-2 text-rose-600 font-bold">¡Ojo! En la primera publicación de Apps Script, Google te pedirá "Autorizar acceso". Dale en "Configuraciones Avanzadas" e ir a "Proyecto sin título" (Seguro) para finalizar.</p>
                    <p className="mt-2 text-slate-800 font-semibold">Copia la "URL de la aplicación web" (debe terminar en <code className="font-mono text-emerald-700">/exec</code>) y pégala arriba.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-5 text-[10px] text-slate-400 leading-relaxed font-semibold flex items-start gap-2 animate-pulse">
            <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Datos descentralizados: AutoDiag procesa peticiones en tiempo real de forma segura y directa, asegurando privacidad total.</span>
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
