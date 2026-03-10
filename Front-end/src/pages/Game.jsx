import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import socket from "../socket/socket";
import CanvasBoard from "../components/CanvasBoard";
import ChatBox from "../components/ChatBox";
import PlayerList from "../components/PlayerList";
import "./Game.css";

function Game() {

  const { roomId } = useParams();
  const [totalTime, setTotalTime] = useState(60);
  const [players, setPlayers] = useState([]);
  const [hint, setHint] = useState("");
  const [time, setTime] = useState(0);
  const [selectTime] = useState(15);
  const [winner, setWinner] = useState(null);
  const [wordOptions, setWordOptions] = useState([]);
  const [isDrawer, setIsDrawer] = useState(false);
  const [round, setRound] = useState(1);

  const [timerKey, setTimerKey] = useState(0);

  /* ---------------- SOCKET EVENTS ---------------- */

  useEffect(() => {

    const handleRoundStart = (data) => {
      console.log("Drawer ID from server:", data.drawerId);
      console.log("My socket ID:", socket.id);
      setHint("");
      setRound(data.round);
    

     setTime(selectTime);
     setTotalTime(selectTime);
     setTimerKey(prev => prev + 1);

      const userIsDrawer = data.drawerId === socket.id;
      setIsDrawer(userIsDrawer);
      console.log("Am I drawer?", userIsDrawer);
      if(userIsDrawer){
        setWordOptions(data.wordOptions);
      } else {
        setWordOptions([]);
      }
    };

    const handleWordSelected = (data) => {

      setHint(data.hint);
      setWordOptions([]);

      if(data.drawTime){
        setTime(data.drawTime);
  setTotalTime(data.drawTime);
  setTimerKey(prev => prev + 1);
      }
    };

    const handlePlayers = (data)=>{
      setPlayers(data);
    };

    const handleRoundEnd = (data)=>{
      setPlayers(data.scores);
      setHint(`Word was: ${data.word}`);
      setIsDrawer(false);
    };

    const handleGameOver = ({ winner })=>{
      setWinner(winner);
    };

    const handleGameState = (data)=>{

      if(data.players) setPlayers(data.players);
      if(data.round) setRound(data.round);

    };

    socket.on("round_start", handleRoundStart);
    socket.on("word_selected", handleWordSelected);
    socket.on("player_joined", handlePlayers);
    socket.on("round_end", handleRoundEnd);
    socket.on("game_over", handleGameOver);
    socket.on("game_state", handleGameState);

    socket.emit("get_game_state",{ roomId });

    return ()=>{

      socket.off("round_start", handleRoundStart);
      socket.off("word_selected", handleWordSelected);
      socket.off("player_joined", handlePlayers);
      socket.off("round_end", handleRoundEnd);
      socket.off("game_over", handleGameOver);
      socket.off("game_state", handleGameState);

    };

  },[roomId]);



  /* ---------------- TIMER ---------------- */

  useEffect(()=>{

    if(time <= 0) return;

    const interval = setInterval(()=>{

      setTime(prev => {

        if(prev <= 1){
          clearInterval(interval);
          return 0;
        }

        return prev - 1;

      });

    },1000);

    return ()=> clearInterval(interval);

  },[timerKey]);



  /* ---------------- WORD CHOOSE ---------------- */

  const chooseWord = (word)=>{

    socket.emit("word_chosen",{ roomId, word });
    setWordOptions([]);

  };


  return (

    <div className="game-container">

      {/* HEADER */}

      <div className="game-header">

        <div className="stats">
          <span className="round-badge">Round {round}</span>
        </div>


        {/* WORD HINT */}

        <div className="hint-section">

         {!isDrawer && hint === "" && time === selectTime ? (
  <span className="waiting-text anim-pulse">
    Drawer is choosing a word...
  </span>
) : (

            <span className="hint-text">

              {hint.split("").map((char,i)=>(
                <span key={i} className="hint-letter">
                  {char === "_" ? "\u00A0_\u00A0" : char}
                </span>
              ))}

            </span>

          )}

        </div>



        {/* TIMER */}

        <div className="timer-container">

          <div className={`timer-text ${time < 10 ? "low-time" : ""}`}>
            ⏳ {time}s
          </div>

          <div className="timer-bar-bg">

            <div
              className="timer-bar-fill"
              style={{
           width: `${Math.max((time / totalTime) * 100, 0)}%`,
           backgroundColor: time < 10 ? "#ff4757" : "#2ed573"
              }}
            />

          </div>

        </div>

      </div>



      {/* WORD SELECTOR */}

      {isDrawer && wordOptions.length > 0 && (

        <div className="word-selector-overlay">

          <div className="word-card">

            <h3>Pick a Word</h3>

            <div className="word-buttons">

              {wordOptions.map((w,i)=>(
                <button
                  key={i}
                  className="btn-word"
                  onClick={()=> chooseWord(w)}
                >
                  {w}
                </button>
              ))}

            </div>

          </div>

        </div>

      )}

      {winner && (
  <div className="winner-overlay">
    <div className="winner-card">
      <div className="winner-title">🏆 Game Winner</div>
      <div className="winner-name">{winner.name}</div>

      <button
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          borderRadius: "8px",
          border: "none",
          background: "#5352ed",
          color: "white",
          cursor: "pointer"
        }}
        onClick={() => setWinner(null)}
      >
        Close
      </button>
    </div>
  </div>
)}

      {/* MAIN GAME AREA */}

      <div className="game-main">

        <div className="canvas-section">
          <CanvasBoard roomId={roomId} isDrawer={isDrawer}/>
        </div>

        <div className="sidebar">
          <PlayerList players={players} playerId={socket.id}/>
          <ChatBox roomId={roomId} disabled={isDrawer}/>
        </div>

      </div>

    </div>

  );

}

export default Game;