import type { Metadata } from 'next';
import '../styles/design-tokens.css';
import '../styles/typography.css';
import '../styles/home.css';
import '../styles/components.css';
import '../styles/utilities.css';
import '../styles/auth.css';
import '../styles/products.css';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { AuthProvider } from '../src/providers/AuthProvider';
import { QueryProvider } from '../src/providers/QueryProvider';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = 'NodeStarter';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Production-ready full-stack template`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Industry-level full-stack monorepo template — Next.js 14, NestJS, PostgreSQL, Redis, Cloudinary. Open source and production ready.',
  keywords: ['Next.js', 'NestJS', 'PostgreSQL', 'full-stack', 'monorepo', 'template'],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Production-ready full-stack template`,
    description:
      'Industry-level full-stack monorepo template — Next.js 14, NestJS, PostgreSQL, Redis, Cloudinary.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Production-ready full-stack template`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Production-ready full-stack template`,
    description:
      'Industry-level full-stack monorepo template — Next.js 14, NestJS, PostgreSQL, Redis, Cloudinary.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
