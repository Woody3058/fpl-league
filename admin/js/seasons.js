
let seasonPageSeasons = [];


// ==========================================
// STARTUP
// ==========================================

async function startupSeasons() {

    console.log(
        "seasons.js: startupSeasons Called"
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
            "seasons"
        );


        await loadSeasons();

    document
        .getElementById(
            "createSeasonButton"
        )
        .addEventListener(
            "click",
            createSeason
        );


        console.log(
            "Seasons page started successfully."
        );

    }
    catch(error) {

        console.error(
            "Seasons page startup failed:",
            error
        );

    }

}


// ==========================================
// LOAD SEASONS
// ==========================================

async function loadSeasons() {

    console.log(
        "seasons.js: loadSeasons Called"
    );


    seasonPageSeasons =
        await getAdminSeasons();


    renderSeasons(
        seasonPageSeasons
    );

}


// ==========================================
// RENDER SEASONS
// ==========================================

function renderSeasons(
    seasons
) {

    const tbody =
        document.querySelector(
            "#seasonManagementTable tbody"
        );


    tbody.innerHTML = "";


    const activeSeason =
        seasons.find(
            season =>
                season.active
        );


    seasons.forEach(
        season => {

            const isFutureSeason =
                activeSeason &&
                season.id >
                activeSeason.id;


            const row =
                document.createElement(
                    "tr"
                );

            if (season.active) {

                row.classList.add(
                    "active-season-row"
                );

            }


            row.innerHTML = `

                <td>
                    ${season.name}
                </td>

                <td>
                    ${season.seasonCode}
                </td>

                <td>
                    ${season.totalGameweeks}
                </td>

                <td>
                    ${season.currentGameweek}
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
                                    class="season-action-button copy-players-button"
                                    data-season-id="${season.id}"
                                >
                                    Copy Players
                                </button>

                                <button
                                    class="season-action-button manage-players-button"
                                    data-season-id="${season.id}"
                                >
                                    Manage Players
                                </button>

                                ${
                                    isFutureSeason
                                        ? `
                                            <button
                                                class="season-action-button setup-periods-button"
                                                data-season-id="${season.id}"
                                                data-season-name="${season.name}"
                                            >
                                                Setup Periods
                                            </button>

                                            <button
                                                class="season-action-button activate-season-button"
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

            `;


            tbody.appendChild(
                row
            );

        }
    );

    document
        .querySelectorAll(
            ".copy-players-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        copyPlayers(
                            Number(
                                button.dataset.seasonId
                            )
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


                            window.location.href =
                                `players.html?season=${seasonId}`;

                        }
                    );

                }
            );

        document
            .querySelectorAll(
                ".setup-periods-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            setupPeriods(

                                Number(
                                    button.dataset.seasonId
                                ),

                                button.dataset.seasonName

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

}

async function createSeason() {

    console.log(
        "seasons.js: createSeason Called"
    );


    const seasonCodeInput =
        document.getElementById(
            "seasonCode"
        );


    const seasonNameInput =
        document.getElementById(
            "seasonName"
        );


    const totalGameweeksInput =
        document.getElementById(
            "totalGameweeks"
        );


    const currentGameweekInput =
        document.getElementById(
            "currentGameweek"
        );


    const message =
        document.getElementById(
            "seasonCreateMessage"
        );


    // ==========================================
    // READ VALUES
    // ==========================================

    const seasonCode =
        seasonCodeInput.value.trim();


    const seasonName =
        seasonNameInput.value.trim();


    const totalGameweeks =
        Number(
            totalGameweeksInput.value
        );


    const currentGameweek =
        Number(
            currentGameweekInput.value
        );


    message.textContent =
        "";


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
        currentGameweek < 0 ||
        currentGameweek >
            totalGameweeks
    ) {

        message.textContent =
            "Starting gameweek is invalid.";

        return;

    }


    // ==========================================
    // CREATE
    // ==========================================

    try {

        await createAdminSeason(

            seasonCode,

            seasonName,

            totalGameweeks,

            currentGameweek

        );


        message.textContent =
            `${seasonName} created successfully.`;


        // ======================================
        // CLEAR FORM
        // ======================================

        seasonCodeInput.value =
            "";

        seasonNameInput.value =
            "";

        totalGameweeksInput.value =
            "38";

        currentGameweekInput.value =
            "0";


        // ======================================
        // REFRESH SEASON LIST
        // ======================================

        await loadSeasons();

    }
    catch(error) {

        console.error(
            "Unable to create season:",
            error
        );


        message.textContent =
            error.message ??
            "Unable to create season.";

    }

}

async function copyPlayers(
    seasonId
) {

    console.log(
        "seasons.js: copyPlayers Called",
        seasonId
    );


    const season =
        seasonPageSeasons.find(
            season =>
                season.id ===
                seasonId
        );


    if (!season)
        return;


    try {

        // ==========================================
        // CHECK TARGET SEASON FIRST
        // ==========================================

        const targetPlayers =
            await getAdminAllSeasonPlayers(
                seasonId
            );


        if (
            targetPlayers.length > 0
        ) {

            alert(
                `${season.name} already contains players.`
            );

            return;

        }


        // ==========================================
        // CONFIRM
        // ==========================================

        const confirmed =
            confirm(
                `Copy players to ${season.name}?\n\n` +
                `Active players from the current season will be copied.`
            );


        if (!confirmed)
            return;


        // ==========================================
        // COPY
        // ==========================================

        const count =
            await copyAdminSeasonPlayers(
                seasonId
            );


        alert(
            `${count} players copied to ${season.name}.`
        );


        await loadSeasons();

    }
    catch(error) {

        console.error(
            "Unable to copy players:",
            error
        );


        alert(
            error.message ??
            "Unable to copy players."
        );

    }

}

async function setupPeriods(
    seasonId,
    seasonName
) {

    console.log(
        "seasons.js: setupPeriods Called",
        seasonId
    );


    try {

        // ==========================================
        // CHECK FIRST
        // ==========================================

        const {
            data: existingPeriods,
            error
        } =
            await supabaseClient
                .from("competition_periods")
                .select("period_number")
                .eq(
                    "season_id",
                    seasonId
                );


        if (error)
            throw error;


        if (
            existingPeriods &&
            existingPeriods.length > 0
        ) {

            alert(
                `${seasonName} already has ` +
                `${existingPeriods.length} competition periods.`
            );

            return;

        }


        // ==========================================
        // CONFIRM
        // ==========================================

        const confirmed =
            confirm(
                `Setup competition periods for ${seasonName}?\n\n` +
                `P1-P8: 4 gameweeks each\n` +
                `P9: GW33-36\n` +
                `P10: GW37-38`
            );


        if (!confirmed)
            return;


        // ==========================================
        // CREATE
        // ==========================================

        const count =
            await setupAdminCompetitionPeriods(
                seasonId
            );


        alert(
            `${count} competition periods created for ${seasonName}.`
        );

    }
    catch(error) {

        console.error(
            "Unable to setup periods:",
            error
        );


        alert(
            error.message ??
            "Unable to setup competition periods."
        );

    }

}

async function activateSeason(
    seasonId,
    seasonName
) {

    console.log(
        "seasons.js: activateSeason Called",
        seasonId,
        seasonName
    );


    try {

        // ==========================================
        // GET TARGET SEASON
        // ==========================================

        const season =
            await getAdminSeasonById(
                seasonId
            );


        if (season.active) {

            alert(
                `${season.name} is already active.`
            );

            return;

        }


        // ==========================================
        // CHECK ACTIVE PLAYERS
        // ==========================================

        const playerCount =
            await getAdminActivePlayerCount(
                seasonId
            );


        if (
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

        const periods =
            await getAdminCompetitionPeriods(
                seasonId
            );


        // ==========================================
        // VALIDATE PERIOD COUNT
        // ==========================================

        if (
            periods.length !== 10
        ) {

            alert(
                `${season.name} cannot be activated.\n\n` +
                `Expected 10 competition periods, but found ${periods.length}.`
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
        // ACTIVATE
        // ==========================================

        await activateAdminSeason(
            seasonId
        );


        alert(
            `${season.name} is now the active season.`
        );


        await loadSeasons();

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


// ==========================================
// START
// ==========================================

startupSeasons();