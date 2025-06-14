<script>
    import { createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";

    const dispatch = createEventDispatcher();

     function migrateStats() {
        const popup = window.open(
            "https://nasal-bittersweet-smell.glitch.me/public/statTransfer.html",
            "_blank",
            "width=600,height=400"
        );
        
        if (!popup) {
            dispatch("popupBlocked");
        }

        // Listen for messages from the popup
        window.addEventListener("message", (event) => {
            if (event.origin !== "https://nasal-bittersweet-smell.glitch.me") {
                console.error("Untrusted origin:", event.origin);
                return;
            }

            const { userStats, firstTime } = event.data.statTransfer || {};
            if (userStats) {
                localStorage.setItem("userStats", userStats);
            }
            if (firstTime) {
                localStorage.setItem("firstTime", firstTime);
            }

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