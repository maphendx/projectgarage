import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ErrorProvider } from '@/context/ErrorContext';

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
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang='en' className={inter.className}>
      <body>
        <ErrorProvider>{children}</ErrorProvider>
      </body>
    </html>
  );
}
