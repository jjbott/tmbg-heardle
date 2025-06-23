<script>
    import ExportToFile from "./ExportToFile.svelte";
    import ImportFromFile from "./ImportFromFile.svelte";
    import MigrateButton from "./MigrateButton.svelte";
    import { idOffset } from "./Solutions.js";
    import { ga } from "@beyonk/svelte-google-analytics";

    let userStats = [];

    let statsMigrated = localStorage.getItem("migrated") === "true";
    let statMigrationComplete;
    $: statMigrationComplete = false;

    export let config;
    export let todaysScore;
    export let hasFinished;
    export let daysSince;

    let hasStats = false,
        played = 0,
        streaks = [],
        dayResults = [],
        wonCount = 0,
        histogram = [],
        maxHistogram = 0;

    export let isPrime;
    export let guessRef;

    const calcStats = () => {

        hasStats = false;
        played = 0;
        streaks = [];
        dayResults = [];
        wonCount = 0;
        histogram = [];
        maxHistogram = 0;

        for (let e = 0; e < config.maxAttempts + 1; e++) histogram[e] = 0;
        if (userStats.some((s) => s.hasFinished)) {
            hasStats = true;

            let lastId = -1;
            let wentBackwards = false;
            for (let e in userStats) {
                if (true === userStats[e].hasFinished) {
                    ++played;

                    let userStatId = userStats[e].id;

                    // In Dec 2022, the ids reset to 0. This was fixed in Jan 2023.
                    // When counting streaks, try to detect this to set the `daysWon` flags correctly

                    // User stats are in date order, not id order. So if the ids went backwards, we've hit our bug
                    if (lastId > userStatId) {
                        wentBackwards = true;
                    }

                    lastId = userStatId;

                    if (wentBackwards && userStatId < 30) {
                        userStatId += idOffset;
                    }

                    dayResults[userStatId] = userStats[e].gotCorrect ? 1 : 0;

                    if (true === userStats[e].gotCorrect) {
                        ++wonCount;
                        ++histogram[userStats[e].score - 1];
                        if (histogram[userStats[e].score - 1] > maxHistogram) {
                            maxHistogram = histogram[userStats[e].score - 1];
                        }
                    } else {
                        ++histogram[config.maxAttempts];
                        if (histogram[config.maxAttempts] > maxHistogram) {
                            maxHistogram = histogram[config.maxAttempts];
                        }
                    }
                }
            }

            // In Dec 2022, the ids reset to 0. This was fixed in Jan 2023 after about 26 days.
            // If you had user stats for these "bad" ids (from the first month the game was live)
            // it thought you already played and didnt let you play.
            // For those cases, for the purposes of streak calculation, assume they would have gotten it right.
            for (let i = 0; i < 26; i++) {
                if (
                    dayResults[i] !== undefined && // They played on the original "bad id" day
                    i <= daysSince && // The game with the "bad id" is not in the future
                    dayResults[i + idOffset] === undefined // They did not play after the fix
                ) {
                    dayResults[i + idOffset] = 1;
                }
            }

            // Fill in empty items (days they didnt play) with 0, so we can correctly calculate streaks.
            // Needs to be done after the above
            for (let i = 0; i < daysSince + 1 + idOffset; i++) {
                if (dayResults[i] === undefined) {
                    dayResults[i] = 0;
                }
            }

            streaks = dayResults.reduce((e, t) => (t ? e[e.length - 1]++ : e.push(0), e), [0]);
        }
    };

    const migrationComplete = () => {
        ga.addEvent("statsMigratedFromStats", {
            name: "statsMigratedFromStats",
        });
        localStorage["migrated"] = true;
        statMigrationComplete = true;
        refreshStats();
    };

    const importComplete = () => {
        ga.addEvent("importedFromStats", {
            name: "importedFromStats",
        });
        refreshStats();
    };

    const refreshStats = () => {
        userStats = JSON.parse(localStorage.getItem("userStats") || "[]");
        calcStats();
    };

    refreshStats();
</script>

{#if hasStats}
    <!-- _n -->
    <div class="flex justify-between py-3">
        {#each histogram as h, i}
            <!-- Mn -->
            <!-- t -->
            <div class="flex flex-col items-stretch">
                <!-- n -->
                <div class="h-32 relative w-9 flex justify-center items-end">
                    <!-- r -->
                    <div class="absolute bg-custom-mg w-6" style:height={(h / maxHistogram) * 100 + "%"}>
                        <!-- s -->
                        <div
                            class="h-full absolute text-center w-full py-1 text-xs"
                            class:bg-custom-positive={i == todaysScore - 1 && 0 != guessRef && hasFinished}
                            class:bg-custom-negative={i == todaysScore && 0 == guessRef && hasFinished}
                        >
                            <!-- i -->
                            {(h > 0 ? h : " ") + ""}
                        </div>
                    </div>
                </div>
                <!-- a -->
                <div>
                    <!-- h -->
                    {#if i === histogram.length - 1}
                        <!-- Sn -->
                        <svg
                            class="mx-auto"
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={6 == todaysScore && 0 == guessRef && hasFinished ? "#FF0000" : "currentColor" }
                            
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    {:else if isPrime}
                        <!-- bn -->
                        <span
                            class:font-semibold={i == todaysScore - 1 && hasFinished}
                            class:text-custom-positive={i == todaysScore - 1 && 0 != guessRef && hasFinished}
                            class:text-custom-negative={i == todaysScore && 0 == guessRef && hasFinished}
                            >{i + 1 + ""}°</span
                        >
                        <span class="text-custom-positive"></span>
                    {:else}
                        <!-- xn -->
                    {/if}
                </div>
            </div>
        {/each}
    </div>
    <!-- r -->
    <div class="flex justify-between text-center w-full py-3">
        <!-- s -->
        <div class="flex-1">
            <!-- i -->
            <div class="text-xl font-semibold">
                <!-- o -->
                {played}
            </div>
            <!-- l -->
            <div class="text-custom-line text-sm">Played</div>
        </div>
        <!-- c -->
        <div class="flex-1">
            <!-- d -->
            <div class="text-xl font-semibold">
                <!-- h -->
                {wonCount}
            </div>
            <!-- m -->
            <div class="text-custom-line text-sm">Won</div>
        </div>
        <!-- b -->
        <div class="flex-1">
            <!-- S -->
            <div class="text-xl font-semibold">
                <!-- B --><!-- T -->
                {(played > 0 ? ((wonCount / played) * 100).toFixed(1) : 0) + ""}%
            </div>
            <!-- C -->
            <div class="text-custom-line text-sm">Win Rate</div>
        </div>
    </div>
    <!-- P -->
    <div class="flex justify-between text-center w-full py-3 pt-0">
        <!-- A -->
        <div class="flex-1">
            <!-- L -->
            <div class="text-xl font-semibold">
                <!-- N -->
                {streaks.slice(-1)[0] + ""}
            </div>
            <!-- I -->
            <div class="text-custom-line text-sm">Current Streak</div>
        </div>
        <!-- R -->
        <div class="flex-1">
            <!-- F -->
            <div class="text-xl font-semibold">
                <!-- G -->
                {Math.max(...streaks) + ""}
            </div>
            <!-- j -->
            <div class="text-custom-line text-sm">Max Streak</div>
        </div>
    </div>
{:else}
    <!-- kn -->
    <div class="text-center py-3 text-custom-line font-semibold">Play daily to see your stats</div>
{/if}

<div class="py-2 text">
    {#if !statsMigrated}
        {#if !statMigrationComplete}
            <div class="justify-center flex items-center mb-2">
                <MigrateButton on:migrationComplete={migrationComplete}>Migrate Your Stats From the Old Site</MigrateButton>
            </div>
        {:else}
            <div class="justify-center text-center">
                Your stats have been migrated!
            </div>
        {/if}
{/if}
    <div class="justify-center flex items-center mb-2">
        <ExportToFile />
    </div>
    <div class="justify-center flex items-center">
        <ImportFromFile on:importComplete={importComplete} />
    </div>
</div>
