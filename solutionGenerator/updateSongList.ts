import puppeteer from "puppeteer";
import * as fs from "fs";
import { RawSong, Song } from "./types/Song.js";
import { fetchSongsFromSoundcloud } from "./fetchSongsFromSoundcloud.js";
import { fetchSongsFromFile } from "./fetchSongsFromFile.js";

const songs: { collection: RawSong[] } = await fetchSongsFromFile();

songs.collection = songs.collection.sort((a: RawSong, b: RawSong) => a.id - b.id) as RawSong[];

// clean up the raw song data a _touch_
songs.collection.forEach((s) => {
    // These appear to be JWTs that change every time.
    // No need to save them off
    s.track_authorization = null;

    // These counts will chnage every time, making the diff noisier
    s.likes_count = 0;
    s.playback_count = 0;
    s.user.followers_count = 0;
});

try {
    fs.mkdirSync("./cache/");
} catch (e) {}

fs.writeFileSync("./cache/rawSongData.json", JSON.stringify(songs, null, 4));

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// The intent is to someday use the waveform data to adjust songs that start very quiet.
// Ex: Istanbul is very hard to guess from the first second because it's basically silent.
// Not sure how I'd change the game to handle those yet though, so these are ultimately unused.
for (const s of songs.collection) {
    const id: number = s.id;
    if (!fs.existsSync(`./cache/waveforms/${id}.json`)) {
        const waveformUrl = s.waveform_url;

        const waveformResponse = await fetch(waveformUrl);
        const waveformData = await waveformResponse.text();
        fs.writeFileSync(`./cache/waveforms/${id}.json`, waveformData);
        await sleep(500);
    }
}

const songData = songs.collection.map(
    (s) =>
        ({
            id: s.id,
            // Looks like `duration` is the duration available for me to listen to as a free user.
            // `full_duration` appears to be the full song duration
            // duration: s.duration,
            duration: s.full_duration,
            url: s.permalink_url,
            title: s.title,
            album: s.publisher_metadata?.album_title ?? "",
            artist: s.publisher_metadata?.artist
        }) as Song
);

fs.writeFileSync("./cache/songData.json", JSON.stringify(songData, null, 4));

const g = 56;
