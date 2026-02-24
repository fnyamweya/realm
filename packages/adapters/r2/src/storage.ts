import type { FilePresigner, PresignRequest } from "@realtyos/files";

/** Minimal type matching Cloudflare's R2Object. */
export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpMetadata?: Record<string, string>;
}

export interface R2PutOptions {
  httpMetadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
}

export interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

/** Minimal type matching Cloudflare's R2Bucket. */
export interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | string,
    options?: R2PutOptions,
  ): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

/**
 * R2 storage adapter implementing FilePresigner.
 * ALWAYS scopes object keys by clientId: `{clientId}/{fileId}`.
 * Private by default — no public ACLs.
 * Access check before presigning.
 */
export class R2StorageAdapter implements FilePresigner {
  private readonly bucket: R2Bucket;
  private readonly accessCheck: (
    clientId: string,
    fileId: string,
  ) => Promise<boolean>;

  constructor(
    bucket: R2Bucket,
    accessCheck: (clientId: string, fileId: string) => Promise<boolean>,
  ) {
    this.bucket = bucket;
    this.accessCheck = accessCheck;
  }

  /** Builds a scoped object key: `{clientId}/{fileId}` */
  static scopedKey(clientId: string, fileId: string): string {
    if (!clientId || !fileId) {
      throw new Error("clientId and fileId are required");
    }
    return `${clientId}/${fileId}`;
  }

  async generateUploadUrl(
    req: PresignRequest,
  ): Promise<{ url: string; expiresAt: string }> {
    const allowed = await this.accessCheck(req.clientId, req.fileId);
    if (!allowed) {
      throw new Error("Access denied");
    }

    const key = R2StorageAdapter.scopedKey(req.clientId, req.fileId);
    const expiresAt = new Date(
      Date.now() + req.ttlSeconds * 1000,
    ).toISOString();

    // In a real implementation, this would use R2's presigned URL mechanism.
    // The key is always scoped by clientId for tenant isolation.
    return {
      url: `https://r2.example.com/upload/${key}?expires=${expiresAt}`,
      expiresAt,
    };
  }

  async generateDownloadUrl(
    clientId: string,
    fileId: string,
    ttlSeconds: number,
  ): Promise<{ url: string; expiresAt: string }> {
    const allowed = await this.accessCheck(clientId, fileId);
    if (!allowed) {
      throw new Error("Access denied");
    }

    const key = R2StorageAdapter.scopedKey(clientId, fileId);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    return {
      url: `https://r2.example.com/download/${key}?expires=${expiresAt}`,
      expiresAt,
    };
  }

  /** Retrieves an object, scoped to clientId. */
  async getObject(clientId: string, fileId: string): Promise<R2Object | null> {
    const key = R2StorageAdapter.scopedKey(clientId, fileId);
    return this.bucket.get(key);
  }

  /** Uploads an object, scoped to clientId. Private by default. */
  async putObject(
    clientId: string,
    fileId: string,
    value: ReadableStream | ArrayBuffer | string,
    options?: R2PutOptions,
  ): Promise<R2Object> {
    const key = R2StorageAdapter.scopedKey(clientId, fileId);
    return this.bucket.put(key, value, options);
  }

  /** Deletes an object, scoped to clientId. */
  async deleteObject(clientId: string, fileId: string): Promise<void> {
    const key = R2StorageAdapter.scopedKey(clientId, fileId);
    return this.bucket.delete(key);
  }

  /** Lists objects for a clientId prefix. */
  async listObjects(
    clientId: string,
    options?: { limit?: number; cursor?: string },
  ): Promise<R2Objects> {
    const listOptions: R2ListOptions = { prefix: `${clientId}/` };
    if (options?.limit !== undefined) {
      listOptions.limit = options.limit;
    }
    if (options?.cursor !== undefined) {
      listOptions.cursor = options.cursor;
    }
    return this.bucket.list(listOptions);
  }
}
