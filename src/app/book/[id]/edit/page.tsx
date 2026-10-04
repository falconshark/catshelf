'use client';
import { use, useState, useEffect, useMemo } from 'react';
import { Container, Form, Button, Image, Alert } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import Topbar from '@/app/components/Topbar';
import { useAppSelector } from "@/lib/hooks"
import { useApi, useRequireAuth } from "@/lib/useApi";
import { assetUrl, parseAuthors, type Book } from "@/lib/books";
import styles from "./page.module.css";

const MAX_COVER_BYTES = 5 * 1024 * 1024; // keep in step with the API's limit

function BookDetail({ params }: { params: Promise<{ id: string }> }) {
    //For dropzone
    const [showDropzone, setShowDropzone] = useState(false);

    function onDrop(acceptedFiles: File[]) {
        if (acceptedFiles[0]) setCover(acceptedFiles[0]);
    }

    //For store full book information
    const [book, setBook] = useState<Book | null>(null);

    //For store form information
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [authors, setAuthors] = useState('');
    const [isbn, setIsbn] = useState('');
    const [cover, setCover] = useState<File | null>(null);
    const [status, setStatus] = useState<{ variant: 'success' | 'danger', message: string } | null>(null);

    const token = useRequireAuth();
    const api = useApi();
    const apiUrl = useAppSelector((state) => state.common.apiUrl);
    const { id } = use(params);

    //For render cover image
    const coverUrl = assetUrl(apiUrl, book?.cover);

    // Object URL for the selected-but-not-yet-saved cover; released when replaced or unmounted
    const coverPreviewUrl = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover]);
    useEffect(() => {
        return () => {
            if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
        };
    }, [coverPreviewUrl]);

    useEffect(() => {
        if (!token) return;
        const fetchBook = async () => {
            try {
                const response = await api(`/api/v1/book/${encodeURIComponent(id)}/`);
                if (!response.ok) {
                    setStatus({ variant: 'danger', message: 'Could not load this book.' });
                    return;
                }
                const result: Book = await response.json();
                setBook(result);
                setTitle(result.title);
                setIsbn(result.isbn ?? '');
                setAuthors(parseAuthors(result.author).join(', '));
                setDescription(result.description ?? '');
            } catch (error) {
                console.error(error);
                setStatus({ variant: 'danger', message: 'Could not load this book.' });
            }
        };
        fetchBook();
    }, [token, api, id]);

    const updateBook = async () => {
        setStatus(null);
        try {
            const data = new FormData();
            if (cover) {
                data.append('file', cover);
            }
            data.append('data', JSON.stringify({
                title: title,
                author: authors.split(',').map((a) => a.trim()).filter(Boolean),
                description: description,
                isbn: isbn
            }));
            const response = await api(`/api/v1/book/${encodeURIComponent(id)}/`, {
                method: 'PATCH',
                body: data
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                setStatus({ variant: 'danger', message: result.error ?? 'Could not save changes.' });
                return;
            }
            setBook(result);
            setCover(null);
            setStatus({ variant: 'success', message: 'Saved.' });
        } catch (error) {
            console.error(error);
            setStatus({ variant: 'danger', message: 'Could not save changes.' });
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
                    {status && <Alert variant={status.variant}>{status.message}</Alert>}
                    {book && coverUrl && <Image className={styles.coverImg} src={coverUrl} alt={book.title} thumbnail />}
                    {book && <h2 className={styles.bookTitle}>{book.title}</h2>}
                    <Button className={styles.changeCoverBtn} variant="secondary" onClick={() => setShowDropzone(!showDropzone)}>
                        Change Cover
                    </Button>

                    {showDropzone && (
                        <div className={styles.dropzone}>
                            <Dropzone
                                onDrop={onDrop}
                                accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/gif': ['.gif'], 'image/webp': ['.webp'] }}
                                maxFiles={1}
                                maxSize={MAX_COVER_BYTES}
                            >
                                {({ getRootProps, getInputProps }) => (
                                    <section>
                                        {coverPreviewUrl && <Image className={styles.coverImg} src={coverPreviewUrl} alt="New cover preview" thumbnail />}
                                        <div {...getRootProps()}>
                                            <input {...getInputProps()} />
                                            <div className={styles.help}>
                                                Drop cover image into the dropzone.
                                            </div>
                                            <Button>Select Image</Button>
                                        </div>
                                    </section>
                                )}
                            </Dropzone>
                        </div>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="title">
                            <Form.Label>Book Title</Form.Label>
                            <Form.Control type="text" maxLength={256} onChange={(e) => setTitle(e.target.value)} value={title} required/>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="isbn">
                            <Form.Label>ISBN</Form.Label>
                            <Form.Control type="text" maxLength={17} onChange={(e) => setIsbn(e.target.value)} value={isbn} />
                        </Form.Group>


                        <Form.Group className="mb-3" controlId="author">
                            <Form.Label>Author</Form.Label>
                            <Form.Control type="text" onChange={(e) => setAuthors(e.target.value)} value={authors} />
                            <Form.Text muted>Separate multiple authors with commas.</Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="description">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} maxLength={20000} value={description} onChange={(e) => setDescription(e.target.value)} />
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
