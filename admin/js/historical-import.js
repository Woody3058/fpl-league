
let historicalImportSeasons = [];

let historicalImportData = null;


// ==========================================
// STARTUP
// ==========================================

async function startupHistoricalImport() {

    console.log(
        "historical-import.js: startupHistoricalImport Called"
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


        historicalImportSeasons =
            await getAdminSeasons();


        populateHistoricalSeasonSelector();


        // ==========================================
        // PREVIEW BUTTON
        // ==========================================

        document
            .getElementById(
                "previewHistoricalButton"
            )
            .addEventListener(
                "click",
                previewHistoricalScores
            );


        console.log(
            "Historical import page started successfully."
        );

    }
    catch(error) {

        console.error(
            "Historical import startup failed:",
            error
        );


        document
            .getElementById(
                "historicalImportMessage"
            )
            .textContent =
            "Unable to load historical score import.";

    }

}


// ==========================================
// SEASON SELECTOR
// ==========================================

function populateHistoricalSeasonSelector() {

    const selector =
        document.getElementById(
            "historicalSeasonSelector"
        );


    selector.innerHTML = "";


    // ==========================================
    // FIND ACTIVE SEASON
    // ==========================================

    const activeSeason =
        historicalImportSeasons.find(
            season =>
                season.active
        );


    // ==========================================
    // ADD HISTORICAL SEASONS ONLY
    // ==========================================

    historicalImportSeasons
        .filter(
            season =>
                activeSeason &&
                season.id <
                activeSeason.id
        )
        .forEach(
            season => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    season.id;


                option.textContent =
                    season.name;


                selector.appendChild(
                    option
                );

            }
        );

}

/*async function loadHistoricalScoreImport() {

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

}*/

async function previewHistoricalScores() {

    console.log(
        "historical-import.js: previewHistoricalScores Called"
    );


    const seasonId =
        Number(
            document
                .getElementById(
                    "historicalSeasonSelector"
                )
                .value
        );


    const fileInput =
        document
            .getElementById(
                "historicalScoreFile"
            );


    const message =
        document
            .getElementById(
                "historicalImportMessage"
            );


    message.textContent = "";


    // ==========================================
    // RESET PREVIEW
    // ==========================================

    document
        .getElementById(
            "historicalPlayerMappingSection"
        )
        .style.display =
        "none";


    document
        .getElementById(
            "historicalScorePreviewSection"
        )
        .style.display =
        "none";


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
        // LOAD DATABASE PLAYERS
        // ==========================================

        const databasePlayers =
            await getAdminPlayers();


        console.log(
            "Database players:",
            databasePlayers
        );


        // ==========================================
        // STORE IMPORT DATA
        // ==========================================

        historicalImportData = {

            seasonId:
                seasonId,

            periods:
                periods

        };


        // ==========================================
        // RENDER PREVIEW
        // ==========================================

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

    console.log(
        "historical-import.js: renderHistoricalScorePreview Called"
    );


    if (
        !periods ||
        periods.length === 0
    ) {

        document
            .getElementById(
                "historicalImportMessage"
            )
            .textContent =
            "No period scores found.";

        return;

    }


    // ==========================================
    // PLAYER NAMES
    // ==========================================

    const playerNames =
        periods[0]
            .scores
            .map(
                score =>
                    score.playerName
            );


    // ==========================================
    // PLAYER MAPPING TABLE
    // ==========================================

    const mappingBody =
        document.querySelector(
            "#historicalPlayerMappingTable tbody"
        );


    mappingBody.innerHTML =
        "";


    playerNames.forEach(
        excelPlayerName => {

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


            const row =
                document.createElement(
                    "tr"
                );

                if (matchingPlayer) {

                    row.classList.add(
                        "historical-map-matched"
                    );

                }
                else {

                    row.classList.add(
                        "historical-map-unmapped"
                    );

                }


            const excelCell =
                document.createElement(
                    "td"
                );


            excelCell.innerHTML = `

                <strong>
                    ${excelPlayerName}
                </strong>

                <div class="historical-map-status">
                    ${
                        matchingPlayer
                            ? "Matched automatically"
                            : "Needs mapping"
                    }
                </div>

            `;


            const databaseCell =
                document.createElement(
                    "td"
                );


            const selector =
                document.createElement(
                    "select"
                );


            selector.className =
                "historical-player-map";


            selector.dataset.excelPlayer =
                excelPlayerName;


            // ======================================
            // SELECT PLAYER OPTION
            // ======================================

            const selectOption =
                document.createElement(
                    "option"
                );


            selectOption.value =
                "";


            selectOption.textContent =
                "Select player";


            selector.appendChild(
                selectOption
            );


            // ======================================
            // IGNORE OPTION
            // ======================================

            const ignoreOption =
                document.createElement(
                    "option"
                );


            ignoreOption.value =
                "ignore";


            ignoreOption.textContent =
                "Ignore";


            selector.appendChild(
                ignoreOption
            );


            // ======================================
            // DATABASE PLAYERS
            // ======================================

            databasePlayers.forEach(
                player => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        player.id;


                    option.textContent =
                        player.name;


                    if (
                        matchingPlayer &&
                        matchingPlayer.id ===
                        player.id
                    ) {

                        option.selected =
                            true;

                    }


                    selector.appendChild(
                        option
                    );

                }
            );


            databaseCell.appendChild(
                selector
            );


            row.appendChild(
                excelCell
            );


            row.appendChild(
                databaseCell
            );


            mappingBody.appendChild(
                row
            );

        }
    );


    // ==========================================
    // SCORE PREVIEW HEADER
    // ==========================================

    const previewHead =
        document.querySelector(
            "#historicalScorePreviewTable thead"
        );


    previewHead.innerHTML =
        "";


    const headerRow =
        document.createElement(
            "tr"
        );


    const periodHeader =
        document.createElement(
            "th"
        );


    periodHeader.textContent =
        "Period";


    headerRow.appendChild(
        periodHeader
    );


    const gameweekHeader =
        document.createElement(
            "th"
        );


    gameweekHeader.textContent =
        "End GW";


    headerRow.appendChild(
        gameweekHeader
    );


    playerNames.forEach(
        playerName => {

            const th =
                document.createElement(
                    "th"
                );


            th.textContent =
                playerName;


            headerRow.appendChild(
                th
            );

        }
    );


    previewHead.appendChild(
        headerRow
    );


    // ==========================================
    // SCORE PREVIEW BODY
    // ==========================================

    const previewBody =
        document.querySelector(
            "#historicalScorePreviewTable tbody"
        );


    previewBody.innerHTML =
        "";


    periods.forEach(
        period => {

            const row =
                document.createElement(
                    "tr"
                );


            const periodCell =
                document.createElement(
                    "td"
                );


            periodCell.textContent =
                `P${period.period}`;


            row.appendChild(
                periodCell
            );


            const gameweekCell =
                document.createElement(
                    "td"
                );


            gameweekCell.textContent =
                `GW${period.endGameweek}`;


            row.appendChild(
                gameweekCell
            );


            period.scores.forEach(
                score => {

                    const cell =
                        document.createElement(
                            "td"
                        );


                    cell.textContent =
                        score.periodTotal ??
                        "—";


                    row.appendChild(
                        cell
                    );

                }
            );


            previewBody.appendChild(
                row
            );

        }
    );


    // ==========================================
    // SHOW SECTIONS
    // ==========================================

    document
        .getElementById(
            "historicalPlayerMappingSection"
        )
        .style.display =
        "block";


    document
        .getElementById(
            "historicalScorePreviewSection"
        )
        .style.display =
        "block";


    // ==========================================
    // IMPORT BUTTON
    // ==========================================

    const importButton =
        document.getElementById(
            "importHistoricalButton"
        );


    importButton.onclick =
        importHistoricalScores;

}

async function importHistoricalScores() {

    console.log(
        "historical-import.js: importHistoricalScores Called"
    );


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
    } =
        historicalImportData;


    try {

        // ==========================================
        // BUILD PLAYER MAPPING
        // ==========================================

        const mappings = {};


        const mappingSelectors =
            document.querySelectorAll(
                ".historical-player-map"
            );


        let mappingError =
            false;


        mappingSelectors.forEach(
            selector => {

                const excelPlayer =
                    selector.dataset
                        .excelPlayer;


                const value =
                    selector.value;


                if (!value) {

                    mappingError =
                        true;

                    return;

                }


                if (
                    value ===
                    "ignore"
                ) {

                    mappings[
                        excelPlayer
                    ] = null;

                    return;

                }


                mappings[
                    excelPlayer
                ] =
                    Number(value);

            }
        );


        if (mappingError) {

            message.textContent =
                "Please map or ignore every Excel player.";

            return;

        }


        // ==========================================
        // DUPLICATE MAPPING CHECK
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
        // BUILD RECORDS
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


                        if (
                            playerId === null ||
                            playerId === undefined
                        ) {

                            return;

                        }


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
        // FIND SEASON NAME
        // ==========================================

        const season =
            historicalImportSeasons.find(
                season =>
                    season.id ===
                    seasonId
            );


        const seasonName =
            season?.name ??
            `Season ${seasonId}`;


        // ==========================================
        // CONFIRM
        // ==========================================

        const confirmed =
            confirm(
                `Import ${records.length} historical period scores into ${seasonName}?`
            );


        if (!confirmed)
            return;


        message.textContent =
            `Importing ${records.length} scores into ${seasonName}...`;


        // ==========================================
        // UPSERT
        // ==========================================

        await upsertHistoricalPeriodScores(
            records
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            "Historical scores imported successfully."
        );


        message.textContent =
            `${records.length} historical period scores imported successfully into ${seasonName}.`;

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


// ==========================================
// START
// ==========================================

startupHistoricalImport();