'use client';
import { useState, useEffect } from "react";
import { Container, Card, Button, Image, Row, Col } from 'react-bootstrap';
import Topbar from '@/app/components/Topbar';
import Dropzone from 'react-dropzone';
import styles from "./page.module.css";

const UploadBooks: React.FC = () => {
    const dropzoneConfig = {
        accept: 'application/epub+zip',
    };
    const [files, setFiles] = useState<File[]>([]);

    function onDrop(acceptedFiles: File[]) {
        setFiles(acceptedFiles);
    }

    return (
        <div className={styles.bookUpload}>
            <Topbar />
            <main className={styles.main}>
                <Container>
                    <h1>Upload Books</h1>
                    <div className={styles.dropzone}>
                        <Dropzone onDrop={onDrop}>
                            {({ getRootProps, getInputProps }) => (
                                <section>
                                    <div {...getRootProps()}>
                                        <input {...getInputProps()} {...dropzoneConfig} />
                                        <div className={styles.help}>
                                            Drop epub file into the dropzone and click "upload" button to upload.
                                        </div>
                                        <Button>Upload</Button>
                                    </div>
                                </section>
                            )}
                        </Dropzone>
                    </div>
                </Container>
            </main>
        </div>
    );
}

export default UploadBooks;