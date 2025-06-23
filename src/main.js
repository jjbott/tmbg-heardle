import Game from "./Game.svelte";
import App from "./App.svelte";

let game = null;

const startGame = (message) => {
    if (!game) {
        if (message) {
            console.error(message);
        }
        game = new App({
            target: document.body
        });
    }
};

startGame();