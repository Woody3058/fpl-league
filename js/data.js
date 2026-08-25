
const appData = {season: null, players: [], scores: [], competitionPeriods: []};

async function loadSeasonData() {

    console.log("data.js: loadSeasonData Called");

    appData.season = await getActiveSeason();

    const [players, scores, competitionPeriods] = await Promise.all([
            getSeasonPlayers(appData.season.id),
            getSeasonScores(appData.season.id),
            getCompetitionPeriods(appData.season.id)
        ]);


    appData.players =
        players;


    appData.scores =
        scores;


    appData.competitionPeriods =
        competitionPeriods;


    console.log(
        "Application data loaded:",
        appData
    );

}

async function getActiveSeason() {

    console.log("data.js: getActiveSeason Called");

    const {data, error} =
        await supabaseClient
            .from("seasons")
            .select("*")
            .eq("active", true)
            .single();

    if (error) {
        console.error(
            "Error loading active season:",
            error
        );
        throw error;
    }

    return {
        id:
            data.id, seasonCode:
            data.season_code,
        name:
            data.name, totalGameweeks:
            data.total_gameweeks,
        currentGameweek:
            data.current_gameweek,
        active:
            data.active
    };

}

async function getSeasonPlayers(
    seasonId
) {

    console.log(
        "data.js: getSeasonPlayers Called"
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("season_players")
            .select(`
                player_id,
                fpl_entry_id,
                fpl_team_name,
                players (
                    id,
                    name
                )
            `)
            .eq(
                "season_id",
                seasonId
            )
            .eq(
                "active",
                true
            )
            .order(
                "display_order"
            );


    if (error) {

        console.error(
            "Error loading season players:",
            error
        );

        throw error;

    }


    return data.map(
        row => ({

            id:
                row.player_id,

            name:
                row.players.name,

            fplEntryId:
                row.fpl_entry_id,

            fplTeamName:
                row.fpl_team_name

        })
    );

}

async function getSeasonScores(
    seasonId
) {

    console.log(
        "data.js: getSeasonScores Called"
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("gameweek_scores")
            .select("*")
            .eq(
                "season_id",
                seasonId
            );


    if (error) {

        console.error(
            "Error loading season scores:",
            error
        );

        throw error;

    }


    return data.map(
        row => ({

            playerId:
                row.player_id,

            gameweek:
                row.gameweek,

            fplPoints:
                Number(
                    row.fpl_points
                ) || 0,

            adjustment:
                Number(
                    row.adjustment
                ) || 0,

            points:
                (
                    Number(
                        row.fpl_points
                    ) || 0
                ) +
                (
                    Number(
                        row.adjustment
                    ) || 0
                ),

            note:
                row.note,

            captainName:
                row.captain_name,

            captainPoints:
                row.captain_points !== null
                    ? Number(
                        row.captain_points
                    )
                    : null,

            captainMultiplier:
                row.captain_multiplier !== null
                    ? Number(
                        row.captain_multiplier
                    )
                    : null

        })
    );

}

async function getCompetitionPeriods(
    seasonId
) {

    console.log(
        "data.js: getCompetitionPeriods Called"
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("competition_periods")
            .select("*")
            .eq(
                "season_id",
                seasonId
            )
            .order(
                "period_number"
            );


    if (error) {

        console.error(
            "Error loading competition periods:",
            error
        );

        throw error;

    }


    return data.map(
        row => ({

            id:
                row.period_number,

            name:
                row.name,

            start:
                row.start_gameweek,

            end:
                row.end_gameweek

        })
    );

}

async function getSeasons() {

    console.log(
        "data.js: getSeasons Called"
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("seasons")
            .select(`
                id,
                season_code,
                name,
                total_gameweeks,
                current_gameweek,
                active
            `)
            .order(
                "season_code",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Error loading seasons:",
            error
        );

        throw error;

    }


    return data.map(
        row => ({

            id:
                row.id,

            seasonCode:
                row.season_code,

            name:
                row.name,

            totalGameweeks:
                row.total_gameweeks,

            currentGameweek:
                row.current_gameweek,

            active:
                row.active

        })
    );

}

async function getHistoricalPeriodScores(
    seasonId
) {

    console.log(
        "data.js: getHistoricalPeriodScores Called"
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("period_scores")
            .select(`
                period,
                period_total,
                player_id,
                players (
                    id,
                    name
                )
            `)
            .eq(
                "season_id",
                seasonId
            )
            .order(
                "period"
            );


    if (error) {

        console.error(
            "Error loading historical period scores:",
            error
        );

        throw error;

    }


    return data.map(
        row => ({

            period:
                row.period,

            periodTotal:
                Number(
                    row.period_total
                ) || 0,

            playerId:
                row.player_id,

            playerName:
                row.players?.name ??
                "Unknown"

        })
    );

}