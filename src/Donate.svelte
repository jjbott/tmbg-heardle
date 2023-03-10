<div class="text-center flex justify-center items-center flex-col ">
    <a class="kofi-button py-2 px-3 rounded-lg items-center flex  svelte-1d3p4dy" href="https://ko-fi.com/heardle" title="Support the Heardle devs on Ko-Fi"
    on:click={() => {
        addEvent("clickKofi", {
          name: "clickKofi",
        })}}>
        <span class="kofitext svelte-1d3p4dy"><img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="Ko-fi donations" class="kofiimg mr-2 mb-1 svelte-1d3p4dy"/>Support the Heardle devs on Ko-Fi</span><svg xmlns="http://www.w3.org/2000/svg" class="ml-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"></path></svg> 
    </a>
</div>