'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Form, Button, Image } from 'react-bootstrap';
import Topbar from '@/app/components/Topbar';
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import styles from "./page.module.css";

function BookDetail({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();

    const [book, setBook] = useState<{ id: number, title: string, author: Array<String>, cover: string, description: string } | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [authors, setAuthors] = useState('');
    const [isbn, setIsbn] = useState('');

    const token = useAppSelector((state) => state.common.token);
    const apiUrl = useAppSelector((state) => state.common.apiUrl);
    const { id } = use(params);

    //For render information
    const coverUrl = `${apiUrl}/api/v1${book?.cover}`;

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await fetch(
                    `${apiUrl}/api/v1/book/${id}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                    },
                  }
                );
                const result = await response.json();
                setBook(result);
                setTitle(result.title);
                setIsbn(result.isbn);
                setDescription(result.description);
                setAuthors(result.author.join(','));
            } catch (error) {
                console.log(error);
            }
        };
        fetchBook();
    }, []);

    const updateBook = async () => {
        try {
            const response = await fetch(
                `${apiUrl}/api/v1/book/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify({ 
                    title: title, 
                    author: authors.split(','), 
                    description: description, 
                    isbn: isbn
                   }),
                }
            );
            const result = await response.json();
            router.push("/books");
        } catch (error) {
            console.log(error);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateBook();
    };

    return (
        <div className={styles.bookUpload}>
            <Topbar />
            <main className={styles.main}>
                <Container>
                    <h1>Edit Book</h1>
                    {book && <Image className={styles.coverImg} src={coverUrl} thumbnail />}
                    {book && <h2 className={styles.bookTitle}>{book?.title}</h2>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="title">
                            <Form.Label>Book Title</Form.Label>
                            <Form.Control type="text" onChange={(e) => setTitle(e.target.value)} value={title} />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="isbn">
                            <Form.Label>ISBN</Form.Label>
                            <Form.Control type="text" onChange={(e) => setIsbn(e.target.value)} value={isbn} />
                        </Form.Group>


                        <Form.Group className="mb-3" controlId="author">
                            <Form.Label>Author</Form.Label>
                            <Form.Control type="text" onChange={(e) => setAuthors(e.target.value)} value={authors} />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="description">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                        </Form.Group>

                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                </Container>
            </main>
        </div>
    );
}
export default BookDetail;