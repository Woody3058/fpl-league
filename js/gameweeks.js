
const gameweekPageData = {season: null, players: [], scores: []};

// ==========================================
// STARTUP
// ==========================================

async function startupGameweeks() {

    console.clear();
    console.log("gameweeks.js: startupGameweeks Called");

    try {
        gameweekPageData.season = await getActiveSeason();
        gameweekPageData.players = await getSeasonPlayers(gameweekPageData.season.id);
        gameweekPageData.scores = await getSeasonScores(gameweekPageData.season.id);

        document.getElementById("gameweekSeasonTitle").textContent = gameweekPageData.season.name;

        populateGameweekSummarySelector();

        const selector = document.getElementById("gameweekSummarySelector");

        selector.addEventListener(
            "change", () => {renderGameweekSummary(Number(selector.value));}
        );

        renderGameweekSummary(gameweekPageData.season.currentGameweek);

        console.log("Gameweeks page started successfully.");
    }
    catch(error) {
        console.error("Gameweeks page startup failed:", error);
    }

}

// ==========================================
// GAMEWEEK SELECTOR
// ==========================================

function populateGameweekSummarySelector() {

    console.log("gameweeks.js: populateGameweekSummarySelector Called");

    const selector = document.getElementById("gameweekSummarySelector");

    selector.innerHTML = "";

    for (let gameweek = 1; gameweek <= gameweekPageData.season.currentGameweek; gameweek++) {

        const option = document.createElement("option");

        option.value = gameweek;
        option.textContent = `GW${gameweek}`;

        if (gameweek === gameweekPageData.season.currentGameweek) {
            option.selected = true;
        }

        selector.appendChild(option);
    }
}

// ==========================================
// RENDER GAMEWEEK
// ==========================================

function renderGameweekSummary(gameweek) {

    console.log("gameweeks.js: renderGameweekSummary Called");

    document.getElementById("gameweekSelectedNumber").textContent = `GW${gameweek}`;

    const currentScores = gameweekPageData.scores.filter(score => score.gameweek === gameweek);

    renderGameweekTopScorer(currentScores);
    renderGameweekBestCaptain(currentScores);
    renderGameweekResults(gameweek, currentScores);
}

// ==========================================
// TOP SCORER
// ==========================================

function renderGameweekTopScorer(scores) {

    console.log("gameweeks.js: renderGameweekTopScorer Called");

    const nameElement = document.getElementById("gameweekTopScorer");
    const detailsElement = document.getElementById("gameweekTopScorerDetails");

    if (scores.length === 0) {
        nameElement.textContent = "—";
        detailsElement.textContent = "No scores";
        return;
    }

    const highestPoints = Math.max(...scores.map(score => score.points));
    const leaders = scores.filter(score => score.points === highestPoints);

    const names = leaders.map(score => {
                const player = gameweekPageData.players.find(
                        player => player.id === score.playerId);
                return (
                    player?.name ??
                    "Unknown"
                );
            }
        );

    nameElement.textContent = names.length > 1 ? `Tied: ${names.join(" / ")}` : names[0];
    detailsElement.textContent = `${highestPoints} points`;
}

// ==========================================
// BEST CAPTAIN
// ==========================================

function renderGameweekBestCaptain(scores) {

    console.log("gameweeks.js: renderGameweekBestCaptain Called");

    const nameElement = document.getElementById("gameweekBestCaptain");
    const detailsElement = document.getElementById("gameweekBestCaptainDetails");

    const validScores = scores.filter(score =>
                score.captainPoints !== null &&
                score.captainMultiplier !== null &&
                score.captainMultiplier !== 3
        );

    if (validScores.length === 0) {
        nameElement.textContent = "—";
        detailsElement.textContent = "No captain data";
        return;
    }

    const highestCaptainPoints = Math.max(...validScores.map(score => score.captainPoints));
    const leaders = validScores.filter(score => score.captainPoints === highestCaptainPoints);

    nameElement.innerHTML = "";

    leaders.forEach(score => {
        const player = gameweekPageData.players.find(player => player.id === score.playerId);
        const playerName = player?.name ?? "Unknown";

        const playerBlock = document.createElement("div");
        playerBlock.className = "gameweeks-captain-leader";

        const playerNameElement = document.createElement("div");
        playerNameElement.className = "gameweeks-captain-leader-name";
        playerNameElement.textContent = playerName;

        const playerDetailsElement = document.createElement("div");
        playerDetailsElement.className = "gameweeks-captain-leader-details";
        playerDetailsElement.textContent =
            `${score.captainName ?? "Captain"} · ` +
            `${score.captainPoints} pts`;

        playerBlock.appendChild(playerNameElement);
        playerBlock.appendChild(playerDetailsElement);

        nameElement.appendChild(playerBlock);
    });

    detailsElement.textContent = "";
}

// ==========================================
// RESULTS TABLE
// ==========================================

function renderGameweekResults(gameweek, scores) {

    console.log("gameweeks.js: renderGameweekResults Called");

    const tbody = document.querySelector("#gameweekResultsTable tbody");

    if (!tbody)
        return;

    tbody.innerHTML = "";

    // ==========================================
    // OVERALL STANDINGS
    // ==========================================

    const overallStandings = getOverallStandingsAtGameweek(gameweek);
    const previousStandings = gameweek > 1 ? getOverallStandingsAtGameweek(gameweek - 1) : null;

    // ==========================================
    // BUILD ROWS
    // ==========================================

    const rows = gameweekPageData.players.map(player => {
        const score = scores.find(item => item.playerId === player.id);
        const overall = overallStandings.find(item => item.playerId === player.id);
        const movementData = getPlayerMovement(player.id, overallStandings, previousStandings);

        return {
            playerId: player.id,
            playerName: player.name,
            gameweekPoints: Number(score?.points) || 0,
            overallPoints: Number(overall?.totalPoints) || 0,
            overallPosition: overall?.position ?? null,
            movement: movementData.movement,
            captainName: score?.captainName ?? null,
            captainPoints: score?.captainPoints ?? null,
            captainMultiplier: score?.captainMultiplier ?? null
        };
    });

    // ==========================================
    // SORT BY GAMEWEEK SCORE
    // ==========================================

    rows.sort((a, b) => {
            if (b.gameweekPoints !==  a.gameweekPoints) {
                return (
                    b.gameweekPoints -
                    a.gameweekPoints
                );
            }
            return (
                a.playerName.localeCompare(b.playerName)
            );
        }
    );

    // ==========================================
    // GAMEWEEK RESULT POSITIONS
    // ==========================================

    let previousPoints = null;
    let previousPosition = 0;

    rows.forEach((row, index) => {
            let position = index + 1;

            if (previousPoints !== null && row.gameweekPoints === previousPoints) {
                position = previousPosition;
            }

            previousPoints = row.gameweekPoints;
            previousPosition = position;

            // ==================================
            // CAPTAIN DISPLAY
            // ==================================

            let captainText = "—";

            if (row.captainName) {
                captainText = `${row.captainName} ` + `(${row.captainPoints ?? 0} pts)`;

                if (row.captainMultiplier === 3) {
                    captainText += " · TC";
                }
            }

            // ==================================
            // ROW
            // ==================================

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>
                    ${position}
                </td>

                <td>
                    ${row.playerName}
                </td>

                <td>
                    ${row.gameweekPoints}
                </td>

                <td>
                    ${row.overallPosition !== null ? `${row.overallPosition} · ${row.overallPoints} pts` : row.overallPoints
                    }
                </td>

                <td>
                    ${formatPlayerMovement(row.movement)}
                </td>

                <td>
                    ${captainText}
                </td>
            `;

            tbody.appendChild(tr);
        }
    );

    // ==========================================
    // BIGGEST MOVER
    // ==========================================

    renderGameweekBiggestMover(rows, gameweek);
}

// ==========================================
// GET OVERALL STANDINGS AT GAMEWEEK
// ==========================================

function getOverallStandingsAtGameweek(gameweek) {

    console.log("gameweeks.js: getOverallStandingsAtGameweek Called");

    const standings = gameweekPageData.players.map(player => {
                const totalPoints = gameweekPageData.scores
                        .filter(
                            score => score.playerId === player.id && score.gameweek <= gameweek
                        )
                        .reduce((total, score) => total + score.points, 0);
                    return {
                        playerId:
                            player.id,
                        playerName:
                            player.name,
                        totalPoints:
                            totalPoints,
                        position:
                            null
                };
            }
        );

    // ======================================
    // SORT BY OVERALL POINTS
    // ======================================

    standings.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return (b.totalPoints - a.totalPoints);
            }
            return (a.playerName.localeCompare(b.playerName));
        }
    );


    // ======================================
    // ASSIGN RANKS WITH TIES
    // ======================================
    //
    // Example:
    // 1, 2, 3, 3, 5
    // ======================================

    let previousPoints = null;
    let previousPosition = 0;

    standings.forEach((player, index) => {
            let position = index + 1;

            if (previousPoints !== null && player.totalPoints === previousPoints) {
                position = previousPosition;
            }

            player.position = position;
            previousPoints = player.totalPoints;
            previousPosition = position;
        }
    );
    return standings;
}

// ==========================================
// GET PLAYER MOVEMENT
// ==========================================

function getPlayerMovement(playerId, currentStandings, previousStandings) {

    console.log("gameweeks.js: getPlayerMovement Called");

    // GW1 has no previous position.

    if (!previousStandings) {
        return {
            movement: 0,
            previousPosition: null,
            currentPosition: null
        };
    }

    const currentPlayer = currentStandings.find(player => player.playerId === playerId);
    const previousPlayer = previousStandings.find(player => player.playerId === playerId);

    if (!currentPlayer || !previousPlayer) {
        return {
            movement: 0,
            previousPosition: null,
            currentPosition: null
        };
    }

    // Positive number = moved UP.
    //
    // Previous 7th → Current 4th
    // 7 - 4 = +3

    const movement = previousPlayer.position - currentPlayer.position;

    return {
        movement: movement,
        previousPosition: previousPlayer.position,
        currentPosition: currentPlayer.position
    };
}

// ==========================================
// FORMAT POSITION MOVEMENT
// ==========================================

function formatPlayerMovement(movement) {

    console.log("gameweeks.js: formatPlayerMovement Called");

    if (movement > 0) {
        return (`↑ ${movement}`);
    }

    if (movement < 0) {
        return (`↓ ${Math.abs(movement)}`);
    }

    return "—";
}

// ==========================================
// BIGGEST MOVER
// ==========================================

function renderGameweekBiggestMover(rows, gameweek) {

    console.log("gameweeks.js: renderGameweekBiggestMover Called");

    const nameElement = document.getElementById("gameweekBiggestMover");
    const detailsElement = document.getElementById("gameweekBiggestMoverDetails");

    if (!nameElement || !detailsElement) {
        return;
    }

    // ======================================
    // GW1 HAS NO PREVIOUS STANDINGS
    // ======================================

    if (gameweek <= 1) {
        nameElement.textContent = "—";
        detailsElement.textContent = "Available from GW2";
        return;
    }

    // ======================================
    // FIND BIGGEST POSITIVE MOVEMENT
    // ======================================

    const biggestMovement = Math.max(...rows.map(player => player.movement));

    if (biggestMovement <= 0) {
        nameElement.textContent = "—";
        detailsElement.textContent = "No upward movement";
        return;
    }

    const movers = rows.filter(player => player.movement === biggestMovement);
    const names = movers.map(player => player.playerName);

    nameElement.textContent = names.length > 1 ? `Tied: ${names.join(" / ")}` : names[0];
    detailsElement.textContent = `↑ ${biggestMovement} ` + `${biggestMovement === 1 ? "place" : "places"}`;
}

startupGameweeks();