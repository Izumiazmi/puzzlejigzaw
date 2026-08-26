const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Mengizinkan akses dari Github Pages Anda
});

// Palet warna untuk kursor pemain
const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

io.on('connection', (socket) => {
    let currentRoom = '';
    
    // Beri warna acak ke pemain yang baru terkoneksi
    socket.data.color = colors[Math.floor(Math.random() * colors.length)];
    socket.data.name = 'Pemain Anonim';

    // 1. Bergabung ke Room
    socket.on('joinRoom', ({ room, name }) => {
        if(currentRoom) socket.leave(currentRoom); // Tinggalkan room lama jika ada
        
        socket.join(room);
        currentRoom = room;
        if(name) socket.data.name = name;
    });

    // 2. Update Nama dari Dropdown
    socket.on('updateName', (newName) => {
        socket.data.name = newName;
    });

    // 3. Broadcast Kursor
    socket.on('cursorMove', (pos) => {
        if (!currentRoom) return;
        socket.to(currentRoom).emit('cursorMoved', {
            id: socket.id,
            name: socket.data.name,
            color: socket.data.color,
            x: pos.x,
            y: pos.y
        });
    });

    // 4. Broadcast Pergerakan Puzzle
    socket.on('pieceMove', (data) => {
        if (!currentRoom) return;
        socket.to(currentRoom).emit('pieceMoved', data); // Teruskan data puzzle ke teman
    });

    // 5. Pemain Keluar
    socket.on('disconnect', () => {
        if (currentRoom) {
            socket.to(currentRoom).emit('playerLeft', socket.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));