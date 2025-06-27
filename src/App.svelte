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
