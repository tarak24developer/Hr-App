import * as XLSX from 'xlsx';

interface PayrollData {
  employeeName: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: string;
  year: string;
}

interface EmployeeData {
  employeeName: string;
  employeeId: string;
  department: string;
  designation: string;
  joinDate: string;
}

class PayslipGenerator {
  private workbook: XLSX.WorkBook | null = null;
  private worksheet: XLSX.WorkSheet | null = null;

  initDocument(employeeName: string, month: string, year: string) {
    this.workbook = XLSX.utils.book_new();
    this.worksheet = XLSX.utils.aoa_to_sheet([]);
    
    // Add header information
    const headerData = [
      ['PAYSLIP'],
      [`Employee: ${employeeName}`],
      [`Month: ${month} | Year: ${year}`],
      [''],
      ['Earnings', 'Amount', '', 'Deductions', 'Amount']
    ];

    if (this.worksheet) {
      XLSX.utils.sheet_add_aoa(this.worksheet, headerData, { origin: 'A1' });
    }
  }

  addEmployeeInfo(payrollData: PayrollData, employeeData: EmployeeData) {
    if (!this.worksheet) return;

    const employeeInfoData = [
      [''],
      ['Employee Details'],
      ['Name:', employeeData.employeeName],
      ['ID:', employeeData.employeeId],
      ['Department:', employeeData.department],
      ['Designation:', employeeData.designation],
      ['Join Date:', employeeData.joinDate],
      [''],
      ['Payroll Details'],
      ['Month:', payrollData.month],
      ['Year:', payrollData.year]
    ];

    if (this.worksheet) {
      XLSX.utils.sheet_add_aoa(this.worksheet, employeeInfoData, { origin: 'A4' });
    }
  }

  addEarnings(payrollData: PayrollData) {
    if (!this.worksheet) return;

    const earningsData = [
      [''],
      ['Earnings Breakdown'],
      ['Basic Salary:', payrollData.basicSalary],
      ['Allowances:', payrollData.allowances],
      ['Total Earnings:', payrollData.basicSalary + payrollData.allowances]
    ];

    if (this.worksheet) {
      XLSX.utils.sheet_add_aoa(this.worksheet, earningsData, { origin: 'A20' });
    }
  }

  addDeductions(payrollData: PayrollData) {
    if (!this.worksheet) return;

    const deductionsData = [
      [''],
      ['Deductions Breakdown'],
      ['Total Deductions:', payrollData.deductions],
      [''],
      ['Net Salary:', payrollData.netSalary]
    ];

    if (this.worksheet) {
      XLSX.utils.sheet_add_aoa(this.worksheet, deductionsData, { origin: 'A30' });
    }
  }

  addTotals(payrollData: PayrollData) {
    if (!this.worksheet) return;

    const totalsData = [
      [''],
      ['Summary'],
      ['Gross Salary:', payrollData.basicSalary + payrollData.allowances],
      ['Total Deductions:', payrollData.deductions],
      ['Net Payable:', payrollData.netSalary],
      [''],
      ['Generated on:', new Date().toLocaleDateString()],
      ['This is a computer generated document']
    ];

    if (this.worksheet) {
      XLSX.utils.sheet_add_aoa(this.worksheet, totalsData, { origin: 'A40' });
    }
  }

  generatePayslip(payrollData: PayrollData, employeeData: EmployeeData, companyName: string = 'Your Company Name') {
    try {
      // Initialize document
      this.initDocument(employeeData.employeeName, payrollData.month, payrollData.year);
      
      // Add company header
      if (this.worksheet) {
        XLSX.utils.sheet_add_aoa(this.worksheet, [['Company:', companyName]], { origin: 'A1' });
      }
      
      // Add all sections
      this.addEmployeeInfo(payrollData, employeeData);
      this.addEarnings(payrollData);
      this.addDeductions(payrollData);
      this.addTotals(payrollData);
      
      // Add worksheet to workbook
      if (this.workbook && this.worksheet) {
        XLSX.utils.book_append_sheet(this.workbook, this.worksheet, 'Payslip');
      }
      
      return this.workbook;
    } catch (error) {
      console.error('Error generating payslip:', error);
      return null;
    }
  }

  generateFilename(employeeName: string, month: string, year: string) {
    const cleanName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
    return `Payslip_${cleanName}_${month}_${year}.xlsx`;
  }
}

export const generateSinglePayslip = async (payrollData: PayrollData, employeeData: EmployeeData, companyName: string = 'Your Company Name') => {
  try {
    const generator = new PayslipGenerator();
    const workbook = generator.generatePayslip(payrollData, employeeData, companyName);
    
    if (workbook) {
      const filename = generator.generateFilename(employeeData.employeeName, payrollData.month, payrollData.year);
      XLSX.writeFile(workbook, filename);
      return { success: true, filename };
    } else {
      return { success: false, error: 'Failed to generate payslip' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const generateBulkPayslips = async (payrollsData: Array<{ payroll: PayrollData; employee: EmployeeData }>, companyName: string = 'Your Company Name') => {
  try {
    const results: Array<{ success: boolean; employee: string; filename?: string; error?: string }> = [];
    
    for (const item of payrollsData) {
      try {
        const result = await generateSinglePayslip(item.payroll, item.employee, companyName);
        if (result.success) {
          results.push({
            success: true,
            employee: item.employee.employeeName,
            filename: result.filename || ''
          });
        } else {
          results.push({ 
            success: false, 
            employee: item.employee.employeeName, 
            error: result.error 
          });
        }
      } catch (error: any) {
        results.push({ 
          success: false, 
          employee: item.employee.employeeName, 
          error: error.message 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return { 
      success: true, 
      results, 
      summary: { 
        total: results.length, 
        success: successCount, 
        failure: failureCount 
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}; 