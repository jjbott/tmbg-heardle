import Game from "./Game.svelte";

let game = null;

const startGame = (message) => {
    if (!game) {
        if (message) {
            console.error(message);
        }
        game = new Game({
            target: document.body
        });
    }
};

localStorage.removeItem("userStats");
localStorage.removeItem("firstTime");
localStorage.removeItem("migrated");

if (localStorage.getItem("migrated") === "true") {
    startGame();
} else {
    try {
        const statTransferUrl = "https://nasal-bittersweet-smell.glitch.me/public/statTransfer.html";

        fetch(statTransferUrl, { method: "HEAD" })
            .then((response) => {
                if (!response.ok) {
                    startGame("Stat transfer page not found. Starting game without stats transfer.");
                    return;
                } else {
                    const iframe = document.createElement("iframe");
                    iframe.id = "statTransfer";
                    iframe.src = statTransferUrl;
                    //iframe.style.display = "none";
                    //iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
                    document.body.appendChild(iframe);

                    /*
                    window.addEventListener(
                        "message",
                        (event) => {
                            if (event.data.statTransfer && typeof event.data.statTransfer === "object") {
                                const { userStats, firstTime } = event.data.statTransfer;
                                if (userStats) {
                                    localStorage.setItem("userStats", event.data.statTransfer.userStats);
                                }
                                if (firstTime) {
                                    localStorage.setItem("firstTime", event.data.statTransfer.firstTime);
                                }
                                localStorage.setItem("migrated", "true");
                                startGame("Game started after stat migration!");
                            }
                        },
                        false
                    );

                    iframe.onerror = () => {
                        startGame("Error loading iframe");
                    };

                    setTimeout(() => {
                        startGame("Timeout waiting for iframe. Starting without stats transfer");
                    }, 30000);
                    */
                    startGame("Stat transfer iframe loaded.");
                }
            })
            .catch((error) => {
                startGame("Error fetching stat transfer page. Starting game without stats transfer.");
            });
    } catch (error) {
        startGame("Error during game initialization. Starting without stats transfer.");
    }
}

//export default game;
