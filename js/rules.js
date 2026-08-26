
const rulesPageData = {season: null, players: [], prizes: []};

// ==========================================
// STARTUP
// ==========================================

async function startupRules() {

    console.clear();
    console.log("rules.js: startupRules Called");

    try {
        rulesPageData.season = await getActiveSeason();
        rulesPageData.players = await getSeasonPlayers(rulesPageData.season.id);
        let playerCount = rulesPageData.players.length;
        rulesPageData.prizes = await getSeasonPrizes(rulesPageData.season.id);
        periodCount = 10;

        // ======================================
        // CALCULATE PRIZES
        // ======================================

        const players = playerCount ?? 0;
        const pot = players * Number(rulesPageData.prizes.entryFee);
        const overallPrize = pot * Number(rulesPageData.prizes.overallPercent) / 100;
        const periodFund = pot * Number(rulesPageData.prizes.periodPercent) / 100;
        const highestGameweekPrize = pot * Number(rulesPageData.prizes.highestGameweekPercent) / 100;
        const captainPrize = pot * Number(rulesPageData.prizes.captainPercent) / 100;

        // ======================================
        // DISPLAY
        // ======================================

        setRulesText("rulesEntryFee", formatRulesCurrency(Number(rulesPageData.prizes.entryFee)));
        setRulesText("rulesPlayerCount", players);
        setRulesText("rulesPrizePot", formatRulesCurrency(pot));
        setRulesText("rulesOverallPercent", `${rulesPageData.prizes.overallPercent}%`);
        setRulesText("rulesOverallPrize", formatRulesCurrency(overallPrize));
        setRulesText("rulesPeriodPercent", `${rulesPageData.prizes. periodPercent}%`);
        setRulesText("rulesPeriodFund", formatRulesCurrency(periodFund));
        setRulesText("rulesPeriodCount", periodCount);
        setRulesText("rulesPeriodPrize", periodCount > 0 ? formatRulesCurrency(periodFund / periodCount) : "—");
        setRulesText("rulesHighestGameweekPercent", `${rulesPageData.prizes.highestGameweekPercent}%`);
        setRulesText("rulesHighestGameweekPrize", formatRulesCurrency(highestGameweekPrize));
        setRulesText("rulesCaptainPercent", `${rulesPageData.prizes.captainPercent}%`);
        setRulesText("rulesCaptainPrize", formatRulesCurrency(captainPrize));
        setRulesText("rulesJoiningEntryFee", formatRulesCurrency(Number(rulesPageData.prizes.entryFee)));

        console.log("Rules and prizes loaded successfully.");
    }
    catch(error) {
        console.error("Unable to load rules and prizes:",
            error
        );
    }
}

// ==========================================
// SET TEXT
// ==========================================

function setRulesText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

// ==========================================
// CURRENCY
// ==========================================

function formatRulesCurrency(value) {

    return new Intl.NumberFormat("en-GB", {
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
        .format(value);
}

// ==========================================
// START
// ==========================================

startupRules();