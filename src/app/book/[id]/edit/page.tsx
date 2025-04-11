'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Form, Button, Image } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import Topbar from '@/app/components/Topbar';
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import styles from "./page.module.css";

function BookDetail({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();

    //For dropzone
    const [showDropzone, setShowDropzone] = useState(false);
    const dropzoneConfig = {
        accept: 'image/*',
        maxFiles: 1,
    };
    function coverPreview(cover: File) {
        const objectUrl = URL.createObjectURL(cover)
        return objectUrl;
    }

    function onDrop(acceptedFiles: File[]) {
        setCover(acceptedFiles[0]);
    }

    //For store full book information
    const [book, setBook] = useState<{ id: number, title: string, author: Array<String>, cover: string, description: string } | null>(null);

    //For store form information
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [authors, setAuthors] = useState('');
    const [isbn, setIsbn] = useState('');
    const [cover, setCover] = useState<File | null>(null);


    const token = useAppSelector((state) => state.common.token);
    const apiUrl = useAppSelector((state) => state.common.apiUrl);
    const { id } = use(params);

    //For render cover image
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
                if (result.isbn) {
                    setIsbn(result.isbn);
                }
                if (result.author) {
                    let authors = JSON.parse(result.author).join(',');
                    setAuthors(authors);
                }
                if (result.description) {
                    setDescription(result.description);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchBook();
    }, []);

    const updateBook = async () => {
        try {
            const data = new FormData();
            if (cover) {
                data.append('file', cover);
            }
            data.append('data', JSON.stringify({
                title: title,
                author: authors.split(','),
                description: description,
                isbn: isbn
            }));
            const response = await fetch(
                `${apiUrl}/api/v1/book/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: data
            }
            );
            const result = await response.json();
            //router.push("/books");
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
                    <Button className={styles.changeCoverBtn} variant="secondary" onClick={() => setShowDropzone(!showDropzone)}>
                        Change Cover
                    </Button>

                    {showDropzone && (
                        <div className={styles.dropzone}>
                            <Dropzone onDrop={onDrop}>
                                {({ getRootProps, getInputProps }) => (
                                    <section>
                                        {cover && <Image className={styles.coverImg} src={coverPreview(cover)} thumbnail />}
                                        <div {...getRootProps()}>
                                            <input {...getInputProps()} {...dropzoneConfig} />
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
                            <Form.Control type="text" onChange={(e) => setTitle(e.target.value)} value={title} required/>
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