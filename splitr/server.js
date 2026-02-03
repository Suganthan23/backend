const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const app = express();
const prisma = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'stdout',
            level: 'error',
        },
        {
            emit: 'stdout',
            level: 'info',
        },
        {
            emit: 'stdout',
            level: 'warn',
        },
    ],
});

prisma.$on('query', (e) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
    console.log('---------------------------------');
});

const jwt = require('jsonwebtoken');
const JWT_SECRET = "my_super_secret_key_12345";

const authenticateToken = require('./authMiddleware');

app.use(express.json());

app.get('/Health', (req, res) => {
    res.json({
        status: "OK",
        message: "Splitr API is healthy"
    });
});

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required." });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "User with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword },
            select: { id: true, name: true, email: true }
        });

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email: email } });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: "Login successful", token: token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/groups', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        const creatorId = req.user.userId;
        if (!name || !creatorId) {
            return res.status(400).json({ error: 'Name and creatorId are required' });
        }

        const newGroup = await prisma.group.create({
            data: {
                name: name,
                creator: { connect: { id: creatorId } },
                members: { create: { user: { connect: { id: creatorId } } } }
            },
            include: { members: true }
        });

        res.status(201).json({ message: 'Group created', group: newGroup });
    } catch (error) {
        console.error("Error details:", error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get("/users/:id/groups", authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const memberships = await prisma.groupMember.findMany({
            where: { userId: userId },
            include: { group: true },
        });
        const groups = memberships.map(membership => membership.group);
        res.json({ groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.post("/groups/:groupId/members", authenticateToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const { userId } = req.body; 

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const existingMember = await prisma.groupMember.findFirst({
            where: { groupId: groupId, userId: userId }
        });

        if (existingMember) {
            return res.status(400).json({ error: "User is already in this group" });
        }

        const newMember = await prisma.groupMember.create({
            data: {
                groupId: groupId,
                userId: userId
            }
        });

        res.status(201).json({ message: "Member added", member: newMember });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.post("/groups/:groupId/expenses", authenticateToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const paidById = req.user.userId;
        const { description, amount, category, splits } = req.body;

        if (!description || !amount || !splits) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const isMember = await prisma.groupMember.findFirst({
            where: { groupId: groupId, userId: paidById }
        });
        if (!isMember) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }

        const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalSplit - parseFloat(amount)) > 0.01) {
            return res.status(400).json({ error: "Split amounts do not sum up to total amount." });
        }

        const newExpense = await prisma.expense.create({
            data: {
                description,
                category,
                amount: parseFloat(amount),
                group: { connect: { id: groupId } },
                paidBy: { connect: { id: paidById } },
                splits: {
                    create: splits.map(split => ({
                        user: { connect: { id: split.userId } },
                        amount: split.amount,
                    }))
                }
            },
            include: { splits: true }
        });

        res.status(201).json({ message: "Expense added", expense: newExpense });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/groups/:groupId/expenses",  authenticateToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const expenses = await prisma.expense.findMany({
            where: { groupId: groupId },
            include: {
                paidBy: { select: { name: true } },
                splits: { include: { user: { select: { name: true } } } }
            },
        });
        res.json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/groups/:groupId/balances", authenticateToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const expenses = await prisma.expense.findMany({
            where: { groupId: groupId },
            include: { splits: true },
        });

        const balances = {};
        const initUser = (id) => {
            if (!balances[id]) balances[id] = { paid: 0, share: 0, net: 0 };
        };

        for (const expense of expenses) {
            initUser(expense.paidById);
            balances[expense.paidById].paid += expense.amount;
            for (const split of expense.splits) {
                initUser(split.userId);
                balances[split.userId].share += split.amount;
            };
        };

        const userIds = Object.keys(balances).map(id => parseInt(id));
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
        });

        const userMap = {};
        users.forEach(user => {
            userMap[user.id] = user.name;
        });

        const result = Object.keys(balances).map(userId => {
            const id = parseInt(userId);
            const data = balances[id];
            const net = data.paid - data.share;
            return {
                userId: id,
                name: userMap[id] || "Unknown",
                paid: data.paid,
                share: data.share,
                netBalance: net,
                status: net > 0 ? `Gets back ${net}` : `Owes ${Math.abs(net)}`
            };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/groups/:groupId/settle", authenticateToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const expenses = await prisma.expense.findMany({
            where: { groupId: groupId },
            include: { splits: true },
        });

        const balances = {};
        const initUser = (id) => {
            if (!balances[id]) balances[id] = 0;
        };

        expenses.forEach(expense => {
            initUser(expense.paidById);
            balances[expense.paidById] += parseFloat(expense.amount);
            expense.splits.forEach(split => {
                initUser(split.userId);
                balances[split.userId] -= split.amount;
            });
        });

        let debtors = [];
        let creditors = [];
        const userIds = Object.keys(balances).map(id => parseInt(id));

        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
        });

        const userMap = {};
        users.forEach(user => (userMap[user.id] = user.name));

        for (const [userId, amount] of Object.entries(balances)) {
            const id = parseInt(userId);
            if (amount < -0.01) {
                debtors.push({ userId: id, amount: Math.abs(amount) });
            } else if (amount > 0.01) {
                creditors.push({ userId: id, amount: amount });
            }
        }

        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const settlements = [];
        let i = 0, j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            let amount = Math.min(debtor.amount, creditor.amount);

            settlements.push({
                from: userMap[debtor.userId] || `User ${debtor.userId}`,
                to: userMap[creditor.userId] || `User ${creditor.userId}`,
                amount: parseFloat(amount.toFixed(2)),
            });

            debtor.amount -= amount;
            creditor.amount -= amount;

            if (debtor.amount < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        res.json(settlements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Splitr API server is running on port ${PORT}`);
    console.log(`Health Check : http://localhost:${PORT}/Health`);
});