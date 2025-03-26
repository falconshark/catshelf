'use client';
import { Container, Card, Button, Image, Row, Col } from 'react-bootstrap';
import Topbar from '../components/Topbar';
import styles from "./page.module.css";

function Books() {
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
                            <Col md="2">
                                <div className={styles.book}>
                                    <div className={styles.cover}>
                                        <Image className={styles.coverImg} src="/images/demo-cover1.jpg" thumbnail />
                                    </div>
                                    <div className="title">
                                        Hello World
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </main>
        </div>
    );
}

export default Books;