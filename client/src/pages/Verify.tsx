import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types';

function Verify() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResendSuccess('');
    setLoading(true);

    try {
      const { data } = await api.post<{ token: string; user: User }>('/auth/verify', {
        email,
        code,
      });
      login(data.token, data.user);
      navigate('/projects');
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { err?: string } } }).response?.data?.err
          : undefined;
      setError(message ?? 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendSuccess('');
    setResendLoading(true);

    try {
      await api.post('/auth/resend-code', { email });
      setResendSuccess('A new code has been sent to your email.');
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { err?: string } } }).response?.data?.err
          : undefined;
      setError(message ?? 'Could not resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Verify your email
        </h1>
        {email && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
            A 5-digit code was sent to {email}.
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 space-y-5"
        >
          <div>
            <label htmlFor="code" className="form-label">Verification code</label>
            <input
              id="code"
              type="text"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={5}
              required
              className="input"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {resendSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">{resendSuccess}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <div className="text-center mt-4">
          <button onClick={handleResend} disabled={resendLoading} className="btn-ghost">
            {resendLoading ? 'Sending...' : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Verify;
