/**
 * =========================================================
 * CODE.GS — Apps Script backend for the voting site
 * -----------------------------------------------------------
 * Deploy this bound to a Google Sheet with one sheet named
 * "Votes" and this header row in row 1:
 *
 *   Timestamp | Google User ID | Email | Candidate Name | Candidate ID
 *
 * See SETUP_GUIDE.md for deployment steps.
 * ========================================================= */

const SHEET_NAME = 'Votes';

// Column indexes (0-based) matching the header row above.
const COL_TIMESTAMP = 0;
const COL_GOOGLE_ID = 1;
const COL_EMAIL = 2;
const COL_CANDIDATE_NAME = 3;
const COL_CANDIDATE_ID = 4;

/**
 * API 1 — Submit Vote
 * Expects a POST body (text/plain, JSON-encoded) with:
 *   { email, googleId, candidateId, candidateName }
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const data = JSON.parse(e.postData.contents);

    if (data.action === 'setStatus') {
      const validPass = getPassword_();
      if (String(data.password) !== validPass) {
        return jsonResponse({ success: false, message: 'Invalid password' });
      }
      PropertiesService.getScriptProperties().setProperty('VOTING_STATUS', data.status);
      return jsonResponse({ success: true, message: 'Status updated to ' + data.status, status: data.status });
    }

    const status = PropertiesService.getScriptProperties().getProperty('VOTING_STATUS') || 'OPEN';
    if (status === 'CLOSED') {
      return jsonResponse({ success: false, message: 'Voting is closed' });
    }

    if (!data.email || !data.candidateId) {
      return jsonResponse({ success: false, message: 'Missing required fields' });
    }

    const sheet = getSheet_();

    // Server-side duplicate check — Fast TextFinder approach for 10k users
    const emailCol = sheet.getRange(1, COL_EMAIL + 1, Math.max(1, sheet.getLastRow()), 1);
    const textFinder = emailCol.createTextFinder(data.email).matchEntireCell(true).matchCase(false);
    const match = textFinder.findNext();
    
    if (match && match.getRow() > 1) {
      const previousVoteId = sheet.getRange(match.getRow(), COL_CANDIDATE_ID + 1).getValue();
      return jsonResponse({ success: false, message: 'Already Voted', candidateId: previousVoteId });
    }

    sheet.appendRow([
      new Date(),
      data.googleId || '',
      data.email,
      data.candidateName || '',
      data.candidateId
    ]);

    incrementCount_(data.candidateId, data.candidateName);

    return jsonResponse({ success: true, message: 'Vote Submitted Successfully' });

  } catch (err) {
    return jsonResponse({ success: false, message: 'Server Error: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/**
 * API 2 — Get Live Results
 * GET .../exec?action=results
 */
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'results') {
    return jsonResponse(getResults_());
  }
  if (action === 'check') {
    return jsonResponse(checkVote_(e.parameter.email));
  }
  if (action === 'verifyPassword') {
    const validPass = getPassword_();
    if (String(e.parameter.pass) === validPass) {
      return jsonResponse({ success: true });
    }
    return jsonResponse({ success: false, message: 'Invalid password' });
  }

  if (action === 'vote') {
    return handleVoteGet_(e.parameter);
  }

  return ContentService.createTextOutput('Voting API is running.');
}

function handleVoteGet_(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const status = PropertiesService.getScriptProperties().getProperty('VOTING_STATUS') || 'OPEN';
    if (status === 'CLOSED') {
      return jsonResponse({ success: false, message: 'Voting is closed' });
    }

    if (!data.email || !data.candidateId) {
      return jsonResponse({ success: false, message: 'Missing required fields' });
    }

    const sheet = getSheet_();

    // Server-side duplicate check — Fast TextFinder approach for 10k users
    const emailCol = sheet.getRange(1, COL_EMAIL + 1, Math.max(1, sheet.getLastRow()), 1);
    const textFinder = emailCol.createTextFinder(data.email).matchEntireCell(true).matchCase(false);
    const match = textFinder.findNext();
    
    if (match && match.getRow() > 1) {
      const previousVoteId = sheet.getRange(match.getRow(), COL_CANDIDATE_ID + 1).getValue();
      return jsonResponse({ success: false, message: 'Already Voted', candidateId: previousVoteId });
    }

    sheet.appendRow([
      new Date(),
      data.googleId || '',
      data.email,
      data.candidateName || '',
      data.candidateId
    ]);

    incrementCount_(data.candidateId, data.candidateName);

    return jsonResponse({ success: true, message: 'Vote Submitted Successfully' });

  } catch (err) {
    return jsonResponse({ success: false, message: 'Server Error: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

function getResults_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('LIVE_RESULTS');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {}
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let summarySheet = ss.getSheetByName('Summary_Live_Vote');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Summary_Live_Vote');
    summarySheet.appendRow(['Candidate ID', 'Candidate Name', 'Votes']);
  } else {
    // If it still has the old QUERY formula, convert it to static values
    const a1Formula = summarySheet.getRange('A1').getFormula();
    if (a1Formula) {
      const range = summarySheet.getDataRange();
      range.setValues(range.getValues());
    }
  }

  const values = summarySheet.getDataRange().getValues();

  const counts = {};
  const names = {};

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const cid = String(row[0]);
    // Skip empty, headers, or #N/A (if QUERY returns no data)
    if (!cid || cid === 'Candidate ID' || cid === 'Candidate Name' || cid === '#N/A') continue;
    
    names[cid] = String(row[1]);
    counts[cid] = Number(row[2]) || 0;
  }

  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);
  const status = PropertiesService.getScriptProperties().getProperty('VOTING_STATUS') || 'OPEN';

  const candidates = {};
  Object.keys(counts).forEach(cid => {
    candidates[cid] = {
      name: names[cid],
      votes: counts[cid],
      percentage: totalVotes > 0 ? Math.round((counts[cid] / totalVotes) * 1000) / 10 : 0
    };
  });

  const result = { totalVotes, candidates, votingStatus: status };
  
  try {
    // Cache for 15 seconds to handle massive traffic smoothly
    cache.put('LIVE_RESULTS', JSON.stringify(result), 15);
  } catch(e) {}

  return result;
}

function checkVote_(email) {
  if (!email) return { voted: false };
  const sheet = getSheet_();
  
  const emailCol = sheet.getRange(1, COL_EMAIL + 1, Math.max(1, sheet.getLastRow()), 1);
  const textFinder = emailCol.createTextFinder(email).matchEntireCell(true).matchCase(false);
  const match = textFinder.findNext();
  
  if (match && match.getRow() > 1) {
    const previousVoteId = sheet.getRange(match.getRow(), COL_CANDIDATE_ID + 1).getValue();
    return { voted: true, candidateId: previousVoteId };
  }
  
  return { voted: false };
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Google User ID', 'Email', 'Candidate Name', 'Candidate ID']);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getPassword_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Sheet2');
  if (!sheet) {
    sheet = ss.insertSheet('Sheet2');
    sheet.appendRow(['Password']);
    sheet.appendRow(['1234']); // Default password
  }
  const data = sheet.getDataRange().getValues();
  return data.length > 1 ? String(data[1][0]) : '1234';
}

function incrementCount_(candidateId, candidateName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let summarySheet = ss.getSheetByName('Summary_Live_Vote');
  
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Summary_Live_Vote');
    summarySheet.appendRow(['Candidate ID', 'Candidate Name', 'Votes']);
  }
  
  // If it still has a formula (from the old version), convert to static values
  const a1Formula = summarySheet.getRange('A1').getFormula();
  if (a1Formula) {
    const range = summarySheet.getDataRange();
    range.setValues(range.getValues());
  }

  const range = summarySheet.getDataRange();
  const values = range.getValues();
  let found = false;
  
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(candidateId)) {
      const newCount = (Number(values[i][2]) || 0) + 1;
      summarySheet.getRange(i + 1, 3).setValue(newCount);
      found = true;
      break;
    }
  }
  
  if (!found) {
    summarySheet.appendRow([candidateId, candidateName, 1]);
  }
}
