/**
 * Analytics Engine
 * Advanced analytics and predictive insights for HR metrics
 */

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { User } from '@/types';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
  timestamp: string;
}

export interface AnalyticsDimension {
  name: string;
  value: string | number;
  count: number;
  percentage: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metrics: string[];
  actionable: boolean;
  suggestedActions?: string[];
  confidence?: number;
  createdAt: string;
}

export interface AnalyticsTimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

class AnalyticsEngine {
  /**
   * Get employee metrics
   */
  public async getEmployeeMetrics(params?: {
    startDate?: Date;
    endDate?: Date;
    departmentId?: string;
  }): Promise<{
    totalEmployees: AnalyticsMetric;
    activeEmployees: AnalyticsMetric;
    newHires: AnalyticsMetric;
    terminations: AnalyticsMetric;
    turnoverRate: AnalyticsMetric;
    averageTenure: AnalyticsMetric;
  }> {
    try {
      if (!db) throw new Error('Firestore not available');

      const startDate = params?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
      const endDate = params?.endDate || new Date();

      // Build query
      let q = query(collection(db, 'users'));
      if (params?.departmentId) {
        q = query(q, where('department', '==', params.departmentId));
      }

      const snapshot = await getDocs(q);
      const employees = snapshot.docs.map(doc => doc.data() as User);

      // Calculate current period metrics
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(e => e.status === 'active').length;
      const newHires = employees.filter(e => {
        const hireDate = new Date(e.hireDate);
        return hireDate >= startDate && hireDate <= endDate;
      }).length;
      const terminations = employees.filter(e => e.status === 'terminated').length;

      // Calculate previous period for comparison
      const previousStartDate = new Date(startDate);
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
      const previousEndDate = new Date(endDate);
      previousEndDate.setMonth(previousEndDate.getMonth() - 1);

      const previousNewHires = employees.filter(e => {
        const hireDate = new Date(e.hireDate);
        return hireDate >= previousStartDate && hireDate <= previousEndDate;
      }).length;

      // Calculate turnover rate
      const turnoverRate = activeEmployees > 0 ? (terminations / activeEmployees) * 100 : 0;

      // Calculate average tenure
      const tenures = employees
        .filter(e => e.status === 'active')
        .map(e => {
          const hireDate = new Date(e.hireDate);
          const diffTime = Math.abs(new Date().getTime() - hireDate.getTime());
          return diffTime / (1000 * 60 * 60 * 24 * 365); // years
        });
      const averageTenure = tenures.length > 0 
        ? tenures.reduce((sum, tenure) => sum + tenure, 0) / tenures.length 
        : 0;

      return {
        totalEmployees: this.createMetric('Total Employees', totalEmployees),
        activeEmployees: this.createMetric('Active Employees', activeEmployees),
        newHires: this.createMetric('New Hires', newHires, previousNewHires),
        terminations: this.createMetric('Terminations', terminations),
        turnoverRate: this.createMetric('Turnover Rate', turnoverRate, undefined, '%'),
        averageTenure: this.createMetric('Average Tenure', averageTenure, undefined, 'years')
      };
    } catch (error) {
      console.error('Error fetching employee metrics:', error);
      throw error;
    }
  }

  /**
   * Get attendance metrics
   */
  public async getAttendanceMetrics(params?: {
    startDate?: Date;
    endDate?: Date;
    employeeId?: string;
  }): Promise<{
    presentRate: AnalyticsMetric;
    absentRate: AnalyticsMetric;
    lateRate: AnalyticsMetric;
    averageHours: AnalyticsMetric;
  }> {
    try {
      if (!db) throw new Error('Firestore not available');

      const startDate = params?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
      const endDate = params?.endDate || new Date();

      let q = query(
        collection(db, 'attendance'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );

      if (params?.employeeId) {
        q = query(q, where('employeeId', '==', params.employeeId));
      }

      const snapshot = await getDocs(q);
      const attendanceRecords = snapshot.docs.map(doc => doc.data());

      const totalRecords = attendanceRecords.length;
      if (totalRecords === 0) {
        return {
          presentRate: this.createMetric('Present Rate', 0, undefined, '%'),
          absentRate: this.createMetric('Absent Rate', 0, undefined, '%'),
          lateRate: this.createMetric('Late Rate', 0, undefined, '%'),
          averageHours: this.createMetric('Average Hours', 0, undefined, 'hrs')
        };
      }

      const present = attendanceRecords.filter(r => r['status'] === 'present').length;
      const absent = attendanceRecords.filter(r => r['status'] === 'absent').length;
      const late = attendanceRecords.filter(r => r['status'] === 'late').length;

      const totalHours = attendanceRecords.reduce((sum, r) => sum + (r['totalHours'] || 0), 0);
      const averageHours = totalHours / totalRecords;

      return {
        presentRate: this.createMetric('Present Rate', (present / totalRecords) * 100, undefined, '%'),
        absentRate: this.createMetric('Absent Rate', (absent / totalRecords) * 100, undefined, '%'),
        lateRate: this.createMetric('Late Rate', (late / totalRecords) * 100, undefined, '%'),
        averageHours: this.createMetric('Average Hours', averageHours, undefined, 'hrs')
      };
    } catch (error) {
      console.error('Error fetching attendance metrics:', error);
      throw error;
    }
  }

  /**
   * Get leave metrics
   */
  public async getLeaveMetrics(params?: {
    startDate?: Date;
    endDate?: Date;
    departmentId?: string;
  }): Promise<{
    totalLeaves: AnalyticsMetric;
    approvedLeaves: AnalyticsMetric;
    pendingLeaves: AnalyticsMetric;
    rejectedLeaves: AnalyticsMetric;
    averageLeaveDays: AnalyticsMetric;
  }> {
    try {
      if (!db) throw new Error('Firestore not available');

      const startDate = params?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
      const endDate = params?.endDate || new Date();

      let q = query(
        collection(db, 'leaves'),
        where('startDate', '>=', Timestamp.fromDate(startDate)),
        where('startDate', '<=', Timestamp.fromDate(endDate))
      );

      const snapshot = await getDocs(q);
      const leaves = snapshot.docs.map(doc => doc.data());

      // Filter by department if needed
      let filteredLeaves = leaves;
      if (params?.departmentId) {
        const employeesSnapshot = await getDocs(
          query(collection(db, 'users'), where('department', '==', params.departmentId))
        );
        const employeeIds = employeesSnapshot.docs.map(doc => doc.id);
        filteredLeaves = leaves.filter(l => employeeIds.includes(l['employeeId']));
      }

      const totalLeaves = filteredLeaves.length;
      const approved = filteredLeaves.filter(l => l['status'] === 'approved').length;
      const pending = filteredLeaves.filter(l => l['status'] === 'pending').length;
      const rejected = filteredLeaves.filter(l => l['status'] === 'rejected').length;

      const totalDays = filteredLeaves.reduce((sum, l) => sum + (l['days'] || 0), 0);
      const averageDays = totalLeaves > 0 ? totalDays / totalLeaves : 0;

      return {
        totalLeaves: this.createMetric('Total Leaves', totalLeaves),
        approvedLeaves: this.createMetric('Approved Leaves', approved),
        pendingLeaves: this.createMetric('Pending Leaves', pending),
        rejectedLeaves: this.createMetric('Rejected Leaves', rejected),
        averageLeaveDays: this.createMetric('Average Leave Days', averageDays, undefined, 'days')
      };
    } catch (error) {
      console.error('Error fetching leave metrics:', error);
      throw error;
    }
  }

  /**
   * Get department breakdown
   */
  public async getDepartmentBreakdown(): Promise<AnalyticsDimension[]> {
    try {
      if (!db) throw new Error('Firestore not available');

      const snapshot = await getDocs(query(collection(db, 'users'), where('status', '==', 'active')));
      const employees = snapshot.docs.map(doc => doc.data() as User);

      const departmentCounts = employees.reduce((acc, emp) => {
        const dept = emp.department || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = employees.length;

      return Object.entries(departmentCounts).map(([name, count]) => ({
        name: 'Department',
        value: name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }));
    } catch (error) {
      console.error('Error fetching department breakdown:', error);
      throw error;
    }
  }

  /**
   * Get time series data
   */
  public async getTimeSeries(
    metric: 'employees' | 'attendance' | 'leaves',
    params?: {
      startDate?: Date;
      endDate?: Date;
      interval?: 'day' | 'week' | 'month';
    }
  ): Promise<AnalyticsTimeSeriesPoint[]> {
    try {
      if (!db) throw new Error('Firestore not available');

      const startDate = params?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 6));
      const endDate = params?.endDate || new Date();
      const interval = params?.interval || 'month';

      // Generate time points
      const points: AnalyticsTimeSeriesPoint[] = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        const nextDate = new Date(current);
        
        switch (interval) {
          case 'day':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'week':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'month':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        }

        // Fetch data for this period
        let value = 0;
        
        switch (metric) {
          case 'employees':
            const empSnapshot = await getDocs(
              query(
                collection(db, 'users'),
                where('createdAt', '>=', Timestamp.fromDate(current)),
                where('createdAt', '<', Timestamp.fromDate(nextDate))
              )
            );
            value = empSnapshot.size;
            break;
            
          case 'attendance':
            const attSnapshot = await getDocs(
              query(
                collection(db, 'attendance'),
                where('date', '>=', Timestamp.fromDate(current)),
                where('date', '<', Timestamp.fromDate(nextDate))
              )
            );
            value = attSnapshot.size;
            break;
            
          case 'leaves':
            const leaveSnapshot = await getDocs(
              query(
                collection(db, 'leaves'),
                where('startDate', '>=', Timestamp.fromDate(current)),
                where('startDate', '<', Timestamp.fromDate(nextDate))
              )
            );
            value = leaveSnapshot.size;
            break;
        }

        points.push({
          timestamp: current.toISOString(),
          value,
          label: this.formatDateLabel(current, interval)
        });

        current.setTime(nextDate.getTime());
      }

      return points;
    } catch (error) {
      console.error('Error fetching time series:', error);
      throw error;
    }
  }

  /**
   * Generate AI insights
   */
  public async generateInsights(params?: {
    departmentId?: string;
    lookbackDays?: number;
  }): Promise<AnalyticsInsight[]> {
    try {
      if (!db) throw new Error('Firestore not available');

      const insights: AnalyticsInsight[] = [];
      const lookbackDays = params?.lookbackDays || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - lookbackDays);

      // Analyze turnover trends
      const metrics = await this.getEmployeeMetrics({ startDate });
      
      if (metrics.turnoverRate.value > 15) {
        insights.push({
          id: this.generateId(),
          type: 'anomaly',
          severity: 'warning',
          title: 'High Turnover Rate Detected',
          description: `Current turnover rate of ${metrics.turnoverRate.value.toFixed(1)}% exceeds healthy threshold of 15%`,
          metrics: ['turnoverRate'],
          actionable: true,
          suggestedActions: [
            'Conduct exit interviews',
            'Review compensation packages',
            'Improve employee engagement programs'
          ],
          confidence: 0.85,
          createdAt: new Date().toISOString()
        });
      }

      // Analyze attendance patterns
      const attendanceMetrics = await this.getAttendanceMetrics({ startDate });
      
      if (attendanceMetrics.absentRate.value > 10) {
        insights.push({
          id: this.generateId(),
          type: 'anomaly',
          severity: 'warning',
          title: 'Elevated Absence Rate',
          description: `Absence rate of ${attendanceMetrics.absentRate.value.toFixed(1)}% is above normal`,
          metrics: ['absentRate'],
          actionable: true,
          suggestedActions: [
            'Review absence patterns',
            'Check for workplace issues',
            'Consider wellness programs'
          ],
          confidence: 0.78,
          createdAt: new Date().toISOString()
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Helper: Create metric object
   */
  private createMetric(
    name: string,
    value: number,
    previousValue?: number,
    unit?: string
  ): AnalyticsMetric {
    let change: number | undefined;
    let changePercentage: number | undefined;
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (previousValue !== undefined && previousValue !== 0) {
      change = value - previousValue;
      changePercentage = (change / previousValue) * 100;
      trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    }

    const metric: AnalyticsMetric = {
      id: this.generateId(),
      name,
      value,
      trend,
      timestamp: new Date().toISOString()
    };
    
    if (previousValue !== undefined) metric.previousValue = previousValue;
    if (change !== undefined) metric.change = change;
    if (changePercentage !== undefined) metric.changePercentage = changePercentage;
    if (unit !== undefined) metric.unit = unit;
    
    return metric;
  }

  /**
   * Helper: Format date label
   */
  private formatDateLabel(date: Date, interval: 'day' | 'week' | 'month'): string {
    switch (interval) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  }

  /**
   * Helper: Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const analyticsEngine = new AnalyticsEngine();
export default analyticsEngine;
