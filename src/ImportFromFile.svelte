<script>
    import { createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";
    import { importStats } from "./importStats";

    
    const dispatch = createEventDispatcher();

    const handleFileUpload = (event) => {
        const file = event.target.files[0]; // Get the selected file
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const fileContent = reader.result; // Store the file's content as a string
                try {
                    const parsedContent = JSON.parse(fileContent);
                    if (parsedContent && typeof parsedContent === "object" && parsedContent.userStats) {
                        importStats(JSON.parse(parsedContent.userStats || "[]"));
                        dispatch("importComplete");
                    } else {
                        alert("Invalid stats file");
                        return;
                    }
                } catch (error) {
                    alert("Invalid stats file");
                    return;
                }
                console.log("File content:", fileContent); // Debugging
            };
            reader.readAsText(file); // Read the file as text
        }
    };
</script>

<input id="fileInput" type="file" accept=".json" on:change={handleFileUpload} style="display:none" />
<label
    for="fileInput" 
    class="px-2 py-2 uppercase tracking-widest border-none flex items-center font-semibold text-sm svelte-1r54uzk bg-custom-positive"
    >Import Stats<span
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
            ><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 4.2v10.3" /></svg
        ></span
    ></label
>
