import type { Metadata, Viewport } from 'next';
import { clientEnvVars } from '@/lib/env';
import { PlayerBar } from '@/app/_components/player/PlayerBar';
import { IdentityBootstrap } from '@/app/_components/identity/IdentityBootstrap';
import { SiteHeader } from '@/app/_components/shell/SiteHeader';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: clientEnvVars.NEXT_PUBLIC_SITE_NAME,
    template: `%s · ${clientEnvVars.NEXT_PUBLIC_SITE_NAME}`,
  },
  description: 'A music forum. Threads come from a WhatsApp group. Listen as you read.',
  applicationName: clientEnvVars.NEXT_PUBLIC_SITE_NAME,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0a0908',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh bg-canvas-0 text-ink-high">
        <IdentityBootstrap />
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl px-4 pt-6 md:pt-10">{children}</main>
        <PlayerBar />
      </body>
    </html>
  );
}
