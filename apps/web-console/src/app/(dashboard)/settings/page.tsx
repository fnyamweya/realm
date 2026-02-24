import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import { SettingsTabs } from './settings-tabs';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences."
      />
      <SettingsTabs />
    </PageContainer>
  );
}
