<script>
    import { createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";
    import { importStats } from "./importStats";
    import { ga } from "@beyonk/svelte-google-analytics";

    const dispatch = createEventDispatcher();

    function migrateStats() {
        const popup = window.open("https://tmbg-heardle.glitch.me/statTransfer.html", "_blank", "width=600,height=400");

        if (!popup) {
            dispatch("popupBlocked");
        }

        window.addEventListener("message", (event) => {
            if (event.origin !== "https://tmbg-heardle.glitch.me") {
                console.error("Untrusted origin:", event.origin);
                return;
            }

            const { userStats, firstTime } = event.data.statTransfer || {};
            const statsToImport = JSON.parse(userStats || "[]");
            if (statsToImport) {
                importStats(statsToImport);
                ga.addEvent("statsMigrated", {
                    name: "statsMigrated"
                });
            }

            event.source.postMessage("thanks bro", event.origin);

            onMigrated();
        });
    }

    const onMigrated = () => {
        dispatch("migrationComplete");
    };
</script>

<Button primary={true} on:click={migrateStats}><slot /></Button>
