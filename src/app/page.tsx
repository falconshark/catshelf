'use client';
import styles from "./page.module.css";
import { Form, Button } from 'react-bootstrap';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="app-title">
          <h1>Catshelf</h1>
        </div>
        <div className="login-form">
          <Form>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text"/>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" placeholder="Password" />
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
