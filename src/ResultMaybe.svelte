<script>
    import Donate from "./Donate.svelte";
    import Button from "./Button.svelte";

    export let userGuesses;
    export let currentHeardle;
    export let config;
    export let hasFinished;
    export let gotCorrect;
    export let guessRef;
    export let isPrime;

    let copiedMessageActive = false;

    const Jt = ["0", "1", "2", "3", "4", "5", "6"];
    let guessesMaybe = Array(config.maxAttempts);

    function onCopyToClipboard() {
        let e = "TMBG Heardle #" + (currentHeardle.id + 1),
            t = "";
        gotCorrect
            ? userGuesses.length < config.maxAttempts / 3
                ? (t += "🔊")
                : userGuesses.length < (config.maxAttempts / 3) * 2
                ? (t += "🔉")
                : userGuesses.length <= config.maxAttempts && (t += "🔈")
            : (t += "🔇");
        for (let e = 0; e < config.maxAttempts; e++)
            userGuesses.length > e
                ? 1 == userGuesses[e].isCorrect
                    ? (t += "🟩")
                    : 1 == userGuesses[e].isSkipped
                    ? (t += "⬛️")
                    : (t += "🟥")
                : (t += "⬜️");
        let o = e + "\n\n" + t + "\n\nhttps://tmbg-heardle.glitch.me/";
        if (
            !navigator.share ||
            !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            /Firefox/i.test(navigator.userAgent)
        ) {
            if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                addEvent("clickShareClipboard", {
                    name: "clickShareClipboard",
                });

                copiedMessageActive = true;

                setTimeout(() => {
                    copiedMessageActive = false;
                }, 2e3);
                navigator.clipboard.writeText(o);
            } else {
                Promise.reject("There was a problem copying your result to the clipboard");
            }
            navigator
                .share({
                    text: o,
                })
                .then(() => {
                    addEvent("clickSharePanel", {
                        name: "clickSharePanel",
                    });
                })
                .catch(console.error);
        }
    }
</script>

{#if hasFinished}
    <div>
        <p />
        <div />
        {#each Jt as jt, i}
            {#if i <= userGuesses.length - 1}
                {#if userGuesses[i].isSkipped}
                    <div class="w-4 h-1 m-0.5 bg-custom-mg" />
                    >
                {:else if userGuesses[i].isCorrect || userGuesses[i].isSkipped}
                    {#if userGuesses[i].isCorrect}
                        <div class="w-4 h-1 m-0.5 bg-custom-positive" />
                    {:else}
                        {undefined}
                    {/if}
                {:else}
                    <div class="w-4 h-1 m-0.5 bg-custom-negative" />
                {/if}
            {:else}
                <div class="w-4 h-1 m-0.5 bg-custom-fg" />
            {/if}
        {/each}
        <p>
            <!-- W -->
            <!-- Maybe? e[3] -->
            {#if guessRef}
                You didn't get today's TMBG Heardle. Better luck tomorrow! 💎
            {:else}
                <!-- /* Maybe? e[4]*/ -->
                {#if isPrime}
                    You got today's TMBG Heardle within {config.attemptIntervalAlt[config.length - 1] / 1e3 + ""}
                    second{config.attemptIntervalAlt[config.length - 1] / 1e3 > 1 ? "s" : ""}.
                {:else}
                    You got today's TMBG Heardle within the first {(userGuesses.length * config.attemptInterval) / 1e3 +
                        ""} seconds.
                {/if}
            {/if}
        </p>
        <!-- R && R.c() -->
        <!-- e[5] -->
        {#if copiedMessageActive}
            <div class="tracking-widest uppercase text-xs text-custom-line p-3 pb-0 text-center">
                Copied to clipboard!
            </div>
        {/if}
        <div>
            <Button primary={true}>
                Share
                <svg
                    class="inline-block ml-2"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewbox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
            </Button>>
        </div>
    </div>
    <div>
        <div>
            <div>Next TMBG song in:</div>
            <!-- S -->
        </div>
        <div>
            <div Y>
                <Donate />
            </div>
        </div>
    </div>
{/if}
