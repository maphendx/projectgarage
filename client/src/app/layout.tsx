import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ErrorProvider } from '@/context/ErrorContext';
import { PlayerProvider } from '@/components/surrounding/player';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Do Re DO - Music Social Network',
  description: 'social network for musicians',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <ErrorProvider>
          <PlayerProvider>
            {children}
            <div className='min-h-[100px] bg-[#1C1C1F]'></div>
          </PlayerProvider>
        </ErrorProvider>
      </body>
    </html>
  );
}