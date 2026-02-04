**Backend Engineering Portfolio 🚀**

A collection of advanced backend systems demonstrating core engineering concepts: Authentication, Transactions, Encryption, and System Design.

📂 Projects

   1. Splitr (Expense Engine)
      
      Focus: Transactions & Algorithms
         - Core: Greedy debt simplification algorithm.
         - Tech: Node.js, Express, PostgreSQL (Prisma).
         - Key Feature: Atomic transactions for complex expense splitting logic.
           
   2. Vault (Secure Storage)
   
      Focus: Encryption & Security
         - Core: Zero-Knowledge architecture using AES-256-CBC.
         - Tech: Node.js, Crypto Module, PostgreSQL.
         - Key Feature: Credentials are encrypted at rest; decrypted only on-demand via authenticated API. Includes Unit Testing suite (Jest).
        
🛠️ How to Run

  Each project is self-contained. Navigate to the project folder and follow the instructions.
  
       cd vault
       npm install
       npx prisma migrate dev
       npm run dev
