DROP DATABASE IF EXISTS salesTracker;
CREATE DATABASE salesTracker;
USE salesTracker;
CREATE TABLE users (
    uid SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    hashedPassword CHAR(60) NOT NULL,
    isAdmin BOOLEAN NOT NULL,
    isHandler BOOLEAN NOT NULL
);
CREATE TABLE products (
    pid SERIAL PRIMARY KEY,
    productName VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE transactions (
    tid SERIAL PRIMARY KEY,
    transactionDate DATE NOT NULL,
    product BIGINT UNSIGNED NOT NULL,
    transactionCount DECIMAL(7,2) NOT NULL,
    price DECIMAL(6,2) NOT NULL,
    estimatedTotal DECIMAL(11,2) GENERATED ALWAYS AS (transactionCount * price),
    actualTotal DECIMAL(11,2) NOT NULL,
    handler1 BIGINT UNSIGNED NOT NULL,
    handler2 BIGINT UNSIGNED,
    handler3 BIGINT UNSIGNED,
    remarks TEXT,
    FOREIGN KEY (product) REFERENCES products(pid),
    FOREIGN KEY (handler1) REFERENCES users(uid),
    FOREIGN KEY (handler2) REFERENCES users(uid),
    FOREIGN KEY (handler3) REFERENCES users(uid)
);
