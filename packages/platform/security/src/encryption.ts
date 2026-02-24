import { z } from "zod";

export interface EncryptionKeyVersion {
  readonly keyId: string;
  readonly version: number;
  readonly algorithm: "AES-GCM" | "XChaCha20-Poly1305";
  readonly status: "active" | "rotated" | "retired";
  readonly createdAt: string;
}

export interface EncryptedField {
  /** Base64-encoded ciphertext */
  readonly ciphertext: string;
  readonly keyId: string;
  readonly keyVersion: number;
  /** Base64-encoded initialization vector */
  readonly iv: string;
  readonly algorithm: string;
}

export const EncryptedFieldSchema = z
  .object({
    ciphertext: z.string().min(1),
    keyId: z.string().min(1),
    keyVersion: z.number().int().nonnegative(),
    iv: z.string().min(1),
    algorithm: z.string().min(1),
  })
  .readonly();

export interface FieldEncryptor {
  encrypt(plaintext: string, keyId: string): Promise<EncryptedField>;
  decrypt(encrypted: EncryptedField): Promise<string>;
  rotateKey(oldKeyId: string, newKeyId: string): Promise<void>;
}

export interface EnvelopeEncryptionService {
  generateDataKey(
    masterKeyId: string,
  ): Promise<{ plainKey: CryptoKey; encryptedKey: string }>;
  decryptDataKey(
    masterKeyId: string,
    encryptedKey: string,
  ): Promise<CryptoKey>;
}
