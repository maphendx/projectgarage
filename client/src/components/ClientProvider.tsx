'use client';

import { ReactNode } from 'react';
import { ErrorProvider } from '@/context/ErrorContext';

export default function ClientProvider({ children }: { children: ReactNode }) {
  return <ErrorProvider>{children}</ErrorProvider>;
}
