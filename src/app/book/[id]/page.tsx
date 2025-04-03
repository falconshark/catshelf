'use client';
import { use, useState, useEffect, useRef } from "react";
import { Container, Card, Button, Image, Row, Col } from 'react-bootstrap';
import { ReactReader } from 'react-reader'
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import Topbar from '@/app/components/Topbar';
import type { NavItem, Rendition } from 'epubjs'
import styles from "./page.module.css";

function Book({ params }: { params: Promise<{ id: string }> }) {
    const [bookUrl, setBookUrl] = useState<string>('')

    //For control book viewer
    const [page, setPage] = useState('')
    const rendition = useRef<Rendition | undefined>(undefined)
    const toc = useRef<NavItem[]>([])
    const [location, setLocation] = useState<string | number>(0)

    const token = useAppSelector((state) => state.common.token);
    const apiUrl = useAppSelector((state) => state.common.apiUrl);
    const { id } = use(params);

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
                const bookUrl = `${apiUrl}/api/v1${result.file}`;
                setBookUrl(bookUrl);
            } catch (error) {
                console.log(error);
            }
        };
        fetchBook();
    }, []);
    return (
        <div className={styles.books}>
            <Topbar />
            <main className={styles.main}>
                <Container>
                    <div style={{ height: '80vh' }}>
                        <div className={styles.pageNumber}>
                            { page }
                        </div>
                    <ReactReader
                        url={bookUrl}
                        location={location}
                        tocChanged={(_toc) => (toc.current = _toc)}
                        locationChanged={(loc: string) => {
                          setLocation(loc)
                          if (rendition.current && toc.current) {
                            const { displayed, href } = rendition.current.location.start
                            const chapter = toc.current.find((item) => item.href === href)
                            setPage(
                              `Page ${displayed.page} of ${displayed.total} in chapter ${
                                chapter ? chapter.label : 'n/a'
                              }`
                            )
                          }
                        }}
                        getRendition={(_rendition: Rendition) => {
                          rendition.current = _rendition
                        }}
                    />
                    </div>
                </Container>
            </main>
        </div>
    );
}

export default Book;