'use client';
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Form, Button } from 'react-bootstrap';


const Home: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api-token-auth/',{
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({username: username, password: password})
        }
      );
      const result = await response.json();
      const token = result['token'];
      setToken(token);
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
              <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
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