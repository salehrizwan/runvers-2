import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

interface PlayerSession {
  id: string;
  name: string;
  isHost: boolean;
  colorVariant: 'teal_rebel' | 'crimson_rebel';
  ws: WebSocket;
  distance: number;
  score: number;
  coins: number;
  isAlive: boolean;
  finished: boolean;
}

interface GameRoom {
  code: string;
  createdAt: number;
  hostId: string;
  guestId?: string;
  players: Map<string, PlayerSession>;
  seed: number;
  started: boolean;
}

const rooms = new Map<string, GameRoom>();

// Clean up stale rooms older than 3 hours
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > 3 * 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 60 * 1000);

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

app.post('/api/rooms/check', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });
  const room = rooms.get(String(code).trim().toUpperCase());
  if (!room) return res.status(404).json({ exists: false, error: 'Room does not exist' });
  if (room.players.size >= 2) return res.status(400).json({ exists: true, full: true, error: 'Room is full' });
  if (room.started) return res.status(400).json({ exists: true, started: true, error: 'Race already started' });
  
  const hostPlayer = Array.from(room.players.values()).find((p) => p.isHost);
  return res.json({ exists: true, hostName: hostPlayer?.name || 'Rival Host' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch (err) {
    console.error('Upgrade error:', err);
  }
});

function sendTo(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastToRoom(room: GameRoom, data: object, excludeWs?: WebSocket) {
  for (const player of room.players.values()) {
    if (player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(data));
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  ws.on('message', (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      const { type } = data;

      if (type === 'create_room') {
        const playerName = (data.name || 'Runner 1').trim().slice(0, 16);
        let code = '';
        for (let attempt = 0; attempt < 10; attempt++) {
          const generated = Math.floor(1000 + Math.random() * 9000).toString();
          if (!rooms.has(generated)) {
            code = generated;
            break;
          }
        }
        if (!code) code = Date.now().toString().slice(-4);

        const playerId = 'host_' + Math.random().toString(36).slice(2, 9);
        const newRoom: GameRoom = {
          code,
          createdAt: Date.now(),
          hostId: playerId,
          players: new Map(),
          seed: Math.floor(Math.random() * 1000000),
          started: false,
        };

        const hostSession: PlayerSession = {
          id: playerId,
          name: playerName,
          isHost: true,
          colorVariant: 'teal_rebel',
          ws,
          distance: 0,
          score: 0,
          coins: 0,
          isAlive: true,
          finished: false,
        };
        newRoom.players.set(playerId, hostSession);
        rooms.set(code, newRoom);

        currentRoomCode = code;
        currentPlayerId = playerId;

        sendTo(ws, {
          type: 'room_created',
          code,
          playerId,
          isHost: true,
          colorVariant: 'teal_rebel',
          hostName: playerName,
        });
      } else if (type === 'join_room') {
        const rawCode = (data.code || '').trim().toUpperCase();
        const playerName = (data.name || 'Runner 2').trim().slice(0, 16);
        const room = rooms.get(rawCode);

        if (!room) {
          sendTo(ws, { type: 'join_error', message: 'Room code not found. Please verify the 4-digit code.' });
          return;
        }
        if (room.players.size >= 2) {
          sendTo(ws, { type: 'join_error', message: 'This room is already full (2/2 players).' });
          return;
        }
        if (room.started) {
          sendTo(ws, { type: 'join_error', message: 'This race has already started.' });
          return;
        }

        const playerId = 'guest_' + Math.random().toString(36).slice(2, 9);
        const hostPlayer = Array.from(room.players.values()).find((p) => p.isHost);

        const guestSession: PlayerSession = {
          id: playerId,
          name: playerName,
          isHost: false,
          colorVariant: 'crimson_rebel',
          ws,
          distance: 0,
          score: 0,
          coins: 0,
          isAlive: true,
          finished: false,
        };

        room.guestId = playerId;
        room.players.set(playerId, guestSession);

        currentRoomCode = rawCode;
        currentPlayerId = playerId;

        // Notify guest
        sendTo(ws, {
          type: 'room_joined',
          code: rawCode,
          playerId,
          isHost: false,
          colorVariant: 'crimson_rebel',
          guestName: playerName,
          hostName: hostPlayer?.name || 'Rival Host',
        });

        // Notify host
        if (hostPlayer) {
          sendTo(hostPlayer.ws, {
            type: 'guest_joined',
            guestId: playerId,
            guestName: playerName,
            colorVariant: 'crimson_rebel',
          });
        }
      } else if (type === 'start_race') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        room.started = true;
        room.seed = Math.floor(Math.random() * 1000000);

        // Reset player match stats
        for (const player of room.players.values()) {
          player.distance = 0;
          player.score = 0;
          player.coins = 0;
          player.isAlive = true;
          player.finished = false;
        }

        broadcastToRoom(room, {
          type: 'race_starting',
          countdown: 3,
          seed: room.seed,
        });
      } else if (type === 'player_sync') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        const session = room.players.get(currentPlayerId);
        if (session) {
          session.distance = data.distance || 0;
          session.score = data.score || 0;
          session.coins = data.coins || 0;
          session.isAlive = data.isAlive ?? true;
        }

        // Relay position & animation state to rival
        broadcastToRoom(
          room,
          {
            type: 'rival_sync',
            senderId: currentPlayerId,
            x: data.x,
            y: data.y,
            z: data.z,
            lane: data.lane,
            animState: data.animState,
            speed: data.speed,
            distance: data.distance,
            score: data.score,
            isAlive: data.isAlive,
          },
          ws
        );
      } else if (type === 'player_stumble') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (room) {
          broadcastToRoom(room, { type: 'rival_stumble', senderId: currentPlayerId }, ws);
        }
      } else if (type === 'player_fatal_crash') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (room) {
          const session = room.players.get(currentPlayerId);
          if (session) {
            session.isAlive = false;
          }
          broadcastToRoom(
            room,
            {
              type: 'rival_crashed',
              senderId: currentPlayerId,
              distance: data.distance,
              score: data.score,
            },
            ws
          );
        }
      } else if (type === 'player_revive') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (room) {
          const session = room.players.get(currentPlayerId);
          if (session) {
            session.isAlive = true;
          }
          broadcastToRoom(room, { type: 'rival_revived', senderId: currentPlayerId }, ws);
        }
      } else if (type === 'player_finished') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        const session = room.players.get(currentPlayerId);
        if (session) {
          session.finished = true;
          session.distance = data.distance || session.distance;
          session.score = data.score || session.score;
          session.coins = data.coins || session.coins;
        }

        // Notify rival
        broadcastToRoom(
          room,
          {
            type: 'rival_finished',
            senderId: currentPlayerId,
            distance: session?.distance || 0,
            score: session?.score || 0,
          },
          ws
        );

        // Check if both players have finished their runs
        const allFinished = Array.from(room.players.values()).every((p) => p.finished);
        if (allFinished) {
          const playersList = Array.from(room.players.values()).map((p) => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            colorVariant: p.colorVariant,
            distance: p.distance,
            score: p.score,
            coins: p.coins,
          }));

          broadcastToRoom(room, {
            type: 'race_game_over',
            players: playersList,
          });
        }
      } else if (type === 'rematch_request') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        // Reset room state
        room.started = true;
        room.seed = Math.floor(Math.random() * 1000000);
        for (const player of room.players.values()) {
          player.distance = 0;
          player.score = 0;
          player.coins = 0;
          player.isAlive = true;
          player.finished = false;
        }

        broadcastToRoom(room, {
          type: 'race_starting',
          countdown: 3,
          seed: room.seed,
        });
      }
    } catch (e) {
      console.error('Socket message processing error:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && currentPlayerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.players.delete(currentPlayerId);
        broadcastToRoom(room, {
          type: 'rival_left',
          message: 'Your rival disconnected from the race.',
        });
        if (room.players.size === 0) {
          rooms.delete(currentRoomCode);
        }
      }
    }
  });
});

// Full-stack Vite dev middleware or static dist serve
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`RUNVERSE Game Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
