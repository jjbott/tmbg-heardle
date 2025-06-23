<script>
    import { onMount, onDestroy } from "svelte";
    import Button from "./Button.svelte";

    let userData = JSON.stringify(localStorage);
    let objectUrl = "";
    const timestamp = new Date().toISOString().replace(/[-:T]/gi, "").slice(0, 14);
    const filename = `tmbgHeardleStats-${timestamp}.json`;

    onMount(() => {
        const file = new Blob([userData], { type: "application/json" });
        objectUrl = URL.createObjectURL(file);
    });

    onDestroy(() => {
        URL.revokeObjectURL(objectUrl);
    });
</script>

<a
    class="px-2 py-2 uppercase tracking-widest border-none flex items-center font-semibold text-sm svelte-1r54uzk bg-custom-positive"
    href={objectUrl}
    download={filename}
    >Export Stats<span
        ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5" /></svg
        ></span
    ></a
>
