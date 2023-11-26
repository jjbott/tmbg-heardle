<script>
    import { onMount } from "svelte";
    import { readable, writable } from "svelte/store";
    import { GoogleAnalytics, ga } from "@beyonk/svelte-google-analytics";
    import moment from "moment";
    import Guesses from "./Guesses.svelte";
    import Header from "./Header.svelte";
    import Modal from "./Modal.svelte";
    import InfoModal from "./InfoModal.svelte";
    import DonateModal from "./DonateModal.svelte";
    import HelpModal from "./HelpModal.svelte";
    import StatsModal from "./StatsModal.svelte";
    import GameResult from "./GameResult.svelte";
    import MusicPlayer from "./MusicPlayer.svelte";
    import GuessInput from "./GuessInput.svelte";

    import { idOffset, potentialAnswers, answerIndexes } from "./Solutions.js";

    const answerTexts = writable(potentialAnswers.map((e) => e.answer).filter((e, i, s) => s.indexOf(e) === i));

    const fullAnswerList = readable(
        answerIndexes.map((e) => potentialAnswers[e]),
        () => {}
    );

    let i, o;

    const config = {
        attemptInterval: 1.5e3,
        attemptIntervalAlt: [1e3, 2e3, 4e3, 7e3, 11e3, 16e3],
        maxAttempts: 6,
        startDate: "2022-12-22"
    };

    let answerIndex = daysSinceStartDate(config.startDate) % $fullAnswerList.length;
    let currentHeardle = {
        url: $fullAnswerList[answerIndex].url,
        correctAnswer: $fullAnswerList[answerIndex].answer,
        id: daysSinceStartDate(config.startDate) + idOffset,
        guessList: [],
        hasFinished: !1,
        hasStarted: !1
    };

    var c, d;
    undefined !== document.hidden
        ? ((c = "hidden"), (d = "visibilitychange"))
        : undefined !== document.msHidden
          ? ((c = "msHidden"), (d = "msvisibilitychange"))
          : undefined !== document.webkitHidden && ((c = "webkitHidden"), (d = "webkitvisibilitychange")),
        undefined === document.addEventListener ||
            undefined === c ||
            document.addEventListener(
                d,
                function () {
                    document[c] ||
                        answerIndex === daysSinceStartDate(config.startDate) % $fullAnswerList.length ||
                        location.reload(!0);
                },
                !1
            );

    let userStats,
        todaysGame,
        height = 0;

    function onResize() {
        height = window.innerHeight;
    }
    onMount(() => {
        onResize();
    });

    if (null == localStorage.getItem("userStats")) {
        userStats = [];
        localStorage.setItem("userStats", JSON.stringify(userStats));
    } else {
        userStats = JSON.parse(localStorage.getItem("userStats"));
    }

    todaysGame = userStats.find((e) => e.id === currentHeardle.id);
    if (undefined === todaysGame) {
        todaysGame = currentHeardle;
        userStats.push(todaysGame);
        localStorage.setItem("userStats", JSON.stringify(userStats));
    }
    let guessInput;
    let allOptions;
    let userGuesses = todaysGame.guessList;

    let gameState = {
        gameIsActive: false,
        musicIsPlaying: false,
        playerIsReady: false,
        isPrime: true
    };

    let modalState = {
        isActive: false,
        hasFrame: true,
        name: "",
        title: ""
    };

    function openModal(name, title, hasFrame) {
        modalState.isActive = !0;
        modalState.name = name;
        modalState.title = title;
        modalState.hasFrame = hasFrame;
    }

    function e13(e) {
        let t = e.detail.currentSong;
        currentHeardle.artist = currentHeardle.correctAnswer.split(" - ")[1];
        currentHeardle.title = currentHeardle.correctAnswer.split(" - ")[0];
        currentHeardle.img = t.artwork_url;
        currentHeardle.duration = t.duration;
        currentHeardle.genre = t.genre;
        currentHeardle.date = t.release_date;
        // Add the correct answer, but only if it doesnt exist already.
        // Otherwise we get duplicates in the autosuggest box
        ($answerTexts =
            $answerTexts.indexOf(currentHeardle.correctAnswer) >= 0
                ? $answerTexts
                : [...$answerTexts, currentHeardle.correctAnswer]),
            /*
          (function (e, t, n) {
            e.set(n);
          })(answerTextList, answerTexts, answerTexts),
          */
            (allOptions = $answerTexts),
            (gameState.playerIsReady = !0),
            todaysGame.hasFinished || (gameState.gameIsActive = !0);
    }
    function e14(e) {
        console.log("onUpdatePlayerState (e14)" + e);
        if (!currentHeardle.hasStarted) {
            ga.addEvent("startGame#" + currentHeardle.id, {
                name: "startGame",
                gameId: currentHeardle.id
            });
            ga.addEvent("startGame", {
                name: "startGame",
                gameId: currentHeardle.id
            });
            currentHeardle.hasStarted = true;
        }
        gameState.musicIsPlaying = e.detail.musicIsPlaying;
    }
    function e15(e) {
        let t = e.detail.guess,
            r = e.detail.isSkipped,
            s = !1;
        var wonGame;
        r ||
            t != currentHeardle.correctAnswer ||
            ((s = !0),
            ga.addEvent("correctGuess", {
                name: "correctGuess",
                gameId: currentHeardle.id
            }),
            ga.addEvent("correctGuess#" + currentHeardle.id, {
                name: "correctGuess",
                gameId: currentHeardle.id
            })),
            r
                ? (ga.addEvent("skippedGuess", {
                      name: "skippedGuess",
                      gameId: currentHeardle.id
                  }),
                  ga.addEvent("skippedGuess#" + currentHeardle.id, {
                      name: "skippedGuess",
                      gameId: currentHeardle.id
                  }))
                : s ||
                  (ga.addEvent("incorrectGuess", {
                      name: "incorrectGuess",
                      gameId: currentHeardle.id
                  }),
                  ga.addEvent("incorrectGuess#" + currentHeardle.id, {
                      name: "incorrectGuess",
                      gameId: currentHeardle.id
                  })),
            (userGuesses = userGuesses.concat({
                answer: e.detail.guess,
                isCorrect: s,
                isSkipped: r
            })),
            (todaysGame.guessList = userGuesses);
        localStorage.setItem("userStats", JSON.stringify(userStats));
        if (userGuesses.length == config.maxAttempts || 1 == s) {
            wonGame = s;
            gameState.gameIsActive = !1;
            todaysGame.hasFinished = !0;
            todaysGame.gotCorrect = wonGame;
            todaysGame.score = userGuesses.length;
            localStorage.setItem("userStats", JSON.stringify(userStats)),
                i.resetAndPlay(),
                wonGame
                    ? (ga.addEvent("wonGame", {
                          name: "won",
                          gameId: currentHeardle.id
                      }),
                      ga.addEvent("wonGame#" + currentHeardle.id, {
                          name: "won",
                          gameId: currentHeardle.id
                      }))
                    : (ga.addEvent("lostGame", {
                          name: "lost",
                          gameId: currentHeardle.id
                      }),
                      ga.addEvent("lostGame#" + currentHeardle.id, {
                          name: "lost",
                          gameId: currentHeardle.id
                      })),
                ga.addEvent("endGame" + currentHeardle.id + "in" + userGuesses.length, {
                    name: "#" + userGuesses.length,
                    gameId: currentHeardle.id
                }),
                ga.addEvent("endGame", {
                    name: "endGame",
                    gameId: currentHeardle.id
                }),
                ga.addEvent("endGame#" + currentHeardle.id, {
                    name: "endGame",
                    gameId: currentHeardle.id
                }),
                ga.addEvent("gameStats#" + currentHeardle.id, {
                    name: userGuesses,
                    gameId: currentHeardle.id
                });
        }
    }

    function openModalCallback(e) {
        openModal(e.detail.name, e.detail.title, e.detail.hasFrame);
    }

    function daysSinceStartDate(e) {
        var t = moment(e, "YYYY-MM-DD");
        return moment().diff(t, "days");
    }

    if (localStorage.getItem("firstTime") == null) {
        openModal("help", "how to play"), localStorage.setItem("firstTime", "false");
    }
</script>

<svelte:window bind:innerHeight={height} />

<svelte:head>
    <title>TMBG Heardle</title>
    <meta
        name="description"
        content="Guess the They Might Be Giants song from the intro in as few tries as possible."
    />
    <meta itemprop="name" content="TMBG Heardle - Name That They Might Be Giants song!" />
    <meta
        itemprop="description"
        content="Guess the They Might Be Giants song from the intro in as few tries as possible."
    />
    <meta
        itemprop="image"
        content="https://cdn.glitch.global/d2ca1732-ae1f-4c4e-93fa-404161416d71/tmbg-heardle-192.png"
    />
    <meta property="og:url" content="https://tmbg-heardle.glitch.me/" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="TMBG Heardle - Name That They Might Be Giants song!" />
    <meta
        property="og:description"
        content="Guess the They Might Be Giants song from the intro in as few tries as possible."
    />
    <meta
        property="og:image"
        content="https://cdn.glitch.global/d2ca1732-ae1f-4c4e-93fa-404161416d71/tmbg-heardle-192.png"
    />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="TMBG Heardle - Name That They Might Be Giants song!" />
    <meta
        name="twitter:description"
        content="Guess the They Might Be Giants song from the intro in as few tries as possible."
    />
    <meta
        name="twitter:image"
        content="https://cdn.glitch.global/d2ca1732-ae1f-4c4e-93fa-404161416d71/tmbg-heardle-192.png"
    />

    <link
        rel="icon"
        type="image/png"
        href="https://cdn.glitch.global/d2ca1732-ae1f-4c4e-93fa-404161416d71/tmbg-heardle-512.png?v=1648764420534"
    />
    <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="https://cdn.glitch.global/d2ca1732-ae1f-4c4e-93fa-404161416d71/tmbg-heardle-32.png?v=1648764422716"
    />
    <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="https://cdn.glitch.global/d2ca1732-ae1f-4c4e-93fa-404161416d71/tmbg-heardle-16.png?v=1648764426356"
    />
    <link
        rel="apple-touch-icon"
        sizes="192x192"
        href="https://cdn.glitch.global/d2ca1732-ae1f-4c4e-93fa-404161416d71/tmbg-heardle-192.png?v=1648764424567"
    />
    <link
        rel="shortcut icon"
        href="https://cdn.glitch.global/d2ca1732-ae1f-4c4e-93fa-404161416d71/tmbg-heardle-192.png?v=1648764424567"
    />
    <link rel="manifest" href="site.webmanifest" />
</svelte:head>

<GoogleAnalytics properties={["G-L8RFKXWJ0Z"]} />

<main class="bg-custom-bg text-custom-fg overflow-auto flex flex-col" style:height="{height}px">
    {#if modalState.isActive}
        <Modal hasFrame={modalState.hasFrame} title={modalState.title} on:close={() => (modalState.isActive = false)}>
            {#if modalState.name == "info"}
                <InfoModal />
            {:else if modalState.name == "donate"}
                <DonateModal />
            {:else if modalState.name == "results"}
                <!-- In -->
                <!-- Tn -->
                <!-- TODO: `daysSince={answerIndex}` looks like a bug -->
                <!-- Yep. It'll be wrong if we ever allow the solutions to loop back to index 0.
                That'll take a while, but it may happen if I forget about this project 😬 -->
                <StatsModal
                    {userStats}
                    {config}
                    isPrime={gameState.isPrime}
                    daysSince={answerIndex}
                    todaysScore={userGuesses.length}
                    guessRef={todaysGame.gotCorrect ? userGuesses.length + 1 : 0}
                    hasFinished={todaysGame.hasFinished}
                />
            {:else if modalState.name == "help"}
                <HelpModal on:close={() => (modalState.isActive = false)} />
            {/if}
        </Modal>
    {/if}
    <div class="flex-none">
        <Header on:modal={openModalCallback} />
    </div>
    <div class="w-full flex flex-col flex-grow relative">
        <div class="max-w-screen-sm w-full mx-auto h-full flex flex-col justify-between overflow-auto">
            <Guesses {userGuesses} maxAttempts={config.maxAttempts} {currentHeardle} {todaysGame} />

            <GameResult
                {config}
                {userGuesses}
                {currentHeardle}
                hasFinished={todaysGame.hasFinished}
                gotCorrect={todaysGame.gotCorrect}
                isPrime={gameState.isPrime}
                guessRef={todaysGame.gotCorrect ? userGuesses.length : 0}
            />
            <!-- {answerTexts}{answers}{i} -->
        </div>
    </div>

    <!-- Y -->
    <MusicPlayer
        {config}
        {gameState}
        {currentHeardle}
        trackDuration={currentHeardle.duration}
        currentAttempt={userGuesses.length + 1}
        on:updateSong={e13}
        on:updatePlayerState={e14}
        bind:this={i}
    />

    <!-- H -->
    {#if !todaysGame.hasFinished && gameState.gameIsActive}
        <!-- Gn -->

        <!-- guessInput is probably wrong. Doesnt make sense -->
        <GuessInput
            isPrime={gameState.isPrime}
            {config}
            {allOptions}
            currentAttempt={userGuesses.length + 1}
            bind:this={o}
            bind:guessInput
            on:guess={e15}
        />
    {/if}
</main>
