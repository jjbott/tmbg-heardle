To update the list of songs from SoundCloud, run `npx tsx ./updateSongList.ts`
This will update `./cache/rawSongData.json` `./cache/songData.json`

To process the song list and generate an updates list of solutions, run `npx tsx ./generateSolutions.ts`
This will update `./cache/processedSongData.json`, `../src/Solutions.js`, and also output a new answer list in `./answerLists`

Good luck, it's wild in there.