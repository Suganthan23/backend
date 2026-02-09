const io = require('socket.io-client');

const socket = io('http://localhost:3003');

console.log("... Connecting to Stadium ...");

socket.on('connect', () => {
    console.log("✅ Connected! Watching the game.");

    socket.emit('join_match', 'live');
});

socket.on('init_score', (match) => {
    console.log(`\n--- CURRENT SCORE ---`);
    printScore(match);
});

socket.on('score_update', (match) => {
    console.log(`\n🔴 LIVE UPDATE!`);
    printScore(match);
});

function printScore(match) {
    console.log(`${match.battingTeam} vs ${match.bowlingTeam}`);
    console.log(`SCORE: ${match.runs}/${match.wickets}`);
    console.log(`OVERS: ${match.overs}`);
    console.log(`🎙️  Comm: ${match.lastBallCommentary}`);
    console.log("-----------------------");
}