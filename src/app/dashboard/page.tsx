'use client';
import { useState, useEffect } from "react";
import { Container, Card, Button, Image, Row, Col } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import Topbar from '../components/Topbar';
import styles from "./page.module.css";

function Dashboard() {
  const [books, setBooks] = useState<{ id: number, title: string, cover: string }[]>([]);
  const token = useAppSelector((state) => state.common.token);
  const apiUrl = useAppSelector((state) => state.common.apiUrl);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/book/`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
        }
        );
        const result = await response.json();
        setBooks(result);
      } catch (error) {
        console.log(error);
      }
    };
    fetchBooks();
  }, []);

  const bookList = () => {
    const items = [];
    for (let i = 0; i < books.length; i++) {
      const coverUrl = `${apiUrl}/api/v1${books[i].cover}`;
      const bookUrl = `/book/${books[i].id}`;
      items.push(<Col md="2" key={books[i].id}>
        <a className={styles.book} href={bookUrl}>
          <div className={styles.cover}>
            <Image className={styles.coverImg} src={coverUrl} thumbnail />
          </div>
          <div className="title">
            {books[i].title}
          </div>
        </a>
      </Col>)
    }
    return items;
  };

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
                  { bookList() }
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