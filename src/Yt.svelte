<script>
    import { onMount, createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";

    let guess;
    export let allOptions;
    export let currentAttempt;
    export let config;
    export let isPrime;

    const l = {
        focus() {
            document.getElementById("autoComplete").focus();
        },
        clear() {
            document.getElementById("autoComplete").value = "";
            guess = "";
        },
    };
    const dispatch = createEventDispatcher();

    function c(e) {
        "skipped" == e
            ? (dispatch("guess", {
                  guess: guess,
                  isSkipped: !0,
              }),
              (guess = ""))
            : undefined !== guess && "" !== guess.trim()
            ? (dispatch("guess", {
                  guess: guess,
                  isSkipped: !1,
              }),
              (guess = ""))
            : l.focus();
    }
    onMount(() => {
        !(function () {
            const e = new autoComplete({
                placeHolder: "Know it? Search for the artist / title",
                threshold: 1,
                wrapper: !1,
                resultsList: {
                    maxResults: 6,
                },
                diacritics: !0,
                noresults: !0,
                searchEngine: "loose",
                data: {
                    src: allOptions,
                    cache: !1,
                    filter: (e) => {
                        if (e.length < 6) return e;
                        const t = document.getElementById("autoComplete").value.toLowerCase();
                        return (e = e.sort((e, n) => {
                            let r = diceCoefficient(t, e.value.toLowerCase()),
                                s = diceCoefficient(t, n.value.toLowerCase());
                            return r === s ? (e.value > n.value ? -1 : 1) : s > r ? 1 : -1;
                        }));
                    },
                },
                resultItem: {
                    highlight: !0,
                },
                events: {
                    focus: {
                        focus: (e) => {},
                    },
                    input: {
                        selection: (t) => {
                            const s = t.detail.selection.value;
                            e.input.value = s;
                            guess = s;
                        },
                    },
                },
            });
        })();
    });

    
    export const guessInput = () => l;

    export const togglePlayState = () => {
        soundcloudWidget.toggle();
    };

    nGram(3);
</script>

<div class="max-w-screen-sm w-full mx-auto flex-col">
    <div class="m-3 mt-0">
        <div>
            <div class="autoComplete_wrapper relative" on:click={() => l.clear()}>
                <svg
                    class="absolute top-4 left-3"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    bind:value={guess}
                    class="focus:outline-none focus:border-custom-positive w-full p-3 pl-9 placeholder:text-custom-line bg-custom-bg text-custom-fg border-custom-mg"
                    id="autoComplete"
                    type="search"
                    dir="ltr"
                    spellcheck="false"
                    autocorrect="off"
                    autocomplete="off"
                    autocapitalize="off"
                />
                <div class="absolute right-3 top-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg
                    >
                </div>
            </div>
            <div class="flex justify-between pt-3">
                <!-- v -->
                <Button secondary={true} on:click={() => c("skipped")}>
                    <!-- Mt -->
                    {#if isPrime}
                        <!-- St -->
                        Skip
                        <span class="tracking-normal lowercase" class:hidden={currentAttempt >= config.maxAttempts}>
                            (+{currentAttempt}s)
                        </span>
                    {:else}
                        <!-- bt -->
                        Skip <span>(+1.5s)</span>
                    {/if}
                </Button>

                <!-- b -->
                <Button primary={true} on:click={c}>
                    <!-- $t -->
                    Submit
                </Button>
            </div>
        </div>
    </div>
</div>
