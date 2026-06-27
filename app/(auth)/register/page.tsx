import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div>
      <h1>Complete your registration</h1>
      <p>Only provisioned HOD, exam-officer, dean, lecturer, and student accounts may register. Ask your administrator for the registration token.</p>
      <RegisterForm />
    </div>
  );
}
