const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const { map } = require('./map.js');
const Robot = require('./robot.js');
const cors = require('cors');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.json())
app.use(cors({
    origin: "*"
}))

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('a user connected');
    
    const robot = new Robot();
    const interval = setInterval(() => {
        const state = robot.getState();
        socket.emit('state', state);

        // с шансом 1 к 1000 возникает критическая ошибка
        if (Math.random() < 0.001) {
            robot.criticalError();
            socket.emit('criticalError');
        }

        // с шансом 10% он чинит критическую ошибку
        if (Math.random() < 0.1) {
            robot.fixCriticalError();
            socket.emit('fixCriticalError');
        }

        if (state.health <= 0) {
            clearInterval(interval);
            socket.emit('died');
        }

    }, 1000);
    // возобновление работы после смерти
    socket.on('restart', () => {
        robot.restart();
    });

    // переключение режимов
    socket.on('changeMode', () => {
        robot.changeMode();
    });

    // починить критическую ошибку
    socket.on('fixCriticalError', () => {
        robot.fixCriticalError();
    });

    socket.on('heal', () => {
        robot.heal();
    });

    // управление
    socket.on('moveForward', () => {
        robot.moveForward();
    });

    socket.on('moveBackward', () => {
        robot.moveBackward();
    });

    socket.on('turnLeft', () => {
        robot.turnLeft();
    });

    socket.on('turnRight', () => {
        robot.turnRight();
    });

    socket.on('moveLeft', () => {
        robot.moveLeft();
    });

    socket.on('moveRight', () => {
        robot.moveRight();
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        clearInterval(interval);
    });
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});