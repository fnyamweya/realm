import type { SearchParamsRecord } from '@/lib/portal-data';

export type AsyncPageProps<TParams extends Record<string, string> = Record<string, string>> = {
  params?: Promise<TParams>;
  searchParams?: Promise<SearchParamsRecord>;
};

export async function resolveSearchParams(
  searchParams?: Promise<SearchParamsRecord>,
): Promise<SearchParamsRecord> {
  return (await searchParams) ?? {};
}

export async function resolveParams<TParams extends Record<string, string>>(
  params?: Promise<TParams>,
): Promise<TParams> {
  if (!params) {
    throw new Error('Expected route params to be provided');
  }
  return params;
}
