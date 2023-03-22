<script>
    import { ga } from "@beyonk/svelte-google-analytics";

    import Button from "./Button.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    function pe(e, t) {
        t.send_to || delete t.send_to,
            ce.update((n) => [
                ...n,
                {
                    event: e,
                    data: t,
                },
            ]);
    }

    function openModal(e, n, r) {
        dispatch("modal", {
            name: e,
            title: n,
            hasFrame: r,
        });
    }
</script>

<header class="border-b border-custom-line">
    <div class="max-w-screen-md mx-auto">
        <div class="flex justify-evenly text-custom-fgcolor p-3 items-center">
            <div class="flex flex-1">
                <Button
                    on:click={() => {
                        openModal("info", "about");
                        ga.addEvent("clickInfo", {
                            name: "clickInfo",
                        });
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                </Button>
                <Button
                    on:click={() => {
                        openModal("donate", "support");
                        ga.addEvent("clickDonate", {
                            name: "clickDonate",
                        });
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                        />
                    </svg>
                </Button>
            </div>
            <h1 class="font-serif text-3xl font-bold flex-grow text-center flex-1">TMBG Heardle</h1>
            <div class="flex flex-1 justify-end">
                <Button
                    on:click={() => {
                        openModal("results", "stats");
                        ga.addEvent("clickStats", {
                            name: "clickStats",
                        });
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                </Button>
                <Button
                    on:click={() => {
                        openModal("help", "how to play");
                        ga.addEvent("clickHelp", {
                            name: "clickHelp",
                        });
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </Button>
            </div>
        </div>
    </div>
</header>
