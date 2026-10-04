'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation'
import { Form, Button, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from "../lib/hooks"
import { persistToken } from '@/lib/auth';
import { setToken } from '@/lib/reducers/commonSlice';
import styles from "./page.module.css";

function Home() {
  const router = useRouter()
  const dispatch = useAppDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = useAppSelector((state) => state.common.apiUrl);
  const token = useAppSelector((state) => state.common.token);

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const handleLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api-token-auth/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || typeof result.token !== 'string') {
        setError(result.error ?? 'Login failed. Please try again.');
        return;
      }

      persistToken(result.token);
      dispatch(setToken(result.token));
      router.replace("/dashboard");
    } catch (error) {
      console.error(error);
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleLogin();
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="app-title">
          <h1>Catshelf</h1>
        </div>
        <div className="login-form">
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3" controlId="formBasicUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Form.Group>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Login'}
            </Button>
          </Form>
        </div>
      </main>
    </div>
  );
}

export default Home;
