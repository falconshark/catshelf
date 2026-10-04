'use client';
import { useState, useEffect } from "react";
import { Container, Modal, Button, Image, Row, Col } from 'react-bootstrap';
import { useAppSelector } from "@/lib/hooks";
import { useApi, useRequireAuth } from "@/lib/useApi";
import { assetUrl, parseAuthors, type Book } from "@/lib/books";
import Topbar from '../components/Topbar';
import styles from "./page.module.css";

function Books() {
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
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

    const deleteBook = async (id: number) => {
        const deleteConfirm = confirm("Are you sure you want to delete this book? This action cannot be undone.");
        if (!deleteConfirm) return;

        try {
            const response = await api(`/api/v1/book/${id}/`, { method: 'DELETE' });
            if (response.ok) {
                setBooks((current) => current.filter((book) => book.id !== id));
            } else {
                console.error("Error deleting book");
            }
        } catch (error) {
            console.error(error);
        }
    }

    const selectedCover = assetUrl(apiUrl, selectedBook?.cover);

    return (
        <div className={styles.books}>
            <Topbar />
            <main className={styles.main}>
                <Modal show={selectedBook !== null} onHide={() => setSelectedBook(null)}>
                    <Modal.Header>
                        <Modal.Title>{selectedBook?.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedCover && (
                            <div className={styles.cover}>
                                <Image className={styles.coverImg} src={selectedCover} alt={selectedBook?.title} thumbnail></Image>
                            </div>
                        )}
                        <div className={styles.infoField}>
                            Author: {selectedBook ? parseAuthors(selectedBook.author).join(', ') : null}
                        </div>
                        {selectedBook?.isbn ?
                            <div className={styles.infoField}>
                                ISBN: {selectedBook.isbn}
                            </div>
                            : null
                        }

                        <div className={styles.infoField}>
                            {selectedBook?.description}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setSelectedBook(null)}>
                            Close
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
                            {books.length === 0 ? <div className={styles.noBooks}>No books available</div> : books.map((book) => {
                                const coverUrl = assetUrl(apiUrl, book.cover);
                                return (
                                    <Col md="2" key={book.id}>
                                        <div className={styles.cover}>
                                            {coverUrl && <Image className={styles.coverImg} src={coverUrl} alt={book.title} thumbnail onClick={() => setSelectedBook(book)}></Image>}
                                        </div>
                                        <div className="title">
                                            {book.title}
                                        </div>
                                        <div className={styles.actionButtons}>
                                            <Button href={`/book/${book.id}`} className={styles.actionButton} as="a">Read</Button>
                                            <Button variant="secondary" href={`/book/${book.id}/edit`} className={styles.actionButton} as="a">Edit</Button>
                                            <Button variant="danger" onClick={() => deleteBook(book.id)} className={styles.actionButton}>
                                                Delete
                                            </Button>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                </Container>
            </main>
        </div>
    );
}

export default Books;
