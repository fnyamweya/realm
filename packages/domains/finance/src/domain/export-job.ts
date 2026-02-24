import type { DomainEvent } from './ledger-entry.js';

// ═══════════════════════════════════════════════════════════════════════════
// Export Job entity — async export generation with R2 storage
// ═══════════════════════════════════════════════════════════════════════════

export const ExportJobStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type ExportJobStatus = (typeof ExportJobStatus)[keyof typeof ExportJobStatus];

export const ExportJobKind = {
  LEDGER_EXPORT: 'LEDGER_EXPORT',
  STATEMENT: 'STATEMENT',
  RECON_REPORT: 'RECON_REPORT',
  DISPUTE_REPORT: 'DISPUTE_REPORT',
} as const;
export type ExportJobKind = (typeof ExportJobKind)[keyof typeof ExportJobKind];

export interface ExportJobData {
  readonly id: string;
  readonly clientId: string;
  readonly kind: ExportJobKind;
  readonly status: ExportJobStatus;
  readonly parametersJson: string;
  readonly resultRef: string | undefined;
  readonly isSandboxWatermarked: boolean;
  readonly createdByActorId: string;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly completedAt: string | undefined;
  readonly failureReason: string | undefined;
}

const VALID_EXPORT_TRANSITIONS: Record<ExportJobStatus, readonly ExportJobStatus[]> = {
  QUEUED: ['RUNNING', 'FAILED'],
  RUNNING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
};

export class ExportJob {
  private _data: ExportJobData;
  private readonly _events: DomainEvent[] = [];

  private constructor(data: ExportJobData) {
    this._data = data;
  }

  get data(): ExportJobData { return this._data; }

  static create(props: Omit<ExportJobData, 'status' | 'resultRef' | 'completedAt' | 'failureReason' | 'createdAt'>): ExportJob {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.createdByActorId) throw new Error('createdByActorId is required');
    if (!props.correlationId) throw new Error('correlationId is required');

    const now = new Date().toISOString();
    const job = new ExportJob({
      ...props,
      status: ExportJobStatus.QUEUED,
      resultRef: undefined,
      completedAt: undefined,
      failureReason: undefined,
      createdAt: now,
    });
    job._events.push({
      eventType: 'finance.export.queued',
      payload: {
        exportJobId: props.id,
        clientId: props.clientId,
        kind: props.kind,
      },
    });
    return job;
  }

  static fromData(data: ExportJobData): ExportJob {
    return new ExportJob(data);
  }

  private transitionTo(newStatus: ExportJobStatus): void {
    const allowed = VALID_EXPORT_TRANSITIONS[this._data.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid export transition from ${this._data.status} to ${newStatus}`);
    }
    this._data = { ...this._data, status: newStatus };
  }

  markRunning(): void {
    this.transitionTo(ExportJobStatus.RUNNING);
  }

  markCompleted(resultRef: string): void {
    this.transitionTo(ExportJobStatus.COMPLETED);
    this._data = {
      ...this._data,
      resultRef,
      completedAt: new Date().toISOString(),
    };
    this._events.push({
      eventType: 'finance.export.completed',
      payload: {
        exportJobId: this._data.id,
        clientId: this._data.clientId,
        kind: this._data.kind,
      },
    });
  }

  markFailed(reason: string): void {
    this.transitionTo(ExportJobStatus.FAILED);
    this._data = {
      ...this._data,
      failureReason: reason,
      completedAt: new Date().toISOString(),
    };
    this._events.push({
      eventType: 'finance.export.failed',
      payload: {
        exportJobId: this._data.id,
        clientId: this._data.clientId,
        kind: this._data.kind,
        reason,
      },
    });
  }

  isComplete(): boolean {
    return this._data.status === ExportJobStatus.COMPLETED;
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> { return [...this._events]; }
}
