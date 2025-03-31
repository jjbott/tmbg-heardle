import puppeteer from "puppeteer";
import * as fs from "fs";

const browser = await puppeteer.launch();
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

// To go a page just to get a client id
await page.goto("https://soundcloud.com/they-might-be-giants");

await browser.close();

const songsResponse = await fetch(
    `https://api-v2.soundcloud.com/users/30199562/tracks?representation=&client_id=${clientId}&limit=10000&offset=0&linked_partitioning=1&app_version=1716534432&app_locale=en`
);
const songs = await songsResponse.json();

try {
    fs.mkdirSync("./cache/");
} catch (e) {}

fs.writeFileSync("./cache/rawSongData.json", JSON.stringify(songs, null, 4));

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

for(const s of songs.collection) {
    const id: number = s.id;
    if (!fs.existsSync(`./cache/waveforms/${id}.json`)) {
        const waveformUrl = s.waveform_url;

        const waveformResponse = await fetch(waveformUrl);
        const waveformData = await waveformResponse.text();
        fs.writeFileSync(`./cache/waveforms/${id}.json`, waveformData);
        await sleep(500);
    }
};

const cleanedUp = songs.collection
    .map((s) => ({
        id: s.id,
        // Looks like `duration` is the duration available for me to listen to as a free user.
        // `full_duration` appears to be the full song duration
        // duration: s.duration,
        duration: s.full_duration,
        url: s.permalink_url,
        title: s.title,
        album: s.publisher_metadata?.album_title ?? "",
        artist: s.publisher_metadata?.artist
    }))
    .toSorted((a, b) => {
        const sorts = [a.album.localeCompare(b.album), a.title.localeCompare(b.title), a.url.localeCompare(b.url)];
        return sorts.find((s) => s !== 0) ?? 0;
    });

fs.writeFileSync("./cache/songData.json", JSON.stringify(cleanedUp, null, 4));

const g = 56;
