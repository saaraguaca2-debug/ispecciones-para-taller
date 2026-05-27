export interface ChecklistItem {
  id: string;
  name: string;
  status: 'ok' | 'regular' | 'grave' | 'no_aplica'; // Verde, Amarillo, Rojo, Gris
  notes: string;
}

export type RevisionEstado = 
  | 'pendiente'        // Recién registrado, revisión no iniciada o inspeccionado sin presupuesto
  | 'en_proceso'       // Vehículo en taller realizándose el diagnóstico
  | 'presupuesto_enviado' // Diagnóstico listo y presupuesto enviado al cliente
  | 'cliente_captado'  // Cliente aceptó el presupuesto (ÉXITO)
  | 'no_interesado';   // Cliente rechazó el presupuesto / No concretado

export interface Revision {
  id: string;             // UID auto-generado REV-XXXX
  fecha: string;          // ISO String datetime o fecha simple
  
  // Cliente info
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  
  // Vehículo info
  vehiculoPlaca: string;
  vehiculoMarca: string;
  vehiculoModelo: string;
  vehiculoAnio: string;
  vehiculoKilometraje: string;
  
  // Motivo de consulta
  motivo: string;
  
  // Diagnóstico
  checklist: ChecklistItem[]; // Almacenado como JSON en Sheets
  diagnosticoGeneral: string;
  
  // Presupuesto y Estimación
  presupuestoEstimado: number;
  detallesPresupuesto: string; // JSON de desglose o descripción de repuestos/mano de obra
  
  // Metadatos
  tecnico: string;
  estado: RevisionEstado;
  notasInternas: string;
}

export interface SpreadsheetConfig {
  id: string;
  url: string;
  title: string;
}

export interface DashboardStats {
  totalInspecciones: number;
  totalPresupuestos: number; // Suma de todos los presupuestos de clientes captados o en proceso
  presupuestosAceptados: number; // Suma de presupuestos aceptados (cliente_captado)
  efectividadCaptacion: number; // % de cliente_captado / total
  estadosCount: Record<RevisionEstado, number>;
  tecnicosRank: Record<string, number>;
  marcasMasComunes: Record<string, number>;
}

export interface AppSettings {
  workshopName: string;
  workshopSlogan: string;
  logoType: 'emoji' | 'url';
  logoEmoji: string;
  logoUrl: string;
  accentColor: 'emerald' | 'blue' | 'indigo' | 'orange' | 'rose' | 'amber' | 'cyan';
  currency: string;
  phone: string;
}

