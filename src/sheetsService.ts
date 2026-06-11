import { Transaction, SheetInfo } from './types';

// Standard Google Sheets API Base URL
const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';

const FILE_NAME = 'Pencatatan Keuangan Pribadi (Keuangan App)';

/**
 * Searches user's Google Drive for an existing transaction sheet.
 */
export async function getOrCreateSpreadsheet(accessToken: string): Promise<SheetInfo> {
  // 1. Search for the spreadsheet file by name
  const query = `name = '${FILE_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  const url = `${DRIVE_BASE_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  
  const searchRes = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Failed to search Google Drive: ${errText}`);
  }

  const searchData = await searchRes.json();
  let spreadsheetId = '';

  if (searchData.files && searchData.files.length > 0) {
    spreadsheetId = searchData.files[0].id;
  } else {
    // 2. Create a new Spreadsheet if not found
    const createUrl = `${DRIVE_BASE_URL}/files`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FILE_NAME,
        mimeType: 'application/vnd.google-apps.spreadsheet',
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create spreadsheet: ${errText}`);
    }

    const createData = await createRes.json();
    spreadsheetId = createData.id;
  }

  // 3. Fetch Spreadsheet metadata to get first worksheet title and sheetId
  return await fetchSheetMetadata(spreadsheetId, accessToken);
}

/**
 * Fetches sheetName and sheetId from spreadsheet metadata.
 */
export async function fetchSheetMetadata(spreadsheetId: string, accessToken: string): Promise<SheetInfo> {
  const metaUrl = `${SHEETS_BASE_URL}/${spreadsheetId}`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Failed to fetch spreadsheet metadata: ${errText}`);
  }

  const metaData = await metaRes.json();
  const sheets = metaData.sheets;
  
  if (!sheets || sheets.length === 0) {
    throw new Error('Spreadsheet has no worksheets.');
  }

  const sheetName = sheets[0].properties.title;
  const sheetId = sheets[0].properties.sheetId;

  // Initialize headers if spreadsheet is brand new/empty
  await ensureSheetHeaders(spreadsheetId, sheetName, accessToken);

  return {
    spreadsheetId,
    sheetName,
    sheetId,
  };
}

/**
 * Writes standard headers to A1:F1 if the sheet is empty or headers are missing.
 */
async function ensureSheetHeaders(spreadsheetId: string, sheetName: string, accessToken: string): Promise<void> {
  const checkUrl = `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:F1`;
  const checkRes = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (checkRes.ok) {
    const data = await checkRes.json();
    if (data.values && data.values.length > 0) {
      // Headers already exist
      return;
    }
  }

  // Write headers
  const updateUrl = `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:F1?valueInputOption=USER_ENTERED`;
  await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [['ID', 'Tanggal', 'Kategori', 'Tipe', 'Jumlah Uang', 'Keterangan']],
    }),
  });
}

/**
 * Reads all entries from Google Sheet and parses them to Transactions.
 */
export async function fetchTransactionsFromSheet(sheetInfo: SheetInfo, accessToken: string): Promise<Transaction[]> {
  const { spreadsheetId, sheetName } = sheetInfo;
  const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:F`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to read spreadsheet data: ${errText}`);
  }

  const data = await res.json();
  const values = data.values;

  if (!values || values.length <= 1) {
    return []; // Only headers exist
  }

  // Parse values (index 0 is header)
  const transactions: Transaction[] = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

    transactions.push({
      id: row[0],
      date: row[1] || '',
      category: row[2] || 'Lain-lain',
      type: (row[3] === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran') as 'Pemasukan' | 'Pengeluaran',
      amount: parseFloat(String(row[4] || '0').replace(/[^\d.-]/g, '')) || 0,
      notes: row[5] || '',
    });
  }

  // Return sorted descending by Date
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Appends a new transaction row to the Google Sheet.
 */
export async function appendTransactionToSheet(
  sheetInfo: SheetInfo,
  transaction: Transaction,
  accessToken: string
): Promise<void> {
  const { spreadsheetId, sheetName } = sheetInfo;
  const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:F:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [
        [
          transaction.id,
          transaction.date,
          transaction.category,
          transaction.type,
          transaction.amount,
          transaction.notes,
        ],
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to append transaction: ${errText}`);
  }
}

/**
 * Helper to retrieve row indices based on ID.
 * Returns 1-based index (exactly how Google Sheets references rows).
 */
async function findRowIndexById(
  spreadsheetId: string,
  sheetName: string,
  id: string,
  accessToken: string
): Promise<number> {
  const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:A`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Failed to search row ID in spreadsheet');
  }

  const data = await res.json();
  const values = data.values;
  if (!values) return -1;

  for (let i = 0; i < values.length; i++) {
    if (values[i] && values[i][0] === id) {
      return i + 1; // 1-based index
    }
  }

  return -1;
}

/**
 * Updates an existing transaction in place.
 */
export async function updateTransactionInSheet(
  sheetInfo: SheetInfo,
  transaction: Transaction,
  accessToken: string
): Promise<void> {
  const { spreadsheetId, sheetName } = sheetInfo;
  
  // 1. Locate row index from latest spreadsheet state
  const rowIndex = await findRowIndexById(spreadsheetId, sheetName, transaction.id, accessToken);
  if (rowIndex === -1) {
    throw new Error(`Transaksi dengan ID ${transaction.id} tidak ditemukan di Google Sheet.`);
  }

  // 2. Put values in matching range
  const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A${rowIndex}:F${rowIndex}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [
        [
          transaction.id,
          transaction.date,
          transaction.category,
          transaction.type,
          transaction.amount,
          transaction.notes,
        ],
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update transaction: ${errText}`);
  }
}

/**
 * Deletes a transaction row using deleteDimension batchUpdate request.
 */
export async function deleteTransactionFromSheet(
  sheetInfo: SheetInfo,
  transactionId: string,
  accessToken: string
): Promise<void> {
  const { spreadsheetId, sheetName, sheetId } = sheetInfo;

  // 1. Locate row index from latest spreadsheet state
  const rowIndex = await findRowIndexById(spreadsheetId, sheetName, transactionId, accessToken);
  if (rowIndex === -1) {
    throw new Error(`Transaksi dengan ID ${transactionId} tidak ditemukan di Google Sheet.`);
  }

  // 2. Send batchUpdate to delete single index row
  const url = `${SHEETS_BASE_URL}/${spreadsheetId}:batchUpdate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-based, inclusive
              endIndex: rowIndex,       // 0-based, exclusive
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to delete transaction row: ${errText}`);
  }
}
