<script>
    import {createEventDispatcher} from 'svelte'
    const dispatch = createEventDispatcher();
    const onClose = () => dispatch("close");

    export let title;
    export let hasFrame;
    //export let onClick;

    let modalDiv;

    const onKeyDown = (e) => {
        if ("Escape" !== e.key) {
            if ("Tab" === e.key) {
                const t = a.querySelectorAll("*");
                n = Array.from(t).filter((e) => e.tabIndex >= 0);
                let r = n.indexOf(document.activeElement);
                -1 === r && e.shiftKey && (r = 0),
                    (r += n.length + (e.shiftKey ? -1 : 1)),
                    (r %= n.length),
                    n[r].focus(),
                    e.preventDefault();
            }
        } else onClose();
    };
</script>

<svelte:window on:keydown={onKeyDown} />

<div class="modal-background p-3 flex justify-center svelte-1nyqrwd" on:click={onClose} />
<div class="modal-background p-3 pointer-events-none svelte-1nyqrwd">
    <div
        bind:this={modalDiv}
        class="pointer-events-auto modal max-w-screen-xs w-full mx-auto top-20 relative rounded-sm"
        role="dialog"
        aria-modal="true"
    >
        {#if hasFrame == 0}
            <button autofocus class="border-none text-custom-mg absolute right-3 top-3" on:click={onClose}>
                <svg
                    class="w-7 h-7"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg
                >
            </button>
            <slot />
        {:else}
            <div class="bg-custom-bg border border-custom-mg p-6">
                <div class="flex items-center justify-center mb-6">
                    <div class="flex-1 pl-7">
                        <h2 class="text-sm text-center uppercase text-custom-line font-semibold tracking-widest">
                            {title}
                        </h2>
                    </div>
                    <div class="justify-self-end flex">
                        <button class="border-none text-custom-mg" autofocus on:click={onClose}>
                            <svg
                                class="w-7 h-7"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg
                            >
                        </button>
                    </div>
                </div>
                <slot />
            </div>
        {/if}
    </div>
</div>
