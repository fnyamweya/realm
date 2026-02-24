// Types
export type { NavItem, NavSection, ShellConfig } from './types';

// Theme infrastructure
export { ActiveThemeProvider, useThemeConfig } from './active-theme';
export { ThemeProvider } from './theme-provider';
export { ThemeModeToggle } from './theme-mode-toggle';
export { ThemeSelector } from './theme-selector';
export { DEFAULT_THEME, THEMES, type ThemeValue } from './theme-config';

// Sidebar components
export { OrgSwitcher, type OrgSwitcherProps, type OrgData } from './org-switcher';
export { NavUser, type NavUserProps, type NavUserData } from './nav-user';

// Primitives
export { AppSidebar, type AppSidebarProps } from './app-sidebar';
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
