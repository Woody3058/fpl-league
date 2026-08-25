
async function startupRules() {

    console.log(
        "rules.js: startupRules Called"
    );


    try {

        // ======================================
        // ACTIVE SEASON
        // ======================================

        const {
            data: season,
            error: seasonError
        } =
            await supabaseClient
                .from("seasons")
                .select(`
                    id,
                    name
                `)
                .eq(
                    "active",
                    true
                )
                .single();


        if (seasonError)
            throw seasonError;


        // ======================================
        // ACTIVE PLAYER COUNT
        // ======================================

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
                    season.id
                )
                .eq(
                    "active",
                    true
                );


        if (playerError)
            throw playerError;


        // ======================================
        // PRIZE SETTINGS
        // ======================================

        const {
            data: settings,
            error: settingsError
        } =
            await supabaseClient
                .from(
                    "season_prize_settings"
                )
                .select(`
                    entry_fee,
                    overall_percent,
                    period_percent,
                    highest_gameweek_percent,
                    captain_percent
                `)
                .eq(
                    "season_id",
                    season.id
                )
                .single();


        if (settingsError)
            throw settingsError;

        // ======================================
        // COMPETITION PERIOD COUNT
        // ======================================

        const {
            count: periodCount,
            error: periodError
        } =
            await supabaseClient
                .from(
                    "competition_periods"
                )
                .select(
                    "period_number",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "season_id",
                    season.id
                );


        if (periodError)
            throw periodError;


        // ======================================
        // CALCULATE PRIZES
        // ======================================

        const players =
            playerCount ?? 0;


        const pot =
            players *
            Number(
                settings.entry_fee
            );


        const overallPrize =
            pot *
            Number(
                settings.overall_percent
            ) /
            100;


        const periodFund =
            pot *
            Number(
                settings.period_percent
            ) /
            100;


        const highestGameweekPrize =
            pot *
            Number(
                settings.highest_gameweek_percent
            ) /
            100;


        const captainPrize =
            pot *
            Number(
                settings.captain_percent
            ) /
            100;


        // ======================================
        // DISPLAY
        // ======================================

        setRulesText(
            "rulesEntryFee",
            formatRulesCurrency(
                Number(
                    settings.entry_fee
                )
            )
        );

        setRulesText(
            "rulesPlayerCount",
            players
        );


        setRulesText(
            "rulesPrizePot",
            formatRulesCurrency(
                pot
            )
        );


        setRulesText(
            "rulesOverallPercent",
            `${settings.overall_percent}%`
        );


        setRulesText(
            "rulesOverallPrize",
            formatRulesCurrency(
                overallPrize
            )
        );


        setRulesText(
            "rulesPeriodPercent",
            `${settings.period_percent}%`
        );


        setRulesText(
            "rulesPeriodFund",
            formatRulesCurrency(
                periodFund
            )
        );

        setRulesText(
            "rulesPeriodCount",
            periodCount
        );


        setRulesText(
            "rulesPeriodPrize",
            periodCount > 0
                ? formatRulesCurrency(
                    periodFund /
                    periodCount
                )
                : "—"
        );


        setRulesText(
            "rulesHighestGameweekPercent",
            `${settings.highest_gameweek_percent}%`
        );


        setRulesText(
            "rulesHighestGameweekPrize",
            formatRulesCurrency(
                highestGameweekPrize
            )
        );


        setRulesText(
            "rulesCaptainPercent",
            `${settings.captain_percent}%`
        );


        setRulesText(
            "rulesCaptainPrize",
            formatRulesCurrency(
                captainPrize
            )
        );

        setRulesText(
            "rulesJoiningEntryFee",
            formatRulesCurrency(
                Number(
                    settings.entry_fee
                )
            )
        );


        console.log(
            "Rules and prizes loaded successfully."
        );

    }
    catch(error) {

        console.error(
            "Unable to load rules and prizes:",
            error
        );

    }

}


// ==========================================
// SET TEXT
// ==========================================

function setRulesText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ==========================================
// CURRENCY
// ==========================================

function formatRulesCurrency(
    value
) {

    return new Intl.NumberFormat(
        "en-GB",
        {
            style:
                "currency",

            currency:
                "GBP",

            minimumFractionDigits:
                0,

            maximumFractionDigits:
                2
        }
    )
        .format(
            value
        );

}


// ==========================================
// START
// ==========================================

startupRules();