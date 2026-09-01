// ==========================================
// STARTUP
// ==========================================

async function startup() {

    console.clear();
    console.log("Starting application...");

    try {
        await loadSeasonData();

        document.getElementById("seasonTitle").textContent = `${appData.season.name} — Gameweek ${appData.season.currentGameweek}`;
        document.getElementById("overallLeagueGameweek").textContent = `Gameweek ${appData.season.currentGameweek}`;

        console.log("Gameweek = ", appData.season.currentGameweek);

        const competitionData = loadPeriodCompetition();

        renderSeasonPrizeLeaders(competitionData.competition);
        renderOverallLeague();
        renderCompetition(competitionData.competition);

        console.log("Application started successfully.");

    }
    catch(error) {
        console.error("Application startup failed:", error);

    }

}

// ==========================================
// PRIZE LEADERS
// ==========================================

function renderSeasonPrizeLeaders(competition) {

    console.log("app.js: renderSeasonPrizeLeaders Called");

    // ==========================================
    // OVERALL LEADER
    // ==========================================

    const overallLeaderElement = document.getElementById("overallPrizeLeader");
    const overallDetailsElement = document.getElementById("overallPrizeDetails");

    if (overallLeaderElement && overallDetailsElement) {

        const playerTotals = appData.players.map(player => {const total = appData.scores
                                .filter(score => score.playerId === player.id)
                                .reduce((sum, score) => sum + score.points, 0);
                            return {
                                playerId:
                                    player.id,
                                playerName:
                                    player.name,
                                points:
                                    total
                            };

                        }
                    );

        const highestOverallPoints = Math.max(...playerTotals.map(player => player.points));

        if (highestOverallPoints <= 0) {
            overallLeaderElement.textContent = "—";
            overallDetailsElement.textContent = "No scores yet";
        }
        else {
            const overallLeaders = playerTotals.filter(player => player.points === highestOverallPoints);
            const names = overallLeaders.map(player => player.playerName);

            overallLeaderElement.textContent = names.length > 1
                    ? `Tied: ${names.join(" / ")}`
                    : names[0] ?? "—";

            overallDetailsElement.textContent = `${highestOverallPoints} points`;
        }
    }

    // ==========================================
    // CURRENT PERIOD LEADER
    // ==========================================

    const periodLeaderElement = document.getElementById("periodPrizeLeader");
    const periodDetailsElement = document.getElementById("periodPrizeDetails");

    if (periodLeaderElement && periodDetailsElement) {
        const currentPeriod = competition.periods.find(period =>
                    appData.season.currentGameweek >= period.startGameweek &&
                    appData.season.currentGameweek <= period.endGameweek);

        if (!currentPeriod) {
            periodLeaderElement.textContent = "—";
            periodDetailsElement.textContent = "No active period";
        }
        else {
            const periodPlayers = currentPeriod.players ??[];

            if (periodPlayers.length === 0) {
                periodLeaderElement.textContent = "—";
                periodDetailsElement.textContent = `P${currentPeriod.period} — No scores yet`;
            }
            else {
                const highestPeriodPoints = Math.max(...periodPlayers.map(player => Number(player.points) || 0));

                if (highestPeriodPoints <= 0) {
                    periodLeaderElement.textContent = "—";
                    periodDetailsElement.textContent = `P${currentPeriod.period} — No scores yet`;
                }
                else {
                    const periodLeaders = periodPlayers.filter(player => (Number(player.points) || 0) === highestPeriodPoints);
                    const names = periodLeaders.map(player => player.playerName);

                    periodLeaderElement.textContent =
                        names.length > 1
                            ? `Tied: ${names.join(" / ")}`
                            : names[0] ?? "—";

                    periodDetailsElement.textContent =
                        `P${currentPeriod.period}: ` +
                        `GW${currentPeriod.startGameweek} to ${currentPeriod.endGameweek} · ` +
                        `${highestPeriodPoints} points`;
                }
            }
        }
    }

    // ==========================================
    // HIGHEST SCORING GAMEWEEK
    // ==========================================

    const highestGameweekLeaderElement = document.getElementById("highestGameweekLeader");
    const highestGameweekDetailsElement = document.getElementById("highestGameweekDetails");

    if (highestGameweekLeaderElement && highestGameweekDetailsElement) {

        let highestPoints = null;
        let leaders = [];

        appData.scores.forEach(score => {const points = Number(score.points) || 0;

                if (points <= 0) {
                    return;
                }

                if (highestPoints === null || points > highestPoints) {
                    highestPoints = points;
                    leaders = [score];
                }
                else if (points === highestPoints) {
                    leaders.push(score);
                }
            }
        );


        if (highestPoints === null || leaders.length === 0) {

            highestGameweekLeaderElement.textContent = "—";
            highestGameweekDetailsElement.textContent = "No gameweek scores yet";
        }
        else {
            const names = leaders.map(score => {const player = appData.players.find(player => player.id === score.playerId);
                        return (player?.name ?? "Unknown"
                        );
                    }
                );

            const gameweeks = [...new Set(leaders.map(score => score.gameweek))];

            highestGameweekLeaderElement.textContent = names.length > 1 ? `Tied: ${names.join(" / ")}`: names[0];
            highestGameweekDetailsElement.textContent = `${highestPoints} points — ` + gameweeks .map(gameweek => `GW${gameweek}`)
                                                        .join(" / ");
        }
    }

    // ==========================================
    // BEST CAPTAIN PICK
    // ==========================================

    const captainLeaderElement = document.getElementById("captainPrizeLeader");
    const captainDetailsElement = document.getElementById("captainPrizeDetails");

    if (captainLeaderElement && captainDetailsElement) {

        let highestCaptainPoints = null;        
        let captainLeaders = [];

        appData.scores.forEach(score => {

                // --------------------------------------
                // NO CAPTAIN DATA
                // --------------------------------------

                if (score.captainPoints === null || score.captainMultiplier === null) {
                    return;
                }

                // --------------------------------------
                // EXCLUDE TRIPLE CAPTAIN
                // --------------------------------------

                if (score.captainMultiplier === 3) {
                    return;
                }

                const captainPoints = Number(score.captainPoints) || 0;

                if (captainPoints <= 0) {
                    return;
                }

                if (highestCaptainPoints === null || captainPoints > highestCaptainPoints) {
                    highestCaptainPoints = captainPoints;
                    captainLeaders = [score];
                }
                else if (captainPoints === highestCaptainPoints) {
                    captainLeaders.push(score);
                }
            }
        );

        if (highestCaptainPoints === null || captainLeaders.length === 0) {
            captainLeaderElement.textContent = "—";
            captainDetailsElement.textContent = "No captain data yet";
        }
        else {
            captainLeaderElement.innerHTML = "";

            captainLeaders.forEach(score => {
                const player = appData.players.find(player => player.id === score.playerId);
                const playerName = player?.name ?? "Unknown";

                const playerBlock = document.createElement("div");
                playerBlock.className = "season-captain-leader";

                const nameElement = document.createElement("div");
                nameElement.className = "season-captain-leader-name";
                nameElement.textContent = playerName;

                const detailsElement = document.createElement("div");
                detailsElement.className = "season-captain-leader-details";
                detailsElement.textContent =
                    `${score.captainName ?? "Captain"} · ` +
                    `GW${score.gameweek} · ` +
                    `${score.captainPoints} points`;

                playerBlock.appendChild(nameElement);
                playerBlock.appendChild(detailsElement);

                captainLeaderElement.appendChild(playerBlock);
            });

            captainDetailsElement.textContent = "";
        }
    }
}

// ==========================================
// OVERALL LEAGUE
// ==========================================

function renderOverallLeague() {

    console.log("app.js: renderOverallLeague Called");

    const tableBody = document.querySelector("#overallTable tbody");

    tableBody.innerHTML = "";

    const league = getOverallLeague(appData.players, appData.scores);

    let previousTotal = null;
    let previousPosition = 0;

    league.forEach((player, index) => {
            const position = getRankedPosition(player.total, index, previousTotal, previousPosition);
            previousTotal = player.total;
            previousPosition =  position;
            const isLeader = position === 1 && player.total > 0;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${isLeader ? `${position}` : position}
                </td>

                <td>
                    ${player.name}
                </td>

                <td>
                    <strong>
                        ${player.total}
                    </strong>
                </td>
            `;

            if (isLeader) {
                row.classList.add("overall-season-winner");
            }

            tableBody.appendChild(row);
        }
    );
}

function getOverallLeague(players, scores) {

    console.log("app.js: getOverallLeague Called");

    const league = players.map(player => {
                const total = scores.filter(score => score.playerId === player.id)
                        .reduce((sum, score) => sum + score.points, 0);
                    return {
                        id:
                            player.id,
                        name:
                            player.name,
                        total:
                            total
                    };
                }
            );

    league.sort((a, b) => b.total - a.total);

    return league;
}

// ==========================================
// PERIOD COMPETITION
// ==========================================

function renderCompetition(competition) {

    console.log("app.js: renderCompetition Called");

    const table = document.querySelector("#competitionTable");

    if (!table) {
        console.error("competitionTable not found");
        return;
    }

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    if (!thead || !tbody) {
        console.error("Competition table head/body not found");
        return;
    }

    tbody.innerHTML = "";

    // ==========================================
    // TABLE HEADINGS
    // ==========================================

    let headingHTML = `
        <tr>
            <th>
                Pos
            </th>

            <th>
                Player
            </th>
    `;

    competition.periods.forEach(period => {
            let status = "future";

            if (appData.season.currentGameweek > period.endGameweek) {
                status = "completed";
            }
            else if (
                appData.season.currentGameweek >= period.startGameweek) {
                status = "current";
            }

            let statusText = "Future";

            if (status === "completed") {
                statusText = "Completed";
            }
            else if (
                status === "current"
            ) {
                statusText = "In Progress";
            }

            headingHTML += `
                <th class="competition-period-${status}">
                    P${period.period}
                    <br>
                        <small>
                            GW${period.startGameweek} – ${period.endGameweek}
                        </small>
                    <br>

                    <span class="competition-period-status">
                        ${statusText}
                    </span>
                </th>
            `;
        }
    );


    headingHTML += `
            <th>
                Period Wins
            </th>
        </tr>
    `;

    thead.innerHTML = headingHTML;

    // ==========================================
    // FIND CURRENT PERIOD
    // ==========================================

    const currentPeriodIndex = competition.periods.findIndex(period =>
                appData.season.currentGameweek >= period.startGameweek &&
                appData.season.currentGameweek <= period.endGameweek
            );

    // ==========================================
    // BUILD PLAYER DATA
    // ==========================================

    const players = [];

    competition.runningTotals.forEach(running => {const playerPeriods = competition.periods.map(period => {return (period.players.find(player => player.playerId === running.playerId));});

            let currentPeriodPoints = 0;

            if (currentPeriodIndex >= 0) {
                currentPeriodPoints = Number(playerPeriods[currentPeriodIndex]?.points) || 0;
            }

            players.push({
                playerId:
                    running.playerId,
                playerName:
                    running.playerName,
                total:
                    Number(running.wins) || 0,
                currentPeriodPoints:
                    currentPeriodPoints,
                periods:
                    playerPeriods
            });
        }
    );

    // ==========================================
    // SORT PLAYERS
    // ==========================================
    //
    // 1. Period wins
    // 2. Current period score
    // 3. Player name
    // ==========================================

    players.sort((a, b) => {

            if (b.total !== a.total) {
                return (b.total - a.total);
            }

            if (b.currentPeriodPoints !== a.currentPeriodPoints) {
                return (b.currentPeriodPoints - a.currentPeriodPoints
                );
            }

            return (a.playerName.localeCompare( b.playerName));
        }
    );

    // ==========================================
    // RENDER PLAYERS
    // ==========================================

    let previousPlayer = null;
    let previousPosition = 0;

    players.forEach((player, index) => {
            const row = document.createElement("tr");

            // ======================================
            // POSITION
            // ======================================

            let position = index + 1;

            if (previousPlayer && player.total === previousPlayer.total && player.currentPeriodPoints === previousPlayer.currentPeriodPoints) {
                position = previousPosition;
            }

            previousPlayer = player;
            previousPosition = position;

            const isLeader = position === 1 && (player.total > 0 || player.currentPeriodPoints > 0);

            // ======================================
            // BASIC COLUMNS
            // ======================================

            let html = `
                <td class="competition-position">
                    ${isLeader ? `${position}` : position
                    }
                </td>

                <td class="competition-player">
                    ${player.playerName}
                </td>
            `;

            // ======================================
            // PERIOD COLUMNS
            // ======================================

            player.periods.forEach((periodPlayer, periodIndex) => {
                    const period = competition.periods[periodIndex];

                    let periodStatus = "future";

                    if (appData.season.currentGameweek > period.endGameweek) {
                        periodStatus = "completed";
                    }
                    else if (appData.season.currentGameweek >= period.startGameweek) {
                        periodStatus = "current";
                    }

                    // ==================================
                    // NO DATA
                    // ==================================

                    if (!periodPlayer || periodPlayer.points === 0) {

                        html += `
                            <td class="competition-empty competition-cell-${periodStatus}">
                                —
                            </td>
                        `;
                        return;
                    }

                    // ==================================
                    // PERIOD WINNER
                    // ==================================

                    if (periodPlayer.won) {

                        html += `
                            <td class="competition-winner competition-cell-${periodStatus}">
                                <strong>
                                    ${periodPlayer.points} pts
                                </strong>
                            </td>
                        `;
                        return;
                    }

                    // ==================================
                    // NORMAL / IN-PROGRESS SCORE
                    // ==================================

                    html += `
                        <td class="competition-score competition-cell-${periodStatus}">
                            <small>
                                ${periodPlayer.points}
                            </small>
                        </td>
                    `;
                }
            );

            // ======================================
            // PERIOD WINS
            // ======================================

        html += `
            <td class="competition-total">
                <strong>
                    ${player.total}
                </strong>
            </td>
        `;

        row.innerHTML = html;

        tbody.appendChild(row);}
    );
}

startup();