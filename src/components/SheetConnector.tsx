import React, { useState, useEffect } from 'react';
import { listUserSpreadsheets, createSpreadsheet, initializeSheetHeaders } from '../sheetsService';
import { SpreadsheetConfig } from '../types';
import { FileSpreadsheet, Plus, ArrowRight, Loader, Search, AlertCircle, HelpCircle } from 'lucide-react';

interface SheetConnectorProps {
  token: string;
  onConnect: (config: SpreadsheetConfig) => void;
  onDisconnect: () => void;
}

export default function SheetConnector({ token, onConnect, onDisconnect }: SheetConnectorProps) {
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [customId, setCustomId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Search spreadsheets in user's Google Drive
  const loadDriveSpreadsheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listUserSpreadsheets(token);
      setSpreadsheets(list);
    } catch (err) {
      console.error(err);
      setError('No se pudieron listar las planillas desde Google Drive. Asegúrese de otorgar permisos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriveSpreadsheets();
  }, [token]);

  // Handle creation of a new sheet
  const handleCreateNew = async () => {
    setCreating(true);
    setError(null);
    try {
      const now = new Date();
      const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      const newSheet = await createSpreadsheet(token, `(${dateStr})`);
      onConnect(newSheet);
    } catch (err: any) {
      console.error(err);
      setError('Error al crear la planilla de Google Sheets. Intente nuevamente.');
    } finally {
      setCreating(false);
    }
  };

  // Convert typical sheet share URL into spreadsheet ID
  const extractSpreadsheetId = (input: string): string => {
    const cleaned = input.trim();
    if (cleaned.includes('/d/')) {
      const parts = cleaned.split('/d/');
      if (parts[1]) {
        return parts[1].split('/')[0];
      }
    }
    return cleaned;
  };

  // Handle connection with custom ID/URL
  const handleConnectCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractSpreadsheetId(customId);
    if (!id) {
      setError('Por favor ingrese una URL o ID de planilla válida');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Test the sheet access
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo acceder a la planilla. Verifique que el ID o URL sea correcto y tenga accesos.');
      }

      const data = await response.json();
      
      // Try to initialize headers just in case it is empty
      await initializeSheetHeaders(id, token);

      onConnect({
        id: id,
        title: data.properties?.title || 'Planilla Conectada',
        url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${id}`
      });
    } catch (err: any) {
      console.error(err);
      setError('Error al conectar con la planilla especificada. Verifique los permisos o si el archivo existe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="sheet-connector" className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-full mb-4">
          <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Conecta la Base de Datos
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-500 mx-auto">
          Para registrar los diagnósticos e inspecciones gratuitas, necesitamos conectar una planilla de Google Sheets como base de datos persistente.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Error: </span>
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Opt 1: Create a automatic spreadsheet */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              Recomendado
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Crear nueva planilla automáticamente</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Crearemos una base de datos optimizada en su Google Drive con todas las columnas, pestañas y estructuras necesarias para registrar vehículos, clientes y presupuestos.
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            disabled={creating || loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {creating ? (
              <>
                <Loader className="animate-spin h-5 w-5" />
                <span>Creando planilla en Drive...</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Crear Base de Datos Nueva</span>
              </>
            )}
          </button>
        </div>

        {/* Opt 2: Enter manual URL */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              Avanzado
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Conectar planilla existente</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Si ya configuró un Google Sheet o desea vincular uno existente, ingrese el enlace o el identificador del documento aquí.
            </p>
          </div>
          <form onSubmit={handleConnectCustom} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Pegue la URL o ID de Google Sheet"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                disabled={creating || loading}
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
              />
              <button
                type="submit"
                disabled={creating || loading || !customId}
                className="absolute right-1.5 top-1.5 p-1 text-slate-400 hover:text-emerald-600 rounded-md disabled:opacity-50"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Discovered spread sheets section */}
      {!loading && spreadsheets.length > 0 && (
        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-slate-500" />
            <span>Planillas detectadas en su cuenta de Google</span>
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Hemos encontrado estas planillas en su Google Drive. Seleccione una para usarla como base de datos para los registros del taller.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-72 overflow-y-auto pr-2">
            {spreadsheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => onConnect(sheet)}
                className="flex items-start gap-3 p-4 border border-slate-200 hover:border-emerald-300 rounded-xl text-left bg-slate-50 hover:bg-emerald-50/30 transition-all cursor-pointer group"
              >
                <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-slate-800 text-sm truncate group-hover:text-emerald-700 transition-colors">
                    {sheet.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-1">ID: {sheet.id.slice(0, 12)}...</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-12 text-center py-6 text-slate-500 flex items-center justify-center gap-2">
          <Loader className="animate-spin h-5 w-5 text-emerald-600" />
          <span>Buscando planillas de Google Sheets de su cuenta...</span>
        </div>
      )}

      {/* Help section */}
      <div className="mt-10 text-center">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span>{showHelp ? 'Ocultar ayuda de permisos' : '¿Por qué necesitamos estos accesos?'}</span>
        </button>

        {showHelp && (
          <div className="mt-4 bg-slate-50 border border-slate-100 p-6 rounded-xl text-left max-w-2xl mx-auto">
            <h4 className="text-sm font-bold text-slate-800 mb-2">Privacidad y Almacenamiento</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Esta aplicación es de tipo cliente-servidor con integración directa de APIs de Google. El acceso otorgado se vincula directamente entre su navegador y Google, sin pasar por bases de datos de terceros.
            </p>
            <h4 className="text-sm font-bold text-slate-800 mb-2">Permisos Requeridos</h4>
            <ul className="list-disc pl-5 text-xs text-slate-500 space-y-2 leading-relaxed">
              <li>
                <strong>Ver y administrar sus hojas de cálculo de Google (Sheets):</strong> Permite recuperar registros del historial y añadir nuevas filas correspondientes a las revisiones de clientes.
              </li>
              <li>
                <strong>Drive.file (Ver y administrar archivos creados por la aplicación):</strong> Permite crear automáticamente una planilla nueva dentro de su unidad si decide no configurar una manualmente.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
