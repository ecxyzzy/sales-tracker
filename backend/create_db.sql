DROP DATABASE IF EXISTS sales_tracker;
CREATE DATABASE sales_tracker;
USE sales_tracker;
CREATE TABLE users (
    uid SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    hashed_password CHAR(60) NOT NULL,
    is_admin BOOLEAN NOT NULL,
    is_handler BOOLEAN NOT NULL
);
CREATE TABLE products (
    pid SERIAL PRIMARY KEY,
    p_name VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE transactions (
    tid SERIAL PRIMARY KEY,
    t_date DATE NOT NULL,
    t_product BIGINT UNSIGNED NOT NULL,
    t_count DECIMAL(7,2) NOT NULL,
    price DECIMAL(6,2) NOT NULL,
    est_total DECIMAL(11,2) GENERATED ALWAYS AS (t_count * price),
    act_total DECIMAL(11,2) NOT NULL,
    handler1 BIGINT UNSIGNED NOT NULL,
    handler2 BIGINT UNSIGNED,
    handler3 BIGINT UNSIGNED,
    remarks TEXT,
    FOREIGN KEY (t_product) REFERENCES products(pid),
    FOREIGN KEY (handler1) REFERENCES users(uid),
    FOREIGN KEY (handler2) REFERENCES users(uid),
    FOREIGN KEY (handler3) REFERENCES users(uid)
);
