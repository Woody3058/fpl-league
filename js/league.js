
/*function getPlayerScore(playerId, gameweek) {

    //console.log("League.js: getPlayerScore Called");

    //console.log(
    //    "Looking for:",
    //    playerId,
    //    gameweek,
    //    "Available scores:",
    //    scores
    //);

    const score = scores.find(
        x =>
            x.playerId === playerId &&
            x.gameweek === gameweek
    );


    return score
        ? score.points
        : 0;
}*/

function getOverallLeague(
    players,
    scores
) {

    const league =
        players.map(
            player => {

                const total =
                    scores
                        .filter(
                            score =>
                                score.playerId ===
                                player.id
                        )
                        .reduce(
                            (
                                sum,
                                score
                            ) =>
                                sum +
                                score.points,
                            0
                        );


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


    league.sort(
        (
            a,
            b
        ) =>
            b.total -
            a.total
    );


    return league;

}

/*function getOverallLeague() {

    return players
        .map(player => {

            let total = 0;

            for (let gw = 1; gw <= season.currentGameweek; gw++) {
                total += getPlayerScore(player.id, gw);
            }

            return {
                playerId: player.id,
                name: player.name,
                total: total
            };
        })
        .sort((a, b) => b.total - a.total);
}*/