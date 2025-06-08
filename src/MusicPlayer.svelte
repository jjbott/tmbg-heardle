<script>
    import { ga } from "@beyonk/svelte-google-analytics";
    import { onMount, createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";
    import LoadbarSound from "./LoadbarSound.svelte";
    import EmptyDiv from "./EmptyDiv.svelte";

    let /*r*/ musicIsPlaying,
        gameIsActive,
        playerIsReady,
        currentAttempt2,
        attemptIntervalAlt,
        l,
        currentAttemptIntervalAlt;
    $: musicIsPlaying = gameState.musicIsPlaying;
    $: gameIsActive = gameState.gameIsActive;
    $: playerIsReady = gameState.playerIsReady;
    $: currentAttempt2 = currentAttempt;
    $: attemptIntervalAlt = config.attemptIntervalAlt;
    $: l = gameState.isPrime
        ? (attemptIntervalAlt[currentAttempt2 - 1] / attemptIntervalAlt.slice(-1)[0]) * 100
        : (currentAttempt / config.maxAttempts) * 100;
    $: { currentAttemptIntervalAlt = attemptIntervalAlt[currentAttempt2 - 1];
        // Prevent flash of a bad progress bar that occurs when the 
        // user guesses/skips while the music is playing.
        calculateProgressBarPercent();
    }
    const dispatch = createEventDispatcher();

    export let currentAttempt; // d
    export let currentHeardle; // h
    export let config; // f
    export let trackDuration = 0; // m
    export let gameState; // p

    let songIsBlocked = false;

    let soundcloudWidget,
        progressBarPercent = 0,
        currentPosition = 0,
        scriptLoaded = false,
        mounted = false,
        hasStartedGame = false,
        startGameEventSent = false,
        playerLoadFailed = false;

    export const togglePlayState = () => {
        soundcloudWidget.toggle();
    };

    export const scPlay = () => {
        soundcloudWidget.seekTo(0), soundcloudWidget.play();
    };

    export const scPause = () => {
        soundcloudWidget.seekTo(0), soundcloudWidget.pause();
    };

    export const resetAndPlay = () => {
        soundcloudWidget.seekTo(0), soundcloudWidget.play();
    };

    function onMusicIsPlayingChange(e) {
        console.log("musicIsPlaying: " + e);
        dispatch("updatePlayerState", {
            musicIsPlaying: e
        });
    }

    let scWidgetDiv;
    function setupWidget() {
        soundcloudWidget = SC.Widget("soundcloud" + currentHeardle.id);
        soundcloudWidget.bind(SC.Widget.Events.READY, function () {
            soundcloudWidget.getCurrentSound(function (e) {
                if ("BLOCK" === e.policy) {
                    songIsBlocked = true;
                }
                dispatch("updateSong", {
                    currentSong: e
                });
            });
        });
        soundcloudWidget.bind(SC.Widget.Events.PAUSE, function () {
            onMusicIsPlayingChange(false);
        });
        soundcloudWidget.bind(SC.Widget.Events.PLAY, function () {
            if (!startGameEventSent) {
                ga.addEvent("startGame", {
                    name: "startGame",
                    gameId: currentHeardle.id
                });
                ga.addEvent("startGame#" + currentHeardle.id, {
                    name: "startGame",
                    gameId: currentHeardle.id
                });
                startGameEventSent = true;
            }

            onMusicIsPlayingChange(true);
            hasStartedGame = true;
        });
        soundcloudWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function (e) {
            currentPosition = e.currentPosition;

            calculateProgressBarPercent();

            if (gameIsActive == 1) {
                if (gameState.isPrime) {
                    if (currentPosition > currentAttemptIntervalAlt) {
                        scPause();
                    }
                } else {
                    if (currentPosition > currentAttempt * config.attemptInterval) {
                        scPause();
                    }
                }
            } else {
                if (currentPosition > trackDuration) {
                    scPause();
                }
            }
        });
    }

    function onScriptLoad() {
        scriptLoaded = true;
        if (mounted) {
            setTimeout(() => {
                playerLoadFailed = true;
            }, 6000);
            setupWidget();
        }
    }

    onMount(() => {
        const e = document.createElement("iframe");
        e.name = currentHeardle.id;
        e.id = "soundcloud" + currentHeardle.id;
        e.allow = "autoplay";
        e.height = 0;
        e.src = "https://w.soundcloud.com/player/?url=" + currentHeardle.url + "&cache=" + currentHeardle.id;
        scWidgetDiv.appendChild(e);
        mounted = true;
        if (scriptLoaded) {
            setTimeout(() => {
                playerLoadFailed = true;
            }, 6000);
            setupWidget();
        }
    });

    function formatMs(e) {
        var t = Math.floor(e / 6e4),
            n = ((e % 6e4) / 1e3).toFixed(0);
        return t + ":" + (n < 10 ? "0" : "") + n;
    }

    function calculateProgressBarPercent() {
        if (gameIsActive == 1) {
            if (gameState.isPrime) {
                progressBarPercent = (currentPosition / currentAttemptIntervalAlt) * 100;
                console.log(
                    `currentPosition: ${currentPosition}, currentAttemptIntervalAlt: ${currentAttemptIntervalAlt}, progressBarPercent: ${progressBarPercent}`
                );
            } else {
                progressBarPercent = (currentPosition / (currentAttempt * config.attemptInterval)) * 100;
            }
        } else {
            progressBarPercent = (currentPosition / trackDuration) * 100;
        }
    }
</script>

<svelte:head>
    <script src="https://w.soundcloud.com/player/api.js" on:load={onScriptLoad}></script>
</svelte:head>

{#if playerIsReady}
    <!-- Je -->
    {#if !songIsBlocked}
        <!-- Qe -->

        <!-- if !e[12] x && 1 == e[0] d -->
        {#if !hasStartedGame && 1 == currentAttempt}
            <!-- tt -->
            <div class="text-center p-3 flex flex-col items-center text-sm text-custom-line">
                <p>Turn up the volume and tap to start the track!</p>
                <svg
                    class="mt-2"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg
                >
            </div>
        {/if}
        <div class="border-t border-custom-line">
            <div class="max-w-screen-sm w-full mx-auto px-3 flex-col">
                <div class="h-3 w-full relative overflow-hidden">
                    <div
                        class="h-full absolute bg-custom-mg overflow-hidden"
                        style:width={(gameIsActive ? l : "100") + "%"}
                    >
                        <div class="h-full absolute bg-custom-positive" style:width={progressBarPercent + "%"} />
                    </div>
                    <!-- W -->

                    {#if gameState.isPrime}
                        <!-- rt -->
                        <div class="w-full h-full absolute">
                            <!-- rt -->

                            {#if gameIsActive}
                                <!-- lt -->
                                <div class="bg-custom-line w-px h-full absolute right-0" />
                                {#each attemptIntervalAlt as a_i, i}
                                    <div
                                        class="w-px h-full absolute"
                                        style:left={(attemptIntervalAlt[i] / attemptIntervalAlt.slice(-1)[0]) * 100 +
                                            "%"}
                                        class:bg-custom-bg={i < currentAttempt2 - 1}
                                        class:bg-custom-mg={i > currentAttempt2 - 1}
                                        class:bg-custom-line={i == currentAttempt2 - 1}
                                    />
                                {/each}
                                <div class="bg-custom-mg w-px h-full absolute right-0" />
                            {/if}
                        </div>
                    {:else}
                        <!-- nt -->
                        <div class="flex w-full h-full absolute justify-between">
                            {#if gameIsActive}
                                {#each Array(config.maxAttempts + 1) as something, i}
                                    <div class="bg-custom-bg w-px h-full" />
                                {/each}
                                <!-- st -->
                            {:else}
                                <!-- it -->
                                {#each Array(Math.floor(trackDuration / config.attemptInterval)) as something, i}
                                    <div class="bg-custom-bg w-px h-full" />
                                {/each}
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        <div class="border-t border-custom-line">
            <div class="max-w-screen-sm w-full mx-auto flex-col">
                <div class="px-3">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center">
                            <div>
                                <!-- {mt(e[11]) + ""} -->
                                {formatMs(currentPosition) + ""}
                            </div>
                        </div>
                        <div class="flex justify-center items-center p-1">
                            <!-- D -->
                            <Button on:click={musicIsPlaying ? scPause() : scPlay()}>
                                <!-- ht -->
                                <div
                                    class="flex justify-center items-center text-custom-fg h-14 w-14 border-2 rounded-full relative overflow-hidden"
                                >
                                    {#if musicIsPlaying}
                                        <!-- dt -->
                                        <div class="relative z-10">
                                            <!-- Fe -->
                                            <LoadbarSound {musicIsPlaying} />
                                        </div>
                                    {:else}
                                        <!-- ct -->
                                        <div class="ml-1 relative z-10">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg
                                            >
                                        </div>
                                    {/if}
                                </div>
                            </Button>
                        </div>
                        <div>
                            <!-- L -->
                            {formatMs(
                                gameIsActive
                                    ? gameState.isPrime
                                        ? attemptIntervalAlt.slice(-1)[0]
                                        : config.maxAttempts * config.attemptInterval
                                    : trackDuration
                            ) + ""}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <!-- Xe -->
        <div class="max-w-screen-sm w-full mx-auto px-3 flex-col">
            <div class="p-3 mb-3 bg-custom-mg rounded-sm">
                <div class="flex items-center">
                    <div class="mr-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6" /></svg
                        >
                    </div>
                    <div>
                        <p class="text-sm">
                            Oh no! Seems like today's track is unavailable on SoundCloud in your location
                        </p>
                        {#if gameState.gameIsActive}
                            <p class="text-xs text-custom-line pt-1">
                                We're really sorry. The answer is <a href={currentHeardle.url}>here</a>, though, if you
                                want to maintain your streak.
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    {/if}
{:else}
    <!-- Ve -->
    <div class="text-sm text-center text-custom-line p-6">
        {#if playerLoadFailed}
            <!-- Ze -->
            <p class="mb-3">There was an error loading the player. Please reload and try again.</p>
            <div class="flex justify-center">
                <Button on:click={() => window.location.reload()}>
                    <!-- qe -->
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
                    </svg>
                </Button>
            </div>
        {:else}
            <!-- Ke -->
            <EmptyDiv />
            <p>loading player</p>
        {/if}
    </div>
{/if}

<div class="hidden">
    <div bind:this={scWidgetDiv} />
</div>
