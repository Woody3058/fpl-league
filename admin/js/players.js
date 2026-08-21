
let playerPageSeason = null;

let playerPagePlayers = [];


// ==========================================
// STARTUP
// ==========================================

async function startupPlayers() {

    console.log(
        "players.js: startupPlayers Called"
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
            "players"
        );


        // ======================================
        // DETERMINE SEASON
        // ======================================

        const params =
            new URLSearchParams(
                window.location.search
            );


        const requestedSeasonId =
            Number(
                params.get(
                    "season"
                )
            );


        if (requestedSeasonId) {

            playerPageSeason =
                await getAdminSeason(
                    requestedSeasonId
                );

        }
        else {

            playerPageSeason =
                await getAdminActiveSeason();

        }

        document
            .getElementById(
                "playerSeasonName"
            )
            .textContent =
                playerPageSeason.name;


        // ======================================
        // LOAD PLAYERS
        // ======================================

        await loadPlayers();


        console.log(
            "Players page started successfully."
        );

    }
    catch(error) {

        console.error(
            "Players page startup failed:",
            error
        );

    }

    document
        .getElementById(
            "addPlayerButton"
        )
        .addEventListener(
            "click",
            addPlayer
        );

        const addSection =
            document.getElementById(
                "playerAddSection"
            );


        const addButton =
            document.getElementById(
                "showAddPlayerButton"
            );


        addSection.hidden =
            true;


        addButton.textContent =
            "+ Add Player";


        addButton.addEventListener(
            "click",
            toggleAddPlayerForm
        );

}


// ==========================================
// LOAD PLAYERS
// ==========================================

async function loadPlayers() {

    console.log(
        "players.js: loadPlayers Called"
    );


    playerPagePlayers =
        await getAdminAllSeasonPlayers(
            playerPageSeason.id
        );


    renderPlayers(
        playerPagePlayers
    );

}


// ==========================================
// RENDER PLAYERS
// ==========================================

function renderPlayers(
    seasonPlayers
) {

    const tbody =
        document.querySelector(
            "#playerManagementTable tbody"
        );


    tbody.innerHTML = "";


    seasonPlayers.forEach(
        player => {

            const row =
                document.createElement(
                    "tr"
                );

                if (!player.active) {

                    row.classList.add(
                        "inactive-player-row"
                    );

                }


            row.innerHTML = `

                <td>

                    <strong>
                        ${player.players?.name ?? "Unknown"}
                    </strong>

                </td>


                <td>

                    <input
                        type="number"
                        class="player-fpl-id"
                        data-season-player-id="${player.id}"
                        value="${player.fpl_entry_id ?? ""}"
                    >

                </td>


                <td>

                    <input
                        type="text"
                        class="player-team-name"
                        data-season-player-id="${player.id}"
                        value="${player.fpl_team_name ?? ""}"
                    >

                </td>


                <td>

                <td class="player-active-cell">

                    <label>

                        <input
                            type="checkbox"
                            class="player-active"
                            data-season-player-id="${player.id}"
                            ${
                                player.active
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            ${
                                player.active
                                    ? "Active"
                                    : "Inactive"
                            }
                        </span>

                    </label>

                </td>


                <td>

                    <button
                        class="save-player-button"
                        data-season-player-id="${player.id}"
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

    document
        .querySelectorAll(
            ".save-player-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        savePlayer(
                            Number(
                                button.dataset
                                    .seasonPlayerId
                            )
                        );

                    }
                );

            }
        );

}

async function savePlayer(
    seasonPlayerId
) {

    console.log(
        "players.js: savePlayer Called",
        seasonPlayerId
    );


    const fplIdInput =
        document.querySelector(
            `.player-fpl-id[data-season-player-id="${seasonPlayerId}"]`
        );


    const teamNameInput =
        document.querySelector(
            `.player-team-name[data-season-player-id="${seasonPlayerId}"]`
        );


    const activeInput =
        document.querySelector(
            `.player-active[data-season-player-id="${seasonPlayerId}"]`
        );


    if (
        !fplIdInput ||
        !teamNameInput ||
        !activeInput
    ) {

        console.error(
            "Player inputs not found:",
            seasonPlayerId
        );

        return;

    }


    const fplEntryId =
        fplIdInput.value
            ? Number(
                fplIdInput.value
            )
            : null;


    const fplTeamName =
        teamNameInput.value.trim();


    const active =
        activeInput.checked;


    try {

        await saveAdminSeasonPlayer(

            seasonPlayerId,

            fplEntryId,

            fplTeamName || null,

            active

        );


        console.log(
            "Player saved successfully."
        );


        await loadPlayers();

    }
    catch(error) {

        console.error(
            "Unable to save player:",
            error
        );


        alert(
            "Unable to save player."
        );

    }

}

async function addPlayer() {

    console.log(
        "players.js: addPlayer Called"
    );


    const nameInput =
        document.getElementById(
            "newPlayerName"
        );


    const fplIdInput =
        document.getElementById(
            "newPlayerFplId"
        );


    const teamNameInput =
        document.getElementById(
            "newPlayerTeamName"
        );


    const message =
        document.getElementById(
            "playerMessage"
        );


    const name =
        nameInput.value.trim();


    const fplEntryId =
        fplIdInput.value
            ? Number(
                fplIdInput.value
            )
            : null;


    const fplTeamName =
        teamNameInput.value.trim();


    message.textContent =
        "";


    if (!name) {

        message.textContent =
            "Please enter a player name.";

        return;

    }


    try {

        await addAdminPlayerToSeason(

            playerPageSeason.id,

            name,

            fplEntryId,

            fplTeamName || null

        );


        message.textContent =
            `${name} added successfully.`;


        nameInput.value =
            "";

        fplIdInput.value =
            "";

        teamNameInput.value =
            "";


        await loadPlayers();

        const addSection =
            document.getElementById(
                "playerAddSection"
            );


        const addButton =
            document.getElementById(
                "showAddPlayerButton"
            );


        addSection.hidden =
            true;


        addButton.textContent =
            "+ Add Player";

    }
    catch(error) {

        console.error(
            "Unable to add player:",
            error
        );


        message.textContent =
            error.message ??
            "Unable to add player.";

    }

}

function toggleAddPlayerForm() {

    const section =
        document.getElementById(
            "playerAddSection"
        );


    const button =
        document.getElementById(
            "showAddPlayerButton"
        );


    const opening =
        section.hidden;


    section.hidden =
        !section.hidden;


    button.textContent =
        opening
            ? "Cancel"
            : "+ Add Player";


    if (opening) {

        const firstInput =
            section.querySelector(
                "input"
            );


        firstInput?.focus();

    }

}


// ==========================================
// START
// ==========================================

startupPlayers();