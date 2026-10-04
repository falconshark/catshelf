'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Button, Form, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import Topbar from '../components/Topbar';
import styles from "./page.module.css";
import { persistToken } from "@/lib/auth";
import { setToken } from '@/lib/reducers/commonSlice';

function Register() {
  const router = useRouter()
  const dispatch = useAppDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = useAppSelector((state) => state.common.apiUrl);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleRegister();
  };

  const handleRegister = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/register/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || typeof result.token !== 'string') {
        setError(result.error ?? 'Registration failed. Please try again.');
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

  return (
    <div className={styles.register}>
      <Topbar />
      <main className={styles.main}>
        <Container>
          <h1>Register</h1>
          <div className="login-form">
            <Form onSubmit={handleSubmit}>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form.Group className="mb-3" controlId="registerUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={64} pattern="[A-Za-z0-9_.\-]+" required />
                <Form.Text muted>Letters, digits, "_", "." and "-" only.</Form.Text>
              </Form.Group>

              <Form.Group className="mb-3" controlId="registerPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" autoComplete="new-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                <Form.Text muted>At least 8 characters.</Form.Text>
              </Form.Group>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Registering…' : 'Register'}
              </Button>
            </Form>
          </div>
        </Container>
      </main>
    </div>
  );
}

export default Register;
