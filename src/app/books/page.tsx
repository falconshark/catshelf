'use client';
import { useState, useEffect } from "react";
import { Container, Card, Modal, Button, Image, Row, Col } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import Topbar from '../components/Topbar';
import styles from "./page.module.css";

function Books() {
    const [showInfo, setShowInfo] = useState<boolean>(false);
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
            const editUrl = `/book/${books[i].id}/edit`;

            items.push(<Col md="2" key={books[i].id}>
                <div className={styles.cover}>
                    <Image className={styles.coverImg} src={coverUrl} thumbnail onClick={() => setShowInfo(!showInfo)} />
                </div>
                <div className="title">
                    {books[i].title}
                </div>
                <div className={styles.actionButtons}>
                    <Button href={bookUrl} className={styles.actionButton} as="a">View</Button>
                    <Button href={editUrl} className={styles.actionButton} as="a">Edit</Button>
                </div>
            </Col>)
        }
        return items;
    };

    return (
        <div className={styles.books}>
            <Topbar />
            <main className={styles.main}>
                <Modal show={showInfo} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Modal heading</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>Woohoo, you are reading this text in a modal!</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleClose}>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Modal>
                <Container>
                    <h1>Books</h1>
                    <div className='toolbar'>
                        <Button as="a" href="/books/upload">Upload Book</Button>
                    </div>
                    <div className={styles.bookList}>
                        <Row className={styles.latestBooks}>
                            {bookList()}
                        </Row>
                    </div>
                </Container>
            </main>
        </div>
    );
}

export default Books;