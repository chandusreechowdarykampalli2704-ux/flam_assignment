// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const state = require('./drawing-state');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// This MUST match your client folder name: 'collaborative-canvas'
const clientPath = path.join(__dirname, '../collaborative-canvas'); 
app.use(express.static(clientPath));

let userCursors = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send the full history and cursor list to the new user
    socket.emit('redraw', state.getHistory());
    socket.emit('cursorsUpdate', userCursors);

    // This event now only handles lines
    socket.on('draw', (data) => {
        const newLine = state.addLine(data);
        // Broadcast the single new line to everyone else
        socket.broadcast.emit('draw', newLine);
    });

    // Handle cursor movement
    socket.on('cursorMove', (data) => {
        userCursors[socket.id] = { x: data.x, y: data.y, color: data.color };
        io.emit('cursorsUpdate', userCursors);
    });

    // Handle Undo
    socket.on('undo', () => {
        const newHistory = state.undoOperation();
        io.emit('redraw', newHistory || []);
    });

    // Handle Redo
    socket.on('redo', () => {
        const newHistory = state.redoOperation();
        io.emit('redraw', newHistory || []);
    });

    // Handle Clear
    socket.on('clear', () => {
        const newHistory = state.clearHistory();
        io.emit('redraw', newHistory);
    });
    
    // Handle Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete userCursors[socket.id];
        io.emit('cursorsUpdate', userCursors);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});