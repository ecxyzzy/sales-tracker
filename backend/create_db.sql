DROP DATABASE IF EXISTS sales_tracker;
CREATE DATABASE sales_tracker;
USE sales_tracker;
CREATE TABLE users (
    uid SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    pswdhash CHAR(60) NOT NULL,
    is_admin BOOLEAN NOT NULL CHECK ((is_admin = 1 AND can_edit = 1) OR (is_admin = 0)),
    can_edit BOOLEAN NOT NULL
);
CREATE TABLE products (
    pid SERIAL PRIMARY KEY,
    pname VARCHAR(255) NOT NULL
);
CREATE TABLE transactions (
    tid SERIAL PRIMARY KEY,
    tdate DATE NOT NULL,
    tproduct BIGINT UNSIGNED NOT NULL,
    tcount DECIMAL(7,2) NOT NULL,
    price DECIMAL(6,2) NOT NULL,
    est_total DECIMAL(11,2) GENERATED ALWAYS AS (tcount * price),
    act_total DECIMAL(11,2) NOT NULL,
    handler1 BIGINT UNSIGNED NOT NULL,
    handler2 BIGINT UNSIGNED,
    handler3 BIGINT UNSIGNED,
    remarks VARCHAR(255),
    FOREIGN KEY (tproduct) REFERENCES products(pid),
    FOREIGN KEY (handler1) REFERENCES users(uid),
    FOREIGN KEY (handler2) REFERENCES users(uid),
    FOREIGN KEY (handler3) REFERENCES users(uid)
);
