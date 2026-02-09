const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const matches = {
    "live": {
        battingTeam: "India",
        bowlingTeam: "Australia",
        runs: 145,
        wickets: 3,
        overs: 18.4, 
        lastBallCommentary: "Start of the match"
    }
};

io.on('connection', (socket) => {
    console.log('🏏 Fan Connected:', socket.id);

    socket.on('join_match', (matchId) => {
        socket.join(matchId);
        socket.emit('init_score', matches[matchId] || {});
    });
});

app.post('/match/:id/ball', (req, res) => {
    const { id } = req.params;
    const { runs, isWicket, commentary } = req.body;

    if (!matches[id]) return res.status(404).json({ error: "Match not found" });

    const match = matches[id];

    match.runs += (runs || 0);
    if (isWicket) match.wickets += 1;
    match.lastBallCommentary = commentary || "Dot ball";

    let ball = Math.round((match.overs % 1) * 10);
    if (ball >= 5) {
        match.overs = Math.floor(match.overs) + 1.0;
    } else {
        match.overs += 0.1;
    }
    match.overs = parseFloat(match.overs.toFixed(1));

    io.to(id).emit('score_update', match);

    res.json({ message: "Ball updated", match });
});

server.listen(3003, () => console.log("🏏 Cricket Live Server running on 3003"));