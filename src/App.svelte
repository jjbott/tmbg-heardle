<script>
    import Game from "./Game.svelte";
    import Modal from "./Modal.svelte";
    import MigrateModal from "./MigrateModal.svelte";
    import { GoogleAnalytics, ga } from "@beyonk/svelte-google-analytics";

    let showMigrationModal = false;

    if (localStorage.getItem("firstTimeNewSite") !== "true" && localStorage.getItem("dontShowMigrationModal") !== "true") {
        showMigrationModal = true;
    }

    function dismissModal() {
        showMigrationModal = false;
    }

    function handleDontShowAgainChange(event) {
        const isChecked = event.target.checked;
        localStorage.setItem("dontShowMigrationModal", isChecked ? "true" : "false");
    }
</script>


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
        content="https://tmbg-heardle.pages.dev/tmbg-heardle-192.png"
    />
    <meta property="og:url" content="https://tmbg-heardle.pages.dev/" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="TMBG Heardle - Name That They Might Be Giants song!" />
    <meta
        property="og:description"
        content="Guess the They Might Be Giants song from the intro in as few tries as possible."
    />
    <meta
        property="og:image"
        content="https://tmbg-heardle.pages.dev/tmbg-heardle-192.png"
    />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="TMBG Heardle - Name That They Might Be Giants song!" />
    <meta
        name="twitter:description"
        content="Guess the They Might Be Giants song from the intro in as few tries as possible."
    />
    <meta
        name="twitter:image"
        content="https://tmbg-heardle.pages.dev/tmbg-heardle-192.png"
    />

    <link
        rel="icon"
        type="image/png"
        href="https://tmbg-heardle.pages.dev/tmbg-heardle-512.png"
    />
    <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="https://tmbg-heardle.pages.dev/tmbg-heardle-32.png"
    />
    <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="https://tmbg-heardle.pages.dev/tmbg-heardle-16.png"
    />
    <link
        rel="apple-touch-icon"
        sizes="192x192"
        href="https://tmbg-heardle.pages.dev/tmbg-heardle-192.png"
    />
    <link
        rel="shortcut icon"
        href="https://tmbg-heardle.pages.dev/tmbg-heardle-192.png"
    />
    <link rel="manifest" href="site.webmanifest" />
</svelte:head>

<GoogleAnalytics properties={["G-68L3F77FNG"]} />

{#if showMigrationModal}
    <main class="bg-custom-bg text-custom-fg">
        <Modal hasFrame={true} title="Welcome TMBG Heardle's New Home!" on:close={dismissModal} isDismissable={false}>
            <MigrateModal />
        </Modal>
    </main>
{:else}
    <Game />
{/if}
