
let historicalSeasons = [];
let historicalCompetition = null;
let selectedHistoricalSeason = null;

// ==========================================
// STARTUP
// ==========================================

async function startupHistory() {

    console.log("history.js: startupHistory Called");

    try {
        await loadHistoricalSeasons();

        document
            .getElementById("historySeasonSelector")
            .addEventListener("change", event => {const seasonId = Number(event.target.value);

                if (!seasonId) {
                    hideHistoricalData();
                    return;
                }

                loadHistoricalSeason(seasonId);
            }
        );

        document
            .getElementById("historicalPeriodSelector")
            .addEventListener("change", event => {const periodNumber = Number(event.target.value);
                renderHistoricalPeriod(periodNumber);
            }
        );

        console.log("Historical page started successfully.");
    }

    catch(error) {

        console.error("Historical startup failed:", error);

        showHistoricalMessage("Unable to load historical seasons.");
    }

}

// ==========================================
// LOAD SEASONS
// ==========================================

async function loadHistoricalSeasons() {

    console.log(
        "history.js: loadHistoricalSeasons Called"
    );


    historicalSeasons =
        await getSeasons();


    renderHistoricalSeasonSelector();

}

// ==========================================
// SEASON SELECTOR
// ==========================================

function renderHistoricalSeasonSelector() {

    console.log("history.js: renderHistoricalSeasonSelector Called");

    const selector = document.getElementById("historySeasonSelector");

    selector.innerHTML = `
        <option value="">
            Select season
        </option>
    `;

    let numberOfSeasons = historicalSeasons.length;

    historicalSeasons.forEach(season => {

            const option = document.createElement("option");
            
            if (season.id < numberOfSeasons) {     
                option.value = season.id;

                option.textContent =
                    season.active
                        ? `${season.name} (Current)`
                        : season.name;

                selector.appendChild(option);
            }
        }
    );
}

// ==========================================
// LOAD SELECTED SEASON
// ==========================================

async function loadHistoricalSeason(seasonId) {

    console.log("history.js: loadHistoricalSeason Called");
    console.log("Loading historical season:", seasonId);

    showHistoricalMessage("Loading historical scores...");

    selectedHistoricalSeason =
        historicalSeasons.find(
            season =>
                season.id ===
                seasonId
        );

    if (!selectedHistoricalSeason) {
        showHistoricalMessage(
            "Season not found."
        );
        return;
    }

    try {

        // ======================================
        // PERIOD SCORES
        // ======================================

        const scoreData =
            await getHistoricalPeriodScores(
                seasonId
            );

        if (!scoreData || scoreData.length === 0) {
            hideHistoricalData();

            showHistoricalMessage(`No historical period scores are available for ${selectedHistoricalSeason.name}.`);

            return;
        }

        historicalCompetition = calculateHistoricalCompetition(scoreData);

        renderHistoricalOverallLeague();
        renderHistoricalCompetition();
        renderHistoricalPeriodSelector();
        renderHistoricalPeriod(historicalCompetition.periods[0].period);
        renderHistoricalRunningStandings();
        showHistoricalSections();
        hideHistoricalMessage();
    }
    
    catch(error) {

        console.error("Unable to load historical season:", error);

        hideHistoricalData();
        showHistoricalMessage("Unable to load historical period scores.");
    }

}

// ==========================================
// CALCULATE HISTORICAL COMPETITION
// ==========================================

function calculateHistoricalCompetition(scoreData) {

    console.log("history.js: calculateHistoricalCompetition Called");

    const periodNumbers = [...new Set(scoreData.map(score => score.period))]
            .sort((a,b) =>
                    a - b
            );

    const periods = [];
    const runningTotals = {};
    const seasonTotals = {};

    // ======================================
    // INITIALISE PLAYERS
    // ======================================

    scoreData.forEach(score => {

            // ======================================
            // COMPETITION RUNNING TOTAL
            // ======================================

            if (!runningTotals[score.playerId]) {

                runningTotals[score.playerId] = {
                    playerId:
                        score.playerId,
                    playerName:
                        score.playerName ??
                        "Unknown",
                    points:
                        0
                };
            }

            // ======================================
            // OVERALL SEASON TOTAL
            // ======================================

            if (!seasonTotals[score.playerId]) {
                
                seasonTotals[score.playerId] = {
                    playerId:
                        score.playerId,
                    playerName:
                        score.playerName ??
                        "Unknown",
                    total:
                        0
                };
            }

            seasonTotals[score.playerId].total += Number(score.periodTotal) || 0;
        }
    );

    // ======================================
    // CALCULATE PERIODS
    // ======================================

    periodNumbers.forEach(
        periodNumber => {

            const periodScores = scoreData.filter(score => score.period === periodNumber)
                    .map(score => ({
                            playerId:
                                score.playerId,
                            playerName:
                                score.playerName ??
                                "Unknown",
                            periodTotal:
                                Number(score.periodTotal),
                            won:
                                false,
                            competitionPoints:
                                0
                        })
                    );

            const highestTotal = Math.max(...periodScores.map(player => player.periodTotal));

            const winners = periodScores.filter(player => player.periodTotal === highestTotal);

            const pointsPerWinner =
                winners.length > 0
                    ? 1 /
                        winners.length
                    : 0;

            periodScores.forEach(player => {

                    if (player.periodTotal === highestTotal) {                        
                        player.won = true;
                        player.competitionPoints = pointsPerWinner;
                        runningTotals[player.playerId].points += pointsPerWinner;
                    }
                }
            );

            periodScores.sort((a, b) =>
                    b.periodTotal -
                    a.periodTotal
            );

            periods.push({
                period:
                    periodNumber,
                players:
                    periodScores
            });
        }
    );

    const standings = Object.values(runningTotals)
            .sort((a, b) =>
                    b.points -
                    a.points
            );

    const overallStandings = Object.values(seasonTotals)
            .sort((a, b) =>
                    b.total -
                    a.total
            );

    return {
        periods,
        runningTotals:
            standings,
        overallStandings:
            overallStandings
    };
}

function renderHistoricalOverallLeague() {

    console.log("history.js: renderHistoricalOverallLeague Called");

    const tbody = document.querySelector("#historicalOverallTable tbody");

    tbody.innerHTML = "";

    const standings = historicalCompetition.overallStandings;
    let previousTotal = null;
    let previousPosition = 0;

    standings.forEach((player, index) => {

            // ======================================
            // CALCULATE POSITION
            // ======================================

            /*let position;

            if (previousTotal !== null && player.total === previousTotal) {
                position = previousPosition;
            }
            else {
                position = index + 1;
            }*/

            const position = getRankedPosition(player.total, index, previousTotal, previousPosition);

            previousTotal = player.total;
            previousPosition = position;

            // ======================================
            // WINNER
            // ======================================

            const isWinner = position === 1;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${isWinner
                        ? `${position}`
                        : position
                    }
                </td>

                <td>
                    ${player.playerName}
                </td>

                <td>
                    <strong>
                        ${player.total}
                    </strong>
                </td>
            `;

            if (isWinner) {
                row.classList.add("overall-season-winner");
            }

            tbody.appendChild(row);
        }
    );
}

// ==========================================
// RENDER MAIN COMPETITION TABLE
// ==========================================

function renderHistoricalCompetition() {

    console.log("history.js: renderHistoricalCompetition Called");

    const header = document.getElementById("historicalCompetitionHeader");
    const tbody = document.querySelector("#historicalCompetitionTable tbody");

    header.innerHTML = "";
    tbody.innerHTML = "";

    // ======================================
    // HEADER
    // ======================================

    const positionHeader = document.createElement("th");
    positionHeader.textContent = "Pos";

    header.appendChild(positionHeader);
    const playerHeader = document.createElement("th");

    playerHeader.textContent = "Player";
    header.appendChild(playerHeader);

    historicalCompetition.periods.forEach(period => {
                const th = document.createElement("th");

                th.textContent = `P${period.period}`;

                header.appendChild(th);
            }
        );

    const totalHeader = document.createElement("th");
    totalHeader.textContent = "Wins";
    header.appendChild(totalHeader);

    // ======================================
    // PLAYER LOOKUP
    // ======================================

    const standings = historicalCompetition.runningTotals;

    standings.forEach((standing, index) => {
            const row = document.createElement("tr");

            const positionCell = document.createElement("td");
            positionCell.textContent = index + 1;
            row.appendChild(positionCell);

            const playerCell = document.createElement("td");
            playerCell.textContent = standing.playerName;
            row.appendChild(playerCell);

            // Periods

            historicalCompetition.periods.forEach(period => {
                const result = period.players.find(player => player.playerId === standing.playerId);

                const cell = document.createElement("td");

                if (!result) {
                    cell.textContent = "—";
                }
                else if (result.won) {
                    cell.innerHTML = `
                            <strong>
                                ${result.periodTotal} pts
                            </strong>
                        `;

                    cell.classList.add("competition-winner");
                }
                else {
                    cell.innerHTML = `
                            <small>
                                ${result.periodTotal} pts
                            </small>
                        `;
                }

                row.appendChild(cell);
            }
        );

            const totalCell = document.createElement("td");

            totalCell.innerHTML = `
                <strong>
                    ${standing.points}
                 </strong>`;

            row.appendChild(totalCell);
            tbody.appendChild(row);
        }
    );
}

// ==========================================
// PERIOD SELECTOR
// ==========================================

function renderHistoricalPeriodSelector() {

    console.log("history.js: renderHistoricalPeriodSelector Called");

    const selector = document.getElementById("historicalPeriodSelector");

    selector.innerHTML = "";

    historicalCompetition.periods.forEach(period => {
                const option = document.createElement("option");
                option.value = period.period;
                option.textContent = `Period ${period.period}`;
                selector.appendChild(option);
            }
        );
}

// ==========================================
// PERIOD DETAILS
// ==========================================

function renderHistoricalPeriod(periodNumber) {

    console.log("history.js: renderHistoricalPeriod Called");

    const period = historicalCompetition.periods
            .find(
                period => period.period === periodNumber
            );

    if (!period)
        return;

    document.getElementById("historicalPeriodSelector").value = periodNumber;

    const tbody = document.querySelector("#historicalPeriodTable tbody");

    tbody.innerHTML = "";

    let previousTotal = null;
    let previousPosition = 0;

    period.players.forEach((player, index) => {

            // ======================================
            // CALCULATE POSITION
            // ======================================

            const position = getRankedPosition(player.total, index, previousTotal, previousPosition);

            previousTotal = player.periodTotal;
            previousPosition = position;

            // ======================================
            // BUILD ROW
            // ======================================

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${player.won
                            ? `${position}`
                            : position
                    }
                </td>

                <td>
                    ${player.playerName}
                </td>

                <td>
                    ${player.periodTotal}
                </td>

                <td>
                    <strong>
                        ${player.competitionPoints}
                    </strong>
                </td>
            `;

            if (player.won) {
                row.classList.add("competition-winner");
            }

            tbody.appendChild(row);
        }
    );
}

// ==========================================
// RUNNING STANDINGS
// ==========================================

function renderHistoricalRunningStandings() {

    console.log("history.js: renderHistoricalRunningStandings Called");

    const tbody = document.querySelector("#historicalRunningTable tbody");

    tbody.innerHTML = "";

    const standings = historicalCompetition.runningTotals;
    let previousTotal = null;
    let previousPosition = 0;

    standings.forEach((player, index) => {

            // ======================================
            // CALCULATE POSITION
            // ======================================

            const position = getRankedPosition(player.total, index, previousTotal, previousPosition);

            previousTotal = player.points;
            previousPosition = position;

            // ======================================
            // LEADER
            // ======================================

            const isLeader = position === 1 && player.points > 0;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${isLeader
                        ? `${position}`
                        : position
                    }
                </td>

                <td>
                    ${player.playerName}
                </td>

                <td>
                    <strong>
                        ${player.points}
                    </strong>
                </td>
            `;

            if (isLeader) {
                row.classList.add("competition-overall-leader");
            }

            tbody.appendChild(row);
        }
    );
}

// ==========================================
// PAGE DISPLAY
// ==========================================

function showHistoricalSections() {

    console.log("history.js: showHistoricalSections Called");

    document.getElementById("historicalOverallSection").style.display = "block";    
    document.getElementById("historicalCompetitionSection").style.display = "block";
    document.getElementById("historicalPeriodDetailsSection").style.display = "block";
    document.getElementById("historicalRunningSection").style.display ="block";
}

function hideHistoricalData() {

    console.log("history.js: hideHistoricalData Called");

    document.getElementById("historicalOverallSection").style.display = "none";    
    document.getElementById("historicalCompetitionSection").style.display = "none";
    document.getElementById("historicalPeriodDetailsSection").style.display = "none";
    document.getElementById("historicalRunningSection").style.display = "none";
}

// ==========================================
// MESSAGES
// ==========================================

function showHistoricalMessage(text) {

    console.log("history.js: showHistoricalMessage Called");

    const section = document.getElementById("historicalMessageSection");

    const message = document.getElementById("historicalMessage");

    message.textContent = text;

    section.style.display = "block";
}


function hideHistoricalMessage() {

    console.log("history.js: hideHistoricalMessage Called");

    document.getElementById("historicalMessageSection").style.display = "none";
}

// ==========================================
// START
// ==========================================

startupHistory();