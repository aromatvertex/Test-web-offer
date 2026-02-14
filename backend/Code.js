// --- CONFIGURATION ---
// ⚠️ IMPORTANT: Replace this ID with your actual Google Sheet ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; 

// --- MAPPINGS ---
const FIELD_MAP = {
  'markup': 'Markup %',
  'selling_currency': 'Selling Currency',
  'number_ships': 'Number Ships',
  'comment': 'Comment',
  'incoterm_supplier': 'Incoterms Supplier',
  'incoterm_av': 'Incoterms A V',
  'transport_cost': 'Transportation Cost Per Quantity'
};

// --- MAIN ENTRY POINTS ---

function doGet(e) {
  try {
    // Safety check for e
    if (!e) e = { parameter: {} };

    // Check Config
    if (!SPREADSHEET_ID || SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      return createResponse(false, 'SETUP_REQUIRED: Please replace SPREADSHEET_ID in Code.gs with your actual Google Sheet ID.', null);
    }

    return handleApiRequest(e, 'GET');
  } catch (err) {
    // Catch-all for any unexpected errors
    return createResponse(false, 'SERVER_ERROR: ' + err.toString(), null);
  }
}

function doPost(e) {
  try {
     // Safety check for e
    if (!e) e = { postData: { contents: '{}' } };

    if (!SPREADSHEET_ID || SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      return createResponse(false, 'SETUP_REQUIRED: Please replace SPREADSHEET_ID in Code.gs with your actual Google Sheet ID.', null);
    }

    return handleApiRequest(e, 'POST');
  } catch (err) {
    // Catch-all for any unexpected errors
    return createResponse(false, 'SERVER_ERROR: ' + err.toString(), null);
  }
}

function doOptions(e) {
  // CORS Preflight
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// --- API CORE ---

function handleApiRequest(e, method) {
  // Lock to prevent race conditions
  const lock = LockService.getScriptLock();
  
  // Wait up to 10 seconds for other processes to finish
  if (!lock.tryLock(10000)) {
    return createResponse(false, 'Server busy (Lock timeout). Try again.', null);
  }

  try {
    let responseData = null;
    let message = 'Success';

    if (method === 'GET') {
      const action = e.parameter ? e.parameter.action : null;
      const id = e.parameter ? e.parameter.id : null;

      if (action === 'getCRMData') {
        responseData = { supplierRates: getStoredSupplierRates() };
      } else if (id) {
        responseData = getOfferData(id);
      } else {
        message = 'Vertex CRM API Ready';
        responseData = { status: 'connected', sheetId: SPREADSHEET_ID };
      }
    } else if (method === 'POST') {
      let postData;
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        throw new Error('Invalid JSON Body in Request');
      }
      
      if (postData.action === 'saveSupplierRates') {
        saveSupplierRates(postData.rates);
        message = 'Rates Saved';
      } else if (postData.operation) {
        responseData = handleOperation(postData);
        message = 'Operation Successful';
      } else {
        throw new Error('Missing operation in payload');
      }
    }

    return createResponse(true, message, responseData);

  } catch (err) {
    Logger.log('Logic Error: ' + err.toString());
    return createResponse(false, err.toString(), null);
  } finally {
    lock.releaseLock();
  }
}

function createResponse(success, message, data) {
  const payload = {
    success: success,
    message: message,
    data: data
  };
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- OPERATIONS DISPATCHER ---

function handleOperation(payload) {
  const op = payload.operation;
  switch (op) {
    case 'add_product': return addProduct(payload);
    case 'update_item_fields': return updateItem(payload);
    case 'toggle_included': return toggleIncluded(payload);
    case 'duplicate_offer_item': return duplicateItem(payload);
    case 'delete_offer_item': return deleteItem(payload);
    case 'delete_offer_items': return deleteItems(payload);
    case 'save_offer': return saveOffer(payload);
    default: throw new Error('Unknown operation: ' + op);
  }
}

// --- DATA ACCESS HELPERS ---

function getSheet(name) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error('Sheet not found: ' + name);
    return sheet;
  } catch (e) {
    throw new Error('Database Access Error: ' + e.message + '. Check SPREADSHEET_ID.');
  }
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function getColumnMap(sheet) {
  const headers = getHeaders(sheet);
  const map = {};
  headers.forEach((h, i) => map[h] = i + 1);
  return map;
}

function getDataWithHeaders(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return []; 

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getOfferData(offerId) {
  try {
    const offers = getDataWithHeaders('Offers');
    const allItems = getDataWithHeaders('OfferItems');
    const products = getDataWithHeaders('Products');
    const suppliers = getDataWithHeaders('Suppliers');
    const config = getDataWithHeaders('Config');

    const offer = offers.find(o => o['Offer ID'] === offerId);
    const items = allItems.filter(i => i['Offer ID'] === offerId);

    return {
      offer: offer || null,
      items: items || [],
      products: products || [],
      suppliers: suppliers || [],
      config: config || [],
      transportCosts: []
    };
  } catch (e) {
    // Return empty structures instead of failing completely if sheets are missing
    Logger.log('Error getting data: ' + e);
    return {
      offer: null, items: [], products: [], suppliers: [], config: [], transportCosts: []
    };
  }
}

// --- CRUD IMPLEMENTATION ---

function addProduct(p) {
  const sheet = getSheet('OfferItems');
  const headers = getHeaders(sheet);
  const colMap = getColumnMap(sheet);
  
  const tiers = [25, 100, 500];
  const newItems = [];

  tiers.forEach(qty => {
    const newId = Utilities.getUuid();
    const row = new Array(headers.length).fill('');
    
    // Map data to columns based on header name
    if (colMap['Offer Item ID']) row[colMap['Offer Item ID'] - 1] = newId;
    if (colMap['Offer ID']) row[colMap['Offer ID'] - 1] = p.offer_id;
    if (colMap['Product ID']) row[colMap['Product ID'] - 1] = p.product_id;
    if (colMap['Quantity Unit From']) row[colMap['Quantity Unit From'] - 1] = qty;
    if (colMap['Actual Quantity']) row[colMap['Actual Quantity'] - 1] = qty;
    
    if (colMap['Unit']) row[colMap['Unit'] - 1] = 'kg';
    if (colMap['Number Ships']) row[colMap['Number Ships'] - 1] = 1;
    if (colMap['Purchase Currency']) row[colMap['Purchase Currency'] - 1] = 'EUR';
    if (colMap['Selling Currency']) row[colMap['Selling Currency'] - 1] = 'EUR';
    if (colMap['Purchase Price']) row[colMap['Purchase Price'] - 1] = 0; 
    if (colMap['Included']) row[colMap['Included'] - 1] = true;
    if (colMap['Markup %']) row[colMap['Markup %'] - 1] = 0.15;
    if (colMap['Incoterms Supplier']) row[colMap['Incoterms Supplier'] - 1] = 'DAP';
    if (colMap['Incoterms A V']) row[colMap['Incoterms A V'] - 1] = 'DAP';
    if (colMap['Price Validity']) row[colMap['Price Validity'] - 1] = '2024-12-31';
    if (colMap['Created Time']) row[colMap['Created Time'] - 1] = new Date();

    sheet.appendRow(row);

    // Return the created item structure
    const itemObj = {};
    headers.forEach((h, i) => itemObj[h] = row[i]);
    newItems.push(itemObj);
  });

  return newItems;
}

function updateItem(p) {
  const sheet = getSheet('OfferItems');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIdx = headers.indexOf('Offer Item ID');
  
  if (idColIdx === -1) throw new Error('ID Column not found');

  let rowIdx = -1;
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idColIdx] == p.offer_item_id) {
      rowIdx = i + 1; 
      break;
    }
  }

  if (rowIdx === -1) throw new Error('Item not found');

  const colMap = getColumnMap(sheet);
  const updates = p.fields;
  
  for (const [key, val] of Object.entries(updates)) {
    const headerName = FIELD_MAP[key];
    if (headerName && colMap[headerName]) {
      sheet.getRange(rowIdx, colMap[headerName]).setValue(val);
    }
  }

  return { success: true };
}

function toggleIncluded(p) {
  const sheet = getSheet('OfferItems');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIdx = headers.indexOf('Offer Item ID');
  const incColIdx = headers.indexOf('Included');

  if (idColIdx === -1 || incColIdx === -1) throw new Error('Columns not found');

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idColIdx] == p.offer_item_id) {
      sheet.getRange(i + 1, incColIdx + 1).setValue(p.included);
      return { success: true };
    }
  }
  throw new Error('Item not found');
}

function duplicateItem(p) {
  const sheet = getSheet('OfferItems');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIdx = headers.indexOf('Offer Item ID');

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idColIdx] == p.offer_item_id) {
      const sourceRow = data[i];
      const newRow = [...sourceRow];
      const newId = Utilities.getUuid();
      
      newRow[idColIdx] = newId;
      
      if (p.overrides) {
        for (const [key, val] of Object.entries(p.overrides)) {
          const colIdx = headers.indexOf(key);
          if (colIdx > -1) newRow[colIdx] = val;
        }
      }

      sheet.appendRow(newRow);
      return { id: newId };
    }
  }
  throw new Error('Source item not found');
}

function deleteItem(p) {
  const sheet = getSheet('OfferItems');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIdx = headers.indexOf('Offer Item ID');

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idColIdx] == p.offer_item_id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Item not found' };
}

function deleteItems(p) {
  const sheet = getSheet('OfferItems');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIdx = headers.indexOf('Offer Item ID');
  const idsToDelete = new Set(p.offer_item_ids);

  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    if (idsToDelete.has(data[i][idColIdx])) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  return { success: true, count: deletedCount };
}

function saveOffer(p) {
  const sheet = getSheet('Offers');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIdx = headers.indexOf('Offer ID');
  const modTimeIdx = headers.indexOf('Modified Time');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idColIdx] == p.offer_id) {
      if (modTimeIdx > -1) {
        sheet.getRange(i + 1, modTimeIdx + 1).setValue(new Date());
      }
      return { success: true };
    }
  }
  return { success: true }; 
}

function getStoredSupplierRates() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('TransportConfig');
  if (!sheet) return {}; 
  
  const val = sheet.getRange('A1').getValue();
  try {
    return val ? JSON.parse(val) : {};
  } catch (e) {
    return {};
  }
}

function saveSupplierRates(rates) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('TransportConfig');
  if (!sheet) {
    sheet = ss.insertSheet('TransportConfig');
  }
  sheet.getRange('A1').setValue(JSON.stringify(rates));
}