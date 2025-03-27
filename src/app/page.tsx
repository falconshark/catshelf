'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation'
import { Form, Button } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from "../lib/hooks"
import { useCookiesNext } from 'cookies-next';
import { setToken } from '@/lib/reducers/commonSlice';
import styles from "./page.module.css";

const Home: React.FC = () => {
  const { setCookie } = useCookiesNext();
  const router = useRouter()
  const dispatch = useAppDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const apiUrl = useAppSelector((state) => state.common.apiUrl);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/api-token-auth/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password })
      }
      );
      const result = await response.json();
      const token = result['token'];
      setCookie('token', token);
      dispatch(setToken(token));
      router.push("/dashboard");
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleLogin(username, password);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="app-title">
          <h1>Catshelf</h1>
        </div>
        <div className="login-form">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Form.Group>
            <Button variant="primary" type="submit">
              Login
            </Button>
          </Form>
        </div>
      </main>
    </div>
  );
}

export default Home;