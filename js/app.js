
async function startup() {

    console.log("Starting application...");

    try {

        await loadSeasonData();

        document.getElementById("seasonTitle").textContent = `${appData.season.name} — Gameweek ${appData.season.currentGameweek}`;

        console.log("Gameweek = ", appData.season.currentGameweek);

        const competitionData = loadPeriodCompetition();

        renderCurrentPeriod(competitionData.competition);

        renderOverallLeague();

        renderCompetition(competitionData.competition);


        console.log(
            "Application started successfully."
        );

    }
    catch(error) {

        console.error(
            "Application startup failed:",
            error
        );

    }

}

function renderOverallLeague() {

    console.log("app.js: renderOverallLeague Called");

    const tableBody = document.querySelector("#overallTable tbody");

    tableBody.innerHTML = "";

    const league = getOverallLeague(appData.players, appData.scores);

    let previousTotal = null;
    let previousPosition = 0;

    league.forEach(
        (player, index) => {

            const position = getRankedPosition(player.total, index, previousTotal, previousPosition);

            previousTotal = player.total;
            previousPosition =  position;

            const isLeader = position === 1 && player.total > 0;

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    ${isLeader
                        ? `🏆 ${position}`
                        : position
                    }
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
                row.classList.add(
                    "overall-season-winner"
                );
            }

            tableBody.appendChild(
                row
            );
        }
    );
}

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

        if (
            appData.season.currentGameweek > period.endGameweek
        ) {
            status = "completed";
        }

        else if (
            appData.season.currentGameweek >= period.startGameweek
        ) {
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
    });

    headingHTML += `
            <th>
                Period Wins
            </th>
        </tr>
    `;

    thead.innerHTML = headingHTML;

    // ==========================================
    // BUILD PLAYER DATA
    // ==========================================

    const players = [];

    competition.runningTotals.forEach(running => {const playerPeriods = competition.periods.map(period => {return (period.players.find(player => player.playerId === running.playerId));});

            players.push({playerId: running.playerId, playerName: running.playerName, total: running.wins, periods: playerPeriods});
        }
    );

    // ==========================================
    // SORT BY COMPETITION TOTAL
    // ==========================================

    players.sort(
        (a, b) => b.total - a.total
    );

    // ==========================================
    // RENDER PLAYERS
    // ==========================================

    let previousTotal = null;
    let previousPosition = 0;

    players.forEach((player, index) => {const row = document.createElement("tr");
        
        const position = getRankedPosition(player.total, index, previousTotal, previousPosition);

        previousTotal = player.total;
        previousPosition = position;

        const isLeader = position === 1 && player.total > 0;

        // ==================================
        // BASIC COLUMNS
        // ==================================

        let html = `
            <td class="competition-position">
                ${isLeader
                    ? `${position}`
                    : position
                }
            </td>

            <td class="competition-player">
                ${player.playerName}
            </td>
        `;

        // ==================================
        // PERIOD COLUMNS
        // ==================================

        player.periods.forEach((periodPlayer, periodIndex) => {const period = competition.periods[periodIndex];

            let periodStatus = "future";

            if (appData.season.currentGameweek > period.endGameweek) {
                periodStatus = "completed";
            }
            else if (appData.season.currentGameweek >= period.startGameweek) {
                periodStatus = "current";
            }

            // No data yet

            if (!periodPlayer || periodPlayer.points === 0) {
                html += `
                    <td class="competition-empty competition-cell-${periodStatus}">
                        —
                    </td>
                `;
                return;
            }

            // ==================================
            // WINNER
            // ==================================

            if (periodPlayer.won) {

                html += `
                    <td class="Competition-winner competition-cell-${periodStatus}">
                        <strong>
                            ${periodPlayer.points} pts
                        </strong>
                    </td>
                `;
                return;
            }

            // ==================================
            // NORMAL SCORE
            // ==================================

            html += `
                <td class="competition-score competition-cell-${periodStatus}">
                    <small>
                        ${periodPlayer.points}
                    </small>
                </td>
            `;
        });

            // ==================================
            // RUNNING TOTAL
            // ==================================

            html += `
                <td class="competition-total">
                    <strong>
                        ${player.total}
                    </strong>
                </td>
            `;

            row.innerHTML =
                html;

            tbody.appendChild(row);
    });
}

function renderCurrentPeriod(competition) {

    console.log("app.js: renderCurrentPeriod Called");

    const info = document.getElementById("currentPeriodInfo");

    if (!info) {
        console.warn("currentPeriodInfo not found");
        return;
    }

    // ==========================================
    // FIND CURRENT PERIOD
    // ==========================================

    const currentPeriod = competition.periods.find(period => appData.season.currentGameweek >= period.startGameweek && appData.season.currentGameweek <= period.endGameweek);

    // ==========================================
    // SEASON COMPLETE
    // ==========================================

    if (!currentPeriod) {
        info.innerHTML = "<p>Season complete</p>";
        return;
    }

    // ==========================================
    // SORT PLAYERS
    // ==========================================

    const leaderboard = [...currentPeriod.players].sort(
            (a,b) =>
                b.points -
                a.points
        );

    const leader = leaderboard[0];
    let leaderHeaderName = leader.playerName;
    let leaderHeaderPoints = leader.points;
    leaderHeaderPoints = "(" + leader.points + ") pts";

    if (leader.points === 0) {
        leaderHeaderName = "";
        leaderHeaderPoints = "n/a";
    }

    // ==========================================
    // DISPLAY
    // ==========================================

        /*<h3>
            Period ${currentPeriod.period}

            (GW${currentPeriod.startGameweek}
            –
            GW${currentPeriod.endGameweek})
        </h3>*/

    info.innerHTML = `
        <h3>
            Gameweek ${appData.season.currentGameweek}
        </h3>

        <p>
            <strong>
                Leader:
            </strong>

            ${leaderHeaderName}
            ${leaderHeaderPoints}
        </p>
    `;
}

startup();