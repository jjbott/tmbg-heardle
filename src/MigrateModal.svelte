<script>
    import { createEventDispatcher, getContext } from "svelte";
    import Button from "./Button.svelte";
    import MigrateButton from "./MigrateButton.svelte";
    import { ga } from "@beyonk/svelte-google-analytics";

    let statMigrationComplete;
    $: statMigrationComplete = false;
    let popupBlocked;
    $: popupBlocked = false;

    let showMigration;
    $: showMigration = false;

    localStorage.setItem("firstTimeNewSite", "true");

    const handleDontShowAgainChange = (event) => {
        const isChecked = event.target.checked;
        localStorage.setItem("dontShowMigrationModal", isChecked ? "true" : "false");
    };

    const onClose = getContext("onClose");

    const migrationComplete = () => {
        localStorage["migrated"] = "true";
        statMigrationComplete = true;
        ga.addEvent("statsMigratedFromModal", {
            name: "statsMigratedFromModal"
        });
    };

    const onPopupBlocked = () => {
        ga.addEvent("statsMigrationPopupBlocked", {
            name: "statsMigrationPopupBlocked"
        });
        popupBlocked = true;
    };
</script>

<div>
    {#if !showMigration}
        <div class="justify-center flex text-center py-2 mt-2">
            Due to&nbsp;<a
                style="color:#1d7e05;text-decoration: underline;"
                href="https://blog.glitch.com/post/changes-are-coming-to-glitch/">Glitch.com shutting down</a
            >, we have a new home!
        </div>
        <div class="justify-center flex text-center py-2 mt-2">Make sure you update your bookmarks to:</div>
        <div class="justify-center flex text-center py-2 text-xl text-custom-positive">
            https://tmbg-heardle.pages.dev
        </div>
        <div class="justify-center flex items-center py-2 mt-2">
            <Button primary={true} on:click={() => (showMigration = true)}>But What About My Stats?</Button>
        </div>
    {:else}
        <div class="justify-center text-center flex py-2 mt-2">
            If you have stats from the old site, we can try to migrate them!
        </div>
        <div class="justify-center flex items-center py-2 mt-2">
            Or, manually import/export stats from the Stats menu!
        </div>
        <div class="justify-center flex text-center text-custom-negative mb-2">
            Make sure to migrate your stats from the old site before July 8th!
        </div>
        {#if popupBlocked}
            <div class="justify-center flex items-center text-custom-negative py-2 mt-2">
                Popup blocked! Please allow popups for this site to migrate your stats.
            </div>
        {/if}

        {#if !statMigrationComplete}
            <div class="justify-center flex items-center py-2 mt-2">
                <MigrateButton on:migrationComplete={migrationComplete} on:popupBlocked={onPopupBlocked}
                    >Migrate My Stats!</MigrateButton
                >
            </div>
        {:else}
            <div class="justify-center text-center py-3 text-custom-positive">Your stats have been migrated!</div>
        {/if}
    {/if}
    <div class="justify-center flex items-center py-2 mt-2">
        <Button primary={true} on:click={onClose}>Play Today's Game</Button>
    </div>
</div>
