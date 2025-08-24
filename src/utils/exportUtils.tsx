import * as XLSX from 'xlsx';

export type ExportFormat = 'xlsx' | 'csv' | 'json';
export type ExportDataType = 'employees' | 'attendance' | 'payroll' | 'leaves' | 'assets' | 'training' | 'incidents' | 'expenses' | 'holidays' | 'announcements' | 'documents' | 'departments' | 'designations';

interface ExportData {
  [key: string]: any;
}

interface ExportOptions {
  filename?: string;
  sheetName?: string;
  format?: ExportFormat;
}

// Common headers for different data types
const commonHeaders: Record<ExportDataType, string[]> = {
  employees: ['ID', 'Name', 'Email', 'Department', 'Position', 'Hire Date', 'Status'],
  attendance: ['ID', 'Employee', 'Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status'],
  payroll: ['ID', 'Employee', 'Month', 'Year', 'Basic Salary', 'Allowances', 'Deductions', 'Gross Salary', 'Net Salary'],
  leaves: ['ID', 'Employee', 'Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'],
  assets: ['ID', 'Name', 'Type', 'Serial Number', 'Assigned To', 'Purchase Date', 'Cost', 'Status'],
  training: ['ID', 'Title', 'Type', 'Instructor', 'Start Date', 'End Date', 'Duration', 'Status'],
  incidents: ['ID', 'Title', 'Type', 'Severity', 'Reported By', 'Reported At', 'Status'],
  expenses: ['ID', 'Employee', 'Type', 'Amount', 'Date', 'Description', 'Status'],
  holidays: ['ID', 'Name', 'Date', 'Type', 'Description'],
  announcements: ['ID', 'Title', 'Content', 'Author', 'Created At', 'Priority'],
  documents: ['ID', 'Title', 'Type', 'Category', 'Uploaded By', 'Uploaded At', 'File Size'],
  departments: ['ID', 'Name', 'Manager', 'Description', 'Created At'],
  designations: ['ID', 'Title', 'Department', 'Description', 'Created At']
};

// Get headers for a specific data type
const getHeaders = (dataType: ExportDataType, data: ExportData[]): string[] => {
  if (data.length === 0) return [];
  
  // Use common headers if available, otherwise extract from data
  return commonHeaders[dataType] || Object.keys(data[0] || {});
};

// Export data to different formats
export const exportData = async (
  data: ExportData[],
  dataType: ExportDataType,
  options: ExportOptions = {}
): Promise<{ success: boolean; filename?: string; error?: string }> => {
  try {
    const {
      filename = `${dataType}_export_${new Date().toISOString().split('T')[0]}`,
      sheetName = dataType.charAt(0).toUpperCase() + dataType.slice(1),
      format = 'xlsx'
    } = options;

    if (!data || data.length === 0) {
      return { success: false, error: 'No data to export' };
    }

    const headers = getHeaders(dataType, data);
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

    // Set column widths
    const columnWidths = headers.map(header => ({
      wch: Math.max(header.length, 15)
    }));
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    let finalFilename: string;
    let mimeType: string;

    switch (format) {
      case 'xlsx':
        finalFilename = `${filename}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        finalFilename = `${filename}.csv`;
        mimeType = 'text/csv';
        break;
      case 'json':
        finalFilename = `${filename}.json`;
        mimeType = 'application/json';
        break;
      default:
        finalFilename = `${filename}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    if (format === 'json') {
      // Export as JSON
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.click();
      
      URL.revokeObjectURL(url);
    } else {
      // Export as Excel/CSV
      XLSX.writeFile(workbook, finalFilename);
    }

    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('Export error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Export failed' 
    };
  }
};

// Export multiple data types at once
export const exportMultipleData = async (
  dataSets: Array<{ data: ExportData[]; type: ExportDataType; sheetName?: string }>,
  options: ExportOptions = {}
): Promise<{ success: boolean; filename?: string; error?: string }> => {
  try {
    const {
      filename = `combined_export_${new Date().toISOString().split('T')[0]}`,
      format = 'xlsx'
    } = options;

    if (format === 'json') {
      // For JSON, combine all data into one object
      const combinedData: Record<string, ExportData[]> = {};
      dataSets.forEach(({ data, type }) => {
        combinedData[type] = data;
      });
      
      const finalFilename = `${filename}.json`;
      const blob = new Blob([JSON.stringify(combinedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      return { success: true, filename: finalFilename };
    }

    // For Excel/CSV, create multiple sheets
    const workbook = XLSX.utils.book_new();
    
    dataSets.forEach(({ data, type, sheetName }) => {
      if (data && data.length > 0) {
        const headers = getHeaders(type, data);
        const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
        
        // Set column widths
        const columnWidths = headers.map(header => ({
          wch: Math.max(header.length, 15)
        }));
        worksheet['!cols'] = columnWidths;
        
        const finalSheetName = sheetName || type.charAt(0).toUpperCase() + type.slice(1);
        XLSX.utils.book_append_sheet(workbook, worksheet, finalSheetName);
      }
    });

    const finalFilename = `${filename}.${format}`;
    XLSX.writeFile(workbook, finalFilename);

    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('Multiple export error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Multiple export failed' 
    };
  }
}; 