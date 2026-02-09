# Backend Engineering Portfolio 🚀

A collection of four advanced backend systems built to master **Authentication, Transactions, Concurrency, and Real-Time Architectures**.

## 📂 Projects Overview

### 1. [Splitr (Expense Engine)](./splitr)
*   **Core Concept:** **Atomic Transactions & ACID Compliance**.
*   **What it does:** A group expense splitter (like Splitwise) that uses a greedy algorithm to simplify debts.
*   **Key Engineering:**
    *   Relational Schema Design (User <-> Group <-> Expense).
    *   Database Transactions to ensure data integrity during splits.
    *   JWT Authentication & RBAC.

### 2. [Vault (Zero-Knowledge Store)](./vault)
*   **Core Concept:** **Encryption at Rest**.
*   **What it does:** A secure password manager where even the database admin cannot read the stored credentials.
*   **Key Engineering:**
    *   **AES-256-CBC Encryption** using Node.js Crypto module.
    *   Initialization Vectors (IV) for randomizing ciphertexts.
    *   Unit Testing suite using **Jest**.

### 3. [Flash (High-Frequency Auction)](./flash)
*   **Core Concept:** **Concurrency & Race Conditions**.
*   **What it does:** An auction system designed to handle thousands of concurrent bids without data loss.
*   **Key Engineering:**
    *   Simulating Race Conditions with attack scripts.
    *   Implementing **Optimistic Locking** (Version Control) in PostgreSQL to prevent lost updates.

### 4. [Pulse (Real-Time Sports)](./pulse)
*   **Core Concept:** **Event-Driven Architecture**.
*   **What it does:** A live cricket scoreboard that broadcasts updates to thousands of clients instantly.
*   **Key Engineering:**
    *   **WebSockets (Socket.io)** for low-latency data push.
    *   Pub/Sub patterns vs HTTP Polling.
    *   Hybrid HTTP + Socket server design.

---

## 🛠️ Tech Stack
*   **Runtime:** Node.js, Express.js
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Real-Time:** Socket.io
*   **Security:** Bcrypt, JWT, Crypto

---
*Built as part of the 2026 Backend Engineering Roadmap.*
