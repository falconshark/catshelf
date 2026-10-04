'use client';
import { useState, useEffect } from "react";
import { Container, Card, Image, Row, Col } from 'react-bootstrap';
import { useAppSelector } from "@/lib/hooks";
import { useApi, useRequireAuth } from "@/lib/useApi";
import { assetUrl, type Book } from "@/lib/books";
import Topbar from '../components/Topbar';
import styles from "./page.module.css";

function Dashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const token = useRequireAuth();
  const api = useApi();
  const apiUrl = useAppSelector((state) => state.common.apiUrl);

  useEffect(() => {
    if (!token) return;
    const fetchBooks = async () => {
      try {
        const response = await api('/api/v1/book/');
        if (response.ok) setBooks(await response.json());
      } catch (error) {
        console.error(error);
      }
    };
    fetchBooks();
  }, [token, api]);

  return (
    <div className={styles.dashboard}>
      <Topbar />
      <main className={styles.main}>
        <Container>
          <h1>Dashboard</h1>
          <div className={styles.dashboardCard}>
            <Card>
              <Card.Body>
                <Card.Title><h2>Latest Book</h2></Card.Title>
                <Row className={styles.latestBooks}>
                  {books.map((book) => {
                    const coverUrl = assetUrl(apiUrl, book.cover);
                    return (
                      <Col md="2" key={book.id}>
                        <a className={styles.book} href={`/book/${book.id}`}>
                          <div className={styles.cover}>
                            {coverUrl && <Image className={styles.coverImg} src={coverUrl} alt={book.title} thumbnail />}
                          </div>
                          <div className="title">
                            {book.title}
                          </div>
                        </a>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}

export default Dashboard;
