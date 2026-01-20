const MVP_KEY = "ff_mvp_players";

/* ==========================
   FILE UPLOAD (FIXED)
========================== */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("logFile");
  const status = document.getElementById("statusText");

  if (!input) {
    console.error("❌ logFile input not found");
    return;
  }

  input.addEventListener("change", function () {
    if (!this.files || this.files.length === 0) return;

    const file = this.files[0];
    console.log("📂 Selected file:", file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;

      processMVP(text);

      if (status) {
        status.textContent = "File uploaded successfully ✓";
      }

      // ✅ allow re-upload of same file
      this.value = "";
    };

    reader.onerror = () => {
      console.error("❌ File read failed");
    };

    reader.readAsText(file);
  });
});


/* =====================================================
   PROCESS MVP DATA (FIXED – ACCUMULATES DATA)
===================================================== */
function processMVP(text) {
  const lines = text.split("\n");

  // ✅ LOAD existing MVP data (IMPORTANT FIX)
  let players = JSON.parse(localStorage.getItem(MVP_KEY)) || {};

  let currentTeamRank = 999;
  let currentTeamName = "UNKNOWN TEAM";

  lines.forEach(rawLine => {
    const line = rawLine.trim();

    /* ---------- TEAM LINE ---------- */
    if (line.startsWith("TeamName:")) {
      const teamMatch = line.match(/TeamName:\s(.+?)\s+Rank:/);
      const rankMatch = line.match(/Rank:\s+(\d+)/);

      if (teamMatch) currentTeamName = teamMatch[1].trim();
      if (rankMatch) currentTeamRank = parseInt(rankMatch[1]);

      return;
    }

    /* ---------- PLAYER LINE ---------- */
    if (line.startsWith("NAME:")) {
      const nameMatch = line.match(/NAME:\s(.+?)\s+ID:/);
      const killMatch = line.match(/KILL:\s+(\d+)/);

      if (!nameMatch || !killMatch) return;

      const playerName = nameMatch[1].trim();
      const kills = parseInt(killMatch[1]);

      if (!players[playerName]) {
        players[playerName] = {
          name: playerName,
          team: currentTeamName,
          kills: 0,
          bestTeamRank: currentTeamRank
        };
      }

      players[playerName].kills += kills;
      players[playerName].team = currentTeamName;

      // keep best (lowest) rank
      players[playerName].bestTeamRank = Math.min(
        players[playerName].bestTeamRank,
        currentTeamRank
      );
    }
  });

  localStorage.setItem(MVP_KEY, JSON.stringify(players));
  console.log("🏆 MVP data saved:", players);
}


/* =====================================================
   LOAD MVP PAGE
===================================================== */
function loadMVP() {
  const data = JSON.parse(localStorage.getItem(MVP_KEY));
  if (!data || Object.keys(data).length === 0) return;

  const players = Object.values(data);

  players.sort((a, b) => {
    if (b.kills !== a.kills) return b.kills - a.kills;
    return a.bestTeamRank - b.bestTeamRank;
  });

  const [first, second, third] = players;

  if (first) fillCard("mvp1", first);
  if (second) fillCard("mvp2", second);
  if (third) fillCard("mvp3", third);
}

/* Helper to fill card safely */
function fillCard(id, player) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = `
    <div class="player-name">${player.name}</div>
    <div class="team-name">${player.team}</div>
    <div class="kills">Kills: ${player.kills}</div>
  `;
}


/* =====================================================
   DOWNLOAD MVP IMAGE
===================================================== */
function downloadMVP() {
  const poster = document.querySelector(".poster");
  const hideElements = document.querySelectorAll(".no-export");

  if (!poster) return;

  hideElements.forEach(el => el.style.display = "none");

  html2canvas(poster, { scale: 2, useCORS: true })
    .then(canvas => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "match-mvp.png";
      link.click();
    })
    .finally(() => {
      hideElements.forEach(el => el.style.display = "flex");
    });
}


/* =====================================================
   NAVIGATION & RESET
===================================================== */
function goBack() {
  window.location.href = "index.html";
}

function resetMVP() {
  if (!confirm("Reset MVP data?")) return;
  localStorage.removeItem(MVP_KEY);
  location.reload();
}

function goToMVP() {
  const data = localStorage.getItem("ff_mvp_players");

  if (!data || data === "{}") {
    alert("Please upload a log file first");
    return;
  }

  window.location.href = "mvp.html";
}

function fillCard(id, player) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = `
    <div class="kills">Kills: ${player.kills}</div>
    <div class="player-name">${player.name}</div>
    <div class="team-name">${player.team}</div>
  `;
}
