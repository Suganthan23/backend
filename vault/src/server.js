const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('./utils/encryption'); // Our math tool

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "vault_secret_123";

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, password: hashedPassword }
        });
        res.status(201).json({ message: "User created", userId: user.id });
    } catch (e) {
        res.status(400).json({ error: "User already exists" });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token });
});

app.post('/credentials', authenticateToken, async (req, res) => {
    try {
        const { siteName, username, password } = req.body;
        const userId = req.user.userId;

        const { iv, encryptedData } = encrypt(password);

        const credential = await prisma.credential.create({
            data: {
                siteName,
                username,
                encryptedPassword: encryptedData,
                iv: iv,
                user: { connect: { id: userId } }
            }
        });

        res.status(201).json({ message: "Saved secure credential", id: credential.id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save" });
    }
});

app.get('/credentials', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const credentials = await prisma.credential.findMany({
            where: { userId: userId }
        });

        const decryptedCredentials = credentials.map(cred => {
            const plainPassword = decrypt(cred.encryptedPassword, cred.iv);

            return {
                id: cred.id,
                siteName: cred.siteName,
                username: cred.username,
                password: plainPassword 
            };
        });

        res.json(decryptedCredentials);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch credentials" });
    }
});

app.listen(3001, () => console.log("Vault running on port 3001"));