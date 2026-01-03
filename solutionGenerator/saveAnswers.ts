import fs from "fs";
import { Answer } from "./types/Answer.js";
import { kidAlbums } from "./kidAlbums.js";

export function saveAnswers(answers: Answer[]) {
    const annotated: Answer[] = [];

    for (let i = 0; i < answers.length; i++) {
        const a = { ...answers[i] };

        const lastAlbum = answers
            .slice(0, i)
            .reverse()
            .find((prev) => prev.album && prev.album === a.album);
        if (lastAlbum) {
            a.lastAlbumDays = Math.floor(
                (new Date(a.date).getTime() - new Date(lastAlbum.date).getTime()) / (1000 * 60 * 60 * 24)
            );
        } else {
            a.lastAlbumDays = null;
        }

        const lastUrl = answers
            .slice(0, i)
            .reverse()
            .find((prev) => prev.url && prev.url === a.url);
        if (lastUrl) {
            a.lastUrlDays = Math.floor(
                (new Date(a.date).getTime() - new Date(lastUrl.date).getTime()) / (1000 * 60 * 60 * 24)
            );
        } else {
            a.lastUrlDays = null;
        }

        if (kidAlbums.includes(a.album)) {
            const lastKidsAlbum = answers
                .slice(0, i)
                .reverse()
                .find((prev) => prev.album && kidAlbums.includes(prev.album));
            if (lastKidsAlbum) {
                a.lastKidsAlbumDays = Math.floor(
                    (new Date(a.date).getTime() - new Date(lastKidsAlbum.date).getTime()) / (1000 * 60 * 60 * 24)
                );
            } else {
                a.lastKidsAlbumDays = null;
            }
        }

        annotated.push(a);
    }

    // Save off the full answer key, to validate future changes against.
    // These won't be pushed. Don't need to make cheating that easy.
    // So save with a datestamp to make comparison easier.
    const today = new Date();
    fs.writeFileSync(`./answerLists/${today.toISOString().split("T")[0]}.json`, JSON.stringify(annotated, null, 4));
}
