import type { ExportJobRepository } from '../ports/export-job-repository.js';
import { ExportJob, type ExportJobData } from '../domain/export-job.js';
import type { DomainEvent } from '../domain/ledger-entry.js';

export interface GenerateExportInput {
  readonly id: string;
  readonly clientId: string;
  readonly kind: string;
  readonly parametersJson: string;
  readonly isSandboxWatermarked: boolean;
  readonly actorId: string;
  readonly correlationId: string;
}

export interface GenerateExportOutput {
  readonly exportJob: ExportJobData;
  readonly events: ReadonlyArray<DomainEvent>;
}

/**
 * Creates a new export job in QUEUED status.
 * The actual generation runs asynchronously via ExportRunJob on the queue.
 */
export async function generateExport(
  input: GenerateExportInput,
  exportJobRepo: ExportJobRepository,
): Promise<GenerateExportOutput> {
  if (!input.clientId) throw new Error('clientId is required');
  if (!input.actorId) throw new Error('actorId is required');

  const job = ExportJob.create({
    id: input.id,
    clientId: input.clientId,
    kind: input.kind as 'LEDGER_EXPORT',
    parametersJson: input.parametersJson,
    isSandboxWatermarked: input.isSandboxWatermarked,
    createdByActorId: input.actorId,
    correlationId: input.correlationId,
  });

  await exportJobRepo.insert(job.data);
  return { exportJob: job.data, events: job.getDomainEvents() };
}
