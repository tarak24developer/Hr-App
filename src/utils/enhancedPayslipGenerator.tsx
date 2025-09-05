import * as XLSX from 'xlsx';

interface SalaryData {
  employeeName: string;
  grossSalary: number;
  basicAndDA: number;
  hra: number;
  specialAllowance: number;
  calculatedGross: number;
  pf: number;
  esi: number;
  pt: number;
  salaryAdvance: number;
  advanceDeduction: number;
  balanceAdvance: number;
  totalDeductions: number;
  netPayable: number;
  otPayment: number;
  finalPayable: number;
}

class EnhancedPayslipGenerator {
  private workbook: XLSX.WorkBook | null = null;
  private worksheet: XLSX.WorkSheet | null = null;

  generateSalaryStatement(salarySheet: SalaryData[], month: string, year: string, overtimeRate: number = 0) {
    this.initDocument();
    this.addHeader(month, year, overtimeRate);
    this.addSalarySheetData(salarySheet);
    this.addSummaryTotals(salarySheet);
    
    if (this.workbook && this.worksheet) {
      XLSX.utils.book_append_sheet(this.workbook, this.worksheet, 'Salary Statement');
      
      // Generate filename
      const filename = `Salary_Statement_${month}-${year}.xlsx`;
      XLSX.writeFile(this.workbook, filename);
      
      console.log(`Salary statement generated: ${filename}`);
    }
  }

  private initDocument() {
    this.workbook = XLSX.utils.book_new();
    this.worksheet = XLSX.utils.aoa_to_sheet([]);
  }

  private addHeader(month: string, year: string, overtimeRate: number) {
    if (!this.worksheet) return;

    const headerData = [
      ['SALARY STATEMENT'],
      [`Month: ${month} | Year: ${year} | Overtime Rate: ${overtimeRate}`],
      [''],
      ['Employee Details', 'Gross Salary', 'Basic + DA', 'HRA', 'Special Allowance', 'Calculated Gross', 'PF', 'ESI', 'PT', 'Salary Advance', 'Advance Deduction', 'Balance Advance', 'Total Deductions', 'Net Payable', 'OT Payment', 'Final Payable']
    ];

    XLSX.utils.sheet_add_aoa(this.worksheet, headerData, { origin: 'A1' });
  }

  private addSalarySheetData(salarySheet: SalaryData[]) {
    if (!this.worksheet) return;

    const rows = salarySheet.map(emp => [
      emp.employeeName,
      emp.grossSalary,
      emp.basicAndDA,
      emp.hra,
      emp.specialAllowance,
      emp.calculatedGross,
      emp.pf,
      emp.esi,
      emp.pt,
      emp.salaryAdvance,
      emp.advanceDeduction,
      emp.balanceAdvance,
      emp.totalDeductions,
      emp.netPayable,
      emp.otPayment,
      emp.finalPayable
    ]);

    this.addRowsToWorksheet(rows);
  }

  private addSummaryTotals(salarySheet: SalaryData[]) {
    if (!this.worksheet) return;

    const totalsData = [
      [''],
      ['TOTALS'],
      [
        'Total Employees: ' + salarySheet.length,
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.grossSalary, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.basicAndDA, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.hra, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.specialAllowance, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.calculatedGross, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.pf, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.esi, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.pt, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.salaryAdvance, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.advanceDeduction, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.balanceAdvance, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.totalDeductions, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.netPayable, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.otPayment, 0),
        salarySheet.reduce((sum: number, emp: SalaryData) => sum + emp.finalPayable, 0)
      ]
    ];

    if (this.worksheet) {
      XLSX.utils.sheet_add_aoa(this.worksheet, totalsData, { origin: 'A' + (salarySheet.length + 6) });
    }
  }

  private addRowsToWorksheet(rows: (string | number)[][]) {
    if (!this.worksheet) return;

    // Get current range
    const currentRange = XLSX.utils.decode_range(this.worksheet['!ref'] || 'A1');
    const startRow = currentRange.e.r + 1;

    // Add rows
    rows.forEach((row: (string | number)[], index: number) => {
      row.forEach((cell: string | number, colIndex: number) => {
        const cellAddress = XLSX.utils.encode_cell({ r: startRow + index, c: colIndex });
        if (this.worksheet) {
          this.worksheet[cellAddress] = { v: cell };
        }
      });
    });

    // Update range
    if (this.worksheet) {
      const newRange = XLSX.utils.decode_range(this.worksheet['!ref'] || 'A1');
      newRange.e.r = Math.max(newRange.e.r, startRow + rows.length - 1);
      this.worksheet['!ref'] = XLSX.utils.encode_range(newRange);
    }
  }

  // Removed unused method _setColumnWidths
}

export const generateEnhancedSalaryStatement = async (salarySheet: SalaryData[], month: string, year: string, overtimeRate: number = 0): Promise<{ success: boolean; filename?: string; error?: string }> => {
  try {
    const generator = new EnhancedPayslipGenerator();
    generator.generateSalaryStatement(salarySheet, month, year, overtimeRate);
    
    const filename = `Salary_Statement_${month}-${year}.xlsx`;
    return { success: true, filename };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

