import React from 'react';
import { Revision, RevisionEstado, AppSettings } from '../types';
import { Target, Users, TrendingUp, DollarSign, Calendar, Car, ArrowUpRight, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { getThemeClasses } from '../lib/theme';

interface DashboardProps {
  revisions: Revision[];
  onNavigate: (tab: string) => void;
  settings?: AppSettings;
}

export default function Dashboard({ revisions, onNavigate, settings }: DashboardProps) {
  const currencySymbol = settings?.currency || '$';
  const theme = getThemeClasses(settings?.accentColor || 'emerald');

  // Metric Calculators
  const totalInspecciones = revisions.length;
  
  const totalPresupuestosEstimados = revisions.reduce((sum, rev) => sum + (rev.presupuestoEstimado || 0), 0);
  
  const aceptadosList = revisions.filter(rev => rev.estado === 'cliente_captado');
  const totalPresupuestosAceptados = aceptadosList.reduce((sum, rev) => sum + (rev.presupuestoEstimado || 0), 0);
  
  const pendientesCount = revisions.filter(rev => rev.estado === 'pendiente').length;
  const enProcesoCount = revisions.filter(rev => rev.estado === 'en_proceso').length;
  const enviadosCount = revisions.filter(rev => rev.estado === 'presupuesto_enviado').length;
  const rechazadosCount = revisions.filter(rev => rev.estado === 'no_interesado').length;
  const captadosCount = aceptadosList.length;

  const efectividadCaptacion = totalInspecciones > 0 
    ? Math.round((captadosCount / totalInspecciones) * 100) 
    : 0;

  // Car Brands distribution calculator
  const marcasMap: Record<string, number> = {};
  revisions.forEach(rev => {
    const brand = (rev.vehiculoMarca || 'Otros').trim().toUpperCase();
    if (brand) {
      marcasMap[brand] = (marcasMap[brand] || 0) + 1;
    }
  });
  const marcasOrdenadas = Object.entries(marcasMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Technicians scoreboard
  const tecnicosMap: Record<string, { total: number; captados: number }> = {};
  revisions.forEach(rev => {
    const techName = (rev.tecnico || 'No asignado').trim();
    if (!tecnicosMap[techName]) {
      tecnicosMap[techName] = { total: 0, captados: 0 };
    }
    tecnicosMap[techName].total += 1;
    if (rev.estado === 'cliente_captado') {
      tecnicosMap[techName].captados += 1;
    }
  });
  const tecnicosOrdenados = Object.entries(tecnicosMap)
    .sort((a, b) => b[1].captados - a[1].captados)
    .slice(0, 5);

  // Get recent list (last 3 items)
  const recientes = [...revisions]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 4);

  // Status mapping descriptors
  const estadoLabelMap: Record<RevisionEstado, { label: string; color: string; desc: string }> = {
    pendiente: { label: 'Pendiente', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', desc: 'Vehículo registrado o inspeccionado. Presupuesto sin enviar.' },
    en_proceso: { label: 'En Proceso', color: 'bg-amber-50 text-amber-700 border-amber-200', desc: 'Vehículo en taller pasando diagnóstico técnico.' },
    presupuesto_enviado: { label: 'Presupuesto Enviado', color: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'Resultados y cotización de reparación enviados al cliente.' },
    cliente_captado: { label: 'Cliente Captado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: '¡ÉXITO! El cliente aceptó el presupuesto y autorizó el trabajo.' },
    no_interesado: { label: 'No Interesado', color: 'bg-rose-50 text-rose-700 border-rose-200', desc: 'Cliente declinó o no respondió al presupuesto de reparación.' }
  };

  return (
    <div id="dashboard-view" className="space-y-8 animate-fade-in">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-905 tracking-tight">Panel de Control General</h2>
          <p className="text-slate-500 text-sm mt-1">Estrategia de captación basada en diagnósticos, revisiones y presupuestos gratuitos.</p>
        </div>
        <button
          onClick={() => onNavigate('new_revision')}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
        >
          <span>Nueva Revisión Gratis</span>
          <PlusCircleIcon className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:border-slate-300 transition-colors">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Inspecciones Totales</span>
            <span className="text-3xl font-black text-slate-900 block mt-1">{totalInspecciones}</span>
            <span className="text-xs text-slate-500 block mt-1.5 font-medium">Historial acumulado de autos</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:border-slate-300 transition-colors">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Efectividad Captación</span>
            <span className="text-3xl font-black text-emerald-600 block mt-1">{efectividadCaptacion}%</span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                {captadosCount} de {totalInspecciones}
              </span>
              <span className="text-[10px] text-slate-400">clientes ganados</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:border-slate-300 transition-colors">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Presupuestos Captados</span>
            <span className="text-3xl font-black text-slate-900 block mt-1">
              {currencySymbol}{totalPresupuestosAceptados.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-500 block mt-1.5 font-medium">Facturación de trabajos aceptados</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:border-slate-300 transition-colors">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Cotizaciones Emitidas</span>
            <span className="text-3xl font-black text-slate-900 block mt-1">
              {currencySymbol}{totalPresupuestosEstimados.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-500 block mt-1.5 font-medium">Total ofrecido sin cerrar aún</span>
          </div>
        </div>
      </div>

      {/* Main Stats breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Status Pipeline & conversion funnel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-500" />
            <span>Embudo de Captación (Estatus de Clientes)</span>
          </h3>

          <div className="space-y-4">
            {/* Emerald - Cliente Captado (Exito) */}
            <div>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <span>Cliente Captado (Trabajo Aceptado)</span>
                </span>
                <span className="font-mono text-emerald-600 font-bold">{captadosCount} ({totalInspecciones > 0 ? Math.round((captadosCount/totalInspecciones)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalInspecciones > 0 ? (captadosCount/totalInspecciones)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Blue - Presupuesto Enviado */}
            <div>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                  <span>Presupuesto Enviado (En decisión)</span>
                </span>
                <span className="font-mono text-blue-600 font-bold">{enviadosCount} ({totalInspecciones > 0 ? Math.round((enviadosCount/totalInspecciones)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalInspecciones > 0 ? (enviadosCount/totalInspecciones)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Amber - En Proceso */}
            <div>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                  <span>En Proceso de Diagnóstico</span>
                </span>
                <span className="font-mono text-amber-600 font-bold">{enProcesoCount} ({totalInspecciones > 0 ? Math.round((enProcesoCount/totalInspecciones)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalInspecciones > 0 ? (enProcesoCount/totalInspecciones)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Indigo - Pendiente */}
            <div>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                  <span>Pendiente (Sin presupuesto enviado)</span>
                </span>
                <span className="font-mono text-indigo-600 font-bold">{pendientesCount} ({totalInspecciones > 0 ? Math.round((pendientesCount/totalInspecciones)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalInspecciones > 0 ? (pendientesCount/totalInspecciones)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Rose - Rechazado */}
            <div>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                  <span>No interesado / Rechazados</span>
                </span>
                <span className="font-mono text-rose-600 font-bold">{rechazadosCount} ({totalInspecciones > 0 ? Math.round((rechazadosCount/totalInspecciones)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-50 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalInspecciones > 0 ? (rechazadosCount/totalInspecciones)*100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-150 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Taller Activo</span>
              <p className="text-lg font-black text-slate-800">{enProcesoCount}</p>
              <span className="text-[10px] text-slate-500">autos</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Por Cerrar</span>
              <p className="text-lg font-black text-blue-600">{enviadosCount}</p>
              <span className="text-[10px] text-slate-500">presupuestos</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Ganados</span>
              <p className="text-lg font-black text-emerald-600">{captadosCount}</p>
              <span className="text-[10px] text-slate-500">clientes</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
              <p className="text-lg font-black text-slate-800">{totalInspecciones}</p>
              <span className="text-[10px] text-slate-500">revisiones</span>
            </div>
          </div>
        </div>

        {/* Brand popular list */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Car className="h-5 w-5 text-slate-500" />
              <span>Marcas más Frecuentes</span>
            </h3>

            <div className="space-y-3.5">
              {marcasOrdenadas.length > 0 ? (
                marcasOrdenadas.map(([brand, count], idx) => {
                  const maxCount = marcasOrdenadas[0][1];
                  const percent = Math.round((count / maxCount) * 100);
                  return (
                    <div key={brand}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">{brand}</span>
                        <span className="text-slate-500">{count} {count === 1 ? 'auto' : 'autos'}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-slate-700 h-full rounded-full" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No hay marcas registradas de vehículos.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 mt-6 pt-4 text-xs text-slate-400 leading-relaxed bg-slate-50/50 p-3 rounded-lg">
            Saber qué marcas entran más le ayuda a enfocar ofertas gratuitas dirigidas y repuestos específicos.
          </div>
        </div>
      </div>

      {/* Technicians & Recent Revisions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Technicians score board */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-slate-500" />
            <span>Productividad de Técnicos</span>
          </h3>

          <div className="divide-y divide-slate-100">
            {tecnicosOrdenados.length > 0 ? (
              tecnicosOrdenados.map(([name, stat]) => {
                const eff = stat.total > 0 ? Math.round((stat.captados / stat.total) * 100) : 0;
                return (
                  <div key={name} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-slate-800">{name}</span>
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                        {eff}% efec.
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{stat.total} diagnósticos realizados</span>
                      <strong className="text-slate-700">{stat.captados} clientes cerrados</strong>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm">
                No hay técnicos registrados aún.
              </div>
            )}
          </div>
        </div>

        {/* Recent timeline logs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2 justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-slate-500" />
              <span>Diagnósticos Recientes</span>
            </span>
            <button 
              onClick={() => onNavigate('revisions')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 shrink-0"
            >
              <span>Ver todos</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </h3>

          <div className="flow-root">
            <ul className="-mb-8">
              {recientes.length > 0 ? (
                recientes.map((rev, revIdx) => {
                  const mapped = estadoLabelMap[rev.estado] || { label: rev.estado, color: 'bg-slate-100 text-slate-700 border-slate-200' };
                  const formattedBudget = (rev.presupuestoEstimado || 0).toLocaleString('es-CL');
                  return (
                    <li key={rev.id}>
                      <div className="relative pb-8">
                        {revIdx !== recientes.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-650 shadow-inner">
                              REV
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1 flex justify-between gap-4">
                            <div>
                              <p className="text-sm text-slate-500">
                                <span className="font-bold text-slate-800">{rev.clienteNombre}</span>
                                <span className="mx-1">inspeccionó</span>
                                <span className="font-semibold text-slate-700">
                                  {rev.vehiculoMarca} {rev.vehiculoModelo} ({rev.vehiculoPlaca})
                                </span>
                              </p>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                <span>{new Date(rev.fecha).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Técnico: {rev.tecnico}</span>
                                {rev.presupuestoEstimado > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="font-semibold text-slate-600">{currencySymbol}{formattedBudget}</span>
                                  </>
                                )}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${mapped.color} border`}>
                                {mapped.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Aún no se han registrado revisiones de vehículos.
                </div>
              )}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

// Inline auxiliary Icon component to avoid lucide imports issues
function PlusCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}
