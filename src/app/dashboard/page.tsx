'use client';
import Container from 'react-bootstrap/Container';
import Topbar from '../components/Topbar';
import styles from "./page.module.css";


function Dashboard() {
  return (
    <div className={styles.page}>
      <Topbar />
      <main className={styles.main}>
        <Container>
          <div className="latest-books">
            
          </div>
        </Container>
      </main>
    </div>
  );
}

export default Dashboard;