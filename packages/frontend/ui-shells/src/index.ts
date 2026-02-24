// Types
export type { NavItem, NavSection, ShellConfig } from './types';

// Primitives
export { Sidebar, type SidebarProps } from './sidebar';
export { Header, type HeaderProps, type BreadcrumbEntry } from './header';
export { PageHeader, type PageHeaderProps } from './page-header';
export { PageContainer, type PageContainerProps } from './page-container';
export { SkeletonPage, type SkeletonPageProps } from './skeleton-page';

// Shells
export { DashboardShell, type DashboardShellProps } from './dashboard-shell';
export { ConsoleShell, type ConsoleShellProps } from './console-shell';
export { ResidentShell, type ResidentShellProps } from './resident-shell';
export {
  CommandShell,
  type CommandShellProps,
  type CommandEnvironment,
} from './command-shell';
export {
  LandingShell,
  type LandingShellProps,
  type LandingNavLink,
  type FooterColumn,
} from './landing-shell';
