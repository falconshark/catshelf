'use client';
import { use, useState, useEffect, useRef } from "react";
import { Container } from 'react-bootstrap';
import { ReactReader } from 'react-reader'
import { useAppSelector } from "@/lib/hooks";
import { useApi, useRequireAuth } from "@/lib/useApi";
import { assetUrl } from "@/lib/books";
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

    const token = useRequireAuth();
    const api = useApi();
    const apiUrl = useAppSelector((state) => state.common.apiUrl);
    const { id } = use(params);

    useEffect(() => {
        if (!token) return;
        const fetchBook = async () => {
            try {
                const response = await api(`/api/v1/book/${encodeURIComponent(id)}/`);
                if (!response.ok) return;
                const result = await response.json();
                setBookUrl(assetUrl(apiUrl, result.file) ?? '');
            } catch (error) {
                console.error(error);
            }
        };
        fetchBook();
    }, [token, api, apiUrl, id]);

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
