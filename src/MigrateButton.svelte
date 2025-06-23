<script>
    import { createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";
    import { importStats } from "./importStats";

    const dispatch = createEventDispatcher();

     function migrateStats() {
        const popup = window.open(
            "https://tmbg-heardle.glitch.me/statTransfer.html",
            "_blank",
            "width=600,height=400"
        );
        
        if (!popup) {
            dispatch("popupBlocked");
        }

        // Listen for messages from the popup
        window.addEventListener("message", (event) => {
            if (event.origin !== "https://tmbg-heardle.glitch.me") {
                console.error("Untrusted origin:", event.origin);
                return;
            }

            const { userStats, firstTime } = event.data.statTransfer || {};
            const statsToImport = JSON.parse(userStats || []);
            if (statsToImport) {
                importStats(statsToImport)
                //localStorage.setItem("userStats", userStats);
            }
            //if (firstTime) {
                //const firstTime = localStorage.getItem("firstTime") === "true";
                //localStorage.setItem("firstTime", firstTime);
            //}

            event.source.postMessage("thanks bro", event.origin);

            console.log("Migration complete. Data received:", { userStats, firstTime });
            onMigrated(); 
        });
    }

    const onMigrated = () => {
        dispatch("migrationComplete");
    };
</script>
<Button primary={true}  on:click={migrateStats}><slot/></Button>