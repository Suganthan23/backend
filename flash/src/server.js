const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.post('/init', async (req, res) => {
    await prisma.bid.deleteMany();
    await prisma.auctionItem.deleteMany();

    const item = await prisma.auctionItem.create({
        data: { name: "PlayStation 5 Pro", currentPrice: 500 }
    });
    res.json(item);
});

app.post('/bid', async (req, res) => {
    const { itemId, amount, username } = req.body;

    try {
        // 1. Read Item AND Version
        const item = await prisma.auctionItem.findUnique({
            where: { id: itemId }
        });

        if (!item) return res.status(404).json({ error: "Item not found" });

        if (parseFloat(amount) <= parseFloat(item.currentPrice)) {
            return res.status(400).json({ error: "Bid too low!" });
        }

        // DELAY (Still here to simulate traffic)
        await new Promise(r => setTimeout(r, 100));

        // 2. THE FIX: Optimistic Locking 🔒
        // We only update if the 'version' matches what we read in Step 1.
        const result = await prisma.auctionItem.updateMany({
            where: {
                id: itemId,
                version: item.version // <--- The Guard Logic
            },
            data: {
                currentPrice: parseFloat(amount),
                version: { increment: 1 } // Bump version to invalidate other bids
            }
        });

        // 3. Check if we won
        if (result.count === 0) {
            // If count is 0, it means the version changed while we were waiting.
            // Someone else got there first!
            return res.status(409).json({ error: "Race Condition! Someone outbid you. Try again." });
        }

        await prisma.bid.create({
            data: { amount: parseFloat(amount), itemId, username }
        });

        res.json({ message: "Bid Accepted!", currentPrice: amount });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed" });
    }
});

app.listen(3002, () => console.log("Auction Server running on 3002"));