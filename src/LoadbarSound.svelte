<script>
    export let musicIsPlaying;
</script>

<!-- Displays https://css.gg/loadbar-sound, although the animation seems slightly different. -->
<!-- Allows toggling the animation to show if the music playing or not, but that functionality isn't used. -->
<!-- There is some Svelte class magic (`svelte-15swa4o`) that I'm ignoring for now -->
<div class="scale-150 transform relative"><i class="gg-loadbar-sound svelte-15swa4o" class:musicIsPlaying /></div>
