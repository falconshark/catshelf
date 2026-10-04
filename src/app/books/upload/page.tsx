'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Table, Alert } from 'react-bootstrap';
import Topbar from '@/app/components/Topbar';
import Dropzone from 'react-dropzone';
import { useApi, useRequireAuth } from "@/lib/useApi";
import styles from "./page.module.css";

const MAX_EPUB_BYTES = 100 * 1024 * 1024; // keep in step with the API's limit

const UploadBooks: React.FC = () => {
    const router = useRouter()
    useRequireAuth();
    const api = useApi();

    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    function onDrop(acceptedFiles: File[]) {
        setFiles((current) => {
            const seen = new Set(current.map((f) => `${f.name}:${f.size}`));
            return [...current, ...acceptedFiles.filter((f) => !seen.has(`${f.name}:${f.size}`))];
        });
    }

    function removeFile(file: File) {
        setFiles((current) => current.filter((f) => f !== file));
    }

    async function onUpload() {
        setError(null);
        setUploading(true);
        const failed: File[] = [];

        for (const file of files) {
            const data = new FormData();
            data.append('file', file);
            try {
                const response = await api('/api/v1/book/', { method: 'POST', body: data });
                if (!response.ok) failed.push(file);
            } catch (error) {
                console.error(error);
                failed.push(file);
            }
        }

        setUploading(false);
        if (failed.length === 0) {
            router.push("/books");
        } else {
            // Keep only the files that didn't make it, so Upload can be retried
            setFiles(failed);
            setError(`Could not upload: ${failed.map((f) => f.name).join(', ')}`);
        }
    }

    return (
        <div className={styles.bookUpload}>
            <Topbar />
            <main className={styles.main}>
                <Container>
                    <h1>Upload Books</h1>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <div className={styles.dropzone}>
                        <Dropzone
                            onDrop={onDrop}
                            accept={{ 'application/epub+zip': ['.epub'] }}
                            maxSize={MAX_EPUB_BYTES}
                        >
                            {({ getRootProps, getInputProps }) => (
                                <section>
                                    <div {...getRootProps()}>
                                        <input {...getInputProps()} />
                                        <div className={styles.help}>
                                            Drop epub file into the dropzone and click &quot;upload&quot; button to upload.
                                        </div>
                                        <Button>Add File</Button>
                                    </div>
                                </section>
                            )}
                        </Dropzone>
                    </div>
                    <div className={styles.uploadList}>
                        <Table striped bordered>
                            <thead>
                                <tr>
                                    <th>File Name</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map((file) => (
                                    <tr key={`${file.name}:${file.size}`}>
                                        <td>{file.name}</td>
                                        <td><Button variant="danger" disabled={uploading} onClick={() => removeFile(file)}>Remove</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                    <div className={styles.uploadButton}>
                        <Button onClick={onUpload} disabled={uploading || files.length === 0}>
                            {uploading ? 'Uploading…' : 'Upload'}
                        </Button>
                    </div>
                </Container>
            </main>
        </div>
    );
}

export default UploadBooks;
