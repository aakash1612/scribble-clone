import { useRef, useEffect, useState } from "react";
import socket from "../socket/socket";
import "./GameComponents.css";

function CanvasBoard({ roomId, isDrawer }) {

  const canvasRef = useRef(null);
  const drawing = useRef(false);

  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(3);

  const strokes = useRef([]);

  /* ---------- REDRAW HISTORY ---------- */

  const redrawHistory = (ctx, history) => {

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    history.forEach(stroke => {

      if (!stroke || stroke.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke[0].color;
      ctx.lineWidth = stroke[0].size;
      ctx.lineCap = "round";

      ctx.moveTo(stroke[0].x, stroke[0].y);

      stroke.forEach(p => {
        ctx.lineTo(p.x, p.y);
      });

      ctx.stroke();

    });

  };

  /* ---------- SOCKET EVENTS ---------- */

useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

const handleDrawData = (payload) => {
  if (isDrawer) return; 

  // Depending on your server, the payload might be the object itself
  const { type, data } = payload; 

  if (type === "start") {
    ctx.beginPath();
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(data.x, data.y);
  } 
  else if (type === "move") {

  ctx.strokeStyle = data.color;
  ctx.lineWidth = data.size;

  ctx.lineTo(data.x, data.y);
  ctx.stroke();

}
  else if (type === "end") {
    ctx.closePath();
  }
};

    const handleClear = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (strokes.current) strokes.current = [];
    };

    const handleCanvasSync = (history) => {
      if (isDrawer) return; // Only sync for guessers
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      history.forEach((stroke) => {
        handleDrawData(stroke);
      });
    };

    socket.on("draw_data", handleDrawData);
    socket.on("canvas_clear", handleClear);
    socket.on("canvas_sync", handleCanvasSync);

    return () => {
      socket.off("draw_data");
      socket.off("canvas_clear");
      socket.off("canvas_sync");
    };
  }, [isDrawer]); // Added isDrawer as dependency

  /* ---------- GET COORDINATES ---------- */

  const getCoords = (e) => {

    const rect = canvasRef.current.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

  };

  /* ---------- START DRAW ---------- */

/* ---------- START DRAW ---------- */
const startDrawing = (e) => {

  if (!isDrawer) return;

  drawing.current = true;

  const { x, y } = getCoords(e);

  const ctx = canvasRef.current.getContext("2d");

  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x, y);

  socket.emit("draw_data", {
    roomId,
    type: "start",
    data: { x, y, color, size }
  });

};

  /* ---------- DRAW (MOVE) ---------- */
  const draw = (e) => {
    if (!drawing.current || !isDrawer) return;
    const { x, y } = getCoords(e);

    const ctx = canvasRef.current.getContext("2d");
   ctx.strokeStyle = color;
ctx.lineWidth = size;
ctx.lineCap = "round";
ctx.lineJoin = "round";

ctx.lineTo(x, y);
ctx.stroke();

    // Send: roomId, type, and coordinate data
  socket.emit("draw_data", {
  roomId,
  type: "move",
  data: { x, y, color, size }
});
  };

  /* ---------- STOP DRAW ---------- */
 const stopDrawing = () => {

  if (!drawing.current || !isDrawer) return;

  drawing.current = false;

  socket.emit("draw_data", {
    roomId,
    type: "end"
  });

};

  /* ---------- CANVAS ACTIONS ---------- */

  const clearCanvas = () => {
    if (!isDrawer) return;
    socket.emit("canvas_clear", { roomId });
  };

  const undo = () => {
    if (!isDrawer) return;
    socket.emit("draw_undo", { roomId });
  };

  /* ---------- COLORS ---------- */

  const colors = [
    "#000000",
    "#ef4444",
    "#22c55e",
    "#3b82f6",
    "#facc15",
    "#ec4899",
    "#06b6d4",
    "#ffffff"
  ];

  return (

    <div className="canvas-wrapper">

      {isDrawer && (

        <div className="drawing-tools">

          <div className="color-palette">
            {colors.map((c,i)=>(
              <div
                key={i}
                className={`color-swatch ${color === c ? "active" : ""}`}
                style={{ background:c }}
                onClick={()=>setColor(c)}
              />
            ))}
          </div>

          <div className="brush-control">
            <span>Brush Size</span>
            <input
              type="range"
              min="1"
              max="20"
              value={size}
              onChange={(e)=>setSize(Number(e.target.value))}
            />
          </div>

          <div className="action-btns">
            <button onClick={undo}>Undo</button>
            <button className="clear-btn" onClick={clearCanvas}>
              Clear
            </button>
          </div>

        </div>

      )}

      {/* NEW CANVAS HOLDER */}

      <div className="canvas-container">

        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className={`drawing-canvas ${!isDrawer ? "guesser-mode" : ""}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />

      </div>

    </div>

  );

}

export default CanvasBoard;