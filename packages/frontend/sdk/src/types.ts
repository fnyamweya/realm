export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: {
    id: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
  audience?: 'console' | 'resident' | 'command';
  clientId?: string;
  roles?: string[];
  permissions?: string[];
  obligations?: Obligation[];
}

export interface Obligation {
  type: 'mfa_required' | 'select_client' | 'accept_terms' | 'password_change';
  metadata?: Record<string, unknown>;
}
