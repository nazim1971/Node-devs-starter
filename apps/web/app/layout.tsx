import type { Metadata } from 'next';
import '../styles/design-tokens.css';
import '../styles/typography.css';
import '../styles/components.css';
import '../styles/utilities.css';
import '../styles/auth.css';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { AuthProvider } from '../src/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'NodeStarter — Production-ready full-stack template',
  description:
    'Industry-level full-stack monorepo template — Next.js 14, NestJS, PostgreSQL, Redis, Cloudinary.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
