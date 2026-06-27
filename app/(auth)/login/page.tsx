import LoginForm from '@/components/auth/LoginForm';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  return (
    <div>
      <h1>Sign in</h1>
      <LoginForm onSuccess={() => router.push('/')} />
    </div>
  );
}
