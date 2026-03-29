import { normalize } from "./generateSolutions.js";

export function findDuplicateTitles(songs: { title: string; url: string }[]) {
    // Find songs with titles that are "too close"
    // Usually indicates a casing mismatch that I missed
    // Important because:
    // * We use the title to detect duplicate tracks. Minor incorrect differences breaks that
    // * We dont want titles with minor differences in the game's answer list. They'd usually be duplicates with casing issues.
    const matches: { song: { title: string; url: string }; duplicates: { title: string; url: string }[] }[] = [];
    songs.forEach((s) => {
        if (matches.some((m) => m.duplicates.some((d) => d.url === s.url))) {
            return;
        }

        let m = songs.filter((t) => t.title !== s.title && normalize(t.title) === normalize(s.title));
        if (m.length >= 1) {
            matches.push({ song: s, duplicates: m });
        }
    });

    matches.forEach(({ song, duplicates }) => {
        console.log("Normalized Match");
        console.log(`    this: '${song.title}', ${song.url}`);
        duplicates.forEach((match) => {
            console.log(`    match:'${match.title}', ${match.url}`);
        });
    });
    if (matches.length > 0) {
        throw new Error("Found duplicate titles. Please fix these before proceeding.");
    }
}
