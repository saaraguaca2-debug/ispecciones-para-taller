import { useState } from 'react';
import { Revision, ChecklistItem, AppSettings } from '../types';
import { Printer, MessageCircle, ArrowLeft, ShieldCheck, Mail, Phone, Calendar, User, Wrench, AlertTriangle, CheckCircle, Info, Send, Share2 } from 'lucide-react';
import { getThemeClasses } from '../lib/theme';

interface RevisionReportProps {
  revision: Revision;
  onBack: () => void;
  settings?: AppSettings;
}

export default function RevisionReport({ revision, onBack, settings }: RevisionReportProps) {
  const [tempPhone, setTempPhone] = useState<string>(revision.clienteTelefono || '');
  const [tempEmail, setTempEmail] = useState<string>(revision.clienteEmail || '');

  const currencySymbol = settings?.currency || '$';
  const theme = getThemeClasses(settings?.accentColor || 'emerald');
  const formattedBudget = (revision.presupuestoEstimado || 0).toLocaleString('es-CL');
  
  // Categorization lists
  const graves = revision.checklist.filter(item => item.status === 'grave');
  const regulares = revision.checklist.filter(item => item.status === 'regular');
  const oks = revision.checklist.filter(item => item.status === 'ok');

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Convert status indicator text to badge representation
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'grave': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'regular': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ok': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'grave': return 'Urgente / Crítico';
      case 'regular': return 'Preventivo';
      case 'ok': return 'Correcto';
      default: return 'No aplica';
    }
  };

  // Prefilled WhatsApp Conversion Message Template
  const generateWhatsAppLink = () => {
    const pNumber = tempPhone.replace(/[^0-9+]/g, ''); // Extract numbers from temporary state
    const workshop = settings?.workshopName || 'AutoDiag';
    
    // Formatting a high-converting message
    let message = `*${workshop.toUpperCase()} - INFORME TÉCNICO GRATUITO*\n\n`;
    message += `Hola Estimado(a) *${revision.clienteNombre}*,\n`;
    message += `Le escribimos de *${workshop}*. Ya tenemos disponible el resultado del diagnóstico de seguridad gratuito de su auto:\n`;
    message += `🚗 *Vehículo:* ${revision.vehiculoMarca} ${revision.vehiculoModelo} (Patente: ${revision.vehiculoPlaca})\n\n`;
    
    if (graves.length > 0) {
      message += `⚠️ *REPARACIONES CRÍTICAS DETECTADAS (${graves.length}):*\n`;
      graves.forEach(item => {
        message += `• *${item.name}:* ${item.notes || 'Requiere sustitución urgente'}\n`;
      });
      message += `\n`;
    }

    if (regulares.length > 0) {
      message += `🔧 *RECOMENDACIONES PREVENTIVAS (${regulares.length}):*\n`;
      regulares.forEach(item => {
        message += `• *${item.name}:* ${item.notes || 'Mantenimiento preventivo aconsejado'}\n`;
      });
      message += `\n`;
    }

    message += `📋 *Presupuesto Estimado de Solución:* ${currencySymbol}${formattedBudget}\n`;
    if (revision.detallesPresupuesto) {
      message += `*Desglose sugerido:*\n${revision.detallesPresupuesto}\n\n`;
    }

    message += `*¿Desea autorizar el inicio de los trabajos para asegurar el buen estado de su auto?*\n`;
    message += `Quedamos atentos a sus comentarios. ¡Muchas gracias! \n`;
    message += `Técnico asignado: *${revision.tecnico}*`;

    const encodedText = encodeURIComponent(message);
    return `https://wa.me/${pNumber}?text=${encodedText}`;
  };

  const generateEmailLink = () => {
    const email = tempEmail;
    const subject = `Informe de Inspección Técnica - Vehículo ${revision.vehiculoMarca} ${revision.vehiculoModelo} (${revision.vehiculoPlaca})`;
    const workshop = settings?.workshopName || 'AutoDiag';
    
    let body = `Estimado(a) ${revision.clienteNombre},\n\n`;
    body += `Le hacemos llegar una copia del informe del diagnóstico de seguridad gratuito realizado a su vehículo en ${workshop}:\n\n`;
    body += `🚗 VEHÍCULO: ${revision.vehiculoMarca} ${revision.vehiculoModelo}\n`;
    body += `📟 PATENTE: ${revision.vehiculoPlaca}\n`;
    if (revision.vehiculoKilometraje) {
      body += `⚡ KILOMETRAJE: ${parseInt(revision.vehiculoKilometraje).toLocaleString()} KM\n`;
    }
    body += `📅 FECHA: ${new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(new Date(revision.fecha))}\n\n`;
    body += `----------------------------------------------------\n`;
    body += `RESUMEN DEL DIAGNÓSTICO:\n`;
    body += `----------------------------------------------------\n`;
    
    if (graves.length > 0) {
      body += `⚠️ REPARACIONES CRÍTICAS DETECTADAS (${graves.length}):\n`;
      graves.forEach(item => {
        body += `  • ${item.name}: ${item.notes || 'Arreglo urgente sugerido'}\n`;
      });
      body += `\n`;
    }

    if (regulares.length > 0) {
      body += `🔧 RECOMENDACIONES PREVENTIVAS (${regulares.length}):\n`;
      regulares.forEach(item => {
        body += `  • ${item.name}: ${item.notes || 'Mantenimiento preventivo sugerido'}\n`;
      });
      body += `\n`;
    }

    if (graves.length === 0 && regulares.length === 0) {
      body += `✓ ¡Felicidades! No se detectaron fallos de seguridad o advertencias en esta inspección.\n\n`;
    }

    body += `----------------------------------------------------\n`;
    body += `DESGLOSE Y PRESUPUESTO SUGERIDO:\n`;
    body += `----------------------------------------------------\n`;
    body += `💰 Presupuesto Estimado de Solución: ${currencySymbol}${formattedBudget}\n`;
    if (revision.detallesPresupuesto) {
      body += `\nDesglose de repuestos y mano de obra:\n${revision.detallesPresupuesto}\n`;
    }
    body += `\n\n¿Desea autorizar el inicio de los trabajos descritos para asegurar su tranquilidad en la conducción?\n`;
    body += `Quedamos a su total disposición para agendar su hora de taller. ¡Muchas gracias por su confianza!\n\n`;
    body += `Atentamente,\n`;
    body += `${revision.tecnico || 'Equipo Técnico'} - Talleres ${workshop}`;
    
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div id="revision-report-container" className="max-w-4xl mx-auto py-5 px-1 animate-fade-in text-left">
      
      {/* Return & Action bar (Disabled in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-850 transition-colors bg-white border border-slate-200 py-1.5 px-3.5 rounded-xl cursor-pointer animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a revisiones</span>
        </button>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Print button */}
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 bg-slate-850 hover:bg-slate-950 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4.5 w-4.5" />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      {/* Dynamic Client Sharing Panel (Hidden in print) */}
      <div className="mb-6 p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-850 rounded-2xl text-white shadow-xl animate-fade-in print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
            Enviar copia de inspección al cliente
          </h3>
        </div>
        
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Envía el diagnóstico técnico interactivo directo al cliente. Confirma o edita los datos de contacto para recalcular la copia en tiempo real antes de presionar Enviar:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Phone custom field */}
          <div className="space-y-1 text-left">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-emerald-400" />
              <span>Número de WhatsApp (con código de país)</span>
            </label>
            <input
              type="text"
              placeholder="Ej: +56912345678"
              value={tempPhone}
              onChange={(e) => setTempPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-200 placeholder:text-slate-700 font-mono"
            />
          </div>

          {/* Email custom field */}
          <div className="space-y-1 text-left">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-indigo-400" />
              <span>Correo Electrónico (Email)</span>
            </label>
            <input
              type="email"
              placeholder="Ej: cliente@correo.com"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-200 placeholder:text-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Whatsapp action */}
          <a
            href={generateWhatsAppLink()}
            target="_blank"
            rel="noreferrer"
            className="flex-1 justify-center inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-5 rounded-xl text-xs sm:text-sm shadow transition-all active:scale-95 text-center cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
            <span>Enviar por WhatsApp</span>
          </a>

          {/* Email action */}
          <a
            href={generateEmailLink()}
            className="flex-1 justify-center inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 px-5 rounded-xl text-xs sm:text-sm shadow transition-all active:scale-95 text-center cursor-pointer"
          >
            <Mail className="h-4 w-4" />
            <span>Enviar por Correo</span>
          </a>
        </div>
      </div>

      {/* Printable Report Document Card wrapper */}
      <div 
        id="printable-report-card" 
        className="bg-white border border-slate-250 rounded-2xl overflow-hidden shadow-lg p-6 sm:p-10 relative print:border-0 print:shadow-none"
      >
        {/* Certificate Watermark Stamp */}
        <div className="absolute right-10 top-12 opacity-5 pointer-events-none hidden sm:block">
          <ShieldCheck className="h-48 w-48 text-emerald-800" />
        </div>

        {/* Heading information */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-8 mb-8">
          <div>
            <span className="p-2 bg-emerald-600 rounded-xl text-white inline-flex items-center justify-center shadow-lg shadow-emerald-600/10 mb-3.5">
              <Wrench className="h-6 w-6" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Talleres AutoDiag</h2>
            <p className="text-xs text-slate-400 font-bold block mt-1 tracking-wider uppercase font-mono">Certificado de Diagnóstico de Seguridad vehicular</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="font-mono text-xs text-slate-405 font-bold bg-slate-100 py-1.5 px-3.5 rounded-lg border border-slate-200">
              INFORME ID: {revision.id}
            </span>
            <p className="text-xs text-slate-500 mt-3 flex sm:justify-end items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>Fecha: {new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(revision.fecha))}</span>
            </p>
          </div>
        </div>

        {/* General Overview Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Customer Details info block */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3.5 border-b border-slate-150 pb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>DATOS DEL PROPÍETARIO</span>
            </h4>
            <div className="space-y-2 text-xs sm:text-sm font-semibold">
              <p className="text-slate-800 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">Cliente:</span>
                <span className="text-right">{revision.clienteNombre}</span>
              </p>
              <p className="text-slate-800 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">Teléfono:</span>
                <span className="text-right font-mono">{revision.clienteTelefono || 'No proporcionado'}</span>
              </p>
              <p className="text-slate-800 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">Email:</span>
                <span className="text-right font-mono truncate max-w-[180px]">{revision.clienteEmail || 'No proporcionado'}</span>
              </p>
            </div>
          </div>

          {/* Vehicle Specifications block */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3.5 border-b border-slate-150 pb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>IDENTIFICACIÓN DEL AUTO</span>
            </h4>
            <div className="space-y-2 text-xs sm:text-sm font-semibold">
              <p className="text-slate-800 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">Marca / Modelo:</span>
                <span className="text-right font-bold">{revision.vehiculoMarca || 'Otros'} {revision.vehiculoModelo || ''}</span>
              </p>
              <p className="text-slate-800 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">Año / Kilometraje:</span>
                <span className="text-right">{revision.vehiculoAnio ? `${revision.vehiculoAnio} • ` : ''} {revision.vehiculoKilometraje ? `${parseInt(revision.vehiculoKilometraje).toLocaleString()} KM` : 'N/A'}</span>
              </p>
              <p className="text-slate-800 flex justify-between gap-4">
                <span className="text-slate-400 font-bold">Patente Patrulla:</span>
                <span className="text-right font-mono font-black bg-slate-900 text-slate-50 px-2 py-0.5 rounded text-xs select-all uppercase">
                  {revision.vehiculoPlaca}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Motivo de ingreso */}
        <div className="mb-8 border border-slate-200 bg-slate-50/20 p-4.5 rounded-xl text-slate-705 text-xs sm:text-sm font-medium">
          <strong className="text-slate-850 font-bold block mb-1">Motivo de la Revisión:</strong>
          <span>{revision.motivo}</span>
        </div>

        {/* Diagnostic point list detail */}
        <div className="space-y-6 mb-8 text-left">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
            Resultado Checklist Inspección Ocular Gratuita
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {revision.checklist.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between bg-white text-left">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm">{item.name}</h5>
                    {item.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 font-medium bg-slate-50 px-2 py-1 rounded border border-slate-100 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-black border uppercase tracking-wider rounded-md shrink-0 ${getBadgeStyle(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Persuasive Summary of Diagnostics */}
        {(graves.length > 0 || regulares.length > 0) ? (
          <div className="mb-8 p-5 rounded-2xl border bg-slate-50 text-slate-800 text-xs sm:text-sm space-y-3.5">
            <h4 className="font-bold text-slate-900 border-b border-slate-150 pb-1.5 uppercase flex items-center gap-1.5 text-xs tracking-wider">
              <Info className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Resumen Profesional de Diagnóstico de Seguridad</span>
            </h4>

            {graves.length > 0 && (
              <div className="flex items-start gap-2 text-rose-800">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Alerta Crítica ({graves.length} puntos):</span>
                  <p className="text-slate-500 text-xs leading-relaxed mt-1">Los puntos marcados como Críticos requieren atención y corrección inmediata para resguardar la seguridad y habitabilidad de la conducción sobre el vehículo.</p>
                </div>
              </div>
            )}

            {regulares.length > 0 && (
              <div className="flex items-start gap-2 text-amber-800">
                <CheckCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Mantenimiento Sugerido ({regulares.length} puntos):</span>
                  <p className="text-slate-500 text-xs leading-relaxed mt-1">Sugerimos programar reparaciones preventivas a corto plazo antes de que originen desperfectos mayores en la mecánica.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3.5 text-emerald-900 text-xs sm:text-sm">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">¡Felicidades! Todo en orden</span>
              <p className="text-emerald-700 leading-relaxed mt-1">El vehículo fue examinado exhaustivamente por nuestro técnico y no se hallaron reparaciones urgentes o advertencias de seguridad en este control.</p>
            </div>
          </div>
        )}

        {/* Section 5: Budget and Estimated Valuation Details */}
        <div className="border-t border-slate-200 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 align-top">
            {/* Price cost pill box */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl text-center md:text-left flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Presupuesto Sugerido</span>
              <span className="text-3xl font-black block">{currencySymbol}{formattedBudget}</span>
              <span className="text-[9px] text-slate-400 block mt-2 leading-relaxed">Estimación sujeta a modificaciones según desmontaje o repuestos específicos.</span>
            </div>

            {/* Price Breakdown text */}
            <div className="col-span-1 md:col-span-2 text-left bg-slate-50 border border-slate-205 p-5 rounded-2xl">
              <h4 className="text-xs font-black uppercase text-slate-405 tracking-widest mb-3.5 border-b border-slate-150 pb-1">
                DETALLE DE COMPONENTES SUGERIDOS
              </h4>
              {revision.detallesPresupuesto ? (
                <pre className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                  {revision.detallesPresupuesto}
                </pre>
              ) : (
                <p className="text-xs text-slate-400 italic">No se agregaron descripciones de repuestos específicos o mano de obra en esta cotización.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer info/signatures */}
        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 mt-12 text-slate-400 text-xs font-semibold">
          <div className="text-center sm:text-left">
            <p className="text-slate-700 font-bold">Certificado por Técnico:</p>
            <p className="text-slate-500 mt-1">{revision.tecnico || settings?.workshopName || 'Taller AutoDiag'}</p>
          </div>
          <div className="text-center sm:text-right">
            <div className="border-b border-slate-300 w-44 mx-auto sm:ml-auto mb-2 text-slate-350"></div>
            <p className="text-slate-450 leading-none">Firma / Sello de Recepción</p>
            <p className="text-[9px] text-slate-400 mt-1">Talleres Oficiales {settings?.workshopName || 'AutoDiag'}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
