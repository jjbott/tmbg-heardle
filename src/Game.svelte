<script>
    import { onMount } from "svelte";
    import Something from "./Something.svelte";
    import Header from "./Header.svelte";
    import Unknown1 from "./Unknown1.svelte";
    import Unknown2 from "./Unknown2.svelte";
    import Modal from "./Modal.svelte";
    import InfoModal from "./InfoModal.svelte";
	import DonateModal from "./DonateModal.svelte";
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

    let answerTexts = ["test"],
        answers = [
            {
                answer: "(She Was A) Hotel Detective - They Might Be Giants",
                url: "https://soundcloud.com/they-might-be-giants/she-was-a-hotel-detective-2",
            },
        ],
        i;

    let idOffset = 0; // TODO: This is going to throw off ctx indexes. Probably needs to live elsewhere

    // TODO: This does _not_ live here
    const config = {
        attemptInterval: 1.5e3,
        attemptIntervalAlt: [1e3, 2e3, 4e3, 7e3, 11e3, 16e3],
        maxAttempts: 6,
        startDate: "2022-12-22",
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

    function daysSinceStartDate(e) {
        var t = moment(e, "YYYY-MM-DD");
        return moment().diff(t, "days");
    }

    let answerIndex = daysSinceStartDate(config.startDate) % answers.length;
    let todaysGameDefault = {
        url: answers[answerIndex].url,
        correctAnswer: answers[answerIndex].answer,
        id: daysSinceStartDate(config.startDate) + idOffset,
        guessList: [],
        hasFinished: !1,
        hasStarted: !1,
    };

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

    todaysGame = userStats.find((e) => e.id === todaysGameDefault.id);
    if (undefined === todaysGame) {
        todaysGame = todaysGameDefault;
        userStats.push(todaysGame);
        localStorage.setItem("userStats", JSON.stringify(userStats));
    }

	function openModalCallback(e) {
        openModal(e.detail.name, e.detail.title, e.detail.hasFrame);
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

<main class="bg-custom-bg text-custom-fg overflow-auto flex flex-col" style:height='{height}px'>
    {#if modalState.isActive}
        <Modal hasFrame={modalState.hasFrame} title={modalState.title}
		on:close={() => modalState.isActive = false}>
            {#if modalState.name == "info"}
                <InfoModal />
            {:else if modalState.name == "donate"}
			<DonateModal />
            {:else if modalState.name == "results"}
                <div>Results</div>
            {:else if modalState.name == "help"}
                <div>Help</div>
            {/if}
        </Modal>
    {/if}
    <div class="flex-none">
        <Header on:modal={openModalCallback} />
    </div>
    <div class="w-full flex flex-col flex-grow relative">
        <div class="max-w-screen-sm w-full mx-auto h-full flex flex-col justify-between overflow-auto">
            <Unknown1 />

            <Unknown1 />
            {answerTexts}{answers}{i}
        </div>
    </div>

    <Unknown2 />
</main>
