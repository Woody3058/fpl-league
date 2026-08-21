
function calculatePeriodCompetition(season, players, scores) {

    console.log("competition.js: calculatePeriodCompetition Called");

    // ==========================================
    // BUILD PERIODS
    // ==========================================

    const periods = [];

    let periodNumber = 1;
    let gameweek = 1;

    while (gameweek <= season.totalGameweeks) {

        const remaining = season.totalGameweeks - gameweek + 1;
        const periodLength = remaining === 2
                ? 2
                : 4;

        const startGameweek = gameweek;
        const endGameweek = Math.min(gameweek + periodLength - 1, season.totalGameweeks);

        periods.push({
            period:
                periodNumber,
            startGameweek:
                startGameweek,
            endGameweek:
                endGameweek
        });

        gameweek = endGameweek + 1;
        periodNumber++;
    }

    // ==========================================
    // CALCULATE EACH PERIOD
    // ==========================================

    const results = periods.map(period => {const periodPlayers = players.map(
                    player => {const playerScores = scores.filter(
                        score =>
                            score.playerId ===  player.id && score.gameweek >=  period.startGameweek && score.gameweek <= period.endGameweek);


                        const points = playerScores.reduce((total, score) => total + score.points, 0);

                        return {
                            playerId:
                                player.id,
                            playerName:
                                player.name,
                            points:
                                points,
                            period:
                                period.period,
                            startGameweek:
                                period.startGameweek,
                            endGameweek:
                                period.endGameweek,
                            won:
                                false,
                            periodPoints:
                                0
                        };

                    }
                );

                // ==========================================
                // DOES THIS PERIOD HAVE ANY SCORES?
                // ==========================================

                const hasScores =
                    periodPlayers.some(
                        player =>
                            scores.some(
                                score =>

                                    score.playerId ===
                                        player.playerId &&

                                    score.gameweek >=
                                        period.startGameweek &&

                                    score.gameweek <=
                                        period.endGameweek

                            )
                    );


                // ==========================================
                // DOES THIS PERIOD HAVE ANY ACTUAL POINTS?
                // ==========================================

                const hasPoints =
                    periodPlayers.some(
                        player =>
                            player.points !== 0
                    );


                // ==========================================
                // FIND WINNER(S)
                // ==========================================

                if (
                    hasScores &&
                    hasPoints
                ) {

                    const highestPoints =
                        Math.max(
                            ...periodPlayers.map(
                                player =>
                                    player.points
                            )
                        );


                    const winners =
                        periodPlayers.filter(
                            player =>
                                player.points ===
                                highestPoints
                        );


                    const pointsPerWinner =
                        1 /
                        winners.length;


                    periodPlayers.forEach(
                        player => {

                            if (
                                player.points ===
                                highestPoints
                            ) {

                                player.won =
                                    true;

                                player.periodPoints =
                                    pointsPerWinner;

                            }

                        }
                    );

                }


                // ==========================================
                // RETURN PERIOD
                // ==========================================

                return {
                    period:
                        period.period,
                    startGameweek:
                        period.startGameweek,
                    endGameweek:
                        period.endGameweek,
                    players:
                        periodPlayers
                };
            }
        );

    // ==========================================
    // RUNNING TOTALS
    // ==========================================

    const runningTotals = {};

    players.forEach(player => {runningTotals[player.id] = {
                playerId:
                    player.id,
                playerName:
                    player.name,
                wins: 0
            };
        }
    );

    // ==========================================
    // ADD PERIOD POINTS
    // ==========================================

    results.forEach(period => {
            period.players.forEach(player => {
                    if (player.periodPoints > 0) {
                        runningTotals[player.playerId].wins += player.periodPoints;
                    }
                }
            );
        }
    );

    // ==========================================
    // SORT RUNNING TOTALS
    // ==========================================

    const sortedRunningTotals = Object.values(runningTotals).sort(
                (a, b) =>
                    b.wins -
                    a.wins
                );

    // ==========================================
    // RETURN RESULT
    // ==========================================

    return {
        periods:
            results,
        runningTotals:
            sortedRunningTotals
    };

    //const testComp = season, players, scores;
}

function loadPeriodCompetition() {

    console.log("competition.js: loadPeriodCompetition Called");

    const competition = calculatePeriodCompetition(appData.season, appData.players, appData.scores);

    return {
        season:
            appData.season,
        competition:
            competition
    };
}

/*function loadPeriodCompetition() {

    console.log("competition.js: loadPeriodCompetition Called");

    const competition =  calculatePeriodCompetition(season, players, scores);

    return {
        season,
        competition
    };
}*/