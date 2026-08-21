
let scorePageSeason = null;

let scorePagePlayers = [];


// ==========================================
// STARTUP
// ==========================================

async function startupScores() {

    console.log(
        "scores.js: startupScores Called"
    );

    const loggedIn =
    await requireAdminLogin();


    if (!loggedIn)
        return;


    setActiveAdminNavigation(
        "scores"
    );

    setupAdminLogout();

    try {

        setActiveAdminNavigation(
            "scores"
        );


        // ======================================
        // ACTIVE SEASON
        // ======================================

        scorePageSeason =
            await getAdminActiveSeason();


        // ======================================
        // PLAYERS
        // ======================================

        scorePagePlayers =
            await getAdminSeasonPlayers(
                scorePageSeason.id
            );


        // ======================================
        // GAMEWEEK SELECTOR
        // ======================================

        populateGameweekSelector(
            scorePageSeason
        );


        // ======================================
        // INITIAL SCORE LOAD
        // ======================================

        await loadScores(
            scorePageSeason.currentGameweek
        );


        // ======================================
        // EVENTS
        // ======================================

        document
            .getElementById(
                "gameweekSelector"
            )
            .addEventListener(
                "change",
                event => {

                    loadScores(
                        Number(
                            event.target.value
                        )
                    );

                }
            );

        document
            .getElementById(
                "importFplButton"
            )
            .addEventListener(
                "click",
                handleFplImport
            );


        console.log(
            "Scores page started successfully."
        );

    }
    catch(error) {

        console.error(
            "Scores page startup failed:",
            error
        );

    }

    document
        .getElementById(
            "scoreSeasonName"
        )
        .textContent =
            scorePageSeason.name;

}

// ==========================================
// GAMEWEEK SELECTOR
// ==========================================

function populateGameweekSelector(
    season
) {

    const selector =
        document.getElementById(
            "gameweekSelector"
        );


    selector.innerHTML = "";


    for (
        let gw = 1;
        gw <= season.totalGameweeks;
        gw++
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            gw;


        option.textContent =
            `GW${gw}`;


        if (
            gw ===
            season.currentGameweek
        ) {

            option.selected =
                true;

        }


        selector.appendChild(
            option
        );

    }

}

// ==========================================
// LOAD SCORES
// ==========================================

async function loadScores(
    gameweek
) {

    console.log(
        "scores.js: loadScores Called",
        gameweek
    );


    try {

        const scoreData =
            await getAdminGameweekScores(
                scorePageSeason.id,
                gameweek
            );


        renderScores(
            scorePagePlayers,
            scoreData,
            gameweek
        );

    }
    catch(error) {

        console.error(
            "Unable to load scores:",
            error
        );

    }

}

// ==========================================
// RENDER SCORES
// ==========================================

function renderScores(
    seasonPlayers,
    scoreData,
    gameweek
) {

    const tbody =
        document.querySelector(
            "#scoreManagementTable tbody"
        );


    tbody.innerHTML = "";


    seasonPlayers.forEach(
        player => {

            const score =
                scoreData.find(
                    row =>
                        row.player_id ===
                        player.player_id
                );


            const fplPoints =
                Number(
                    score?.fpl_points
                ) || 0;


            const adjustment =
                Number(
                    score?.adjustment
                ) || 0;


            const total =
                fplPoints +
                adjustment;


            const row =
                document.createElement(
                    "tr"
                );

                if (adjustment !== 0) {

                    row.classList.add(
                        "score-adjusted-row"
                    );

                }


            row.innerHTML = `

                <td>
                    ${player.players?.name ?? "Unknown"}
                </td>

                <td class="score-fpl">
                    ${fplPoints}
                </td>

                <td>

                    <input
                        type="number"
                        class="score-adjustment"
                        data-player-id="${player.player_id}"
                        value="${adjustment}"
                    >

                </td>

                <td class="score-total">

                    <strong>
                        ${total}
                    </strong>

                </td>

                <td>

                    <input
                        type="text"
                        class="score-note"
                        data-player-id="${player.player_id}"
                        value="${score?.note ?? ""}"
                        placeholder="Optional note"
                    >

                </td>

                <td>

                    <button
                        class="save-score-button"
                        data-player-id="${player.player_id}"
                        data-gameweek="${gameweek}"
                    >
                        Save
                    </button>

                </td>

            `;


            tbody.appendChild(
                row
            );
        }
    );

                // ==========================================
            // SAVE BUTTON EVENTS
            // ==========================================

            document
                .querySelectorAll(
                    ".save-score-button"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            () => {

                                saveScore(

                                    Number(
                                        button.dataset.playerId
                                    ),

                                    Number(
                                        button.dataset.gameweek
                                    )

                                );

                            }
                        );

                    }
                );

}

async function saveScore(
    playerId,
    gameweek
) {

    console.log(
        "scores.js: saveScore Called",
        playerId,
        gameweek
    );


    const adjustmentInput =
        document.querySelector(
            `.score-adjustment[data-player-id="${playerId}"]`
        );


    const noteInput =
        document.querySelector(
            `.score-note[data-player-id="${playerId}"]`
        );


    if (
        !adjustmentInput ||
        !noteInput
    ) {

        console.error(
            "Score inputs not found for player:",
            playerId
        );

        return;

    }


    const adjustment =
        Number(
            adjustmentInput.value
        ) || 0;


    const note =
        noteInput.value.trim();


    try {

        await saveAdminGameweekScore(

            scorePageSeason.id,

            playerId,

            gameweek,

            adjustment,

            note || null

        );


        console.log(
            "Score saved successfully."
        );


        await loadScores(
            gameweek
        );

    }
    catch(error) {

        console.error(
            "Unable to save score:",
            error
        );


        alert(
            "Unable to save score."
        );

    }

}

function showFplImportStatus() {

    const panel =
        document.getElementById(
            "fplImportStatus"
        );

    if (!panel)
        return;


    panel.style.display =
        "block";


    document
        .getElementById(
            "fplImportSummary"
        )
        .textContent =
        "Starting import...";


    document
        .getElementById(
            "fplImportPlayers"
        )
        .innerHTML =
        "";

}


function updateFplImportSummary(
    text
) {

    const summary =
        document.getElementById(
            "fplImportSummary"
        );


    if (summary) {

        summary.textContent =
            text;

    }

}


function updateFplPlayerStatus(
    playerId,
    playerName,
    status,
    message = ""
) {

    const container =
        document.getElementById(
            "fplImportPlayers"
        );


    if (!container)
        return;


    let row =
        document.getElementById(
            `fpl-import-player-${playerId}`
        );


    if (!row) {

        row =
            document.createElement(
                "div"
            );


        row.id =
            `fpl-import-player-${playerId}`;


        row.className =
            "fpl-import-player";


        container.appendChild(
            row
        );

    }


    let icon = "…";


    if (
        status ===
        "importing"
    ) {

        icon = "⏳";

    }
    else if (
        status ===
        "success"
    ) {

        icon = "✓";

    }
    else if (
        status ===
        "retry"
    ) {

        icon = "↻";

    }
    else if (
        status ===
        "skipped"
    ) {

        icon = "—";

    }
    else if (
        status ===
        "failed"
    ) {

        icon = "✗";

    }


    row.className =
        `fpl-import-player fpl-import-${status}`;


    row.innerHTML = `

        <span class="fpl-import-icon">
            ${icon}
        </span>

        <strong>
            ${playerName}
        </strong>

        <span>
            ${message}
        </span>

    `;

}

async function updateCurrentGameweekFromFpl() {

    console.log("Admin.js: updateCurrentGameweekFromFpl Called");

    try {
        const result =
            await supabaseClient.functions.invoke("fpl-history",
                {
                    body: {
                        requestType:
                            "currentGameweek"
                    }
                }
            );

        if (result.error)
            throw result.error;


        const currentGameweek = Number(result.data?.currentGameweek);

        console.log("FPL current gameweek:", currentGameweek);

        // Before GW1 starts, FPL may return 0.
        // In that case, leave Supabase unchanged.

        if (!Number.isInteger(currentGameweek) || currentGameweek < 1) {
            console.log("No active FPL gameweek yet.");
            return false;
        }

        // ==========================================
        // GET ACTIVE SEASON
        // ==========================================

        const {data: season, error: seasonError} =
            await supabaseClient
                .from("seasons")
                .select(`id, current_gameweek`)
                .eq("active", true)
                .single();

        if (seasonError)
            throw seasonError;


        // ==========================================
        // ALREADY CORRECT
        // ==========================================

        if (
            season.current_gameweek ===
            currentGameweek
        ) {

            console.log(
                `Current gameweek already GW${currentGameweek}.`
            );

            return true;

        }


        // ==========================================
        // UPDATE SEASON
        // ==========================================

        const {
            error: updateError
        } =
            await supabaseClient
                .from("seasons")
                .update({

                    current_gameweek:
                        currentGameweek

                })
                .eq(
                    "id",
                    season.id
                );


        if (updateError)
            throw updateError;


        console.log(
            `Season current gameweek updated to GW${currentGameweek}.`
        );


        return true;

    }
    catch(error) {

        console.error(
            "Unable to update current gameweek:",
            error
        );


        return false;

    }

}

async function importFplPlayer(
    playerId,
    entryId,
    playerName
) {

    console.log(
        "Importing FPL player:",
        playerId,
        entryId,
        playerName
    );


    try {

        // ==========================================
        // GET ACTIVE SEASON
        // ==========================================

        const {
            data: season,
            error: seasonError
        } = await supabaseClient
            .from("seasons")
            .select("*")
            .eq("active", true)
            .single();


        if (seasonError)
            throw seasonError;


        // ==========================================
        // GET FPL HISTORY
        // ==========================================





let data = null;
let lastError = null;


for (
    let attempt = 1;
    attempt <= 5;
    attempt++
) {

    try {

        console.log(
            `FPL request attempt ${attempt} for ${entryId}`
        );


        const result =
            await supabaseClient.functions.invoke(
                "fpl-history",
                {
                    body: {
                        entryId: entryId
                    }
                }
            );


        if (result.error) {

            // Try to read the function response body

            if (
                result.error.context
            ) {

                try {

                    const errorBody =
                        await result.error
                            .context
                            .clone()
                            .json();


                    console.warn(
                        "Edge Function response body:",
                        errorBody
                    );

                }
                catch {
                    // Ignore parsing errors
                }

            }


            throw result.error;

        }


        data =
            result.data;


        console.log(
            `FPL request succeeded for ${entryId} on attempt ${attempt}`
        );


        break;

    }
    catch(error) {

        lastError =
            error;


        console.warn(
            `FPL request failed for ${entryId}, attempt ${attempt}`,
            error
        );


        if (
            attempt < 5
        ) {

            // Exponential backoff:
            //
            // attempt 1 -> 2 sec
            // attempt 2 -> 4 sec
            // attempt 3 -> 8 sec
            // attempt 4 -> 16 sec

            const delay =
                2000 *
                Math.pow(
                    2,
                    attempt - 1
                );


            // Add a little randomness so requests
            // don't all happen at exact intervals.

            const jitter =
                Math.floor(
                    Math.random() *
                    1000
                );


            const waitTime =
                delay +
                jitter;

            
            //console.clear();

            console.log(
                `Waiting ${waitTime} ms before retry...`
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        waitTime
                    )
            );

        }

    }

}


if (!data) {

    throw (
        lastError ??
        new Error(
            "FPL request failed after retries"
        )
    );

}

        if (!data) {

            throw lastError ??
                new Error(
                    "FPL request failed"
                );

        }

        //console.clear();

        console.log("FPL history received for:",playerName, data);

        // ==========================================
        // GET CURRENT SEASON HISTORY
        // ==========================================

        const history =
            data.current;

        if (
            !Array.isArray(history) ||
            history.length === 0
        ) {

        //console.clear();

            console.log("No completed FPL gameweeks for", playerName);

            return false;

        }


        if (!Array.isArray(history)) {

            throw new Error(
                "FPL response does not contain current history"
            );

        }


        console.log(
            "Current season gameweeks:",
            history.length
        );


        // ==========================================
        // IMPORT EACH GAMEWEEK
        // ==========================================

        for (const gw of history) {

            console.log(
                "Importing GW",
                gw.event,
                "points:",
                gw.points
            );


            const {
                data: existing,
                error: existingError
            } =
                await supabaseClient
                    .from("gameweek_scores")
                    .select(
                        "id, adjustment, note"
                    )
                    .eq(
                        "season_id",
                        season.id
                    )
                    .eq(
                        "player_id",
                        playerId
                    )
                    .eq(
                        "gameweek",
                        gw.event
                    )
                    .maybeSingle();


            if (existingError)
                throw existingError;


            if (existing) {

                // ----------------------------------
                // UPDATE FPL POINTS ONLY
                // ----------------------------------

                const {
                    error: updateError
                } =
                    await supabaseClient
                        .from(
                            "gameweek_scores"
                        )
                        .update({

                            fpl_points:
                                gw.points

                        })
                        .eq(
                            "id",
                            existing.id
                        );


                if (updateError)
                    throw updateError;

            }
            else {

                // ----------------------------------
                // CREATE NEW RECORD
                // ----------------------------------

                const {
                    error: insertError
                } =
                    await supabaseClient
                        .from(
                            "gameweek_scores"
                        )
                        .insert({

                            season_id:
                                season.id,

                            player_id:
                                playerId,

                            gameweek:
                                gw.event,

                            fpl_points:
                                gw.points,

                            adjustment:
                                0,

                            note:
                                null

                        });


                if (insertError)
                    throw insertError;

            }

        }


        console.log(
            "FPL import complete"
        );


        return true;

    }
        catch(error) {

            console.error(
                "FPL import failed:",
                error
            );

            throw error;

        }

}

async function importAllFplPlayers() {

    console.log(
        "================================="
    );

    console.log(
        "Starting FPL import for all players"
    );

    console.log(
        "================================="
    );


    try {

        // ==========================================
        // UPDATE CURRENT GAMEWEEK FIRST
        // ==========================================

        console.log(
            "Checking current FPL gameweek..."
        );

        showFplImportStatus();

        updateFplImportSummary(
            "Checking current FPL gameweek..."
        );

        const gameweekUpdated =
            await updateCurrentGameweekFromFpl();

            
            if (!gameweekUpdated) {

                updateFplImportSummary(
                    "Import stopped — no active FPL gameweek."
                );

            }
            else {

                updateFplImportSummary(
                    "Current gameweek confirmed. Starting player import..."
                );

            }


        console.log(
            "Gameweek check complete:",
            gameweekUpdated
        );


        if (!gameweekUpdated) {

            console.warn(
                "Unable to determine current FPL gameweek."
            );

            return {
                imported: 0,
                skipped: 0,
                failed: 0,
                failedPlayers: [],
                gameweekError: true
            };

        }


        console.log(
            "Current gameweek confirmed. Starting player import..."
        );


        // ==========================================
        // GET ACTIVE SEASON
        // ==========================================

        const {
            data: season,
            error: seasonError
        } =
            await supabaseClient
                .from("seasons")
                .select("*")
                .eq(
                    "active",
                    true
                )
                .single();


        if (seasonError)
            throw seasonError;


        // ==========================================
        // GET ACTIVE PLAYERS
        // ==========================================

        const {
            data: seasonPlayers,
            error: playersError
        } =
            await supabaseClient
                .from("season_players")
                .select(`
                    id,
                    player_id,
                    fpl_entry_id,
                    players (
                        id,
                        name
                    )
                `)
                .eq(
                    "season_id",
                    season.id
                )
                .eq(
                    "active",
                    true
                )
                .order(
                    "display_order"
                );


        if (playersError)
            throw playersError;


        // ==========================================
        // COUNTERS
        // ==========================================

        let imported = 0;
        let skipped = 0;

        const failedPlayers = [];


        // ==========================================
        // FIRST PASS
        // ==========================================

        console.log(
            "Starting first import pass..."
        );


        for (
            const player of seasonPlayers
        ) {

            const playerName =
                player.players?.name ??
                `Player ${player.player_id}`;


            // --------------------------------------
            // NO FPL ENTRY ID
            // --------------------------------------

            if (!player.fpl_entry_id) {

                console.warn(
                    "Skipping",
                    playerName,
                    "- no FPL Entry ID"
                );

                updateFplPlayerStatus(
                    player.player_id,
                    playerName,
                    "skipped",
                    "No FPL Entry ID"
                );

                skipped++;

                continue;

            }

            updateFplPlayerStatus(
                player.player_id,
                playerName,
                "importing",
                "Importing..."
            );




            try {

                const success =
                    await importFplPlayer(
                        player.player_id,
                        player.fpl_entry_id,
                        playerName
                    );


                if (success) {

                    imported++;

                    updateFplPlayerStatus(
                        player.player_id,
                        playerName,
                        "success",
                        "Imported"
                    );

                }
                else {

                    // No current-season data yet

                    skipped++;

                updateFplPlayerStatus(
                    player.player_id,
                    playerName,
                    "skipped",
                    "No completed gameweek data"
                );

                }

            }
            
            catch(error)
            
             {

                console.warn(
                    `First pass failed for ${playerName}`
                );

                updateFplPlayerStatus(
                    player.player_id,
                    playerName,
                    "retry",
                    "First pass failed — queued for retry"
                );


                failedPlayers.push({

                    playerId:
                        player.player_id,

                    playerName:
                        playerName,

                    entryId:
                        player.fpl_entry_id,

                    error:
                        error

                });

            }


            // ======================================
            // DELAY BEFORE NEXT PLAYER
            // ======================================

                updateFplImportSummary(
                    `Retrying ${failedPlayers.length} failed player(s)...`
                );

            const playerDelay =
                1500 +
                Math.floor(
                    Math.random() *
                    1500
                );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        playerDelay
                    )
            );

        }


        // ==========================================
        // SECOND PASS
        // ==========================================

        const finalFailures = [];


        if (
            failedPlayers.length > 0
        ) {

            console.log(
                "================================="
            );

            console.log(
                `First pass completed with ${failedPlayers.length} failures`
            );

            console.log(
                "Waiting before second pass..."
            );

            updateFplPlayerStatus(
                player.playerId,
                player.playerName,
                "retry",
                "Retrying..."
            );


            // Give FPL a longer pause before
            // retrying only the failed accounts

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        10000
                    )
            );


            console.log(
                "Starting second import pass..."
            );


            for (
                const player of failedPlayers
            ) {

                console.log(
                    `Second-pass retry: ${player.playerName}`
                );


                try {

                    const success =
                        await importFplPlayer(
                            player.playerId,
                            player.entryId
                        );


                    if (success) {

                        imported++;

                    updateFplPlayerStatus(
                        player.playerId,
                        player.playerName,
                        "success",
                        "Imported on retry"
                    );


                        console.log(
                            `Second-pass import succeeded: ${player.playerName}`
                        );

                    }
                    else {

                        skipped++;

                    }

                }
                catch(error) {

                    console.error(
                        `Second-pass import failed: ${player.playerName}`,
                        error
                    );

                    updateFplPlayerStatus(
                        player.playerId,
                        player.playerName,
                        "failed",
                        "Import failed"
                    );


                    finalFailures.push({

                        playerId:
                            player.playerId,

                        playerName:
                            player.playerName,

                        entryId:
                            player.entryId,

                        error:
                            error

                    });

                }


                // Slightly slower between second-pass
                // requests

                const retryDelay =
                    2500 +
                    Math.floor(
                        Math.random() *
                        2500
                    );


                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            retryDelay
                        )
                );

            }

        }


        // ==========================================
        // FINAL SUMMARY
        // ==========================================

        //console.clear();

        console.log("=================================");
        console.log("FPL IMPORT COMPLETE");
        console.log("=================================");

        console.log("Imported:", imported);

        console.log("Skipped:", skipped);

        console.log("Failed:", finalFailures.length);


        if (
            finalFailures.length > 0
        ) {

            console.log(
                "Final failed players:"
            );


            finalFailures.forEach(
                player => {

                    console.log(
                        `${player.playerName} (${player.entryId})`
                    );

                }
            );

        }


        updateFplImportSummary(
            `Import complete — Imported: ${imported}, Skipped: ${skipped}, Failed: ${finalFailures.length}`
        );

        return {

            imported:
                imported,

            skipped:
                skipped,

            failed:
                finalFailures.length,

            failedPlayers:
                finalFailures

        };

    }
    catch(error) {

        console.error(
            "FPL import failed:",
            error
        );


        return null;

    }

}

async function handleFplImport() {

    const button =
        document.getElementById(
            "importFplButton"
        );


    button.disabled = true;

    button.innerHTML = `

        <span
            class="fpl-spinner"
        ></span>

        Importing...

    `;


    showFplImportStatus();


    try {

        const result =
            await importAllFplPlayers();


        if (!result)
            return;


        if (
            result.gameweekError
        ) {

            updateFplImportSummary(
                "Import stopped — no active FPL gameweek."
            );

            return;

        }


        updateFplImportSummary(

            `Import complete — ` +

            `Imported: ${result.imported}, ` +

            `Skipped: ${result.skipped}, ` +

            `Failed: ${result.failed}`

        );


        // Refresh displayed scores after import

        const gameweek =
            Number(
                document
                    .getElementById(
                        "gameweekSelector"
                    )
                    .value
            );


        await loadScores(
            gameweek
        );

    }
    catch(error) {

        console.error(
            "FPL import error:",
            error
        );


        updateFplImportSummary(
            "FPL import failed."
        );

    }
    finally {

        button.disabled = false;

        button.textContent =
            "Import FPL Scores";

    }

}


// ==========================================
// START
// ==========================================

startupScores();