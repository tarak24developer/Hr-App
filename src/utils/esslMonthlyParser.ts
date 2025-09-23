import * as XLSX from 'xlsx';

export type EsslMonthlyRow = {
  empCode: string;
  employeeName: string;
  department: string;
  presentDays: number;
  absentDays: number;
  wo: number; // weekly offs
  cl: number; // casual leave
  pl: number; // privilege leave
  sl: number; // sick leave
  totalLeave: number;
  totalPresent: number;
  totalPayDays: number;
  otHours: number; // in hours (decimal)
  lateBy: string; // e.g. 01:30
  earlyBy: string; // e.g. 00:45
  monthKey: string; // YYYY-MM
};

export type EsslParseResult = {
  rows: EsslMonthlyRow[];
  errors: string[];
  headers: string[];
};

const HEADER_ALIASES: Record<string, keyof EsslMonthlyRow> = {
  'Emp. Code': 'empCode',
  'Emp Code': 'empCode',
  'Employee Code': 'empCode',
  'Employee Name': 'employeeName',
  'Department': 'department',
  'Present days': 'presentDays',
  'Present Days': 'presentDays',
  'Absent days': 'absentDays',
  'Absent Days': 'absentDays',
  'WO': 'wo',
  'CL': 'cl',
  'PL': 'pl',
  'SL': 'sl',
  'Total Leave': 'totalLeave',
  'Total Present': 'totalPresent',
  'Total Pay Days': 'totalPayDays',
  'OT Hours': 'otHours',
  'Late By': 'lateBy',
  'Early By': 'earlyBy'
};

const REQUIRED_FIELDS: Array<keyof EsslMonthlyRow> = [
  'empCode','employeeName','department','presentDays','absentDays','totalLeave','totalPresent','totalPayDays'
];

function coerceNumber(value: any): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.:-]/g, '');
  if (cleaned.includes(':')) {
    const [h, m] = cleaned.split(':').map(v => parseInt(v || '0', 10));
    return Math.round(((h || 0) + (m || 0) / 60) * 100) / 100;
  }
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export async function parseEsslCsv(file: File, monthKey: string): Promise<EsslParseResult> {
  const text = await file.text();
  // Try XLSX to handle CSV quirks
  const wb = XLSX.read(text, { type: 'string' });
  const firstSheetName = (wb.SheetNames && wb.SheetNames.length > 0) ? wb.SheetNames[0] : undefined;
  if (!firstSheetName) {
    return { rows: [], errors: ['No sheets found in uploaded CSV'], headers: Object.keys(HEADER_ALIASES) };
  }
  const ws = wb.Sheets[firstSheetName];
  if (!ws) {
    return { rows: [], errors: ['Could not read the first sheet'], headers: Object.keys(HEADER_ALIASES) };
  }
  const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const headers = Object.keys(HEADER_ALIASES);
  const errors: string[] = [];

  const rows: EsslMonthlyRow[] = json.map((raw, idx) => {
    const mapped: Partial<EsslMonthlyRow> = {};
    for (const key in raw) {
      const alias = HEADER_ALIASES[key.trim()];
      if (!alias) continue;
      const v = raw[key];
      switch (alias) {
        case 'presentDays':
        case 'absentDays':
        case 'wo':
        case 'cl':
        case 'pl':
        case 'sl':
        case 'totalLeave':
        case 'totalPresent':
        case 'totalPayDays':
        case 'otHours':
          (mapped as any)[alias] = coerceNumber(v);
          break;
        default:
          (mapped as any)[alias] = String(v ?? '').trim();
      }
    }

    const row: EsslMonthlyRow = {
      empCode: String((mapped.empCode ?? '')).trim(),
      employeeName: String((mapped.employeeName ?? '')).trim(),
      department: String((mapped.department ?? '')).trim(),
      presentDays: mapped.presentDays ?? 0,
      absentDays: mapped.absentDays ?? 0,
      wo: mapped.wo ?? 0,
      cl: mapped.cl ?? 0,
      pl: mapped.pl ?? 0,
      sl: mapped.sl ?? 0,
      totalLeave: mapped.totalLeave ?? ((mapped.cl ?? 0) + (mapped.pl ?? 0) + (mapped.sl ?? 0)),
      totalPresent: mapped.totalPresent ?? (mapped.presentDays ?? 0),
      totalPayDays: mapped.totalPayDays ?? ((mapped.presentDays ?? 0) + (mapped.wo ?? 0) + (mapped.cl ?? 0) + (mapped.pl ?? 0) + (mapped.sl ?? 0)),
      otHours: mapped.otHours ?? 0,
      lateBy: (mapped.lateBy as any) ? String(mapped.lateBy) : '00:00',
      earlyBy: (mapped.earlyBy as any) ? String(mapped.earlyBy) : '00:00',
      monthKey
    };

    REQUIRED_FIELDS.forEach(f => {
      if (String((row as any)[f] ?? '') === '' || (typeof (row as any)[f] === 'number' && isNaN((row as any)[f]))) {
        errors.push(`Row ${idx + 2}: Missing/invalid ${f}`);
      }
    });

    return row;
  });

  return { rows, errors, headers };
}

export async function parseEsslPdf(_file: File, _monthKey: string): Promise<EsslParseResult> {
  // Placeholder: PDF parsing would need a PDF text extractor. For now, instruct CSV usage.
  return { rows: [], errors: ['PDF parsing not yet implemented. Please upload CSV exported from ESSL.'], headers: Object.keys(HEADER_ALIASES) };
}

export function summarizeByDepartment(rows: EsslMonthlyRow[]) {
  const summary: Record<string, {
    employees: number;
    presentDays: number;
    absentDays: number;
    totalLeave: number;
    totalPayDays: number;
    otHours: number;
  }> = {};
  rows.forEach(r => {
    if (!summary[r.department]) {
      summary[r.department] = { employees: 0, presentDays: 0, absentDays: 0, totalLeave: 0, totalPayDays: 0, otHours: 0 };
    }
    const s = summary[r.department]!;
    s.employees += 1;
    s.presentDays += r.presentDays || 0;
    s.absentDays += r.absentDays || 0;
    s.totalLeave += r.totalLeave || 0;
    s.totalPayDays += r.totalPayDays || 0;
    s.otHours += r.otHours || 0;
  });
  return summary;
}

export const MONTHLY_ATTENDANCE_HEADERS = [
  'Emp Code','Employee Name','Department','Present Days','Absent Days','WO','CL','PL','SL','Total Leave','Total Present','Total Pay Days','OT Hours','Late By','Early By','Month'
];

export function toMonthlyExportRows(rows: EsslMonthlyRow[]) {
  return rows.map(r => ({
    'Emp Code': r.empCode,
    'Employee Name': r.employeeName,
    'Department': r.department,
    'Present Days': r.presentDays,
    'Absent Days': r.absentDays,
    'WO': r.wo,
    'CL': r.cl,
    'PL': r.pl,
    'SL': r.sl,
    'Total Leave': r.totalLeave,
    'Total Present': r.totalPresent,
    'Total Pay Days': r.totalPayDays,
    'OT Hours': r.otHours,
    'Late By': r.lateBy,
    'Early By': r.earlyBy,
    'Month': r.monthKey
  }));
}


