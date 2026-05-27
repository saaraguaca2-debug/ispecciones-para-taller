import { useState } from 'react';
import { Revision, RevisionEstado, AppSettings } from '../types';
import { Search, Edit, Eye, Trash2, Filter, AlertTriangle, FileSpreadsheet, Plus, HelpCircle, Phone, Sparkles } from 'lucide-react';
import { getThemeClasses } from '../lib/theme';

interface RevisionListProps {
  revisions: Revision[];
  onEdit: (revision: Revision) => void;
  onViewReport: (revision: Revision) => void;
  onDelete: (revisionId: string) => Promise<void>;
  onNavigateToNew: () => void;
  settings?: AppSettings;
}

export default function RevisionList({ 
  revisions, 
  onEdit, 
  onViewReport, 
  onDelete,
  onNavigateToNew,
  settings
}: RevisionListProps) {
  const currencySymbol = settings?.currency || '$';
  const theme = getThemeClasses(settings?.accentColor || 'emerald');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Status mapping colors & labels helper
  const statusConfigMap: Record<RevisionEstado, { label: string; bg: string; text: string; border: string }> = {
    pendiente: { label: 'Pendiente', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
    en_proceso: { label: 'En Taller', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    presupuesto_enviado: { label: 'Cotizado', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    cliente_captado: { label: 'Captado ✓', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    no_interesado: { label: 'Sin interés', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' }
  };

  // Safe deletion confirm dialog trigger
  const triggerDeleteConfirm = (id: string) => {
    setDeletingId(id);
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await onDelete(deletingId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  // Searching filter logic
  const filteredRevisions = revisions.filter(rev => {
    const text = (`${rev.clienteNombre} ${rev.vehiculoPlaca} ${rev.vehiculoMarca} ${rev.vehiculoModelo} ${rev.tecnico} ${rev.id}`)
      .toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rev.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="revisions-list-view" className="space-y-6 animate-fade-in">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Revisiones y Diagnósticos Registrados</h2>
          <p className="text-sm text-slate-500 mt-1">
            Administre, filtre y edite el estado mecánico de cada unidad registrada en la base de datos de Google Sheets.
          </p>
        </div>

        <button
          onClick={onNavigateToNew}
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all focus:ring-2 focus:ring-emerald-500 shrink-0 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Registrar Diagnóstico</span>
        </button>
      </div>

      {/* Confirmation Deletion Modal (Surgical and compliant with Workspace mutators rules) */}
      {deletingId && (
        <div id="delete-confirmation-dialog" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-up text-left">
            <div className="flex items-center gap-3 text-rose-600 mb-4 bg-rose-50 p-3 rounded-xl border border-rose-100">
              <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0" />
              <div>
                <h4 className="text-sm font-extrabold text-rose-900">¿Confirmar eliminación en Google Sheets?</h4>
                <p className="text-[10px] text-rose-700 font-mono">Registro ID: {deletingId}</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Esta acción eliminará de forma permanente la fila correspondiente a este diagnóstico mecánico en su planilla conectada. Los cambios son irreversibles en Drive.
            </p>

            <div className="flex items-center justify-end gap-3.5">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-5 py-2 text-sm font-extrabold bg-rose-600 hover:bg-rose-700 disabled:bg-rose-405 text-white rounded-xl shadow transition-transform active:scale-95 cursor-pointer"
              >
                {isDeleting ? 'Borrando fila...' : 'Sí, confirmar eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Tools Panel (Search & Status Filters) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Search bar input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, patente, marca, ID o técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-medium"
          />
        </div>

        {/* State filters tabs picker */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0 border-t md:border-t-0 border-slate-100 pt-3.5 md:pt-0">
          <span className="text-xs font-bold text-slate-400 hidden lg:inline mr-1 uppercase tracking-wider flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filtrar</span>
          </span>
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl max-w-full text-xs shrink-0">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pendiente', label: 'Pendientes' },
              { id: 'en_proceso', label: 'En taller' },
              { id: 'presupuesto_enviado', label: 'Cotizados' },
              { id: 'cliente_captado', label: 'Captados ✓' },
              { id: 'no_interesado', label: 'Rechazados' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg select-none font-semibold transition-all shrink-0 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results grid / table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Table view on desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Vehículo Patente</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Presupuesto Estimado</th>
                <th className="px-6 py-4">Técnico</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700 font-medium">
              {filteredRevisions.length > 0 ? (
                filteredRevisions.map((rev) => {
                  const stateConfig = statusConfigMap[rev.estado] || { label: rev.estado, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
                  const formattedBudget = (rev.presupuestoEstimado || 0).toLocaleString('es-CL');
                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* ID */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          {rev.id}
                        </span>
                      </td>

                      {/* Vehicle */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-850 text-sm">
                            {rev.vehiculoMarca || 'Desconocido'} {rev.vehiculoModelo || ''}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 uppercase">
                            {rev.vehiculoPlaca} {rev.vehiculoAnio ? `(${rev.vehiculoAnio})` : ''}
                          </p>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-slate-800 text-sm">{rev.clienteNombre}</p>
                          <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 inline text-slate-300" />
                            <span>{rev.clienteTelefono || 'Sin teléfono'}</span>
                          </p>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4 justify-center">
                        {rev.presupuestoEstimado > 0 ? (
                          <span className="font-extrabold text-slate-900 text-sm">
                            {currencySymbol}{formattedBudget}
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                            Solo Revisión (Gratis)
                          </span>
                        )}
                      </td>

                      {/* Tech */}
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {rev.tecnico || 'Sin asignar'}
                      </td>

                      {/* State */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${stateConfig.bg} ${stateConfig.text} ${stateConfig.border}`}>
                          {stateConfig.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* File Preview report */}
                          <button
                            onClick={() => onViewReport(rev)}
                            className="p-1 px-2.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all border border-slate-100 hover:border-slate-300 hover:text-slate-950 cursor-pointer"
                            title="Ver Reporte e Imprimir"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-550" />
                            <span>Reporte</span>
                          </button>
                          
                          {/* Edit form */}
                          <button
                            onClick={() => onEdit(rev)}
                            className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg hover:text-blue-800 transition-colors cursor-pointer"
                            title="Editar Datos"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {/* Delete Row database */}
                          <button
                            onClick={() => triggerDeleteConfirm(rev.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg hover:text-rose-700 transition-colors cursor-pointer"
                            title="Borrar Registro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-slate-400 text-sm">
                    No se encontraron registros que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View with styled cards structure */}
        <div className="md:hidden divide-y divide-slate-150 p-4 space-y-4">
          {filteredRevisions.length > 0 ? (
            filteredRevisions.map((rev) => {
              const stateConfig = statusConfigMap[rev.estado] || { label: rev.estado, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
              const formattedBudget = (rev.presupuestoEstimado || 0).toLocaleString('es-CL');
              return (
                <div key={rev.id} className="pt-4 first:pt-0 pb-4 last:pb-0 text-left">
                  <div className="flex justify-between items-start mb-2.5 gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-black tracking-wider text-slate-550 bg-slate-100 px-1.5 py-0.5 rounded mr-1.5">
                        {rev.id}
                      </span>
                      <strong className="text-sm text-slate-900">{rev.vehiculoMarca} {rev.vehiculoModelo}</strong>
                      <span className="text-xs text-slate-400 font-mono block mt-0.5 uppercase">{rev.vehiculoPlaca}</span>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold border shrink-0 ${stateConfig.bg} ${stateConfig.text} ${stateConfig.border}`}>
                      {stateConfig.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cliente</span>
                      <span className="font-semibold text-slate-800">{rev.clienteNombre}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cotización</span>
                      {rev.presupuestoEstimado > 0 ? (
                        <strong className="text-slate-900 font-extrabold">{currencySymbol}{formattedBudget}</strong>
                      ) : (
                        <strong className="text-emerald-700 font-extrabold">Gratis (Inspección)</strong>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => onViewReport(rev)}
                      className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Ver Reporte</span>
                    </button>
                    <button
                      onClick={() => onEdit(rev)}
                      className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-blue-600 rounded-lg cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => triggerDeleteConfirm(rev.id)}
                      className="px-3.5 py-2 border border-rose-100 bg-rose-50/20 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-slate-400 text-sm">
              No se encontraron registros.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
