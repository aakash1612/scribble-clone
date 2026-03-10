import { useState,useEffect,useRef } from "react";
import socket from "../socket/socket";
import "./GameComponents.css";

function ChatBox({ roomId, disabled }) {

  const [text,setText] = useState("");
  const [messages,setMessages] = useState([]);

  const bottomRef = useRef();

  useEffect(()=>{

    socket.on("chat_message",(msg)=>{
      setMessages(prev=>[...prev,msg]);
    });

  socket.on("correct_guess",({playerName})=>{
  setMessages(prev=>[
    ...prev,
    {
      type:"correct",
      playerName,
      text:`${playerName} guessed the word!`
    }
  ]);
});

    socket.on("round_start",()=>{
      setMessages([]);
    });

    return ()=>{

      socket.off("chat_message");
      socket.off("correct_guess");
      socket.off("round_start");

    };

  },[]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages]);

  const send = ()=>{

    if(!text.trim()) return;

    socket.emit("guess",{
      roomId,
      guess:text
    });

    setText("");

  };

  return (

    <div>

      <div style={{height:200,overflowY:"auto"}}>

        {messages.map((m,i)=>{

  if(m.type === "correct"){
    return (
      <div key={i} className="correct-guess-banner">
        🎉 {m.text}
      </div>
    );
  }

  return (
    <div key={i} className="chat-message">
      <b>{m.playerName}:</b> {m.text}
    </div>
  );

})}

        <div ref={bottomRef}/>

      </div>

      {!disabled && (

        <div>

          <input
            value={text}
            onChange={(e)=>setText(e.target.value)}
            onKeyDown={(e)=>e.key==="Enter" && send()}
          />

          <button onClick={send}>
            Send
          </button>

        </div>

      )}

    </div>

  );

}

export default ChatBox;