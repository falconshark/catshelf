'use client';
import { useState, useEffect } from "react";
import { Container, Button, Table } from 'react-bootstrap';
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
    const fileList = () => {
        const items = [];
        for (let i = 0; i < files.length; i++) {
            items.push(<tr>
                <td>{files[i].name}</td>
                <td><Button variant="danger">Remove</Button></td>
            </tr>)
        }
        return items;
    };

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
                                { fileList() }
                            </tbody>
                        </Table>
                    </div>
                    <div className={styles.uploadButton}>
                        <Button>Upload</Button>
                    </div>
                </Container>
            </main>
        </div>
    );
}

export default UploadBooks;