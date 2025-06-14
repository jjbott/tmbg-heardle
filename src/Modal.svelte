<script>
    import { createEventDispatcher, onDestroy, setContext } from "svelte";
    const dispatch = createEventDispatcher();
    const close = () => {
        dispatch("close");
    };

    setContext("onClose", close);

    const dismiss = () => {
        if (isDismissable) {
            close();
        }
    };

    let modal;

    export let title;
    export let hasFrame;
    export let isDismissable = true;

    const handle_keydown = (e) => {
        if (e.key === "Escape") {
            close();
            return;
        }

        if (e.key === "Tab") {
            // trap focus
            const nodes = modal.querySelectorAll("*");
            const tabbable = Array.from(nodes).filter((n) => n.tabIndex >= 0);

            let index = tabbable.indexOf(document.activeElement);
            if (index === -1 && e.shiftKey) index = 0;

            index += tabbable.length + (e.shiftKey ? -1 : 1);
            index %= tabbable.length;

            tabbable[index].focus();
            e.preventDefault();
        }
    };

    const previously_focused = typeof document !== "undefined" && document.activeElement;

    if (previously_focused) {
        onDestroy(() => {
            previously_focused.focus();
        });
    }
</script>

<svelte:window on:keydown={handle_keydown} />

<div class="modal-background p-3 flex justify-center svelte-1nyqrwd" on:click={dismiss} />
<div class="modal-background p-3 pointer-events-none svelte-1nyqrwd">
    <div
        bind:this={modal}
        class="pointer-events-auto modal max-w-screen-xs w-full mx-auto top-20 relative rounded-sm"
        role="dialog"
        aria-modal="true"
    >
        {#if hasFrame == 0}
            <!-- svelte-ignore a11y-autofocus -->
            <button autofocus class="border-none text-custom-mg absolute right-3 top-3" on:click={close}>
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
            <slot/>
        {:else}
            <div class="bg-custom-bg border border-custom-mg p-6">
                <div class="flex items-center justify-center mb-6">
                    <div class="flex-1 pl-7">
                        <h2 class="text-sm text-center uppercase text-custom-line font-semibold tracking-widest">
                            {title}
                        </h2>
                    </div>
                    {#if isDismissable}
                        <div class="justify-self-end flex">
                            <!-- svelte-ignore a11y-autofocus -->
                            <button class="border-none text-custom-mg" autofocus on:click={close}>
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
                    {/if}
                </div>
                <slot/>
            </div>
        {/if}
    </div>
</div>
