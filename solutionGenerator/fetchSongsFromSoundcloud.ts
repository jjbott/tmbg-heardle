import puppeteer from "puppeteer";
import * as fs from "fs";
import { RawSong, Song } from "./types/Song.js";

// TODO: Soundcloud is blocking me now, and so far I havent found a way around it.
// So theres some experimentation in here, but it doesnt work.

export async function fetchSongsFromSoundcloud() {
    const songs: { collection: RawSong[] } = { collection: [] };

    //const browser = await puppeteer.launch({ headless: false, args: ["--incognito"] });
    //const context = browser.defaultBrowserContext();
    //const page = (await context.pages())[0];

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    let clientId = "";

    page.on("request", (request) => {
        //console.log(request.url());
        const url = new URL(request.url());
        const params = new URLSearchParams(url.search);
        if (clientId === "" && params.has("client_id")) {
            clientId = params.get("client_id")!;
            console.log(`found client_id ${clientId}`);
        }
    });

    // Go to a page just to get a client id
    await page.goto("https://soundcloud.com/they-might-be-giants");

    await page.waitForSelector('[id^="ddChallengeContainer"]', { visible: true });

    await page.waitForSelector('[id^="ddChallengeContainer"]', { hidden: true });

    const cookies = await browser.cookies();

    /*
const response = await page.goto(
    `https://api-v2.soundcloud.com/users/30199562/tracks?representation=&client_id=${clientId}&limit=200&offset=0&linked_partitioning=1&app_version=1716534432&app_locale=en`
);
const content = (await response?.text()) ?? "";
const songsResponse = JSON.parse(content) as {
    url: string | undefined;
    collection: RawSong[];
};

if (songsResponse.url) {
    throw new Error("Got blocked: " + songsResponse.url);
}
*/
    await new Promise((resolve) => setTimeout(resolve, 30000));
    let url: string | null =
        `https://api-v2.soundcloud.com/users/30199562/tracks?offset=0&limit=50&app_version=1774492604`;
    while (url) {
        const songPageResponse = await page.goto(url + `&client_id=${clientId}`, {});
        const songPage = (await songPageResponse!.json()) as {
            url: string | undefined;
            next_href: string | null;
            collection: RawSong[];
        };

        if (songPage.url) {
            throw new Error("Got blocked: " + songPage.url);
        }

        if (songPage.collection) {
            songs.collection.push(...songPage.collection);
        }

        url = songPage.next_href;
        if (url) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    await browser.close();

    /*
let url : string | null = `https://api-v2.soundcloud.com/users/30199562/tracks?offset=0&limit=50&app_version=1774492604`;
while (url) {
    const songPageResponse = await fetch(url + `&client_id=${clientId}`);
    const songPage = (await songPageResponse.json()) as {
        url: string | undefined;
        next_href: string | null;
        collection: RawSong[];
    };

    if( songPage.url ) {
        throw new Error("Got blocked: " + songPage.url);
    }
    
    if ( songPage.collection ) {
        songs.collection.push(...songPage.collection);
    }

    url = songPage.next_href;
    if ( url){
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}
*/
    return songs;
}
