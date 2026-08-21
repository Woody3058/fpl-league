
const loginSection =
    document.getElementById("loginSection");

const adminSection =
    document.getElementById("adminSection");

const loginForm =
    document.getElementById("loginForm");

const loginError =
    document.getElementById("loginError");

const logoutButton =
    document.getElementById("logoutButton");

const adminContent =
    document.getElementById("adminContent");

let historicalImportData = null;


// ==========================================
// CHECK CURRENT LOGIN
// ==========================================

async function checkLogin() {

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        return;
    }


    if (data.session) {

        showAdmin();

    }
    else {

        showLogin();

    }

}


// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {

    loginSection.style.display =
        "block";

    adminSection.style.display =
        "none";

}


// ==========================================
// SHOW ADMIN
// ==========================================

function showAdmin() {

    loginSection.style.display =
        "none";

    adminSection.style.display =
        "block";


    loadAdminDashboard();

}


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        loginError.textContent = "";


        const email =
            document.getElementById("email")
                .value.trim();

        const password =
            document.getElementById("password")
                .value;


        const {
            data,
            error
        } = await supabaseClient.auth
            .signInWithPassword({

                email,
                password

            });


        if (error) {

            console.error(
                "Login failed:",
                error
            );


            loginError.textContent =
                error.message;

            return;
        }


        console.log(
            "Login successful:",
            data
        );


        showAdmin();

    }
);


// ==========================================
// LOGOUT
// ==========================================

logoutButton.addEventListener(
    "click",
    async function() {

        await supabaseClient.auth.signOut();

        showLogin();

    }
);


// ==========================================
// ADMIN DASHBOARD
// ==========================================

async function loadAdminDashboard() {

    adminContent.innerHTML = `
        <p>Loading dashboard...</p>
    `;


    try {

        // -----------------------------
        // Get active season
        // -----------------------------

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


        // -----------------------------
        // Get players
        // -----------------------------

        const {
            data: seasonPlayers,
            error: playerError
        } = await supabaseClient
            .from("season_players")
            .select(`
                id,
                player_id,
                fpl_entry_id,
                fpl_team_name,
                active,
                display_order,
                players (
                    id,
                    name
                )
            `)
            .eq("season_id", season.id)
            .order("display_order");


        if (playerError)
            throw playerError;


        renderAdminDashboard(
            season,
            seasonPlayers
        );


    }
    catch(error) {

        console.error(
            "Admin dashboard error:",
            error
        );


        adminContent.innerHTML = `
            <div class="error">
                Unable to load admin data.
            </div>
        `;

    }

}

function renderAdminDashboard(
    season,
    seasonPlayers
) {

    const playerCount =
        seasonPlayers.length;


    let playerRows = "";


    seasonPlayers.forEach(
        (seasonPlayer, index) => {

            const player =
                seasonPlayer.players;


            playerRows += `
                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${player.name}
                    </td>

                    <td>
                        ${
                            seasonPlayer.fpl_entry_id
                                ?? "—"
                        }
                    </td>

                    <td>
                        ${
                            seasonPlayer.fpl_team_name
                                ?? "—"
                        }
                    </td>

                    <td>
                        ${
                            seasonPlayer.active
                                ? "✓"
                                : "No"
                        }
                    </td>

                    <td>

                        <button
                            class="edit-player-button"
                            data-id="${seasonPlayer.id}"
                        >
                            Edit
                        </button>

                    </td>

                </tr>
            `;

        }
    );


    adminContent.innerHTML = `

        <div class="admin-navigation">

        <button
            id="playersNavButton" class="admin-nav-active">
            Players
        </button>

        <button id="scoresNavButton">
            Scores
        </button>

        <button id="seasonsNavButton">
            Seasons
        </button>

        </div>

        <div class="admin-summary">

            <div class="admin-card">

                <h3>Season</h3>

                <strong>
                    ${season.name}
                </strong>

            </div>


            <div class="admin-card">

                <h3>Current Gameweek</h3>

                <strong>
                    ${season.current_gameweek}
                </strong>

            </div>


            <div class="admin-card">

                <h3>Players</h3>

                <strong>
                    ${playerCount} / 20
                </strong>

            </div>

        </div>


        <section class="admin-panel">

            <div class="admin-panel-header">

                <h2>Players</h2>

                ${
                    playerCount < 20
                    ?
                    `
                    <button
                        id="addPlayerButton"
                    >
                        + Add Player
                    </button>
                    `
                    :
                    ""
                }

            </div>


            <table>

                <thead>

                    <tr>

                        <th>#</th>
                        <th>Player</th>
                        <th>FPL Entry ID</th>
                        <th>FPL Team</th>
                        <th>Active</th>
                        <th></th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        playerRows ||
                        `
                        <tr>
                            <td colspan="6">
                                No players yet.
                            </td>
                        </tr>
                        `
                    }

                </tbody>

            </table>

        </section>

    `;


    const addButton =
        document.getElementById(
            "addPlayerButton"
        );


    if(addButton) {

        addButton.addEventListener(
            "click",
            showAddPlayerForm
        );

    }


    document
        .querySelectorAll(
            ".edit-player-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showEditPlayerForm(
                        Number(button.dataset.id),
                        seasonPlayers
                    );

                }
            );

        });

    document
        .getElementById(
            "scoresNavButton"
        )
        .addEventListener(
            "click",
            function () {
                loadScoreManagement();
            }
        );

    document
        .getElementById(
            "seasonsNavButton"
        )
        .addEventListener(
            "click",
            loadSeasonManagement
        );

}

async function loadScoreManagement(
    selectedGameweek = null
) {

    adminContent.innerHTML = `
        <p>Loading scores...</p>
    `;

    try {

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


        const gameweek =
            selectedGameweek ??
            season.current_gameweek;


        console.log(
            "Loading gameweek:",
            gameweek
        );


        // -----------------------------
        // Get players
        // -----------------------------

        const {
            data: seasonPlayers,
            error: playerError
        } = await supabaseClient
            .from("season_players")
            .select(`
                id,
                player_id,
                players (
                    id,
                    name
                )
            `)
            .eq("season_id", season.id)
            .eq("active", true)
            .order("display_order");


        if (playerError)
            throw playerError;


        // -----------------------------
        // Get selected GW scores
        // -----------------------------

        const {
            data: scoreData,
            error: scoreError
        } = await supabaseClient
            .from("gameweek_scores")
            .select("*")
            .eq(
                "season_id",
                season.id
            )
            .eq(
                "gameweek",
                gameweek
            );


        if (scoreError)
            throw scoreError;


        renderScoreManagement(
            season,
            seasonPlayers,
            scoreData,
            gameweek
        );

    }
catch(error) {

    console.error(
        "Score management error:",
        error
    );

    adminContent.innerHTML = `
        <div class="error">
            Unable to load scores.<br><br>
            ${error.message}
        </div>
    `;

}

}

function renderScoreManagement(
    season,
    seasonPlayers,
    scoreData,
    gameweek
) {

    let rows = "";


    // ==========================================
    // BUILD PLAYER ROWS
    // ==========================================

    seasonPlayers.forEach(
        player => {

            const score =
                scoreData.find(
                    x =>
                        x.player_id ===
                        player.player_id
                );


        const hasScore =
            !!score;


        const fplPoints =
            hasScore
                ? score.fpl_points
                : null;


        const adjustment =
            hasScore
                ? score.adjustment
                : null;


        const total =
            hasScore
                ? fplPoints + adjustment
                : null;


        let status = "Missing";


        if (hasScore) {

            if (adjustment !== 0)
                status = "Adjusted";
            else
                status = "Imported";

        }


            rows += `

                <tr>

                    <td>
                        ${player.players.name}
                    </td>

                    <td>
                        ${
                            fplPoints === null
                                ? "—"
                                : fplPoints
                        }
                    </td>

                    <td>

                         ${
                                adjustment === null
                                    ? "—"
                                    :
                                    `
                                    <input
                                        type="number"
                                        class="score-adjustment"
                                        data-player-id="${
                                            player.player_id
                                        }"
                                        value="${adjustment}"
                                    >
                                    `
                            }

                    </td>

                    <td>

                        <strong>
                            ${
                                total === null
                                    ? "—"
                                    : total
                            }
                        </strong>

                    </td>

                    <td>
                        ${status}
                    </td>

                    <td>

                        <input
                            type="text"
                            class="score-note"
                            data-player-id="${
                                player.player_id
                            }"
                            value="${
                                score?.note ?? ""
                            }"
                            placeholder="Optional note"
                        >

                    </td>

                    <td>

                        <button
                            class="save-score-button"
                            data-player-id="${
                                player.player_id
                            }"
                        >
                            Save
                        </button>

                    </td>

                </tr>

            `;

        }
    );


    // ==========================================
    // BUILD GAMEWEEK OPTIONS
    // ==========================================

    let gameweekOptions = "";


    for (
        let gw = 1;
        gw <= season.total_gameweeks;
        gw++
    ) {

        gameweekOptions += `

            <option
                value="${gw}"
                ${
                    gw === gameweek
                        ? "selected"
                        : ""
                }
            >
                ${gw}
            </option>

        `;

    }


    // ==========================================
    // BUILD PAGE
    // ==========================================

    adminContent.innerHTML = `

        <div class="admin-navigation">

            <button id="playersNavButton">
                Players
            </button>

            <button id="scoresNavButton" class="admin-nav-active">
                Scores
            </button>

            <button id="seasonsNavButton">
                Seasons
            </button>

        </div>


        <section class="admin-panel">


            <div class="admin-panel-header">

                    <h2>
                        Gameweek Scores
                    </h2>


                    <div>

                        <label for="gameweekSelector">
                            Gameweek:
                        </label>

                        <select
                            id="gameweekSelector"
                        >

                            ${gameweekOptions}

                        </select>


                        <button
                            id="importFplButton"
                            type="button"
                        >
                            Import FPL Scores
                        </button>

                    </div>

                    <div
                        id="fplImportStatus"
                        class="fpl-import-status"
                        style="display:none;"
                    >

                        <h3>
                            FPL Import Status
                        </h3>

                        <div
                            id="fplImportSummary"
                        ></div>

                        <div
                            id="fplImportPlayers"
                        ></div>

                    </div>

            </div>


            <table>

                <thead>

                    <tr>

                        <th>Player</th>
                        <th>FPL</th>
                        <th>Adjustment</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Note</th>
                        <th></th>

                    </tr>

                </thead>


                <tbody>

                    ${rows}

                </tbody>

            </table>


        </section>

    `;


    // ==========================================
    // NAV BUTTONS
    // ==========================================

    document
        .getElementById(
            "playersNavButton"
        )
        .addEventListener(
            "click",
            loadAdminDashboard
        );

    document
        .getElementById(
            "seasonsNavButton"
        )
        .addEventListener(
            "click",
            loadSeasonManagement
        );

    // ==========================================
    // SAVE BUTTONS
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

                        saveScoreAdjustment(
                            season.id,
                            gameweek,
                            Number(button.dataset.playerId
                            )

                        );

                    }
                );

            }
        );


    // ==========================================
    // GAMEWEEK SELECTOR
    // ==========================================

        document
            .getElementById("gameweekSelector")
            .addEventListener(
                "change",
                function (event) {

                    const selectedGameweek =
                        Number(event.currentTarget.value);

                    console.log(
                        "Selected gameweek:",
                        selectedGameweek
                    );

                    loadScoreManagement(
                        selectedGameweek
                    );

                }
            );

        document
            .getElementById(
                "importFplButton"
            )
            .addEventListener(
                "click",
                async () => {

                    const button =
                        document.getElementById(
                            "importFplButton"
                        );


            // ==========================================
            // PREVENT MULTIPLE IMPORTS
            // ==========================================

            button.disabled = true;

            button.innerHTML = `

                <span
                    class="fpl-spinner"
                ></span>

                Importing...

            `;


            try {

                const result =
                    await importAllFplPlayers();


                if (!result) {

                    alert(
                        "FPL import failed. Check the console for details."
                    );

                    return;

                }


                // ==========================================
                // SHOW RESULT
                // ==========================================

                if (
                    result.imported === 0 &&
                    result.skipped === 0 &&
                    result.failed === 0
                ) {

                    alert("No FPL gameweek data is currently available.");

                }
                else {

                    alert(
                        "FPL import complete.\n\n" +

                        "Imported: " +
                        result.imported +

                        "\nSkipped: " +
                        result.skipped +

                        "\nFailed: " +
                        result.failed
                    );

                }


                // ==========================================
                // REFRESH SCORE SCREEN
                // ==========================================

                await loadScoreManagement(
                    Number(
                        document
                            .getElementById(
                                "gameweekSelector"
                            )
                            .value
                    )
                );

            }
            finally {

                button.disabled = false;

                button.textContent =
                    "Import FPL Scores";

            }

        }
    );




}

async function saveScoreAdjustment(
    seasonId,
    gameweek,
    playerId
) {

    const adjustmentInput =
        document.querySelector(
            `.score-adjustment[data-player-id="${playerId}"]`
        );


    const noteInput =
        document.querySelector(
            `.score-note[data-player-id="${playerId}"]`
        );


    const adjustment =
        Number(
            adjustmentInput.value
        );


    const note =
        noteInput.value.trim();


    try {

        // Check whether a score already exists

        const {
            data: existing,
            error: findError
        } = await supabaseClient
            .from("gameweek_scores")
            .select("id")
            .eq(
                "season_id",
                seasonId
            )
            .eq(
                "player_id",
                playerId
            )
            .eq(
                "gameweek",
                gameweek
            )
            .maybeSingle();


        if(findError)
            throw findError;


        if(existing) {

            // -----------------------------
            // Update existing score
            // -----------------------------

            const {
                error
            } = await supabaseClient
                .from("gameweek_scores")
                .update({

                    adjustment:
                        adjustment,

                    note:
                        note || null

                })
                .eq(
                    "id",
                    existing.id
                );


            if(error)
                throw error;

        }
        else {

            // -----------------------------
            // Create score
            // -----------------------------

            const {
                error
            } = await supabaseClient
                .from("gameweek_scores")
                .insert({

                    season_id:
                        seasonId,

                    player_id:
                        playerId,

                    gameweek:
                        gameweek,

                    fpl_points:
                        0,

                    adjustment:
                        adjustment,

                    note:
                        note || null

                });


            if(error)
                throw error;

        }


        await loadScoreManagement();

    }
    catch(error) {

        console.error(
            "Save score failed:",
            error
        );

        alert(
            "Unable to save score adjustment.\n\n" +
            error.message
        );

    }

}

function showEditPlayerForm(
    seasonPlayerId,
    seasonPlayers
) {

    const seasonPlayer =
        seasonPlayers.find(
            x => x.id === seasonPlayerId
        );


    if(!seasonPlayer)
        return;


    const player =
        seasonPlayer.players;


    adminContent.innerHTML = `

        <section class="admin-panel">

            <div class="admin-panel-header">

                <h2>Edit Player</h2>

                <button
                    id="cancelEditButton"
                >
                    Cancel
                </button>

            </div>


            <form id="editPlayerForm">

                <div class="form-group">

                    <label>
                        Player Name
                    </label>

                    <input
                        type="text"
                        id="editPlayerName"
                        value="${player.name}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        FPL Entry ID
                    </label>

                    <input
                        type="number"
                        id="editFplEntryId"
                        value="${
                            seasonPlayer.fpl_entry_id ?? ""
                        }"
                    >

                </div>


                <div class="form-group">

                    <label>
                        FPL Team Name
                    </label>

                    <input
                        type="text"
                        id="editFplTeamName"
                        value="${
                            seasonPlayer.fpl_team_name ?? ""
                        }"
                    >

                </div>


                <div class="form-group">

                    <label>

                        <input
                            type="checkbox"
                            id="editPlayerActive"
                            ${
                                seasonPlayer.active
                                    ? "checked"
                                    : ""
                            }
                        >

                        Active

                    </label>

                </div>


                <button type="submit">
                    Save Changes
                </button>

            </form>


            <div
                id="editPlayerError"
                class="error"
            ></div>

        </section>

    `;


    document
        .getElementById(
            "cancelEditButton"
        )
        .addEventListener(
            "click",
            loadAdminDashboard
        );


    document
        .getElementById(
            "editPlayerForm"
        )
        .addEventListener(
            "submit",
            event => {

                updatePlayer(
                    event,
                    player.id,
                    seasonPlayer.id
                );

            }
        );

}

async function updatePlayer(
    event,
    playerId,
    seasonPlayerId
) {

    event.preventDefault();


    const errorElement =
        document.getElementById(
            "editPlayerError"
        );


    errorElement.textContent = "";


    const name =
        document
            .getElementById("editPlayerName")
            .value
            .trim();


    const fplEntryIdValue =
        document
            .getElementById("editFplEntryId")
            .value
            .trim();


    const fplTeamName =
        document
            .getElementById("editFplTeamName")
            .value
            .trim();


    const active =
        document
            .getElementById("editPlayerActive")
            .checked;


    try {

        // -----------------------------
        // Update player
        // -----------------------------

        const {
            error: playerError
        } = await supabaseClient
            .from("players")
            .update({

                name: name

            })
            .eq("id", playerId);


        if(playerError)
            throw playerError;


        // -----------------------------
        // Update season player
        // -----------------------------

        const {
            error: seasonPlayerError
        } = await supabaseClient
            .from("season_players")
            .update({

                fpl_entry_id:
                    fplEntryIdValue
                        ? Number(fplEntryIdValue)
                        : null,

                fpl_team_name:
                    fplTeamName || null,

                active: active

            })
            .eq(
                "id",
                seasonPlayerId
            );


        if(seasonPlayerError)
            throw seasonPlayerError;


        await loadAdminDashboard();

    }
    catch(error) {

        console.error(
            "Update player failed:",
            error
        );


        errorElement.textContent =
            error.message;

    }

}

function showAddPlayerForm() {

    adminContent.innerHTML = `

        <section class="admin-panel">

            <div class="admin-panel-header">

                <h2>Add Player</h2>

                <button
                    id="cancelPlayerButton"
                >
                    Cancel
                </button>

            </div>


            <form id="addPlayerForm">

                <div class="form-group">

                    <label>
                        Player Name
                    </label>

                    <input
                        type="text"
                        id="playerName"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        FPL Entry ID
                    </label>

                    <input
                        type="number"
                        id="fplEntryId"
                    >

                </div>


                <div class="form-group">

                    <label>
                        FPL Team Name
                    </label>

                    <input
                        type="text"
                        id="fplTeamName"
                    >

                </div>


                <button type="submit">
                    Add Player
                </button>

            </form>


            <div
                id="playerFormError"
                class="error"
            ></div>

        </section>

    `;


    document
        .getElementById("cancelPlayerButton")
        .addEventListener(
            "click",
            loadAdminDashboard
        );


    document
        .getElementById("addPlayerForm")
        .addEventListener(
            "submit",
            addPlayer
        );

}

async function addPlayer(event) {

    event.preventDefault();


    const errorElement =
        document.getElementById(
            "playerFormError"
        );


    errorElement.textContent = "";


    const name =
        document
            .getElementById("playerName")
            .value
            .trim();


    const fplEntryIdValue =
        document
            .getElementById("fplEntryId")
            .value
            .trim();


    const fplTeamName =
        document
            .getElementById("fplTeamName")
            .value
            .trim();


    try {

        // -----------------------------
        // Get active season
        // -----------------------------

        const {
            data: season,
            error: seasonError
        } = await supabaseClient
            .from("seasons")
            .select("id")
            .eq("active", true)
            .single();


        if (seasonError)
            throw seasonError;


        // -----------------------------
        // Create player
        // -----------------------------

        const {
            data: player,
            error: playerError
        } = await supabaseClient
            .from("players")
            .insert({

                name: name

            })
            .select()
            .single();


        if (playerError)
            throw playerError;


        // -----------------------------
        // Add player to season
        // -----------------------------

        const {
            error: seasonPlayerError
        } = await supabaseClient
            .from("season_players")
            .insert({

                season_id: season.id,

                player_id: player.id,

                fpl_entry_id:
                    fplEntryIdValue
                        ? Number(fplEntryIdValue)
                        : null,

                fpl_team_name:
                    fplTeamName || null,

                active: true,

                display_order: 999

            });


        if (seasonPlayerError)
            throw seasonPlayerError;


        // -----------------------------
        // Return to dashboard
        // -----------------------------

        await loadAdminDashboard();

    }
    catch(error) {

        console.error(
            "Add player failed:",
            error
        );


        errorElement.textContent =
            error.message;

    }

}


/*async function testFplEntry(entryId) {

    console.log(
        "Testing FPL Entry ID:",
        entryId
    );


    const url =
        `https://fantasy.premierleague.com/api/entry/${entryId}/history/`;


    try {

        const response =
            await fetch(url);


        console.log(
            "FPL response status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `FPL API returned HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "FPL history:",
            data
        );


        console.log(
            "Gameweek history:",
            data.current
        );


        return data;


    }
    catch(error) {

        console.error(
            "FPL API test failed:",
            error
        );

    }

}*/


/*async function testFplEdgeFunction(entryId) {

    console.log(
        "Testing FPL Edge Function:",
        entryId
    );


    try {

        // Get current Supabase session

        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient.auth.getSession();


        if (sessionError)
            throw sessionError;


        if (!sessionData.session) {

            throw new Error(
                "No logged-in Supabase session"
            );

        }


        const accessToken =
            sessionData.session.access_token;


        // Call Edge Function

        const {
            data,
            error
        } = await supabaseClient.functions.invoke(
            "fpl-history",
            {
                body: {
                    entryId: entryId,
                }
            }
        );


        if (error)
            throw error;


        console.log(
            "FPL Edge Function response:",
            data
        );


        return data;

    }
    catch(error) {

        console.error(
            "FPL Edge Function test failed:",
            error
        );

    }

}*/


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

/*async function testPeriodCompetition() {

    try {

        // ==========================================
        // ACTIVE SEASON
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
        // PLAYERS
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
        // SCORES
        // ==========================================

        const {
            data: scoreData,
            error: scoresError
        } =
            await supabaseClient
                .from("gameweek_scores")
                .select("*")
                .eq(
                    "season_id",
                    season.id
                );


        if (scoresError)
            throw scoresError;


        // ==========================================
        // CALCULATE
        // ==========================================

        const result =
            calculatePeriodCompetition(
                season,
                seasonPlayers,
                scoreData
            );


        console.log(
            "================================="
        );

        console.log(
            "PERIOD COMPETITION"
        );

        console.log(
            "================================="
        );


        console.log(
            "Periods:",
            result.periods
        );


        console.log(
            "Running totals:",
            result.runningTotals
        );


        return result;

    }
    catch(error) {

        console.error(
            "Period competition test failed:",
            error
        );

    }

}*/

async function loadSeasonManagement() {

    console.log("Admin.js: loadSeasonManagement Called");

    adminContent.innerHTML = `
        <p>Loading seasons...</p>
    `;

    try {

        const {
            data: seasons,
            error
        } = await supabaseClient
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

        if (error)
            throw error;

        renderSeasonManagement(
            seasons
        );

    }
    catch(error) {

        console.error(
            "Season management error:",
            error
        );

        adminContent.innerHTML = `
            <div class="error">
                Unable to load seasons.
            </div>
        `;

    }

}

function renderSeasonManagement(seasons) {

    const activeSeason = seasons.find(season => season.active);

    let rows = "";

    seasons.forEach(
        season => {

            const isFutureSeason = activeSeason && season.id > activeSeason.id;

            rows += `

                <tr>

                    <td>
                        ${season.name}
                    </td>

                    <td>
                        ${season.season_code}
                    </td>

                    <td>
                        ${season.total_gameweeks}
                    </td>

                    <td>
                        ${season.current_gameweek}
                    </td>

                    <td>
                        ${
                            season.active
                                ? "<strong>ACTIVE</strong>"
                                : "—"
                        }
                    </td>

                    <td>

                        ${
                            season.active
                                ? "—"
                                : `
                                    <button
                                        class="copy-players-button"
                                        data-season-id="${season.id}"
                                    >
                                        Copy Players
                                    </button>

                                    <button
                                        class="manage-players-button"
                                        data-season-id="${season.id}"
                                    >
                                        Manage Players
                                    </button>

                        ${
                            isFutureSeason
                                ? `
                                    <button
                                        class="activate-season-button"
                                        data-season-id="${season.id}"
                                        data-season-name="${season.name}"
                                    >
                                        Make Active
                                    </button>
                                `
                                : ""
                        }
                                `
                        }

                    </td>

                </tr>

            `;

        }
    );


    adminContent.innerHTML = `

        <div class="admin-navigation">

            <button id="playersNavButton">
                Players
            </button>

            <button id="scoresNavButton">
                Scores
            </button>

            <button id="seasonsNavButton" class="admin-nav-active">
                Seasons
            </button>

        </div>


        <section class="admin-panel">

            <div class="admin-panel-header">

                <h2>
                    Season Management
                </h2>

            </div>


            <div class="admin-panel">

                <h3>
                    Create New Season
                </h3>


                <div class="form-row">

                    <label for="seasonCode">
                        Season Code
                    </label>

                    <input
                        type="text"
                        id="seasonCode"
                        placeholder="27/28"
                    >

                </div>


                <div class="form-row">

                    <label for="seasonName">
                        Season Name
                    </label>

                    <input
                        type="text"
                        id="seasonName"
                        placeholder="2027/28"
                    >

                </div>


                <div class="form-row">

                    <label for="totalGameweeks">
                        Total Gameweeks
                    </label>

                    <input
                        type="number"
                        id="totalGameweeks"
                        value="38"
                        min="1"
                        max="50"
                    >

                </div>


                <div class="form-row">

                    <label for="currentGameweek">
                        Starting Gameweek
                    </label>

                    <input
                        type="number"
                        id="currentGameweek"
                        value="1"
                        min="1"
                        max="50"
                    >

                </div>


                <button
                    id="createSeasonButton"
                >
                    Create Season
                </button>

                <button id="historicalScoresButton">
                    Import Historical Scores
                </button>


                <div
                    id="seasonCreateMessage"
                ></div>

            </div>


            <h3>
                Existing Seasons
            </h3>


            <table>

                <thead>

                    <tr>

                        <th>Season</th>
                        <th>Code</th>
                        <th>Gameweeks</th>
                        <th>Current GW</th>
                        <th>Status</th>
                        <th>Actions</th>

                    </tr>

                </thead>


                <tbody>

                    ${rows}

                </tbody>

            </table>

        </section>

    `;


    // ==========================================
    // CREATE SEASON
    // ==========================================

    document
        .getElementById(
            "createSeasonButton"
        )
        .addEventListener(
            "click",
            createSeason
        );


    // ==========================================
    // COPY PLAYERS
    // ==========================================

    document
        .querySelectorAll(
            ".copy-players-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const seasonId =
                            Number(
                                button.dataset.seasonId
                            );


                        copyPlayersToSeason(
                            seasonId
                        );

                    }
                );

            }
        );

    document
        .querySelectorAll(
            ".manage-players-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const seasonId =
                            Number(
                                button.dataset.seasonId
                            );

                        loadSeasonPlayers(
                            seasonId
                        );

                    }
                );

            }
        );

    document
        .querySelectorAll(
            ".activate-season-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        activateSeason(
                            Number(
                                button.dataset.seasonId
                            ),
                            button.dataset.seasonName
                        );

                    }
                );

            }
        );


    // ==========================================
    // NAVIGATION
    // ==========================================

    document
        .getElementById(
            "playersNavButton"
        )
        .addEventListener(
            "click",
            loadAdminDashboard
        );


    document
        .getElementById(
            "scoresNavButton"
        )
        .addEventListener(
            "click",
            () => {

                const activeSeason =
                    seasons.find(
                        season =>
                            season.active
                    );


                loadScoreManagement(
                    activeSeason
                        ?.current_gameweek ??
                    1
                );

            }
        );

        document
            .getElementById(
                "historicalScoresButton"
            )
            .addEventListener(
                "click",
                loadHistoricalScoreImport
            );

}

async function copyPlayersToSeason(
    destinationSeasonId
) {

    console.log(
        "Copying players to season:",
        destinationSeasonId
    );


    try {

        // ==========================================
        // GET ACTIVE / SOURCE SEASON
        // ==========================================

        const {
            data: sourceSeason,
            error: sourceSeasonError
        } =
            await supabaseClient
                .from("seasons")
                .select(
                    "id, name"
                )
                .eq(
                    "active",
                    true
                )
                .single();


        if (sourceSeasonError)
            throw sourceSeasonError;


        // ==========================================
        // DON'T COPY TO SAME SEASON
        // ==========================================

        if (
            sourceSeason.id ===
            destinationSeasonId
        ) {

            alert(
                "The destination season is already active."
            );

            return;

        }


        // ==========================================
        // GET SOURCE PLAYERS
        // ==========================================

        const {
            data: sourcePlayers,
            error: sourcePlayersError
        } =
            await supabaseClient
                .from("season_players")
                .select(`
                    player_id,
                    fpl_entry_id,
                    fpl_team_name,
                    active,
                    display_order
                `)
                .eq(
                    "season_id",
                    sourceSeason.id
                )
                .order(
                    "display_order"
                );


        if (sourcePlayersError)
            throw sourcePlayersError;


        if (
            !sourcePlayers ||
            sourcePlayers.length === 0
        ) {

            alert(
                "The active season has no players to copy."
            );

            return;

        }


        // ==========================================
        // CHECK DESTINATION
        // ==========================================

        const {
            data: existingPlayers,
            error: existingError
        } =
            await supabaseClient
                .from("season_players")
                .select(
                    "id"
                )
                .eq(
                    "season_id",
                    destinationSeasonId
                );


        if (existingError)
            throw existingError;


        if (
            existingPlayers &&
            existingPlayers.length > 0
        ) {

            alert(
                "The destination season already has players."
            );

            return;

        }


        // ==========================================
        // CONFIRM
        // ==========================================

        const confirmed =
            confirm(
                `Copy ${sourcePlayers.length} players from ${sourceSeason.name}?`
            );


        if (!confirmed)
            return;


        // ==========================================
        // BUILD NEW RECORDS
        // ==========================================

        const records =
            sourcePlayers.map(
                player => ({

                    season_id:
                        destinationSeasonId,

                    player_id:
                        player.player_id,

                    fpl_entry_id:
                        player.fpl_entry_id,

                    fpl_team_name:
                        player.fpl_team_name,

                    active:
                        player.active,

                    display_order:
                        player.display_order

                })
            );


        // ==========================================
        // INSERT
        // ==========================================

        const {
            error: insertError
        } =
            await supabaseClient
                .from("season_players")
                .insert(
                    records
                );


        if (insertError)
            throw insertError;


        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            "Players copied successfully:",
            records
        );


        alert(
            `${records.length} players copied successfully.`
        );

    }
    catch(error) {

        console.error(
            "Copy players error:",
            error
        );


        alert(
            "Unable to copy players."
        );

    }

}

async function loadSeasonPlayers(
    seasonId
) {

    console.log(
        "Loading season players:",
        seasonId
    );


    adminContent.innerHTML = `
        <p>Loading players...</p>
    `;


    try {

        // ==========================================
        // GET SEASON
        // ==========================================

        const {
            data: season,
            error: seasonError
        } =
            await supabaseClient
                .from("seasons")
                .select("*")
                .eq(
                    "id",
                    seasonId
                )
                .single();


        if (seasonError)
            throw seasonError;


        // ==========================================
        // GET PLAYERS
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
                    fpl_team_name,
                    active,
                    display_order,
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
                    "display_order"
                );


        if (playersError)
            throw playersError;


        renderSeasonPlayers(
            season,
            seasonPlayers
        );

    }
    catch(error) {

        console.error(
            "Load season players error:",
            error
        );


        adminContent.innerHTML = `
            <div class="error">
                Unable to load season players.
            </div>
        `;

    }

}

function renderSeasonPlayers(
    season,
    seasonPlayers
) {

    let rows = "";


    seasonPlayers.forEach(
        player => {

            rows += `

                <tr>

                    <td>
                        ${player.players?.name ?? "Unknown"}
                    </td>


                    <td>

                        <input
                            type="number"
                            class="season-fpl-entry"
                            data-id="${player.id}"
                            value="${player.fpl_entry_id ?? ""}"
                        >

                    </td>


                    <td>

                        <input
                            type="text"
                            class="season-fpl-team"
                            data-id="${player.id}"
                            value="${player.fpl_team_name ?? ""}"
                        >

                    </td>


                    <td>

                        <input
                            type="number"
                            class="season-display-order"
                            data-id="${player.id}"
                            value="${player.display_order ?? ""}"
                        >

                    </td>


                    <td>

                        <label>

                            <input
                                type="checkbox"
                                class="season-player-active"
                                data-id="${player.id}"
                                ${
                                    player.active
                                        ? "checked"
                                        : ""
                                }
                            >

                            Active

                        </label>

                    </td>


                    <td>

                        <button
                            class="save-season-player"
                            data-id="${player.id}"
                        >
                            Save
                        </button>

                    </td>

                </tr>

            `;

        }
    );


    adminContent.innerHTML = `

        <div class="admin-navigation">

            <button
                id="seasonsBackButton"
            >
                Seasons
            </button>

        </div>


        <section class="admin-panel">

            <div class="admin-panel-header">

                <h2>
                    ${season.name} — Players
                </h2>

            </div>


            <table>

                <thead>

                    <tr>

                        <th>Player</th>
                        <th>FPL Entry ID</th>
                        <th>FPL Team Name</th>
                        <th>Order</th>
                        <th>Active</th>
                        <th></th>

                    </tr>

                </thead>


                <tbody>

                    ${rows}

                </tbody>

            </table>

        </section>

    `;


    // ==========================================
    // BACK
    // ==========================================

    document
        .getElementById(
            "seasonsBackButton"
        )
        .addEventListener(
            "click",
            loadSeasonManagement
        );


    // ==========================================
    // SAVE
    // ==========================================

    document
        .querySelectorAll(
            ".save-season-player"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        saveSeasonPlayer(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );

}

async function saveSeasonPlayer(
    seasonPlayerId
) {

    console.log(
        "Saving season player:",
        seasonPlayerId
    );


    try {

        const fplEntry =
            document.querySelector(
                `.season-fpl-entry[data-id="${seasonPlayerId}"]`
            );


        const fplTeam =
            document.querySelector(
                `.season-fpl-team[data-id="${seasonPlayerId}"]`
            );


        const displayOrder =
            document.querySelector(
                `.season-display-order[data-id="${seasonPlayerId}"]`
            );


        const active =
            document.querySelector(
                `.season-player-active[data-id="${seasonPlayerId}"]`
            );


        const fplEntryId =
            fplEntry.value
                ? Number(
                    fplEntry.value
                )
                : null;


        const order =
            displayOrder.value
                ? Number(
                    displayOrder.value
                )
                : null;


        const {
            error
        } =
            await supabaseClient
                .from("season_players")
                .update({

                    fpl_entry_id:
                        fplEntryId,

                    fpl_team_name:
                        fplTeam.value.trim(),

                    display_order:
                        order,

                    active:
                        active.checked

                })
                .eq(
                    "id",
                    seasonPlayerId
                );


        if (error)
            throw error;


        console.log(
            "Season player saved."
        );


        alert(
            "Player saved."
        );

    }
    catch(error) {

        console.error(
            "Save season player error:",
            error
        );


        alert(
            "Unable to save player."
        );

    }

}

async function createSeason() {

    console.log(
        "Admin.js: createSeason Called"
    );


    const message =
        document.getElementById(
            "seasonCreateMessage"
        );


    const seasonCode =
        document
            .getElementById(
                "seasonCode"
            )
            .value
            .trim();


    const seasonName =
        document
            .getElementById(
                "seasonName"
            )
            .value
            .trim();


    const totalGameweeks =
        Number(
            document
                .getElementById(
                    "totalGameweeks"
                )
                .value
        );


    const currentGameweek =
        Number(
            document
                .getElementById(
                    "currentGameweek"
                )
                .value
        );


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!seasonCode) {

        message.textContent =
            "Please enter a season code.";

        return;

    }


    if (!seasonName) {

        message.textContent =
            "Please enter a season name.";

        return;

    }


    if (
        !Number.isInteger(
            totalGameweeks
        ) ||
        totalGameweeks < 1
    ) {

        message.textContent =
            "Please enter a valid number of gameweeks.";

        return;

    }


    if (
        !Number.isInteger(
            currentGameweek
        ) ||
        currentGameweek < 1 ||
        currentGameweek >
            totalGameweeks
    ) {

        message.textContent =
            "Starting gameweek must be between 1 and the total gameweeks.";

        return;

    }


    message.textContent =
        "Checking season...";


    try {

        // ==========================================
        // CHECK FOR DUPLICATE CODE
        // ==========================================

        const {
            data: existing,
            error: checkError
        } =
            await supabaseClient
                .from("seasons")
                .select("id")
                .eq(
                    "season_code",
                    seasonCode
                )
                .maybeSingle();


        if (checkError)
            throw checkError;


        if (existing) {

            message.textContent =
                "A season with this season code already exists.";

            return;

        }


        // ==========================================
        // CREATE SEASON
        // ==========================================

        message.textContent =
            "Creating season...";


        const {
            data,
            error
        } =
            await supabaseClient
                .from("seasons")
                .insert({

                    season_code:
                        seasonCode,

                    name:
                        seasonName,

                    total_gameweeks:
                        totalGameweeks,

                    current_gameweek:
                        currentGameweek,

                    active:
                        false

                })
                .select()
                .single();


        if (error)
            throw error;


        console.log(
            "Season created:",
            data
        );


        message.textContent =
            `Season ${seasonName} created successfully.`;


        // ==========================================
        // REFRESH SCREEN
        // ==========================================

        setTimeout(
            () => {

                loadSeasonManagement();

            },
            //800
            3000
        );

    }
    catch(error) {

        console.error(
            "Create season error:",
            error
        );


        message.textContent =
            "Unable to create season.";

    }

}

async function loadHistoricalScoreImport() {

    console.log(
        "Admin.js: loadHistoricalScoreImport Called"
    );


    adminContent.innerHTML = `
        <p>Loading historical score import...</p>
    `;


    try {

        // ==========================================
        // LOAD SEASONS
        // ==========================================

        const {
            data: seasons,
            error: seasonsError
        } =
            await supabaseClient
                .from("seasons")
                .select(`
                    id,
                    season_code,
                    name,
                    active
                `)
                .order(
                    "season_code",
                    {
                        ascending: false
                    }
                );


        if (seasonsError)
            throw seasonsError;


        // ==========================================
        // BUILD SEASON OPTIONS
        // ==========================================

        let seasonOptions = `
            <option value="">
                Select a season
            </option>
        `;


        seasons.forEach(
            season => {

                seasonOptions += `

                    <option
                        value="${season.id}"
                    >
                        ${season.name}
                        ${
                            season.active
                                ? " (Current)"
                                : ""
                        }
                    </option>

                `;

            }
        );


        // ==========================================
        // RENDER PAGE
        // ==========================================

        adminContent.innerHTML = `

            <div class="admin-navigation">

                <button
                    id="historicalImportBackButton"
                >
                    Seasons
                </button>

            </div>


            <section class="admin-panel">

                <div class="admin-panel-header">

                    <h2>
                        Historical Period Score Import
                    </h2>

                </div>


                <p>
                    Import historical period totals from an Excel file.
                    The scores will be previewed before anything is
                    written to the database.
                </p>


                <div class="form-group">

                    <label
                        for="historicalSeason"
                    >
                        Season
                    </label>

                    <select
                        id="historicalSeason"
                    >

                        ${seasonOptions}

                    </select>

                </div>


                <div class="form-group">

                    <label
                        for="historicalExcelFile"
                    >
                        Excel File
                    </label>

                    <input
                        type="file"
                        id="historicalExcelFile"
                        accept=".xlsx,.xls"
                    >

                </div>


                <button
                    id="previewHistoricalScoresButton"
                    type="button"
                >
                    Preview Scores
                </button>


                <div
                    id="historicalImportMessage"
                    class="historical-import-message"
                ></div>


                <div
                    id="historicalImportPreview"
                ></div>

            </section>

        `;


        // ==========================================
        // BACK BUTTON
        // ==========================================

        document
            .getElementById(
                "historicalImportBackButton"
            )
            .addEventListener(
                "click",
                loadSeasonManagement
            );


        // ==========================================
        // PREVIEW BUTTON
        // ==========================================

        document
            .getElementById(
                "previewHistoricalScoresButton"
            )
            .addEventListener(
                "click",
                previewHistoricalScores
            );

    }
    catch(error) {

        console.error(
            "Historical score import error:",
            error
        );


        adminContent.innerHTML = `

            <div class="error">

                Unable to load historical
                score import.

            </div>

        `;

    }

}

async function previewHistoricalScores() {

    console.log(
        "Admin.js: previewHistoricalScores Called"
    );


    const seasonId =
        Number(
            document
                .getElementById(
                    "historicalSeason"
                )
                .value
        );


    const fileInput =
        document
            .getElementById(
                "historicalExcelFile"
            );


    const message =
        document
            .getElementById(
                "historicalImportMessage"
            );


    const preview =
        document
            .getElementById(
                "historicalImportPreview"
            );


    message.textContent = "";
    preview.innerHTML = "";


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!seasonId) {

        message.textContent =
            "Please select a season.";

        return;

    }


    if (
        !fileInput.files ||
        fileInput.files.length === 0
    ) {

        message.textContent =
            "Please select an Excel file.";

        return;

    }


    const file =
        fileInput.files[0];


    try {

        message.textContent =
            "Reading Excel file...";


        // ==========================================
        // READ FILE
        // ==========================================

        const buffer =
            await file.arrayBuffer();


        const workbook =
            XLSX.read(
                buffer,
                {
                    type: "array"
                }
            );


        console.log(
            "Workbook sheets:",
            workbook.SheetNames
        );


        // ==========================================
        // FIRST WORKSHEET
        // ==========================================

        const sheetName =
            workbook.SheetNames[0];


        const worksheet =
            workbook.Sheets[
                sheetName
            ];


        // ==========================================
        // CONVERT TO ARRAY
        // ==========================================

        const rows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    header: 1,
                    defval: null
                }
            );


        console.log(
            "Historical Excel rows:",
            rows
        );


        if (
            !rows ||
            rows.length < 3
        ) {

            throw new Error(
                "Excel file does not contain enough data."
            );

        }


        // ==========================================
        // PLAYER NAMES
        // ==========================================
        //
        // Your historical workbook has the
        // player names on row 2.
        //
        // Array index 1 = Excel row 2.
        //
        // Column A is not a player.
        // ==========================================

        const playerNames =
            rows[1]
                .slice(1)
                .map(
                    name =>
                        name !== null
                            ? String(name).trim()
                            : ""
                );


        console.log(
            "Excel players:",
            playerNames
        );


        // ==========================================
        // READ PERIOD ROWS
        // ==========================================

        const periods = [];


        for (
            let rowIndex = 2;
            rowIndex < rows.length;
            rowIndex++
        ) {

            const row =
                rows[rowIndex];


            if (!row)
                continue;


            const endGameweek =
                Number(
                    row[0]
                );


            // Ignore anything that isn't one of
            // our period end gameweeks.

            if (
                !Number.isInteger(
                    endGameweek
                )
            ) {

                continue;

            }


            // ======================================
            // DETERMINE PERIOD
            // ======================================

            let periodNumber;


            if (
                endGameweek === 38
            ) {

                periodNumber = 10;

            }
            else {

                periodNumber =
                    endGameweek / 4;

            }


            if (
                !Number.isInteger(
                    periodNumber
                ) ||
                periodNumber < 1 ||
                periodNumber > 10
            ) {

                continue;

            }


            // ======================================
            // PLAYER SCORES
            // ======================================

            const scores =
                playerNames.map(
                    (
                        playerName,
                        playerIndex
                    ) => {

                        const value =
                            row[
                                playerIndex + 1
                            ];


                        return {

                            playerName:
                                playerName,

                            periodTotal:
                                value === null
                                    ? null
                                    : Number(value)

                        };

                    }
                );


            periods.push({

                period:
                    periodNumber,

                endGameweek:
                    endGameweek,

                scores:
                    scores

            });

        }


        periods.sort(
            (
                a,
                b
            ) =>
                a.period -
                b.period
        );


        console.log(
            "Parsed historical periods:",
            periods
        );


        // ==========================================
        // DISPLAY PREVIEW
        // ==========================================

        // ==========================================
        // LOAD DATABASE PLAYERS
        // ==========================================

        const {
            data: databasePlayers,
            error: playersError
        } =
            await supabaseClient
                .from("players")
                .select(`
                    id,
                    name
                `)
                .order(
                    "name"
                );


        if (playersError)
            throw playersError;


        console.log(
            "Database players:",
            databasePlayers
        );

        historicalImportData = {

            seasonId:
                seasonId,

            periods:
                periods

        };


        renderHistoricalScorePreview(
            periods,
            databasePlayers
        );


        message.textContent =
            `${periods.length} periods read from ${file.name}.`;

    }
    catch(error) {

        console.error(
            "Historical Excel preview error:",
            error
        );


        message.textContent =
            "Unable to read the Excel file.";

    }

}

function renderHistoricalScorePreview(
    periods,
    databasePlayers
) {

    const preview =
        document.getElementById(
            "historicalImportPreview"
        );


    if (
        !periods ||
        periods.length === 0
    ) {

        preview.innerHTML = `
            <p>
                No period scores found.
            </p>
        `;

        return;

    }


    // ==========================================
    // PLAYER HEADINGS
    // ==========================================

    const playerNames =
        periods[0]
            .scores
            .map(
                score =>
                    score.playerName
            );

    // ==========================================
    // BUILD PLAYER MAPPING
    // ==========================================

    let playerMapping = "";


    playerNames.forEach(
        excelPlayerName => {

            // Try exact name match first

            const matchingPlayer =
                databasePlayers.find(
                    player =>

                        player.name
                            .trim()
                            .toLowerCase() ===

                        excelPlayerName
                            .trim()
                            .toLowerCase()
                );

        let options = `

            <option value="">
                Select player
            </option>

            <option value="ignore">
                Ignore
            </option>

        `;


            databasePlayers.forEach(
                player => {

                    options += `

                        <option
                            value="${player.id}"

                            ${
                                matchingPlayer &&
                                matchingPlayer.id ===
                                    player.id

                                    ? "selected"
                                    : ""
                            }
                        >
                            ${player.name}
                        </option>

                    `;

                }
            );


            playerMapping += `

                <tr>

                    <td>
                        ${excelPlayerName}
                    </td>

                    <td>

                        <select
                            class="historical-player-map"
                            data-excel-player="${excelPlayerName}"
                        >

                            ${options}

                        </select>

                    </td>

                </tr>

            `;

        }
    );


    let header = `

        <tr>

            <th>
                Period
            </th>

            <th>
                End GW
            </th>

    `;


    playerNames.forEach(
        playerName => {

            header += `

                <th>
                    ${playerName}
                </th>

            `;

        }
    );


    header += `
        </tr>
    `;


    // ==========================================
    // PERIOD ROWS
    // ==========================================

    let rows = "";


    periods.forEach(
        period => {

            rows += `

                <tr>

                    <td>
                        P${period.period}
                    </td>

                    <td>
                        GW${period.endGameweek}
                    </td>

            `;


            period.scores.forEach(
                score => {

                    rows += `

                        <td>
                            ${
                                score.periodTotal ??
                                "—"
                            }
                        </td>

                    `;

                }
            );


            rows += `
                </tr>
            `;

        }
    );


    // ==========================================
    // OUTPUT
    // ==========================================

        preview.innerHTML = `

            <h3>
                Player Mapping
            </h3>


            <p>
                Match each player from the Excel file
                to the correct database player.
            </p>


            <table class="historical-player-mapping">

                <thead>

                    <tr>

                        <th>
                            Excel Player
                        </th>

                        <th>
                            Database Player
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${playerMapping}

                </tbody>

            </table>


            <h3>
                Score Preview
            </h3>


            <div
                class="historical-preview-table"
            >

                <table>

                    <thead>
                        ${header}
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>

                </table>


                <div class="historical-import-actions">
                    <button
                        id="importHistoricalScoresButton"
                        type="button"
                    >
                        Import Scores
                    </button>

                </div>

            </div>

        `;

        document
    .getElementById(
        "importHistoricalScoresButton"
    )
    .addEventListener(
        "click",
        importHistoricalScores
    );

}

async function importHistoricalScores() {

    console.log("Admin.js: importHistoricalScores Called");


    const message =
        document.getElementById(
            "historicalImportMessage"
        );


    if (!historicalImportData) {
        message.textContent =
            "No historical score data is available.";
        return;
    }

    const {
        seasonId,
        periods
    } = historicalImportData;

    try {

        // ==========================================
        // BUILD PLAYER MAPPING
        // ==========================================

        const mappings = {};


        const mappingSelectors =
            document.querySelectorAll(
                ".historical-player-map"
            );


        let mappingError = false;


        mappingSelectors.forEach(
            selector => {

                const excelPlayer =
                    selector.dataset.excelPlayer;


                const value =
                    selector.value;


                // Player hasn't been mapped or ignored

                if (!value) {

                    mappingError = true;

                    return;

                }


                // Explicitly ignored

                if (value === "ignore") {

                    mappings[
                        excelPlayer
                    ] = null;

                    return;

                }


                mappings[
                    excelPlayer
                ] = Number(value);

            }
        );


        if (mappingError) {

            message.textContent =
                "Please map or ignore every Excel player.";

            return;

        }


        // ==========================================
        // CHECK FOR DUPLICATE PLAYER MAPPINGS
        // ==========================================

        const mappedPlayerIds =
            Object.values(
                mappings
            )
                .filter(
                    playerId =>
                        playerId !== null
                );


        const uniquePlayerIds =
            new Set(
                mappedPlayerIds
            );


        if (
            uniquePlayerIds.size !==
            mappedPlayerIds.length
        ) {

            message.textContent =
                "The same database player has been mapped more than once.";

            return;

        }


        // ==========================================
        // BUILD DATABASE RECORDS
        // ==========================================

        const records = [];


        periods.forEach(
            period => {

                period.scores.forEach(
                    score => {

                        const playerId =
                            mappings[
                                score.playerName
                            ];


                        // Ignore deliberately excluded players

                        if (
                            playerId === null ||
                            playerId === undefined
                        ) {

                            return;

                        }


                        // Ignore blank Excel cells

                        if (
                            score.periodTotal === null ||
                            !Number.isFinite(
                                score.periodTotal
                            )
                        ) {

                            return;

                        }


                        records.push({

                            season_id:
                                seasonId,

                            period:
                                period.period,

                            player_id:
                                playerId,

                            period_total:
                                score.periodTotal

                        });

                    }
                );

            }
        );


        if (
            records.length === 0
        ) {

            message.textContent =
                "There are no scores to import.";

            return;

        }


        console.log(
            "Historical records ready for import:",
            records
        );


        // ==========================================
        // CONFIRM
        // ==========================================

        const confirmed =
            confirm(
                `Import ${records.length} historical period scores?`
            );


        if (!confirmed)
            return;


        message.textContent =
            `Importing ${records.length} scores...`;


        // ==========================================
        // UPSERT
        // ==========================================

        const {
            error
        } =
            await supabaseClient
                .from("period_scores")
                .upsert(
                    records,
                    {
                        onConflict:
                            "season_id,period,player_id"
                    }
                );


        if (error)
            throw error;


        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            "Historical scores imported successfully."
        );


        message.textContent =
            `${records.length} historical period scores imported successfully.`;

    }
    catch(error) {

        console.error(
            "Historical score import failed:",
            error
        );


        message.textContent =
            "Unable to import historical scores.";

    }

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

async function activateSeason(
    seasonId,
    seasonName
) {

    console.log(
        "Admin.js: activateSeason Called",
        seasonId,
        seasonName
    );


    try {

        // ==========================================
        // GET TARGET SEASON
        // ==========================================

        const {
            data: season,
            error: seasonError
        } =
            await supabaseClient
                .from("seasons")
                .select(`
                    id,
                    name,
                    total_gameweeks,
                    current_gameweek,
                    active
                `)
                .eq(
                    "id",
                    seasonId
                )
                .single();


        if (seasonError)
            throw seasonError;


        if (season.active) {

            alert(
                `${season.name} is already active.`
            );

            return;

        }


        // ==========================================
        // COUNT ACTIVE PLAYERS
        // ==========================================

        const {
            count: playerCount,
            error: playerError
        } =
            await supabaseClient
                .from("season_players")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "season_id",
                    seasonId
                )
                .eq(
                    "active",
                    true
                );


        if (playerError)
            throw playerError;


        // ==========================================
        // VALIDATE PLAYERS
        // ==========================================

        if (
            !playerCount ||
            playerCount < 1
        ) {

            alert(
                `${season.name} cannot be activated.\n\n` +
                `No active players have been assigned to this season.`
            );

            return;

        }

        // ==========================================
        // LOAD COMPETITION PERIODS
        // ==========================================

        const {
            data: periods,
            error: periodError
        } =
            await supabaseClient
                .from("competition_periods")
                .select(`
                    period_number,
                    start_gameweek,
                    end_gameweek
                `)
                .eq(
                    "season_id",
                    seasonId
                )
                .order(
                    "period_number"
                );


        if (periodError)
            throw periodError;


        // ==========================================
        // VALIDATE PERIOD COUNT
        // ==========================================

        if (
            !periods ||
            periods.length !== 10
        ) {

            alert(
                `${season.name} cannot be activated.\n\n` +
                `Expected 10 competition periods, but found ${periods?.length ?? 0}.`
            );

            return;

        }

        // ==========================================
        // VALIDATE PERIOD RANGES
        // ==========================================

        const expectedPeriods = [

            { period: 1,  start: 1,  end: 4  },
            { period: 2,  start: 5,  end: 8  },
            { period: 3,  start: 9,  end: 12 },
            { period: 4,  start: 13, end: 16 },
            { period: 5,  start: 17, end: 20 },
            { period: 6,  start: 21, end: 24 },
            { period: 7,  start: 25, end: 28 },
            { period: 8,  start: 29, end: 32 },
            { period: 9,  start: 33, end: 36 },
            { period: 10, start: 37, end: 38 }

        ];


        const periodsValid =
            expectedPeriods.every(
                expected => {

                    const actual =
                        periods.find(
                            period =>
                                period.period_number ===
                                expected.period
                        );


                    return (
                        actual &&
                        actual.start_gameweek ===
                            expected.start &&
                        actual.end_gameweek ===
                            expected.end
                    );

                }
            );


        if (!periodsValid) {

            alert(
                `${season.name} cannot be activated.\n\n` +
                `The competition periods are not configured correctly.`
            );

            return;

        }


        // ==========================================
        // CONFIRM ACTIVATION
        // ==========================================

        const confirmed =
            confirm(
                `Activate ${season.name}?\n\n` +
                `✓ Active players: ${playerCount}\n` +
                `✓ Competition periods: 10\n` +
                `✓ Gameweeks: ${season.total_gameweeks}\n\n` +
                `The current season will be deactivated.`
            );


        if (!confirmed)
            return;

        


        // ==========================================
        // ACTIVATE USING DATABASE RPC
        // ==========================================

        const {
            error
        } =
            await supabaseClient
                .rpc(
                    "activate_season",
                    {
                        target_season_id:
                            seasonId
                    }
                );


        if (error)
            throw error;


        alert(
            `${season.name} is now the active season.`
        );


        await loadSeasonManagement();

    }
    catch(error) {

        console.error(
            "Activate season error:",
            error
        );


        alert(
            "Unable to activate season."
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

// ==========================================
// START
// ==========================================

checkLogin();