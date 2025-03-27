'use client';
import { Container, Card, Button, Image, Row, Col } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import Topbar from '../components/Topbar';
import styles from "./page.module.css";   

function Dashboard() {
  const apiUrl = useAppSelector((state) => state.common.apiUrl);
  const token = useAppSelector((state) => state.common.token);
  return (
    <div className={styles.dashboard}>
      <Topbar />
      <main className={styles.main}>
        <Container>
          <h1>Dashboard</h1>
          <div className={styles.dashboardCard}>
            <Card>
              <Card.Body>
                <Card.Title><h2>Latest Book</h2></Card.Title>
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
              </Card.Body>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}

export default Dashboard;