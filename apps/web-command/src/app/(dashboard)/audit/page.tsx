import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import { AuditSearch } from './audit-search';

export const metadata = { title: 'Audit Log' };

export default function AuditPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Audit Log"
        description="Search and review platform audit events."
      />
      <AuditSearch />
    </PageContainer>
  );
}
