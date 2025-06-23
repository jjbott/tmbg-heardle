<script>
    import { createEventDispatcher, getContext } from "svelte";
    import Button from "./Button.svelte";
    import MigrateButton from "./MigrateButton.svelte";
    import { ga } from "@beyonk/svelte-google-analytics";

    let statMigrationComplete;
    $: statMigrationComplete = false;
    let popupBlocked;
    $: popupBlocked = false;

    const onClick = () => (window.location.href = "https://tmbg-heardle.pages.dev");
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
    {#if !statMigrationComplete}
        <div class="justify-center flex items-center py-2 mt-2">
            If you have stats from the old site, we can try to migrate them!
        </div>
        {#if popupBlocked}
            <div class="justify-center flex items-center text-custom-negative py-2 mt-2">
                Popup blocked! Please allow popups for this site to migrate your stats.
            </div>
        {/if}
        <div class="justify-center flex items-center py-2 mt-2">
            <MigrateButton on:migrationComplete={migrationComplete} on:popupBlocked={onPopupBlocked}
                >Migrate My Stats!</MigrateButton
            >
        </div>
        <div class="justify-center flex items-center py-2 mt-2">
            <Button secondary={true} on:click={onClose}>Skip</Button>
        </div>
        <div class="justify-left flex items-center py-2 mt-2">
            <label>
                <input type="checkbox" on:change={handleDontShowAgainChange} />
                Don't show this again
            </label>
        </div>
    {:else}
        <div class="justify-center text-center py-3 text-custom-line font-semibold">Your stats have been migrated!</div>
        <div class="justify-center flex items-center py-2 mt-2">
            <Button primary={true} on:click={onClose}>Lets Play!</Button>
        </div>
    {/if}
</div>
