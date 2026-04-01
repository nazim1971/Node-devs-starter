import type { Metadata } from 'next';
import '../styles/design-tokens.css';
import '../styles/typography.css';
import '../styles/components.css';
import '../styles/utilities.css';
import '../styles/dashboard.css';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { AuthProvider } from '../src/providers/AuthProvider';
import { QueryProvider } from '../src/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Node Devs Admin Dashboard',
  description: 'Admin panel for Node Devs Starter template',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
