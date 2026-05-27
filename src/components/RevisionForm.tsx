import React, { useState, useEffect } from 'react';
import { Revision, ChecklistItem, RevisionEstado, AppSettings } from '../types';
import { DEFAULT_CHECKLIST } from '../sheetsService';
import { Save, ArrowLeft, Check, AlertTriangle, AlertOctagon, HelpCircle, RefreshCw, Sparkles } from 'lucide-react';
import { getThemeClasses } from '../lib/theme';

interface RevisionFormProps {
  revisionToEdit?: Revision | null;
  existingRevisions: Revision[];
  onSave: (revision: Revision) => Promise<void>;
  onCancel: () => void;
  currentUserDisplayName?: string;
  settings?: AppSettings;
}

export default function RevisionForm({ 
  revisionToEdit, 
  existingRevisions, 
  onSave, 
  onCancel,
  currentUserDisplayName,
  settings
}: RevisionFormProps) {
  const currencySymbol = settings?.currency || '$';
  const theme = getThemeClasses(settings?.accentColor || 'emerald');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Form states
  const [id, setId] = useState<string>('');
  const [fecha, setFecha] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [clienteEmail, setClienteEmail] = useState<string>('');
  const [vehiculoPlaca, setVehiculoPlaca] = useState<string>('');
  const [vehiculoMarca, setVehiculoMarca] = useState<string>('');
  const [vehiculoModelo, setVehiculoModelo] = useState<string>('');
  const [vehiculoAnio, setVehiculoAnio] = useState<string>('');
  const [vehiculoKilometraje, setVehiculoKilometraje] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('Inspección de Seguridad Gratuita');
  const [diagnosticoGeneral, setDiagnosticoGeneral] = useState<string>('');
  const [presupuestoEstimado, setPresupuestoEstimado] = useState<number>(0);
  const [detallesPresupuesto, setDetallesPresupuesto] = useState<string>('');
  const [tecnico, setTecnico] = useState<string>('');
  const [estado, setEstado] = useState<RevisionEstado>('pendiente');
  const [notasInternas, setNotasInternas] = useState<string>('');
  
  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (revisionToEdit) {
      // Load selected revision
      setId(revisionToEdit.id);
      setFecha(revisionToEdit.fecha);
      setClienteNombre(revisionToEdit.clienteNombre || '');
      setClienteTelefono(revisionToEdit.clienteTelefono || '');
      setClienteEmail(revisionToEdit.clienteEmail || '');
      setVehiculoPlaca(revisionToEdit.vehiculoPlaca || '');
      setVehiculoMarca(revisionToEdit.vehiculoMarca || '');
      setVehiculoModelo(revisionToEdit.vehiculoModelo || '');
      setVehiculoAnio(revisionToEdit.vehiculoAnio || '');
      setVehiculoKilometraje(revisionToEdit.vehiculoKilometraje || '');
      setMotivo(revisionToEdit.motivo || '');
      setDiagnosticoGeneral(revisionToEdit.diagnosticoGeneral || '');
      setPresupuestoEstimado(revisionToEdit.presupuestoEstimado || 0);
      setDetallesPresupuesto(revisionToEdit.detallesPresupuesto || '');
      setTecnico(revisionToEdit.tecnico || '');
      setEstado(revisionToEdit.estado || 'pendiente');
      setNotasInternas(revisionToEdit.notasInternas || '');
      setChecklist(
        revisionToEdit.checklist && revisionToEdit.checklist.length > 0
          ? JSON.parse(JSON.stringify(revisionToEdit.checklist)) // Clone array in state
          : JSON.parse(JSON.stringify(DEFAULT_CHECKLIST))
      );
    } else {
      // Setup fresh registration
      const autoId = generateNextId();
      setId(autoId);
      setFecha(new Date().toISOString());
      setClienteNombre('');
      setClienteTelefono('');
      setClienteEmail('');
      setVehiculoPlaca('');
      setVehiculoMarca('');
      setVehiculoModelo('');
      setVehiculoAnio('');
      setVehiculoKilometraje('');
      setMotivo('Inspección Técnica de Seguridad (Gratuita)');
      setDiagnosticoGeneral('');
      setPresupuestoEstimado(0);
      setDetallesPresupuesto('');
      setTecnico(currentUserDisplayName || '');
      setEstado('pendiente');
      setNotasInternas('');
      setChecklist(JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)));
    }
  }, [revisionToEdit, currentUserDisplayName]);

  // Generates serialized revision ID sequentially (REV-1001, REV-1002...)
  const generateNextId = (): string => {
    if (existingRevisions.length === 0) {
      return 'REV-1001';
    }
    const ids = existingRevisions
      .map(r => {
        const num = parseInt(r.id.replace('REV-', ''));
        return isNaN(num) ? 0 : num;
      })
      .filter(num => num > 0);
    
    const maxNum = ids.length > 0 ? Math.max(...ids) : 1000;
    return `REV-${maxNum + 1}`;
  };

  // Modify checklist item properties
  const handleChecklistChange = (id: string, field: 'status' | 'notes', value: any) => {
    setChecklist(prev => 
      prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Generate recommendation notes automatically using Gemini model or simple expert diagnostics template
  const handleAISuggestBudget = () => {
    // Collect active problems in checklist to propose a dynamic estimated template
    const problemSystems = checklist.filter(item => item.status === 'grave' || item.status === 'regular');
    
    if (problemSystems.length === 0) {
      setDiagnosticoGeneral("Vehículo en muy buenas condiciones generales tras inspección de seguridad.");
      setDetallesPresupuesto("No se requieren reparaciones urgentes.");
      setPresupuestoEstimado(0);
      return;
    }

    let diagLines = "Se realizó la inspección de seguridad gratuita. Se detectaron los siguientes puntos:\n";
    let budgetLines = "Desglose tentativo de reparaciones de seguridad sugeridas:\n";
    let calculatedCost = 0;

    problemSystems.forEach(item => {
      if (item.status === 'grave') {
        diagLines += `• CRÍTICO EN ${item.name.toUpperCase()}: ${item.notes || 'Requiere intervención inmediata por seguridad.'}\n`;
        budgetLines += `- Reparación/Sustitución de ${item.name}: $120.000 aprox (Mano de obra + repuesto nuevo)\n`;
        calculatedCost += 120000;
      } else {
        diagLines += `• RECOMENDADO EN ${item.name}: ${item.notes || 'Monitoreo o mantenimiento preventivo aconsejable.'}\n`;
        budgetLines += `- Mantenimiento/Ajuste de ${item.name}: $45.050 aprox\n`;
        calculatedCost += 45000;
      }
    });

    setDiagnosticoGeneral(diagLines.trim());
    setDetallesPresupuesto(budgetLines.trim());
    setPresupuestoEstimado(calculatedCost);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre || !vehiculoPlaca) {
      setErrorForm('Por favor complete al menos el Nombre del Cliente y la Placa del vehículo.');
      return;
    }

    setSubmitting(true);
    setErrorForm(null);

    const fullRevision: Revision = {
      id,
      fecha,
      clienteNombre: clienteNombre.trim(),
      clienteTelefono: clienteTelefono.trim(),
      clienteEmail: clienteEmail.trim(),
      vehiculoPlaca: vehiculoPlaca.trim().toUpperCase(),
      vehiculoMarca: vehiculoMarca.trim(),
      vehiculoModelo: vehiculoModelo.trim(),
      vehiculoAnio: vehiculoAnio.trim(),
      vehiculoKilometraje: vehiculoKilometraje.trim(),
      motivo: motivo.trim(),
      checklist,
      diagnosticoGeneral: diagnosticoGeneral.trim(),
      presupuestoEstimado,
      detallesPresupuesto: detallesPresupuesto.trim(),
      tecnico: tecnico.trim() || 'Técnico General',
      estado,
      notasInternas: notasInternas.trim()
    };

    try {
      await onSave(fullRevision);
    } catch (err: any) {
      console.error(err);
      setErrorForm('No se pudo guardar la revisión en Google Sheets. Verifique la conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="revision-form-container" className="max-w-5xl mx-auto py-4 px-1 animate-fade-in">
      {/* Return Head */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onCancel}
          type="button"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white hover:bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al listado</span>
        </button>
        <span className="font-mono text-xs text-slate-400 font-bold bg-slate-100 py-1 px-3 rounded-md">
          {revisionToEdit ? `Editando: ${id}` : `ID Generado: ${id}`}
        </span>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden mb-10">
        <div className="bg-slate-900 px-6 py-5 text-white">
          <h2 className="text-xl font-extrabold tracking-tight">
            {revisionToEdit ? 'Modificar Registro de Inspección' : 'Registrar Inspección y Diagnóstico Gratuito'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Complete los datos del cliente, realice el checklist de inspección del auto y genere un presupuesto estratégico para captación.
          </p>
        </div>

        {errorForm && (
          <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-800 text-sm flex gap-2.5 items-start">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Error en formulario:</span>
              <span>{errorForm}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* Section 1: Cliente & Vehículo */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">
              1. Datos del Cliente y Vehículo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Cliente name */}
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nombre Completo del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcelo Silva Rodríguez"
                  value={clienteNombre}
                  onChange={e => setClienteNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-medium"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Teléfono de Contacto (con WhatsApp) *</label>
                <input
                  type="tel"
                  placeholder="Ej: +56912345678"
                  value={clienteTelefono}
                  onChange={e => setClienteTelefono(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-medium"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email del Cliente</label>
                <input
                  type="email"
                  placeholder="Ej: cliente@correo.com"
                  value={clienteEmail}
                  onChange={e => setClienteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-medium"
                />
              </div>

              {/* Plate / Placa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Placa de Patente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: AB12CD o XXYY11"
                  value={vehiculoPlaca}
                  onChange={e => setVehiculoPlaca(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-bold uppercase placeholder:normal-case"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Marca del Vehículo</label>
                <input
                  type="text"
                  list="popular-brands"
                  placeholder="Ej: Toyota"
                  value={vehiculoMarca}
                  onChange={e => setVehiculoMarca(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-medium"
                />
                <datalist id="popular-brands">
                  <option value="Toyota" />
                  <option value="Nissan" />
                  <option value="Chevrolet" />
                  <option value="Hyundai" />
                  <option value="Kia" />
                  <option value="Ford" />
                  <option value="Honda" />
                  <option value="Suzuki" />
                  <option value="Peugeot" />
                  <option value="Citroen" />
                  <option value="Mazda" />
                  <option value="Mitsubishi" />
                  <option value="Volkswagen" />
                </datalist>
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Modelo</label>
                <input
                  type="text"
                  placeholder="Ej: Hilux, Yaris, Rio"
                  value={vehiculoModelo}
                  onChange={e => setVehiculoModelo(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-medium"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Año del Vehículo</label>
                <input
                  type="number"
                  placeholder="Ej: 2018"
                  min="1950"
                  max="2027"
                  value={vehiculoAnio}
                  onChange={e => setVehiculoAnio(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-medium"
                />
              </div>

              {/* Mileage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kilometraje actual (KM)</label>
                <input
                  type="text"
                  placeholder="Ej: 85.000"
                  value={vehiculoKilometraje}
                  onChange={e => setVehiculoKilometraje(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-medium"
                />
              </div>

              {/* Motivo */}
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Motivo de Ingreso / Campaña</label>
                <input
                  type="text"
                  placeholder="Campaña Diagnóstico Invierno Gratis"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Checklist */}
          <div className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                2. Checklist de Inspección Especializada
              </h3>
              <span className="text-xs text-slate-400 bg-slate-50 py-0.5 px-2 rounded-md font-semibold">
                8 puntos clave de seguridad
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
              {checklist.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 border rounded-2xl transition-all ${
                    item.status === 'ok' ? 'bg-emerald-50/20 border-emerald-100' :
                    item.status === 'regular' ? 'bg-amber-50/20 border-amber-100' :
                    item.status === 'grave' ? 'bg-rose-50/20 border-rose-105' :
                    'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2 mb-3">
                    <span className="text-sm font-extrabold text-slate-850 truncate">{item.name}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Estado</span>
                  </div>

                  {/* 4 Status Pills Select */}
                  <div className="grid grid-cols-4 gap-1.5 mb-3.5">
                    {/* OK */}
                    <button
                      type="button"
                      onClick={() => handleChecklistChange(item.id, 'status', 'ok')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg border text-center transition-all ${
                        item.status === 'ok'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50'
                      }`}
                    >
                      Correcto
                    </button>
                    {/* REGULAR */}
                    <button
                      type="button"
                      onClick={() => handleChecklistChange(item.id, 'status', 'regular')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg border text-center transition-all ${
                        item.status === 'regular'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-amber-700 border-slate-200 hover:bg-amber-50'
                      }`}
                    >
                      Observación
                    </button>
                    {/* GRAVE */}
                    <button
                      type="button"
                      onClick={() => handleChecklistChange(item.id, 'status', 'grave')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg border text-center transition-all ${
                        item.status === 'grave'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white text-rose-700 border-slate-200 hover:bg-rose-50'
                      }`}
                    >
                      Urgente
                    </button>
                    {/* NO APLICA */}
                    <button
                      type="button"
                      onClick={() => handleChecklistChange(item.id, 'status', 'no_aplica')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg border text-center transition-all ${
                        item.status === 'no_aplica'
                          ? 'bg-slate-500 text-white border-slate-500 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      N/A
                    </button>
                  </div>

                  {/* Detail text on this unit */}
                  <div>
                    <input
                      type="text"
                      placeholder={
                        item.status === 'grave' ? 'Describa el problema grave urgente...' :
                        item.status === 'regular' ? '¿Qué observación encontró?' :
                        'Notas o mediciones (ej: balatas 4mm)...'
                      }
                      value={item.notes}
                      onChange={e => handleChecklistChange(item.id, 'notes', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Diagnostic Findings & Budgets */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                3. Diagnóstico Técnico y Cotización de Reparación
              </h3>
              <button
                type="button"
                onClick={handleAISuggestBudget}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white text-[11px] font-extrabold uppercase rounded-lg shadow-sm hover:shadow transition-all group scale-95 lg:scale-100 hover:brightness-105"
              >
                <Sparkles className="h-3 w-3 animate-pulse" />
                <span>Generar Diagnóstico Experto</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* General Diagnostic Summary Text */}
              <div>
                <label className="block text-xs font-bold text-slate-705 uppercase tracking-wider mb-2">Diagnóstico General (Resumen para el Cliente)</label>
                <textarea
                  rows={3}
                  placeholder="Detalle el estado global del vehículo. Escriba recomendaciones profesionales de forma comprensible para el cliente, buscando generar confianza para la venta."
                  value={diagnosticoGeneral}
                  onChange={e => setDiagnosticoGeneral(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Budget sum cost */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Presupuesto Estimado ({currencySymbol})</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={presupuestoEstimado}
                      onChange={e => setPresupuestoEstimado(parseInt(e.target.value) || 0)}
                      className="w-full pl-7 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-black focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">Suma estimada para la solución de los problemas mecánicos hallados en la inspección gratuita.</p>
                </div>

                {/* Details list of estimate */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-705 uppercase tracking-wider mb-2">Desglose del Presupuesto (Repuestos y Soluciones)</label>
                  <textarea
                    rows={4}
                    placeholder={`Ej: - Juego de pastillas de freno delanteras marca BOSCH: ${currencySymbol}45.000\n- Rectificado de discos delanteros: ${currencySymbol}25.000... (O detalle los componentes mecánicos necesarios)`}
                    value={detallesPresupuesto}
                    onChange={e => setDetallesPresupuesto(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Technicians, States & Notes */}
          <div className="space-y-6 pt-2">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">
              4. Información de Gestión y Estatus
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Assignee Technician */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Técnico a cargo</label>
                <input
                  type="text"
                  placeholder="Ej: Pedro González"
                  value={tecnico}
                  onChange={e => setTecnico(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                />
              </div>

              {/* Status Select dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Estado de Gestión *</label>
                <select
                  value={estado}
                  onChange={e => setEstado(e.target.value as RevisionEstado)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                >
                  <option value="pendiente">Pendiente (Sólo Inspección / Sin enviar)</option>
                  <option value="en_proceso">En Proceso de Reparación / Taller</option>
                  <option value="presupuesto_enviado">Presupuesto Enviado (Seguimiento)</option>
                  <option value="cliente_captado">Cliente Captado (Trabajo Aceptado ✓)</option>
                  <option value="no_interesado">No Interesado / Rechazado</option>
                </select>
              </div>

              {/* Internal comments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Notas Internas (No visible para Cliente)</label>
                <input
                  type="text"
                  placeholder="Ej: Cliente indeciso, llamar el viernes por confirmación"
                  value={notasInternas}
                  onChange={e => setNotasInternas(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Form Actions footer */}
          <div className="pt-6 border-t border-slate-250 flex flex-col-reverse sm:flex-row justify-end items-center gap-3">
            <button
              onClick={onCancel}
              type="button"
              className="w-full sm:w-auto px-6 py-3 border border-slate-200 text-slate-500 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl text-sm shadow inline-flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="animate-spin h-5 w-5" />
                  <span>Guardando en Google Sheets...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Guardar Revisión</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
