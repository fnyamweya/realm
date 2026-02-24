import { PortalShell } from '@/components/portal/chrome';

export default function PortalRoutesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <PortalShell>{children}</PortalShell>;
}
