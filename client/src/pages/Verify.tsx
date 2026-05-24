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
    <div>
      <h1>Verify your email</h1>
      {email && <p>A 5-digit code was sent to {email}.</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="code">Verification code</label>
          <input
            id="code"
            type="text"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={5}
            required
          />
        </div>
        {error && <p>{error}</p>}
        {resendSuccess && <p>{resendSuccess}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
      <button onClick={handleResend} disabled={resendLoading}>
        {resendLoading ? 'Sending...' : 'Resend code'}
      </button>
    </div>
  );
}

export default Verify;
