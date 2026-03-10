import "./GameComponents.css";

function PlayerList({ players, playerId }) {

  const sorted = [...players].sort((a, b) => b.score - a.score);

  const getMedal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  return (

    <div className="leaderboard">

      <h3 className="leaderboard-title">🏆 Leaderboard</h3>

      {sorted.map((p, i) => (

        <div
          key={i}
          className={`player-row ${p.id === playerId ? "me" : ""}`}
        >

          <div className="player-info">

            <span className="medal">{getMedal(i)}</span>

            <div className="avatar">
              {p.name.charAt(0).toUpperCase()}
            </div>

            <span className="player-name">{p.name}</span>

          </div>

          <span className="score">{p.score}</span>

        </div>

      ))}

    </div>

  );

}

export default PlayerList;