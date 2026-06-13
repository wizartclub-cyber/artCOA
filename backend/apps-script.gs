/* ArtCOA — central usage table backend (Google Apps Script + Google Sheet)
 * ===========================================================================
 * This gives you ONE central spreadsheet with every certificate use, device
 * info and IP/location — free, no server. The static site POSTs events here.
 *
 * SETUP (≈5 minutes):
 *   1. Create a new Google Sheet (sheets.new). It will hold the data.
 *   2. Extensions → Apps Script. Delete the sample code.
 *   3. Paste THIS whole file. Save.
 *   4. Deploy → New deployment → type "Web app".
 *        - Execute as:   Me
 *        - Who has access: Anyone
 *      Deploy, authorise, and COPY the "Web app URL".
 *   5. Open analytics.js in the site and set:
 *        var ANALYTICS_ENDPOINT = 'PASTE_THE_WEB_APP_URL_HERE';
 *      Commit & push. Done — new uses appear as rows in the Sheet.
 *
 * Re-deploying after edits: Deploy → Manage deployments → edit → Version: New.
 * ===========================================================================
 */

var SHEET_NAME = 'Certificates';

var HEADERS = [
  'Timestamp', 'Action', 'Serial', 'Artist', 'Title', 'Year', 'Technique', 'Support',
  'Sheet size', 'Artwork area', 'Status Edition', 'Edition ID', 'Edition no', 'Edition total',
  'Gallery', 'Issued', 'Lang',
  'IP', 'City', 'Region', 'Country', 'ISP/Org', 'VisitorID',
  'UserAgent', 'Platform', 'Language', 'Screen', 'Viewport', 'DPR', 'Timezone', 'Referrer'
];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  // Ensure row 1 always matches the current HEADERS (auto-fixes after a schema change).
  var needHeader = sheet.getLastRow() === 0;
  if (!needHeader) {
    var first = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (first.join('') !== HEADERS.join('')) needHeader = true;
  }
  if (needHeader) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Receives an event from analytics.js and appends one row.
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var d = {};
    try { d = JSON.parse(e.postData.contents); } catch (err) { d = {}; }
    var dev = d.device || {};
    getSheet_().appendRow([
      d.ts || '', d.action || '', d.serial || '', d.artist || '', d.title || '',
      d.year || '', d.technique || '', d.support || '', d.sheet || '', d.area || '',
      d.status || '', d.editionId || '', d.editionNo || '', d.editionTotal || '',
      d.gallery || '', d.issued || '', d.lang || '',
      d.ip || '', d.city || '', d.region || '', d.country || '', d.org || '', d.visitorId || '',
      dev.userAgent || '', dev.platform || '', dev.language || '', dev.screen || '',
      dev.viewport || '', dev.dpr || '', dev.timezone || '', dev.referrer || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Optional: GET returns all rows as JSON (handy for custom dashboards).
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var rows = sheet ? sheet.getDataRange().getValues() : [];
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, count: Math.max(0, rows.length - 1), rows: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}
