<script>
    import { ga } from "@beyonk/svelte-google-analytics";
    import TmbgShop from "./TmbgShopButton.svelte";
    import Button from "./Button.svelte";
    import TimeRemaining from "./TimeRemaining.svelte";

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
                ga.addEvent("clickShareClipboard", {
                    name: "clickShareClipboard",
                });

                copiedMessageActive = true;

                setTimeout(() => {
                    copiedMessageActive = false;
                }, 2e3);
                return navigator.clipboard.writeText(o);
            } else {
                return Promise.reject("There was a problem copying your result to the clipboard");
            }

            navigator
                .share({
                    text: o,
                })
                .then(() => {
                    ga.addEvent("clickSharePanel", {
                        name: "clickSharePanel",
                    });
                })
                .catch(console.error);
        }
    }
</script>

{#if hasFinished}
    <div class="text-center px-3">
        <p class="text-lg text-custom-line">
            <!-- A -->
            {Jt[guessRef] + ""}
        </p>
        <div class="flex justify-center my-2">
            {#each Array(config.maxAttempts) as jt, i}
                {#if i <= userGuesses.length - 1}
                    {#if userGuesses[i].isSkipped}
                        <div class="w-4 h-1 m-0.5 bg-custom-mg" />
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
        </div>
        <p class="py-1">
            <!-- W -->
            <!-- Maybe? e[3] -->
            {#if 0 == guessRef}
                <!-- un -->
                You didn't get today's TMBG Heardle. Better luck tomorrow! 💎
            {:else if isPrime}<!-- /* Maybe? e[4]*/ -->
                <!-- ln -->
                You got today's TMBG Heardle within {config.attemptIntervalAlt[userGuesses.length - 1] / 1e3 + ""}
                second{config.attemptIntervalAlt[userGuesses.length - 1] / 1e3 > 1 ? "s" : ""}.
            {:else}
                <!-- an -->
                You got today's TMBG Heardle within the first {(userGuesses.length * config.attemptInterval) / 1e3 + ""}
                seconds.
            {/if}
        </p>
        <!-- R && R.c() -->
        <!-- e[5] -->
        {#if copiedMessageActive}
            <div class="tracking-widest uppercase text-xs text-custom-line p-3 pb-0 text-center">
                Copied to clipboard!
            </div>
        {/if}
        <div class="flex flex-col justify-center items-center pt-3">
            <Button primary={true} on:click={onCopyToClipboard}>
                <!-- dn -->
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
            </Button>
        </div>
    </div>
    <div>
        <div class="flex flex-col justify-center items-center mb-6 mx-3">
            <div class="text-center text-custom-line text-sm">Next TMBG song in:</div>
            <!-- qt -->
            <TimeRemaining />
        </div>
        <div class="bg-custom-highlight py-3 pb-5 mx-3 rounded-t-md">
            <div class="flex justify-center items-center mb-3">
                <span class="text-custom-negative"
                    ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke=""
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path
                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                        /></svg
                    ></span
                >
                <span class="px-1">TMBG?</span>
            </div>
            <TmbgShop />
        </div>
    </div>
{/if}
