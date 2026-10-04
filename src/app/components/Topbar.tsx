'use client';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import { useAppSelector } from '@/lib/hooks';
import { useLogout } from '@/lib/useApi';

function Topbar() {
  const token = useAppSelector((state) => state.common.token);
  const logout = useLogout();

  return (
    <Navbar expand="lg" className="bg-body-tertiary">
    <Container>
      <Navbar.Brand href="/dashboard">Catshelf</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          <Nav.Link href="/dashboard">Dashboard</Nav.Link>
          <Nav.Link href="/books">Books</Nav.Link>
        </Nav>
        <Nav className="justify-content-end">
          {token && <Button variant="outline-secondary" size="sm" onClick={logout}>Logout</Button>}
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>
  );
}

export default Topbar;
