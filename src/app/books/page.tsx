'use client';
import { useState, useEffect } from "react";
import { Container, Card, Button, Image, Row, Col } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import Topbar from '../components/Topbar';
import styles from "./page.module.css";

function Books() {
    const [books, setBooks] = useState<{ title: string }[]>([]);
    const token = useAppSelector((state) => state.common.token);
    const apiUrl = useAppSelector((state) => state.common.apiUrl);
    console.log(token);
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
            items.push(<Col md="2">
                <div className={styles.book}>
                    <div className={styles.cover}>
                        <Image className={styles.coverImg} src="/images/demo-cover1.jpg" thumbnail />
                    </div>
                    <div className="title">
                        {books[i].title}
                    </div>
                </div>
            </Col>)
        }
        return items;
    };

    return (
        <div className={styles.books}>
            <Topbar />
            <main className={styles.main}>
                <Container>
                    <h1>Books</h1>
                    <div className='toolbar'>
                        <Button as="a" href="/books/upload">Upload Book</Button>
                    </div>
                    <div className={styles.bookList}>
                        <Row className={styles.latestBooks}>
                            { bookList() }
                        </Row>
                    </div>
                </Container>
            </main>
        </div>
    );
}

export default Books;