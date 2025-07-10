<script>
    import TmbgShop from "./TmbgShopButton.svelte";
    import Version from "./Version.svelte";
</script>

<div class="text">
    <p class="mb-3">A clone of Heardle (now defunct) but for songs by the band They Might Be Giants.</p>

    <p class="mb-3">Each TMBG Heardle is randomly chosen from TMBG's discography.</p>
    <p />
    <p class="mb-3">
        Having problems? Create an issue on <a href="https://github.com/jjbott/tmbg-heardle">Github</a>!
    </p>
    <p />
    <p class="mb-3">
        <TmbgShop />
    </p>
    <p />
    <p class="text-xs mb-3 text-custom-line">
        Prepared with <a href="https://developers.soundcloud.com">Soundcloud</a>,
        <a href="https://svelte.dev">Svelte</a>,
        <a href="https://tailwindcss.com">Tailwind</a>,

        <a href="https://fonts.google.com/noto/specimen/Noto+Serif+Display">Noto Serif Display</a>,
        <a href="https://fonts.google.com/noto/specimen/Noto+Sans">Noto Sans</a>,

        <a href="https://iconsvg.xyz">IconSVG</a>, <a href="https://momentjs.com">momentjs</a>,

        <a href="https://tarekraafat.github.io/autoComplete.js/#/">autocomplete.js</a>, and powered by
        <a href="https://pages.cloudflare.com/">Cloudflare</a>. Original Heardle by
        <a href="https://omakase.studio" title="Studio Omakase">Studio omakase / お任せ</a>. TMBG version is currently
        maintained by <a href="https://twitter.com/ZorMonkey">Joe</a>. Original was created by
        <a href="https://twitter.com/ckolderup">casey</a>
    </p>
    <p class="text-xs mb-3 text-custom-line">Not affiliated with They Might Be Giants</p>
    <p class="text-xxs mb-3 text-custom-line" style="text-align:right;color:#666"><Version/></p>
</div>
