<script>
    import { onMount } from "svelte";
    import { readable, writable } from "svelte/store";
    import moment from 'moment'
    import Something from "./Something.svelte";
    import Header from "./Header.svelte";
    import Unknown1 from "./Unknown1.svelte";
    import Unknown2 from "./Unknown2.svelte";
    import Modal from "./Modal.svelte";
    import InfoModal from "./InfoModal.svelte";
    import DonateModal from "./DonateModal.svelte";
    import HelpModal from "./HelpModal.svelte";
    import ResultMaybe from "./ResultMaybe.svelte";
    import SoundCloudMaybe from "./SoundCloudMaybe.svelte";
    import Yt from "./Yt.svelte";

    import {idOffset,potentialAnswers, answerIndexes} from './Solutions.js'
    /*
	let answerTexts, answers, i, o;
   let answerIndex = daysSinceStartDate(Vt.startDate) % answers.length,
      l = {
        url: answers[answerIndex].url,
        correctAnswer: answers[answerIndex].answer,
        id: daysSinceStartDate(Vt.startDate) + idOffset,
        guessList: [],
        hasFinished: !1,
        hasStarted: !1,
      };
    var c, d;
*/
    //const { document: document, window: window } = globals;

    /*const potentialAnswers = [
        {
            answer: "(She Was A) Hotel Detective - They Might Be Giants",
            url: "https://soundcloud.com/they-might-be-giants/she-was-a-hotel-detective-2",
        },
    ];
    const answerIndexes = [0];
*/
    const answerTexts = writable(potentialAnswers.map((e) => e.answer).filter((e, i, s) => s.indexOf(e) === i));

    const fullAnswerList = readable(
        answerIndexes.map((e) => potentialAnswers[e]),
        () => {}
    );
    //$:answers = fullAnswerList;

    //const answers = readable(answerIndexes.map(e=>potentialAnswers[e]), () => {});

    let /*answerTexts = ["test"],
        answers = [
            {
                answer: "(She Was A) Hotel Detective - They Might Be Giants",
                url: "https://soundcloud.com/they-might-be-giants/she-was-a-hotel-detective-2",
            },
        ],*/
        i,
        o;

    //let idOffset = 0; // TODO: This is going to throw off ctx indexes. Probably needs to live elsewhere

    // TODO: This does _not_ live here. I think?
    const config = {
        attemptInterval: 1.5e3,
        attemptIntervalAlt: [1e3, 2e3, 4e3, 7e3, 11e3, 16e3],
        maxAttempts: 6,
        startDate: "2022-12-22",
    };

    let answerIndex = daysSinceStartDate(config.startDate) % $fullAnswerList.length;
    let currentHeardle = {
        url: $fullAnswerList[answerIndex].url,
        correctAnswer: $fullAnswerList[answerIndex].answer,
        id: daysSinceStartDate(config.startDate) + idOffset,
        guessList: [],
        hasFinished: !1,
        hasStarted: !1,
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
        isPrime: true,
    };

    let modalState = {
        isActive: false,
        hasFrame: true,
        name: "",
        title: "",
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
            addEvent("startGame#" + currentHeardle.id, {
                name: "startGame",
            });
            addEvent("startGame", {
                name: "startGame",
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
            addEvent("correctGuess", {
                name: "correctGuess",
            }),
            addEvent("correctGuess#" + currentHeardle.id, {
                name: "correctGuess",
            })),
            r
                ? (addEvent("skippedGuess", {
                      name: "skippedGuess",
                  }),
                  addEvent("skippedGuess#" + currentHeardle.id, {
                      name: "skippedGuess",
                  }))
                : s ||
                  (addEvent("incorrectGuess", {
                      name: "incorrectGuess",
                  }),
                  addEvent("incorrectGuess#" + currentHeardle.id, {
                      name: "incorrectGuess",
                  })),
            (userGuesses = userGuesses.concat({
                answer: e.detail.guess,
                isCorrect: s,
                isSkipped: r,
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
                    ? (addEvent("wonGame", {
                          name: "won",
                      }),
                      addEvent("wonGame#" + currentHeardle.id, {
                          name: "won",
                      }))
                    : (addEvent("lostGame", {
                          name: "lost",
                      }),
                      addEvent("lostGame#" + currentHeardle.id, {
                          name: "lost",
                      })),
                addEvent("endGame" + currentHeardle.id + "in" + userGuesses.length, {
                    name: "#" + userGuesses.length,
                }),
                addEvent("endGame", {
                    name: "endGame",
                }),
                addEvent("endGame#" + currentHeardle.id, {
                    name: "endGame",
                }),
                addEvent("gameStats#" + currentHeardle.id, {
                    name: userGuesses,
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
    <meta name="description" content="Guess the They Might Be Giants song from the intro in as few tries as possible" />
    <link rel="apple-touch-icon" sizes="192x192" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <title>TMBG Heardle</title>
</svelte:head>

<main class="bg-custom-bg text-custom-fg overflow-auto flex flex-col" style:height="{height}px">
    {#if modalState.isActive}
        <Modal hasFrame={modalState.hasFrame} title={modalState.title} on:close={() => (modalState.isActive = false)}>
            {#if modalState.name == "info"}
                <InfoModal />
            {:else if modalState.name == "donate"}
                <DonateModal />
            {:else if modalState.name == "results"}
                <div>Results</div>
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
            <Something {userGuesses} maxAttempts={config.maxAttempts} {currentHeardle} {todaysGame} />

            <ResultMaybe {config} {userGuesses} {currentHeardle} hasFinished={todaysGame.hasFinished} gotCorrect={todaysGame.gotCorrect} isPrime={config.isPrime} guessRef={todaysGame.gotCorrect ? userGuesses.length : 0} />
            <!-- {answerTexts}{answers}{i} -->
        </div>
    </div>

    <!-- Y -->
    <SoundCloudMaybe
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
        <Yt
            isPrime={gameState.isPrime}
            {config}
            {allOptions}
            currentAttempt={userGuesses.length + 1}
            bind:this={o}
            bind:guessInput={guessInput}
        
        on:guess={e15}/>
    {/if}
</main>
