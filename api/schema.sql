-- Catshelf Node.js API schema
-- Run this once to set up the database tables.

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(256) NOT NULL,
  author         JSON NOT NULL,
  isbn           VARCHAR(13),
  published_date DATE,
  description    TEXT,
  file           VARCHAR(256) NOT NULL,
  cover          VARCHAR(256) NOT NULL DEFAULT '',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
