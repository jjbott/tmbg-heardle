<script>
    import { ga } from "@beyonk/svelte-google-analytics";
</script>

<div class="text-center flex justify-center items-center flex-col">
    <a
        class="tmbgshop-button py-2 px-3 rounded-lg items-center flex svelte-1d3p4dy"
        href="https://tmbgshop.com/"
        title="Support They Might Be Giants"
        target="_blank"
        on:click={() => {
            ga.addEvent("clickTmbgShop", {
                name: "clickTmbgShop",
            });
        }}
    >
        <span class="tmbgshoptext svelte-1d3p4dy"
            ><img src="/build/tmbglogo.png" alt="TMBG Shop" class="tmbgshopimg mr-2 mb-1 svelte-1d3p4dy" />Support They
            Might Be Giants </span
        ><svg
            xmlns="http://www.w3.org/2000/svg"
            class="ml-2"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><g fill="none" fill-rule="evenodd"
                ><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h5M15 3h6v6M10 14L20.2 3.8" /></g
            ></svg
        >
    </a>
</div>
