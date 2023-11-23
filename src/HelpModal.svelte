<script>
    import { createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";
    const dispatch = createEventDispatcher();

	const onClick = () => dispatch("close");
</script>

<div>
    <div class="flex items-center mb-6">
        <div class="mr-4 w-8 text-custom-line">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-7 w-7"
                ><circle cx="5.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="15.5" r="2.5" /><path
                    d="M8 17V5l12-2v12"
                /></svg
            >
        </div>
        <div><p>Listen to the intro, then find the correct TMBG song in the list.</p></div>
    </div>
    <div class="flex items-center mb-6">
        <div class="mr-4 w-8 text-custom-line">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-6 w-6"
                ><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path
                    d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"
                /></svg
            >
        </div>
        <div><p>Skipped or incorrect attempts unlock more of the intro</p></div>
    </div>
    <div class="flex items-center mb-6">
        <div class="mr-4 w-8 text-custom-line">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-6 w-7"
                ><path
                    d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                /></svg
            >
        </div>
        <div><p>Answer in as few tries as possible and share your score!</p></div>
    </div>
    <div class="justify-center flex py-2 mt-2">
        <Button primary={true} on:click="{onClick}">
            Play
        </Button>
    </div>
</div>
