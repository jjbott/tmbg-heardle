<script>
  export let primary = false;
  export let secondary = false;
</script>

<button
  class="px-2 py-2 uppercase tracking-widest bg-custom-mg border-none flex items-center font-semibold text-sm svelte-1r54uzk"
  class:bg-custom-positive={primary}
  class:bg-custom-mg={secondary}
  on:click><slot /></button
>
