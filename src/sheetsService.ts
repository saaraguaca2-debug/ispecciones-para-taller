import { Revision, RevisionEstado, SpreadsheetConfig, ChecklistItem } from './types';

// Default checklist structure
export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'motor', name: 'Motor y Transmisión', status: 'ok', notes: '' },
  { id: 'frenos', name: 'Sistema de Frenos', status: 'ok', notes: '' },
  { id: 'suspension', name: 'Suspensión y Dirección', status: 'ok', notes: '' },
  { id: 'neumaticos', name: 'Neumáticos y Ruedas', status: 'ok', notes: '' },
  { id: 'electrico', name: 'Batería y Sistema Eléctrico', status: 'ok', notes: '' },
  { id: 'luces', name: 'Luces y Señalización', status: 'ok', notes: '' },
  { id: 'fluidos', name: 'Niveles de Líquidos', status: 'ok', notes: '' },
  { id: 'escape', name: 'Sistema de Escape', status: 'ok', notes: '' }
];

const HEADERS = [
  "ID", "Fecha", "Nombre Cliente", "Teléfono", "Email", 
  "Placa", "Marca", "Modelo", "Año", "Kilometraje", 
  "Motivo Revisión", "Checklist (JSON)", "Diagnóstico General", 
  "Presupuesto Estimado ($)", "Detalles Presupuesto", "Técnico", 
  "Estado", "Notas Internas"
];

// Search user's Google Drive for existing spreadsheets
export async function listUserSpreadsheets(token: string): Promise<SpreadsheetConfig[]> {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=30`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('No se pudieron buscar los archivos de Google Drive');
    }

    const data = await response.json();
    return (data.files || []).map((file: any) => ({
      id: file.id,
      title: file.name,
      url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}`
    }));
  } catch (error) {
    console.error('Error listing spreadsheets:', error);
    throw error;
  }
}

// Create a new spreadsheet with the 'Revisiones' sheet and add headers
export async function createSpreadsheet(token: string, titleSuffix?: string): Promise<SpreadsheetConfig> {
  try {
    const title = `Registro de Revisiones Automotrices ${titleSuffix || ''}`.trim();
    const url = 'https://sheets.googleapis.com/v4/spreadsheets';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: title
        },
        sheets: [
          {
            properties: {
              title: 'Revisiones',
              gridProperties: {
                columnCount: 18,
                rowCount: 1000
              }
            }
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en creación de planilla: ${errorText}`);
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // Initialize headers
    await initializeSheetHeaders(spreadsheetId, token);

    return {
      id: spreadsheetId,
      title: title,
      url: spreadsheetUrl
    };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

// Write the primary header labels to a spreadsheet
export async function initializeSheetHeaders(spreadsheetId: string, token: string): Promise<boolean> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Revisiones!A1:R1?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'Revisiones!A1:R1',
        majorDimension: 'ROWS',
        values: [HEADERS]
      })
    });

    if (!response.ok) {
      throw new Error('Falló la inicialización de columnas de cabecera');
    }

    return true;
  } catch (error) {
    console.error('Error initializing headers:', error);
    throw error;
  }
}

// Map spreadsheet row format to Revision struct
function mapRowToRevision(row: any[]): Revision {
  let checklist: ChecklistItem[] = [];
  try {
    if (row[11]) {
      checklist = JSON.parse(row[11]);
    }
  } catch (e) {
    checklist = [];
  }
  
  if (!checklist || checklist.length === 0) {
    checklist = JSON.parse(JSON.stringify(DEFAULT_CHECKLIST));
  }

  return {
    id: row[0] || '',
    fecha: row[1] || '',
    clienteNombre: row[2] || '',
    clienteTelefono: row[3] || '',
    clienteEmail: row[4] || '',
    vehiculoPlaca: row[5] || '',
    vehiculoMarca: row[6] || '',
    vehiculoModelo: row[7] || '',
    vehiculoAnio: row[8] || '',
    vehiculoKilometraje: row[9] || '',
    motivo: row[10] || '',
    checklist: checklist,
    diagnosticoGeneral: row[12] || '',
    presupuestoEstimado: parseFloat(row[13]) || 0,
    detallesPresupuesto: row[14] || '',
    tecnico: row[15] || '',
    estado: (row[16] || 'pendiente') as RevisionEstado,
    notasInternas: row[17] || ''
  };
}

// Convert Revision struct to spreadsheet row format
function mapRevisionToRow(rev: Revision): any[] {
  return [
    rev.id,
    rev.fecha,
    rev.clienteNombre,
    rev.clienteTelefono,
    rev.clienteEmail,
    rev.vehiculoPlaca,
    rev.vehiculoMarca,
    rev.vehiculoModelo,
    rev.vehiculoAnio,
    rev.vehiculoKilometraje,
    rev.motivo,
    JSON.stringify(rev.checklist),
    rev.diagnosticoGeneral,
    rev.presupuestoEstimado,
    rev.detallesPresupuesto,
    rev.tecnico,
    rev.estado,
    rev.notasInternas
  ];
}

// Fetch all revisions from spreadsheet
export async function fetchRevisions(spreadsheetId: string, token: string): Promise<Revision[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Revisiones!A2:R1000`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // If table 'Revisiones' sheets tab doesn't exist, try initializing it
      const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
      const metaRes = await fetch(metaUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        const sheetExists = (metaData.sheets || []).some((s: any) => s.properties?.title === 'Revisiones');
        
        if (!sheetExists) {
          // Attempt to add a sheet sheet tab
          await createRevisionesTab(spreadsheetId, token);
          await initializeSheetHeaders(spreadsheetId, token);
          return [];
        }
      }
      return [];
    }

    const data = await response.json();
    const rows = data.values || [];
    return rows.map((row: any[]) => mapRowToRevision(row)).filter((rev: Revision) => rev.id);
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return [];
  }
}

// ==========================================
// GOOGLE APPS SCRIPT WEB APP ALTERNATIVE MODE
// ==========================================

export async function fetchRevisionsAppsScript(appsScriptUrl: string): Promise<Revision[]> {
  try {
    // Apps Script GET returns JSON revisions
    const response = await fetch(appsScriptUrl, {
      method: 'GET',
      redirect: 'follow'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching revisions via Apps Script:', error);
    throw error;
  }
}

export async function saveRevisionAppsScript(appsScriptUrl: string, revision: Revision): Promise<boolean> {
  try {
    await fetch(appsScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'save',
        revision
      })
    });
    // With mode: 'no-cors', the response is opaque and we cannot read its body,
    // but the request is sent successfully and executed by the script.
    return true;
  } catch (error) {
    console.error('Error saving revision via Apps Script:', error);
    throw error;
  }
}

export async function deleteRevisionAppsScript(appsScriptUrl: string, revisionId: string): Promise<boolean> {
  try {
    await fetch(appsScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'delete',
        revisionId
      })
    });
    return true;
  } catch (error) {
    console.error('Error deleting revision via Apps Script:', error);
    return false;
  }
}

// Create 'Revisiones' tab if not exists in target sheet
async function createRevisionesTab(spreadsheetId: string, token: string): Promise<boolean> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: 'Revisiones',
              gridProperties: {
                columnCount: 18,
                rowCount: 1000
              }
            }
          }
        }
      ]
    })
  });
  return response.ok;
}

// Save or Update a revision in spreadsheet
export async function saveRevision(spreadsheetId: string, revision: Revision, token: string): Promise<boolean> {
  try {
    // 1. Fetch current rows to find if it exists
    const urlGet = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Revisiones!A1:A1000`;
    const resGet = await fetch(urlGet, { headers: { 'Authorization': `Bearer ${token}` } });
    
    let existingIndex = -1;
    if (resGet.ok) {
      const data = await resGet.json();
      const ids = (data.values || []).map((row: any[]) => row[0]);
      existingIndex = ids.indexOf(revision.id); // index 0 is row 1 (Header)
    }

    const rowData = mapRevisionToRow(revision);

    if (existingIndex !== -1) {
      // Row exists: Update row at (existingIndex + 1)
      const rowNumber = existingIndex + 1;
      const urlUpdate = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Revisiones!A${rowNumber}:R${rowNumber}?valueInputOption=USER_ENTERED`;
      
      const response = await fetch(urlUpdate, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: `Revisiones!A${rowNumber}:R${rowNumber}`,
          majorDimension: 'ROWS',
          values: [rowData]
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar fila en la hoja');
      }
      return true;
    } else {
      // Row is new: Append row
      const urlAppend = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Revisiones!A2:append?valueInputOption=USER_ENTERED`;
      const response = await fetch(urlAppend, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: 'Revisiones!A2',
          majorDimension: 'ROWS',
          values: [rowData]
        })
      });

      if (!response.ok) {
        throw new Error('Error al agregar fila en la hoja');
      }
      return true;
    }
  } catch (error) {
    console.error('Error saving revision:', error);
    throw error;
  }
}

// Delete revision row (set state/row to deleted or clear its cells - in sheets we usually clear or mark as deleted, let's mark its state as 'no_interesado' or completely remove the row by sending empty cells or filter it)
// A safer solution for Google Sheets is to filter out locally, but if the user wants delete, we can also clear the row context or let it stay but update `id` to empty or status to 'deleted'. Let's mark it index state as empty ID to completely hide it.
export async function deleteRevision(spreadsheetId: string, revisionId: string, token: string): Promise<boolean> {
  try {
    const urlGet = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Revisiones!A1:A1000`;
    const resGet = await fetch(urlGet, { headers: { 'Authorization': `Bearer ${token}` } });
    
    if (resGet.ok) {
      const data = await resGet.json();
      const ids = (data.values || []).map((row: any[]) => row[0]);
      const existingIndex = ids.indexOf(revisionId);
      
      if (existingIndex !== -1) {
        const rowNumber = existingIndex + 1;
        // In Google Sheets, a row deletion is a batchUpdate process, or we can just clear the row or change its custom state/ID so it is ignored.
        // A direct row clearance is very clean. Let's just clear the range.
        const urlClear = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Revisiones!A${rowNumber}:R${rowNumber}:clear`;
        const resClear = await fetch(urlClear, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return resClear.ok;
      }
    }
    return false;
  } catch (error) {
    console.error('Error deleting revision:', error);
    return false;
  }
}
