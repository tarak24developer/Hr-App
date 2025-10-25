/**
 * Workflow Automation Engine
 * Automates HR processes and approvals
 */

import { collection, addDoc, updateDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';

export type WorkflowTrigger = 
  | 'employee_onboarding'
  | 'leave_request'
  | 'expense_submission'
  | 'document_upload'
  | 'performance_review'
  | 'training_assignment'
  | 'asset_assignment'
  | 'manual';

export type WorkflowActionType =
  | 'send_notification'
  | 'send_email'
  | 'create_task'
  | 'update_record'
  | 'assign_approver'
  | 'execute_function'
  | 'wait_for_approval'
  | 'conditional_branch';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  enabled: boolean;
  steps: WorkflowStep[];
  conditions?: WorkflowCondition[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  actionType: WorkflowActionType;
  config: Record<string, any>;
  onSuccess?: string; // Next step ID
  onFailure?: string; // Next step ID
  timeout?: number; // milliseconds
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStepId?: string;
  initiatedBy: string;
  context: Record<string, any>;
  steps: WorkflowStepExecution[];
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface WorkflowStepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

class WorkflowEngine {
  private runningInstances: Map<string, WorkflowInstance> = new Map();

  /**
   * Create workflow definition
   */
  public async createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      if (!db) throw new Error('Firestore not available');

      const workflow: WorkflowDefinition = {
        ...definition,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'workflows'), {
        ...workflow,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow definition
   */
  public async getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
    try {
      if (!db) throw new Error('Firestore not available');

      const snapshot = await getDocs(
        query(collection(db, 'workflows'), where('id', '==', workflowId))
      );

      if (snapshot.empty || !snapshot.docs[0]) return null;

      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString()
      } as WorkflowDefinition;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      return null;
    }
  }

  /**
   * Start workflow instance
   */
  public async startWorkflow(
    workflowId: string,
    initiatedBy: string,
    context: Record<string, any>
  ): Promise<string> {
    try {
      if (!db) throw new Error('Firestore not available');

      // Get workflow definition
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) throw new Error('Workflow not found');
      if (!workflow.enabled) throw new Error('Workflow is disabled');

      // Check conditions
      if (workflow.conditions && !this.evaluateConditions(workflow.conditions, context)) {
        throw new Error('Workflow conditions not met');
      }

      // Create instance
      const instance: WorkflowInstance = {
        id: '',
        workflowId,
        workflowName: workflow.name,
        status: 'pending',
        initiatedBy,
        context,
        steps: workflow.steps.map(step => ({
          stepId: step.id,
          status: 'pending'
        })),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'workflow_instances'), {
        ...instance,
        createdAt: Timestamp.fromDate(new Date())
      });

      instance.id = docRef.id;
      this.runningInstances.set(instance.id, instance);

      // Start execution asynchronously
      this.executeWorkflow(instance.id, workflow);

      return instance.id;
    } catch (error) {
      console.error('Error starting workflow:', error);
      throw error;
    }
  }

  /**
   * Execute workflow
   */
  private async executeWorkflow(instanceId: string, workflow: WorkflowDefinition): Promise<void> {
    try {
      const instance = this.runningInstances.get(instanceId);
      if (!instance) return;

      // Update status to running
      instance.status = 'running';
      await this.updateInstance(instance);

      // Execute steps sequentially
      let currentStepIndex = 0;
      
      while (currentStepIndex < workflow.steps.length) {
        const step = workflow.steps[currentStepIndex];
        if (!step) break;
        
        instance.currentStepId = step.id;

        try {
          // Execute step
          const result = await this.executeStep(step, instance.context);

          // Update step execution
          const stepExecution = instance.steps.find(s => s.stepId === step.id);
          if (stepExecution) {
            stepExecution.status = 'completed';
            stepExecution.completedAt = new Date().toISOString();
            stepExecution.result = result;
          }

          await this.updateInstance(instance);

          // Determine next step
          if (step.onSuccess) {
            const nextStepIndex = workflow.steps.findIndex(s => s.id === step.onSuccess);
            if (nextStepIndex !== -1) {
              currentStepIndex = nextStepIndex;
              continue;
            }
          }

          currentStepIndex++;
        } catch (error: any) {
          // Handle step failure
          const stepExecution = instance.steps.find(s => s.stepId === step.id);
          if (stepExecution) {
            stepExecution.status = 'failed';
            stepExecution.error = error.message;
          }

          if (step.onFailure) {
            const failureStepIndex = workflow.steps.findIndex(s => s.id === step.onFailure);
            if (failureStepIndex !== -1) {
              currentStepIndex = failureStepIndex;
              continue;
            }
          }

          // No failure handler, fail the workflow
          instance.status = 'failed';
          instance.error = error.message;
          await this.updateInstance(instance);
          this.runningInstances.delete(instanceId);
          return;
        }
      }

      // All steps completed
      instance.status = 'completed';
      instance.completedAt = new Date().toISOString();
      await this.updateInstance(instance);
      this.runningInstances.delete(instanceId);
    } catch (error) {
      console.error('Error executing workflow:', error);
      const instance = this.runningInstances.get(instanceId);
      if (instance) {
        instance.status = 'failed';
        instance.error = (error as Error).message;
        await this.updateInstance(instance);
        this.runningInstances.delete(instanceId);
      }
    }
  }

  /**
   * Execute workflow step
   */
  private async executeStep(step: WorkflowStep, context: Record<string, any>): Promise<any> {
    switch (step.actionType) {
      case 'send_notification':
        return this.sendNotification(step.config, context);
      
      case 'create_task':
        return this.createTask(step.config, context);
      
      case 'update_record':
        return this.updateRecord(step.config, context);
      
      case 'assign_approver':
        return this.assignApprover(step.config, context);
      
      default:
        console.log(`Executing step: ${step.name}`);
        return { success: true };
    }
  }

  /**
   * Send notification action
   */
  private async sendNotification(config: Record<string, any>, context: Record<string, any>): Promise<any> {
    if (!db) throw new Error('Firestore not available');

    const notification = {
      title: this.interpolate(config.title, context),
      message: this.interpolate(config.message, context),
      recipientId: context.recipientId || config.recipientId,
      type: config.type || 'info',
      priority: config.priority || 'medium',
      createdAt: Timestamp.fromDate(new Date())
    };

    await addDoc(collection(db, 'notifications'), notification);
    return { success: true, notificationId: 'generated' };
  }

  /**
   * Create task action
   */
  private async createTask(config: Record<string, any>, context: Record<string, any>): Promise<any> {
    if (!db) throw new Error('Firestore not available');

    const task = {
      title: this.interpolate(config.title, context),
      description: this.interpolate(config.description, context),
      assigneeId: context.assigneeId || config.assigneeId,
      dueDate: config.dueDate,
      status: 'pending',
      createdAt: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(collection(db, 'tasks'), task);
    return { success: true, taskId: docRef.id };
  }

  /**
   * Update record action
   */
  private async updateRecord(config: Record<string, any>, context: Record<string, any>): Promise<any> {
    if (!db) throw new Error('Firestore not available');

    const updates = Object.entries(config.updates).reduce((acc, [key, value]) => {
      acc[key] = this.interpolate(value as string, context);
      return acc;
    }, {} as Record<string, any>);

    updates.updatedAt = Timestamp.fromDate(new Date());

    await updateDoc(doc(db, config.collection, config.documentId || context.documentId), updates);
    return { success: true };
  }

  /**
   * Assign approver action
   */
  private async assignApprover(config: Record<string, any>, context: Record<string, any>): Promise<any> {
    if (!db) throw new Error('Firestore not available');

    const approval = {
      requestId: context.requestId || config.requestId,
      approverId: config.approverId,
      approverRole: config.approverRole,
      status: 'pending',
      createdAt: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(collection(db, 'approvals'), approval);
    return { success: true, approvalId: docRef.id };
  }

  /**
   * Evaluate workflow conditions
   */
  private evaluateConditions(conditions: WorkflowCondition[], context: Record<string, any>): boolean {
    return conditions.every(condition => {
      const value = context[condition.field];

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  /**
   * Update workflow instance
   */
  private async updateInstance(instance: WorkflowInstance): Promise<void> {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'workflow_instances', instance.id), {
        status: instance.status,
        currentStepId: instance.currentStepId,
        steps: instance.steps,
        completedAt: instance.completedAt ? Timestamp.fromDate(new Date(instance.completedAt)) : null,
        error: instance.error
      });
    } catch (error) {
      console.error('Error updating workflow instance:', error);
    }
  }

  /**
   * Get workflow instance
   */
  public async getInstance(instanceId: string): Promise<WorkflowInstance | null> {
    try {
      if (!db) throw new Error('Firestore not available');

      const snapshot = await getDocs(
        query(collection(db, 'workflow_instances'), where('id', '==', instanceId))
      );

      if (snapshot.empty || !snapshot.docs[0]) return null;

      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        completedAt: data.completedAt?.toDate().toISOString()
      } as WorkflowInstance;
    } catch (error) {
      console.error('Error fetching workflow instance:', error);
      return null;
    }
  }

  /**
   * Cancel workflow instance
   */
  public async cancelWorkflow(instanceId: string): Promise<void> {
    try {
      const instance = this.runningInstances.get(instanceId);
      if (instance) {
        instance.status = 'cancelled';
        await this.updateInstance(instance);
        this.runningInstances.delete(instanceId);
      }
    } catch (error) {
      console.error('Error cancelling workflow:', error);
      throw error;
    }
  }

  /**
   * Helper: Interpolate string with context variables
   */
  private interpolate(template: string, context: Record<string, any>): string {
    if (typeof template !== 'string') return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? String(context[key]) : match;
    });
  }
}

export const workflowEngine = new WorkflowEngine();
export default workflowEngine;
