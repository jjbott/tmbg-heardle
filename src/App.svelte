<script>
    import { onMount } from "svelte";
    import Game from "./Game.svelte";
    import Modal from "./Modal.svelte";
    import MigrateModal from "./MigrateModal.svelte";

    let showMigrationModal = false;

    if (localStorage.getItem("migrated") !== "true" && localStorage.getItem("dontShowMigrationModal") !== "true") {
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

{#if showMigrationModal}
    <main class="bg-custom-bg text-custom-fg">
        <Modal hasFrame={true} title="Migrate Your Stats" on:close={dismissModal} isDismissable={false}>
            <MigrateModal />
        </Modal>
    </main>
{:else}
    <Game />
{/if}
