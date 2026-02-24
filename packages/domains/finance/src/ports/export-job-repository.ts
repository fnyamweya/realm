import type { ExportJobData } from '../domain/export-job.js';

/**
 * Export job repository. All methods scoped by clientId.
 */
export interface ExportJobRepository {
  findByIdScoped(clientId: string, exportJobId: string): Promise<ExportJobData | undefined>;
  findByStatus(clientId: string, status: string, cursor: string | undefined, limit: number): Promise<{ items: ExportJobData[]; nextCursor: string | undefined }>;
  insert(data: ExportJobData): Promise<void>;
  update(data: ExportJobData): Promise<void>;
}
