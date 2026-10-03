import type { Metadata } from 'next';

import { AuthForm } from '@/components/AuthForm';
import { dataMode } from '@/utils/config';

export const metadata: Metadata = { title: 'Create account' };

export default function SignupPage() {
  return (
    <div className="container-page max-w-md py-16">
      <AuthForm mode="signup" demoMode={dataMode === 'demo'} />
    </div>
  );
}