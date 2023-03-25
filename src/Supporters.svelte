<script>
    import {onMount} from 'svelte'
    import EmptyDiv from "./EmptyDiv.svelte";

    let supporters;

    onMount(async () => {
        (async function () {
            const e = await fetch("https://tmbg-heardle.glitch.me/supporters.json");
            return await e.json();
        })().then((e) => {
            supporters = e.supporters;
        });
    });
</script>

{#if supporters}
    <div class="relative">
        <div class="flex justify-center items-center mt-6 mb-1" />
        <div class="text-custom-mg text-xs h-32 overflow-scroll relative">
            <p class="pb-6">
                <span class="text-custom-negative" />
                {supporters}
            </p>
        </div>
        <div
            class="absolute h-6 bottom-0 w-full border-custom-fg "
            style:background="linear-gradient(to bottom, rgba(18,18,18,0), rgba(18,18,18,1)) no-repeat bottom"
            style:background-size="100% 100%"
        />
    </div>
{:else}
    <EmptyDiv />
{/if}
