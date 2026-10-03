import type { Metadata } from 'next';

import { AuthForm } from '@/components/AuthForm';
import { dataMode } from '@/utils/config';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="container-page max-w-md py-16">
      <AuthForm mode="login" demoMode={dataMode === 'demo'} />
    </div>
  );
}