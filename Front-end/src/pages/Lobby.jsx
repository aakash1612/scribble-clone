import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../socket/socket";
import "./Lobby.css";

function Lobby() {

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState([]);

  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {

    socket.on("room_created", ({ roomId }) => {
      navigate(`/lobby/${roomId}`);
    });

    socket.on("player_joined", (players) => {
      setPlayers(players);
    });

    socket.on("game_started", () => {
      navigate(`/game/${roomId}`);
    });

    return () => {
      socket.off("room_created");
      socket.off("player_joined");
      socket.off("game_started");
    };

  }, [roomId, navigate]);

  const createRoom = () => {

    if (!name) return alert("Enter name");

    socket.emit("create_room", { name });

  };

  const joinRoom = () => {

    if (!name || !roomCode) return alert("Enter name & room code");

    socket.emit("join_room", {
      roomId: roomCode.toUpperCase(),
      name
    });

    navigate(`/lobby/${roomCode.toUpperCase()}`);

  };

  const startGame = () => {
    socket.emit("start_game", { roomId });
  };

  return (

    <div className="lobby-container">

      <div className="lobby-card">

        {!roomId && (

          <>

            <h2 className="lobby-title">Create Room</h2>

            <input
              placeholder="Your name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />

            <button onClick={createRoom}>
              Create
            </button>

            <hr/>

            <h2>Join Room</h2>

            <input
              placeholder="Room Code"
              value={roomCode}
              onChange={(e)=>setRoomCode(e.target.value)}
            />

            <button onClick={joinRoom}>
              Join
            </button>

          </>

        )}

        {roomId && (

          <>

            <h2 className="lobby-title">Room Code</h2>

            <div className="room-id">
              <span>{roomId}</span>
            </div>

            <h3 className="player-title">Players</h3>

            <div className="players-list">

              {players.map((p,i)=>(
                <div key={i} className="player-item">

                  <div className="avatar">
                    {p.name.charAt(0).toUpperCase()}
                  </div>

                  <span>{p.name}</span>

                </div>
              ))}

            </div>

            <button className="start-btn" onClick={startGame}>
              Start Game
            </button>

          </>

        )}

      </div>

    </div>

  );

}

export default Lobby;