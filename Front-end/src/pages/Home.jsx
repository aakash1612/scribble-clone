import { useState } from "react";
import socket from "../socket/socket";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {

  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  const navigate = useNavigate();

  const createRoom = () => {

    if (!name) {
      alert("Enter your name");
      return;
    }

    socket.emit("create_room", { name });

    socket.once("room_created", ({ roomId }) => {
      navigate(`/lobby/${roomId}`, { state: { name } });
    });

  };

  const joinRoom = () => {

    if (!name || !roomId) {
      alert("Enter name and room ID");
      return;
    }

    socket.emit("join_room", { roomId, name });

    socket.once("player_joined", () => {
      navigate(`/lobby/${roomId}`, { state: { name } });
    });

  };

  return (

    <div className="home-container">

      <div className="card">

        <h1 className="title">🎨 Skribbl Clone</h1>
        <p className="subtitle">Draw, guess and have fun with friends</p>

        <input
          className="input"
          placeholder="Enter your name"
          onChange={(e) => setName(e.target.value)}
        />

        <button className="btn create-btn" onClick={createRoom}>
          Create Room
        </button>

        <div className="divider">OR</div>

        <input
          className="input"
          placeholder="Enter Room ID"
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button className="btn join-btn" onClick={joinRoom}>
          Join Room
        </button>

      </div>

    </div>

  );

}

export default Home;