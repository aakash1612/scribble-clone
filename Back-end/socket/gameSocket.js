const { createRoom, joinRoom, getRoom, removePlayer } = require("../utils/roomManager");
const { getRandomWords } = require("../utils/words");

function setupGameSocket(io) {
  
  function clearRoomTimers(room) {
    if (!room.timers) room.timers = {};
    if (room.timers.drawTimer) clearTimeout(room.timers.drawTimer);
    if (room.timers.selectionTimer) clearTimeout(room.timers.selectionTimer);
    if (room.timers.hintInterval) clearInterval(room.timers.hintInterval);
    
    room.timers.drawTimer = null;
    room.timers.selectionTimer = null;
    room.timers.hintInterval = null;
  }

  function endRoundLogic(roomId, room, winnerName = null) {
    clearRoomTimers(room);

    io.to(roomId).emit("round_end", {
      playerName: winnerName,
      word: room.word,
      scores: room.players
    });

    room.canvasHistory = [];
    // Important: Reset guessed status for all players for next round
    room.players.forEach(p => p.hasGuessed = false);

    // Move to next drawer
    room.drawerIndex = (room.drawerIndex + 1) % room.players.length;

    if (room.drawerIndex === 0) {
      room.round++;
    }

    if (room.round > room.settings.rounds) {
      const leaderboard = [...room.players].sort((a, b) => b.score - a.score);
      io.to(roomId).emit("game_over", { winner: leaderboard[0], leaderboard });
      room.gameStarted = false;
      return;
    }

    // Delay before next round starts
    setTimeout(() => {
      const updatedRoom = getRoom(roomId);
      if (updatedRoom && updatedRoom.players.length > 1) {
        startRound(roomId, updatedRoom);
      }
    }, 4000);
  }

  function startHintTimer(roomId, room) {
    // Reveal first hint after 1/3 of the time has passed
    const hintDelay = (room.settings.drawTime * 1000) / 3;
    
    room.timers.hintInterval = setInterval(() => {
      if (!room.word) return clearInterval(room.timers.hintInterval);

      const hiddenIndexes = room.hint
        .map((c, i) => (c === "_" ? i : null))
        .filter((x) => x !== null);

      // Keep at least 2 letters hidden or 50% of word
      if (hiddenIndexes.length <= 2 || hiddenIndexes.length <= room.word.length / 2) {
        return clearInterval(room.timers.hintInterval);
      }

      const revealIndex = hiddenIndexes[Math.floor(Math.random() * hiddenIndexes.length)];
      room.hint[revealIndex] = room.word[revealIndex];

      // Broadcast hint to everyone except drawer
      const drawer = room.players[room.drawerIndex];
      socketToRoomExceptDrawer(roomId, drawer.id, "word_selected", {
        hint: room.hint.join(" "),
      });
    }, hintDelay);
  }

  // Helper to send to everyone except drawer
  function socketToRoomExceptDrawer(roomId, drawerId, event, data) {
    io.to(roomId).fetchSockets().then(sockets => {
      sockets.forEach(s => {
        if (s.id !== drawerId) io.to(s.id).emit(event, data);
      });
    });
  }

  function startRound(roomId, room) {
    if (!room || room.players.length < 2) {
        io.to(roomId).emit("error", "Not enough players to start");
        return;
    }

    clearRoomTimers(room);
    room.canvasHistory = [];
    io.to(roomId).emit("canvas_clear");

    room.wordChosen = false;
    room.word = "";

    const drawer = room.players[room.drawerIndex];
    const words = getRandomWords(3);

    io.to(roomId).emit("round_start", {
      drawerId: drawer.id,
      drawerName: drawer.name,
      wordOptions: words,
      round: room.round,
      totalRounds: room.settings.rounds
    });

    // Auto-select first word if drawer fails to pick in 15s
    room.timers.selectionTimer = setTimeout(() => {
      if (!room.wordChosen) {
        executeWordSelection(roomId, room, words[0]);
      }
    }, 15000);
  }

  function executeWordSelection(roomId, room, word) {
    room.word = word;
    room.wordChosen = true;
    room.hint = Array(word.length).fill("_");
    const drawer = room.players[room.drawerIndex];

    // Individual signaling
    room.players.forEach((p) => {
      io.to(p.id).emit("word_selected", {
        hint: p.id === drawer.id ? word : room.hint.join(" "),
        drawTime: room.settings.drawTime
      });
    });

    startHintTimer(roomId, room);

    room.timers.drawTimer = setTimeout(() => {
      endRoundLogic(roomId, room);
    }, room.settings.drawTime * 1000);
  }

  /* ---------------- SOCKET EVENTS ---------------- */

  io.on("connection", (socket) => {
    
    socket.on("create_room", ({ name, settings }) => {
      const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
      const room = createRoom(roomId, socket.id, name, settings);
      socket.join(roomId);
      socket.emit("room_created", { roomId });
      io.to(roomId).emit("player_joined", room.players);
    });

    socket.on("get_game_state", ({ roomId }) => {
    const room = getRoom(roomId);
    if (room) {
    socket.emit("game_state", {
      players: room.players,
      round: room.round,
      gameStarted: room.gameStarted,
      canvasHistory: room.canvasHistory,
      drawerId: room.players[room.drawerIndex]?.id
    });
      socket.emit("player_joined", room.players);
  }
});
    socket.on("join_room", ({ roomId, name }) => {
      const room = joinRoom(roomId, socket.id, name);
      if (!room) return socket.emit("error", "Room not found");

      socket.join(roomId);
      io.to(roomId).emit("player_joined", room.players);

      if (room.gameStarted) {
        socket.emit("game_started");
        socket.emit("canvas_sync", room.canvasHistory);
      }
    });

socket.on("start_game", ({ roomId }) => {
      const room = getRoom(roomId);
      if (room && room.host === socket.id && !room.gameStarted) {
        room.gameStarted = true;
        io.to(roomId).emit("game_started");
        io.to(roomId).emit("player_joined", room.players);

        setTimeout(() => startRound(roomId, room), 1000);
      }
    });

    socket.on("word_chosen", ({ roomId, word }) => {
      const room = getRoom(roomId);
      if (!room || room.wordChosen) return;
      const drawer = room.players[room.drawerIndex];
      if (socket.id !== drawer.id) return;

      if (room.timers.selectionTimer) clearTimeout(room.timers.selectionTimer);
      executeWordSelection(roomId, room, word);
    });

socket.on("guess", ({ roomId, guess }) => {
      const room = getRoom(roomId);
      if (!room || !room.word) return;

      const player = room.players.find(p => p.id === socket.id);
      const drawer = room.players[room.drawerIndex];
      
      if (!player || socket.id === drawer.id || player.hasGuessed) return;

      if (guess.trim().toLowerCase() === room.word.toLowerCase()) {
        player.hasGuessed = true;
        player.score += 100; 
        drawer.score += 25;

        // 1. Tell everyone a correct guess happened (for the chat/notification)
        io.to(roomId).emit("correct_guess", { playerName: player.name });

        // 2. CRITICAL: Send the updated players array to everyone IMMEDIATELY
        // This makes the scorecard update on the screen right now
        io.to(roomId).emit("player_joined", room.players); 

        // 3. Check if everyone (except drawer) has guessed
        const totalGuessed = room.players.filter(p => p.hasGuessed).length;
        if (totalGuessed === room.players.length - 1) {
          endRoundLogic(roomId, room, "Everyone");
        }
      } else {
        io.to(roomId).emit("chat_message", { playerName: player.name, text: guess });
      }
    });

    // Canvas Events
 socket.on("draw_data", (payload) => {
  const { roomId, type, data } = payload; // Destructure top-level properties
  const room = getRoom(roomId);
  
  if (!room) return;

  // 1. Store in history for new joiners
  room.canvasHistory.push({ type, data });
  socket.to(roomId).emit("draw_data", { type, data });
});

    socket.on("canvas_clear", ({ roomId }) => {
      const room = getRoom(roomId);
      if (room) {
        room.canvasHistory = [];
        io.to(roomId).emit("canvas_clear");
      }
    });

    socket.on("disconnect", () => {
      const result = removePlayer(socket.id);
      if (result && result.wasDrawer) {
        const room = getRoom(result.roomId);
    // Force end the round because the drawer left
    endRoundLogic(result.roomId, room, "Drawer Disconnected");
      }
    });
  });
}

module.exports = setupGameSocket;