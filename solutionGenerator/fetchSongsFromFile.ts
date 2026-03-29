// created by going to a url like `https://api-v2.soundcloud.com/users/30199562/tracks?offset=0&limit=200&client_id={clientid}`,
// and copying the response into `rawPagedData.json`, and repeating for each page.
import rawPagedData from "./rawPagedData.json" with { type: "json" };
import { RawSong } from "./types/Song.js";

export async function fetchSongsFromFile() {
    const songs: { collection: RawSong[] } = { collection: [] };

    rawPagedData.forEach(({ collection }) => {
        songs.collection.push(...(collection as RawSong[]));
    });
    return songs;
}
