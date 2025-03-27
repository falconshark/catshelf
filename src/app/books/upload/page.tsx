'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Table } from 'react-bootstrap';
import Topbar from '@/app/components/Topbar';
import Dropzone from 'react-dropzone';
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import styles from "./page.module.css";

const UploadBooks: React.FC = () => {
    const router = useRouter()
    const token = useAppSelector((state) => state.common.token);
    const apiUrl = useAppSelector((state) => state.common.apiUrl);

    const dropzoneConfig = {
        accept: 'application/epub+zip',
    };
    const [files, setFiles] = useState<File[]>([]);

    function onDrop(acceptedFiles: File[]) {
        setFiles(acceptedFiles);
    }

    async function onUpload() {
        for (const file of files) {
            const data = new FormData();
            data.append('file', file);
            try {
                const response = await fetch(
                    `${apiUrl}/api/v1/book/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${token}`,
                    },
                    body: data
                }
                );
                const result = await response.json();
                if(response.status !== 200){
                    return;
                }
                router.push("/books");
            } catch (error) {
                console.log(error);
            }
        }
    }

    const fileList = () => {
        const items = [];
        for (let i = 0; i < files.length; i++) {
            items.push(<tr key={files[i].name}>
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
                                {fileList()}
                            </tbody>
                        </Table>
                    </div>
                    <div className={styles.uploadButton}>
                        <Button onClick={onUpload}>Upload</Button>
                    </div>
                </Container>
            </main>
        </div>
    );
}

export default UploadBooks;