const rooms = {};

/* ---------------- CREATE ROOM ---------------- */
function createRoom(roomId, hostId, hostName, customSettings = {}) {
  const room = {
    id: roomId,
    host: hostId, // The ID of the current host
    players: [{
      id: hostId,
      name: hostName,
      score: 0,
      hasGuessed: false // Track if they guessed correctly this round
    }],
    settings: {
      rounds: customSettings.rounds || 3,
      drawTime: customSettings.drawTime || 60,
      maxPlayers: customSettings.maxPlayers || 10
    },
    drawerIndex: 0,
    round: 1,
    word: "",
    hint: [],
    wordChosen: false,
    gameStarted: false,
    canvasHistory: [],
    timers: {
      drawTimer: null,
      selectionTimer: null,
      hintInterval: null
    }
  };

  rooms[roomId] = room;
  return room;
}

/* ---------------- JOIN ROOM ---------------- */
function joinRoom(roomId, playerId, name) {
  const room = rooms[roomId];
  if (!room) return null;
  
  // Prevent joining if game full
  if (room.players.length >= room.settings.maxPlayers) return null;

  const player = {
    id: playerId,
    name,
    score: 0,
    hasGuessed: false
  };

  room.players.push(player);
  return room;
}

/* ---------------- GET ROOM ---------------- */
function getRoom(roomId) {
  return rooms[roomId];
}

/* ---------------- REMOVE PLAYER ---------------- */
function removePlayer(playerId) {
  for (const roomId in rooms) {
    const room = rooms[roomId];
    const index = room.players.findIndex(p => p.id === playerId);

    if (index !== -1) {
      const wasDrawer = (room.drawerIndex === index);
      const wasHost = (room.host === playerId);

      // Remove the player
      room.players.splice(index, 1);

      // 1. Delete room if empty
      if (room.players.length === 0) {
        delete rooms[roomId];
        return null;
      }

      // 2. Host Migration: If host left, assign first remaining player as host
      if (wasHost) {
        room.host = room.players[0].id;
      }

      // 3. Adjust Drawer Index
      // If the removed player was before the current drawer, shift index back
      if (index < room.drawerIndex) {
        room.drawerIndex--;
      }
      
      // Wrap around if index is now out of bounds
      if (room.drawerIndex >= room.players.length) {
        room.drawerIndex = 0;
      }

      return {
        roomId,
        players: room.players,
        wasDrawer, // Alert the socket handler to reset the round if needed
        newHost: room.host
      };
    }
  }
  return null;
}

module.exports = { createRoom, joinRoom, getRoom, removePlayer };