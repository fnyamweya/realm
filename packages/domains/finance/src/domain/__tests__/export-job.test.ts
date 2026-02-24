import { describe, it, expect } from 'vitest';
import { ExportJob, ExportJobStatus, ExportJobKind } from '../export-job.js';

function makeExportProps(overrides: Partial<Parameters<typeof ExportJob.create>[0]> = {}) {
  return {
    id: 'exp-1',
    clientId: 'client-1',
    kind: ExportJobKind.LEDGER_EXPORT,
    parametersJson: '{"startDate":"2024-01-01","endDate":"2024-01-31"}',
    isSandboxWatermarked: false,
    createdByActorId: 'actor-1',
    correlationId: 'cor-1',
    ...overrides,
  };
}

describe('ExportJob', () => {
  it('creates with QUEUED status', () => {
    const job = ExportJob.create(makeExportProps());
    expect(job.data.status).toBe(ExportJobStatus.QUEUED);
    expect(job.data.resultRef).toBeUndefined();
    expect(job.data.completedAt).toBeUndefined();
  });

  it('requires clientId', () => {
    expect(() => ExportJob.create(makeExportProps({ clientId: '' }))).toThrow('clientId is required');
  });

  it('requires createdByActorId', () => {
    expect(() => ExportJob.create(makeExportProps({ createdByActorId: '' }))).toThrow('createdByActorId is required');
  });

  it('emits export.queued event', () => {
    const job = ExportJob.create(makeExportProps());
    const events = job.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('finance.export.queued');
  });

  it('transitions QUEUED → RUNNING → COMPLETED', () => {
    const job = ExportJob.create(makeExportProps());
    job.markRunning();
    expect(job.data.status).toBe(ExportJobStatus.RUNNING);

    job.markCompleted('r2://bucket/exports/exp-1.csv');
    expect(job.data.status).toBe(ExportJobStatus.COMPLETED);
    expect(job.data.resultRef).toBe('r2://bucket/exports/exp-1.csv');
    expect(job.data.completedAt).toBeDefined();
    expect(job.isComplete()).toBe(true);
  });

  it('transitions QUEUED → FAILED', () => {
    const job = ExportJob.create(makeExportProps());
    job.markFailed('Query timeout');
    expect(job.data.status).toBe(ExportJobStatus.FAILED);
    expect(job.data.failureReason).toBe('Query timeout');
  });

  it('transitions RUNNING → FAILED', () => {
    const job = ExportJob.create(makeExportProps());
    job.markRunning();
    job.markFailed('Out of memory');
    expect(job.data.status).toBe(ExportJobStatus.FAILED);
  });

  it('rejects COMPLETED → FAILED', () => {
    const job = ExportJob.create(makeExportProps());
    job.markRunning();
    job.markCompleted('r2://ref');
    expect(() => job.markFailed('late')).toThrow('Invalid export transition');
  });

  it('rejects COMPLETED → RUNNING', () => {
    const job = ExportJob.create(makeExportProps());
    job.markRunning();
    job.markCompleted('r2://ref');
    expect(() => job.markRunning()).toThrow('Invalid export transition');
  });

  it('sandbox watermarked flag is preserved', () => {
    const job = ExportJob.create(makeExportProps({ isSandboxWatermarked: true }));
    expect(job.data.isSandboxWatermarked).toBe(true);
  });

  it('collects events through full lifecycle', () => {
    const job = ExportJob.create(makeExportProps());
    job.markRunning();
    job.markCompleted('r2://ref');
    const events = job.getDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[0]!.eventType).toBe('finance.export.queued');
    expect(events[1]!.eventType).toBe('finance.export.completed');
  });

  it('failure events include reason', () => {
    const job = ExportJob.create(makeExportProps());
    job.markFailed('Error occurred');
    const events = job.getDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[1]!.eventType).toBe('finance.export.failed');
    expect(events[1]!.payload['reason']).toBe('Error occurred');
  });
});
