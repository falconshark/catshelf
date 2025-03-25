'use client';
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Form, Button } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { setToken } from "@/lib/reducers/commonSlice"


const Dashboard: React.FC = () => {
  const token = useAppSelector((state) => state.common.token);
  const dispatch = useAppDispatch();

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api-token-auth/',{
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({username: username, password: password})
        }
      );
      const result = await response.json();
      const token = result['token'];
      dispatch(setToken(token));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="dashboard">
            Hello World !
        </div>
      </main>
    </div>
  );
}

export default Dashboard;