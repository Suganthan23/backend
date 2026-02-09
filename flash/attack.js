const axios = require('axios');

const URL = "http://localhost:3002";

async function runAttack() {
    console.log("1. Resetting Auction...");
    const initResponse = await axios.post(`${URL}/init`);
    const targetId = initResponse.data.id;

    console.log(`   -> Item reset to $500 (ID: ${targetId})\n`);

    console.log("2. 🚀 Launching Concurrent Bids...");

    const safeRequest = (p) => p.then(r => console.log(`✅ Success (${r.data.currentPrice})`))
        .catch(e => console.log(`❌ Failed: ${e.response?.data?.error}`));

    const p1 = axios.post(`${URL}/bid`, {
        itemId: targetId, 
        amount: 550,
        username: "Alice (High Bidder)"
    });

    const p2 = axios.post(`${URL}/bid`, {
        itemId: targetId, 
        amount: 505,
        username: "Bob (Low Bidder)"
    });

    await Promise.all([safeRequest(p1), safeRequest(p2)]);

    console.log("\n3. Attack Finished.");
}

runAttack();