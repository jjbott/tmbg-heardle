import * as fs from "fs";
import { diceCoefficient } from "dice-coefficient";
import prettier from "prettier";
import CRC32 from "crc-32";

import { startDate, idOffset, potentialAnswers as potentialAnswersRaw, answerIndexes } from "../src/Solutions.js";
import { Answer } from "./types/Answer.js";
import { saveAnswers } from "./saveAnswers.js";
import { kidAlbums } from "./kidAlbums.js";
import { ProcessedSong, Song } from "./types/Song.js";
import { findDuplicateTitles } from "./findDuplicateTitles.js";
import { findNearDuplicateTitles } from "./findNearDuplicateTitles.js";
import { fixTitle, fixTitles } from "./fixTitles.js";

const generateStarting = "2026-04-01";
const generateThrough = "2030-12-31";

// At least 6 months before we can see the same answer again
const minDaysBetweenSameAnswer = 180;

// At least 10 days before we can see the same album again
const minDaysBetweenSameAlbum = 10;

const minDaysBetweenAnyKidsAlbum = 15;
const minDaysBetweenSameKidsAlbum = 30;

// `potentialAnswers` in Solutions.js will have ` - They Might Be Giants` appended to the answers.
// Strip those so they match the actual titles
const oldPotentialAnswers = potentialAnswersRaw.map((a) => ({
    ...a,
    answer: a.answer.replace(" - They Might Be Giants", "")
}));

export function normalize(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9 ]/g, "");
}

export let songs = JSON.parse(fs.readFileSync("./cache/songData.json").toString()) as ProcessedSong[];

songs.forEach((s) => {
    // We'll be mucking with titles later.
    // Store off the original so we can still easily differentiate when needed.
    s.originalTitle = s.title;
});
    
fixTitles(songs);

findDuplicateTitles(songs);
findNearDuplicateTitles(songs);

// Filtering out all tracks without an album that are also listed in an album
let filteredData: any[] = [];
var albumTracks = songs.filter((e) => e.album);
songs.forEach((s) => {
    if (!s.album) {
        const albumTrack = albumTracks.find((at) => at.title == s.title);
        if (!albumTrack) {
            return true;
        } else {
            // This track does not have an album, but there are no matches with an album, so keep it.
            s.exclusionReason = `Has no album, but found matching track on "${albumTrack.album}" with url ${albumTrack.url}`;
        }
    }
});

// TODO: For debugging, remove
fs.writeFileSync("./cache/processedSongData.json", JSON.stringify(songs, null, 4));

filteredData = [];
songs.forEach((s) => {
    // Exceptions to the below
    // We mostly dont want compilations/live albums, but there are exceptions with individual tracks.
    // Notably "Doctor Worm" is on a "live" album, but it's not live.
    // TODO: There are probably lots more that we could add
    const allowedTracks = [
        "https://soundcloud.com/they-might-be-giants/doctor-worm",
        "https://soundcloud.com/they-might-be-giants/severe-tire-damage-theme",
        // At a quick glance I think these 'Then: The Earlier Years' tracks are fine. I hope... *I* like them anyways
        "https://soundcloud.com/they-might-be-giants/now-that-i-have-everything",
        "https://soundcloud.com/they-might-be-giants/weep-day",
        "https://soundcloud.com/they-might-be-giants/im-gettin-sentimental-over-you",
        "https://soundcloud.com/they-might-be-giants/become-a-robot",
        // Fairly distinct from the other verion, so not really a dupe
        "https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine-the-1",
        "https://soundcloud.com/they-might-be-giants/robot-parade-adult-version",
        "https://soundcloud.com/they-might-be-giants/kiss-me-sun-of-god-alternate"
    ];
    if (allowedTracks.find((t) => t == s.url)) {
        return;
    }

    // Skip anything from a live album
    // They tend to start with nonsense, which is unfair.
    // Many could be fine, but limiting to studio versions for now.
    if (s.album == "Severe Tire Damage" || s.album == "At Large" || s.album == "Beast of Horns (Sampler)") {
        s.exclusionReason = "Live Track";
        return;
    }

    var matches = songs.filter((t) => t.title === s.title && t.url !== s.url);
    if (matches.length === 0) {
        return;
    }

    // Prefer main releases
    const mainReleases = [
        "Apollo 18",
        "BOOK",
        "Factory Showroom",
        "Flood",
        "Glean",
        "Here Come the 123s",
        "Here Comes Science",
        "I Like Fun",
        "John Henry",
        "Join Us",
        "Lincoln",
        "Long Tall Weekend",
        "Mink Car",
        "No!",
        "The Spine",
        "They Might Be Giants: Here Come the ABCs",
        "They Might Be Giants"
    ];
    const songOnMainRelease = mainReleases.find((mr) => mr === s.album);
    const matchesOnMainRelease = matches.filter((m) => mainReleases.find((mr) => mr === m.album));
    if (matchesOnMainRelease.length > 0) {
        if (songOnMainRelease) {
            // These have matches on other "main" albums.
            // Leave these alone and let the other be treated as a dupe
            if (s.album === "No!" || s.album === "Mink Car") {
                return;
            }

            // These albums are the ones causing dupes on the above.
            // Throw for anything else
            if (s.album !== "They Might Be Giants: Here Come the ABCs" && s.album !== "Long Tall Weekend") {
                throw new Error(`Song ${s.title} on 'main' release has a match on another 'main' release`);
            }
        }
        s.exclusionReason = `Matching track on main release '${matchesOnMainRelease[0].album}'`;
        return;
    }
});

// TODO: For debugging, remove
fs.writeFileSync("./cache/processedSongData.json", JSON.stringify(songs, null, 4));

// Duplicate title check
let byTitle = Object.groupBy(
    songs.filter((s) => !s.exclusionReason),
    (s) => s.title
);
Object.keys(byTitle)
    .filter((title) => byTitle[title]!.length > 1)
    .forEach((title) => {
        /*if (s.album == "Severe Tire Damage" || s.album == "At Large") {
        // Letting these live versions create "duplicates". Their titles match the studio versions.
        // I think thats fine. Dont really want both a (for example) `Ana Ng` and `Ana Ng (Live)` in the answer lists
        return true;
    }*/

        /*
    var existingTitleMatches = songs.filter(s => !s.exclusionReason).filter(
        (t) =>
            normalize(t.title) == normalize(s.title) &&
            // Ignore the albums we allowed above, otherwise they'll block studio albums
            t.album != "Severe Tire Damage" &&
            t.album != "At Large"
    );
*/
        const matchingSongs = byTitle[title]!;

        if (
            title == "Why Does the Sun Shine? (The Sun Is a Mass of Incandescent Gas)" &&
            matchingSongs.length === 2 &&
            matchingSongs.find((s) => s.url === "https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine") &&
            matchingSongs.find(
                (s) => s.url === "https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine-the-1"
            )
        ) {
            // These are distinct studio tracks. I'm fine keeping them both, mapping to the same title.
            return;
        }

        if (title == "We Live in a Dump") {
            // Choose the version from "Cast Your Pod to the Wind"
            matchingSongs
                .filter((s) => s.url != "https://soundcloud.com/they-might-be-giants/we-live-in-a-dump-2")
                .forEach((s) => {
                    s.exclusionReason = 'Used the version from "Cast Your Pod to the Wind"';
                });

            return;
        }

        // Prefer "Miscellaneous T" over "Then: The Earlier Years"
        // Didnt add "Miscellaneous T" to the list of "main" albums
        // because then (for example) it could get picked instead of
        // "They Might Be Giants" for "Don't Let's Start"
        if (
            matchingSongs.length == 2 &&
            matchingSongs.find((s) => s.album === "Miscellaneous T") &&
            matchingSongs.find((s) => s.album === "Then: The Earlier Years")
        ) {
            matchingSongs.find((s) => s.album === "Then: The Earlier Years")!.exclusionReason =
                'Used the version from "Miscellaneous T"';

            return;
        }

        if (
            matchingSongs.length == 2 &&
            matchingSongs.find((s) => s.album === "Working Undercover for the Man") &&
            matchingSongs.find((s) => s.album === "They Got Lost")
        ) {
            matchingSongs.find((s) => s.album === "They Got Lost")!.exclusionReason =
                'Used the version from "Working Undercover for the Man"';

            return;
        }

        if (
            matchingSongs.length == 2 &&
            matchingSongs[0].album == "Venue Songs" &&
            matchingSongs[1].album == "Venue Songs" &&
            matchingSongs.find((s) => s.originalTitle.includes(" (In Situ)")) &&
            matchingSongs.find((s) => !s.originalTitle.includes(" (In Situ)"))
        ) {
            matchingSongs.find((s) => s.originalTitle.includes(" (In Situ)"))!.exclusionReason =
                'Used the non-"in situ" version with matching title';

            return;
        }

        const replacementsByUrl: Record<string, string> = {
            "https://soundcloud.com/they-might-be-giants/doctor-worm-bonus-live-version":
                "https://soundcloud.com/they-might-be-giants/doctor-worm"
        };

        if (matchingSongs.length == 2) {
            const hasReplacement = matchingSongs.filter((s) => replacementsByUrl[s.url] !== undefined);
            if (hasReplacement.length == 1) {
                hasReplacement[0].exclusionReason = "Replaced with " + replacementsByUrl[hasReplacement[0].url];
                return;
            } else if (hasReplacement.length > 1) {
                throw new Error("All matches have a potential replacement");
            }
        }
    });

byTitle = Object.groupBy(
    songs.filter((s) => !s.exclusionReason),
    (s) => s.title
);
Object.keys(byTitle)
    .filter((title) => byTitle[title]!.length > 1)
    .forEach((title) => {
        console.warn("Missed tracks with matching titles:");
        byTitle[title]!.forEach((s) => {
            console.warn(`    ${s.album} : ${s.title}`);
        });
    });

// Filter anything that's too short
songs
    .filter((s) => !s.exclusionReason)
    .filter((s) => s.duration < 17000)
    .forEach((s) => {
        s.exclusionReason = "Too short";
    });

// Editorial Removals

songs
    .filter((s) => !s.exclusionReason)
    .forEach((s) => {
        // Not sure if I agree with all of these anymore, but leaving them for now.

        // My logic is basically
        // * Is it on a main release?
        // * Am I familiar with it?
        // * Are there a good number of listens on Spotify?

        // Horibly flawed and inconsistent, but whatever, it has been working.
        // Like, I enjoy "Savoy Truffle", but according to Spotify that's very obsure...
        // Whatever, I'm keeping it. :)


        // "Album Raises New and Troubling Questions" was removed from Soundcloud.
        // Keeping this code for now though...
        if (
            s.album === "Album Raises New and Troubling Questions" &&
            // Most of the album feels too obsure, but this one is a keeper
            s.url !== "https://soundcloud.com/they-might-be-giants/tubthumping-feat-the-onion-av"
        ) {
            s.exclusionReason = '"Album Raises New and Troubling Questions" feels too obscure';
        }

        // "Cast Your Pod to the Wind" was removed from Soundcloud.
        // Keeping this code for now though..."
        if (
            s.album === "Cast Your Pod to the Wind" &&
            // Including most popular for now
            s.url !== "https://soundcloud.com/they-might-be-giants/we-live-in-a-dump-2" &&
            s.url !== "https://soundcloud.com/they-might-be-giants/brain-problem-situation-1"
        ) {
            s.exclusionReason = '"Cast Your Pod to the Wind" feels too obscure';
        }

        // When the above two albums were removed from SoundCloud,
        // they moved 3 songs to a new album, "Idlewild: A Compilation".
        // Coincidentally, 2 are ones we're keeping above: "We Live in a Dump" and "Brain Problem Situation".
        // The 3rd is "Electronic Istanbul (Not Constantinople)", which used to be excluded.
        // But, ehhhhhhhh, I'll keep it.

        if (s.album === "Venue Songs") {
            s.exclusionReason = '"Venue Songs" feels too obscure';
        }

        if (s.album === "They Got Lost") {
            s.exclusionReason = '"They Got Lost" feels too obscure';
        }

        if (
            s.album === "Then: The Earlier Years" &&
            // At a quick glance I think these are fine. I hope... *I* like them anyways
            s.url !== "https://soundcloud.com/they-might-be-giants/now-that-i-have-everything" &&
            s.url !== "https://soundcloud.com/they-might-be-giants/weep-day" &&
            s.url !== "https://soundcloud.com/they-might-be-giants/im-gettin-sentimental-over-you" &&
            s.url !== "https://soundcloud.com/they-might-be-giants/become-a-robot"
        ) {
            s.exclusionReason = 'The rarites on "Then: The Earlier Years" feel too obscure';
        }

        if (s.url === "https://soundcloud.com/they-might-be-giants/careless-santa-1") {
            s.exclusionReason = "This is technically Mono Puff, not TMBG";
        }

        if (
            s.url === "https://soundcloud.com/they-might-be-giants/you-are-old-father-william" ||
            s.url === "https://soundcloud.com/they-might-be-giants/choo-choo-express" ||
            s.url === "https://soundcloud.com/they-might-be-giants/ive-been-seeing-things" ||
            s.url === "https://soundcloud.com/they-might-be-giants/who-are-the-electors" ||
            s.url === "https://soundcloud.com/they-might-be-giants/through-being-cool-album"
        ) {
            s.exclusionReason = "Feels too obsure";
        }

        if (s.url === "https://soundcloud.com/they-might-be-giants/hot-dog-christmas-from-mickey") {
            s.exclusionReason = 'Duplicate of "Hot Dog!"?';
        }

        if (s.url === "https://soundcloud.com/they-might-be-giants/theres-a-great-big-beautiful") {
            s.exclusionReason =
                "Possibly in german? Soundcloud wont let me listen. But, it's pretty obscure either way";
        }

        if (s.url === "https://soundcloud.com/they-might-be-giants/13-1") {
            s.exclusionReason =
                "Don't think there is a commonly accepted title for this. Not going to make people try to guess 'Untitled' or '13'";
        }

        if (s.url === "https://soundcloud.com/they-might-be-giants/talks") {
            s.exclusionReason = "Not a song";
        }

        if (s.url === "https://soundcloud.com/they-might-be-giants/fake-believe-type-b") {
            s.exclusionReason = "Essentially a duplicate of the main Fake-Believe";
        }

        if (s.url === "https://soundcloud.com/they-might-be-giants/tmbgs-john-f-guest-djs-on-indie-1032-co-public-radios-sunday-rewind") {
            s.exclusionReason = "Radio interview, not a song";
        }
    });

songs
    .filter((s) => !s.exclusionReason)
    .forEach((s) => {
        const matches = (oldPotentialAnswers as Array<{ answer: string; url: string }>).filter((a) => a.url === s.url);
        if (matches.length === 0) {
            console.log(`New: "${s.title}" from "${s.album}"`);
        }
        if (matches.length > 1) {
            throw new Error("found too many matches in old solutions");
        }
    });

songs
    .filter((s) => !s.exclusionReason)
    .forEach((s) => {
        const answer = s.title;
        const matches = (oldPotentialAnswers as Array<{ answer: string; url: string }>).filter((a) => a.url === s.url);

        if (matches.length === 1 && answer != matches[0].answer) {
            console.log("Answer mismatch:");
            console.log(`    Old: ${matches[0].answer}, Url: ${matches[0].url}`);
            console.log(`    New: ${answer}, from ${s.url}`);
        }
    });

(oldPotentialAnswers as Array<{ answer: string; url: string }>).forEach((s) => {
    const song = songs.find((a) => a.url === s.url);
    if (!song) {
        console.log(`Old potential answer no longer in SoundCloud: ${s.answer}, ${s.url}. Patching!`);

        // Add the missing song to the new song list
        // so we still have data to tie to old occurrences.
        
        // For example, game id 1327, `2025-11-17`, `Tubthumping`.
        // That will no longer work since the song is gone.
        // But we need something for `2025-11-17` in the solution array.
        // So, adding the track with what we know, so it can still point to something.

        songs.push({
            // Fake an ID that is greater than the rest will be
            id: Math.pow(2, 40) + CRC32.str(s.url),
            url: s.url,
            originalTitle: s.answer,
            title: s.answer,
            album: "",
            duration: 0,
            artist: "They Might Be Giants",
            exclusionReason: "Missing from SoundCloud"
        });
    } else if (song.exclusionReason) {
        console.log(`Old potential answer excluded from new song data: ${s.answer}, ${s.url}, `);
        console.log(`    ${song.originalTitle}`);
        console.log(`    ${song.album}`);
        console.log(`    ${song.exclusionReason ?? "Missing from SoundCloud"}`);
    }
});

// We've fully processed everything, save off the data including exclusion reasons
fs.writeFileSync("./cache/processedSongData.json", JSON.stringify(songs.sort((a, b) => a.id - b.id), null, 4));

function check(answer: Answer, date: Date, queue: Answer[]) {
    // This is absolutely the worst way to assign songs to days. But, here we are.

    // Some secrets in here that I used to obscure by not committing the code,
    // but then I almost lost it. So, well, shhhh.

    const feastOfLights = [
        "2022-12-26",
        // I guess I forgot this for a few years, whoops
        "2026-12-12",
        // Conflicts with NY
        //'2028-01-01',
        "2028-12-20",
        "2029-12-09",
        "2030-12-28",
        "2031-12-17",
        "2033-01-04",
        "2033-12-26",
        "2034-12-15",
        "2036-01-02"
    ];

    if (feastOfLights.includes(date.toISOString().split("T")[0])) {
        return answer.url === "https://soundcloud.com/they-might-be-giants/feast-of-lights-1";
    } else if (answer.url === "https://soundcloud.com/they-might-be-giants/feast-of-lights-1") {
        return false;
    }

    if (date.getUTCMonth() === 0 && date.getUTCDate() === 1) {
        return answer.url === "https://soundcloud.com/they-might-be-giants/careful-what-you-pack-2";
    } else if (answer.url === "https://soundcloud.com/they-might-be-giants/careful-what-you-pack-2") {
        return false;
    }

    if (date.getUTCMonth() === 9 && date.getUTCDate() === 8) {
        return answer.url === "https://soundcloud.com/they-might-be-giants/other-father-song";
    } else if (answer.url === "https://soundcloud.com/they-might-be-giants/other-father-song") {
        return false;
    }

    if (date.getUTCMonth() === 3 && date.getUTCDate() === 26) {
        return answer.url === "https://soundcloud.com/they-might-be-giants/its-not-my-birthday-1";
    } else if (answer.url === "https://soundcloud.com/they-might-be-giants/its-not-my-birthday-1") {
        return false;
    }

    if (date.getUTCMonth() === 7 && date.getUTCDate() === 1) {
        return answer.url === "https://soundcloud.com/they-might-be-giants/stuff-is-way-1";
    } else if (answer.url === "https://soundcloud.com/they-might-be-giants/stuff-is-way-1") {
        return false;
    }

    // Go easy on the kid albums
    if (kidAlbums.indexOf(answer.album ?? "") >= 0) {
        // Enforce minimum spacing between any kids album
        if (
            queue
                .slice(Math.max(queue.length - minDaysBetweenAnyKidsAlbum, 0))
                .some((a) => kidAlbums.indexOf(a.album ?? "") >= 0)
        ) {
            return false;
        }

        // Enforce minimum spacing between this specific kids album
        if (
            queue.slice(Math.max(queue.length - minDaysBetweenSameKidsAlbum, 0)).some((a) => a.album === answer.album)
        ) {
            return false;
        }
    }

    var isXmasSong =
        answer.url === "https://soundcloud.com/they-might-be-giants/santas-beard-4" ||
        answer.url === "https://soundcloud.com/they-might-be-giants/santa-claus-1" ||
        answer.url === "https://soundcloud.com/they-might-be-giants/o-tannenbaum-1";

    if (queue.slice(Math.max(queue.length - minDaysBetweenSameAnswer, 0)).some((a) => a.url === answer.url)) {
        return false;
    }

    if (queue.slice(Math.max(queue.length - minDaysBetweenSameAlbum, 0)).some((a) => a.album === answer.album)) {
        return false;
    }

    // Only a xmas song on xmas

    if (date.getUTCMonth() === 11 && date.getUTCDate() === 25 && !isXmasSong) {
        return false;
    }

    // Xmas songs only in december

    if (isXmasSong && date.getUTCMonth() !== 11) {
        return false;
    }

    return true;
}

// regenerate existing answer list
const answers: Answer[] = [];
let date = new Date(Date.parse(startDate));
let id = idOffset;
for (let i = 0; i < answerIndexes.length && date.toISOString() < generateStarting; ++i) {
    answers.push({
        id: id++,
        date: date.toISOString(),
        title: oldPotentialAnswers[answerIndexes[i]].answer,
        url: oldPotentialAnswers[answerIndexes[i]].url,
        album: songs.find((s) => s.url === oldPotentialAnswers[answerIndexes[i]].url)!.album
    });

    date = new Date(date.setUTCDate(date.getUTCDate() + 1));
    date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const validSongs = songs.filter((s) => !s.exclusionReason);
while (answers[answers.length - 1].date < generateThrough) {
    // For this loop, we're choosing each song only once
    // Stop generating answers when we've used up 50% of all tracks.
    const availableSongs = [...validSongs.filter((s) => !s.exclusionReason)];
    var n = 0;
    while (availableSongs.length > validSongs.length / 2) {
        const i = Math.floor(Math.random() * availableSongs.length);
        const potentialSong = availableSongs[i];
        const potentialAnswer = {
            id: id,
            date: date.toISOString(),
            title: potentialSong.title,
            url: potentialSong.url,
            album: potentialSong.album
        };

        if (check(potentialAnswer, date, answers)) {
            answers.push(potentialAnswer);
            id++;
            date = new Date(date.setUTCDate(date.getUTCDate() + 1));
            date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

            // remove the song from future candidates
            availableSongs.splice(i, 1);

            if (date.toISOString() >= generateThrough) {
                break;
            }
        } else {
            //console.log(potentialAnswer.url + " is bad")

            // If we've had too many failures, bail!
            // Probably because the "special day" code is awful and relies on random chance to pick the correct song.
            // If we fail, just restart the app and try again. We could solve it, but, eh, maybe someday.
            if (n > 100000) {
                throw new Error("Got stuck generating new answers! Try again");
            }

            ++n;
        }
    }
}

// Check that all ids are a correct sequence, because I messed it up.
for (let i = 1; i < answers.length; ++i) {
    if (answers[i].id != answers[i - 1].id + 1) {
        throw new Error(`Problem with id ${answers[i].id}!`);
    }
}

saveAnswers(answers);

const newPotentialAnswers = songs
    .filter((s) => !s.exclusionReason)
    .map((s) => ({
        answer: s.title,
        url: s.url
    }));

// Add in any tracks that were already used as a day's answer,
// but that we've since removed from the potential answer list.
// Doing this to make it easier to enable a "play previous day's game" feature,
// that I'll probably never actually add.
// Thats also why I'm not trimming the list of `answerIndexes` yet, to keep historical data.
answerIndexes.forEach((index) => {
    const potentialAnswer = oldPotentialAnswers[index];
    if (!newPotentialAnswers.find((a) => a.url === potentialAnswer.url)) {
        
        // We may have old answers that we've changes the title of since.
        // Fix those up so we dont accidentally end up with duplicate titles in the answer list.
        // TODO: If we enable viewing old games,
        // this may cause problems if their stored answer doesnt match anymore
        potentialAnswer.answer = fixTitle(potentialAnswer.answer, potentialAnswer.url);

        newPotentialAnswers.push(potentialAnswer);

    }
});

findDuplicateTitles(newPotentialAnswers.map((a) => ({ title: a.answer, url: a.url })));

const newSortedPotentialAnswers = newPotentialAnswers.toSorted((a, b) => {
    const answerCompare = a.answer.localeCompare(b.answer);
    if (answerCompare === 0) {
        return a.url.localeCompare(b.url);
    }
    return answerCompare;
});

const newAnswerIndexes = answers.map((a) => newSortedPotentialAnswers.findIndex((npa) => npa.url === a.url));
if (newAnswerIndexes.find((a) => a < 0)) {
    throw new Error("Couldnt find an answer in the newPotentialAnswer list");
}

const solutionsPath = "../src/Solutions.js";
fs.writeFileSync(solutionsPath, `const idOffset = ${idOffset};\n`);
fs.appendFileSync(
    solutionsPath,
    `const potentialAnswers = ${JSON.stringify(
        newSortedPotentialAnswers.map((a) => ({
            ...a,
            url: a.url.replace("https://soundcloud.com/they-might-be-giants/", "")
        }))
    )}`
);
fs.appendFileSync(
    solutionsPath,
    ".map(a => ({answer: a.answer + ' - They Might Be Giants', url: 'https://soundcloud.com/they-might-be-giants/' + a.url }));\n\n"
);
fs.appendFileSync(solutionsPath, `const answerIndexes = ${JSON.stringify(newAnswerIndexes)};\n`);
fs.appendFileSync(
    solutionsPath,
    '\nconst startDate = "2022-12-22";\n\nexport { startDate, idOffset, potentialAnswers, answerIndexes };\n'
);

const fileContent = fs.readFileSync(solutionsPath);
const options = await prettier.resolveConfig(solutionsPath);
const formatted = await prettier.format(fileContent.toString(), {
    ...options,
    filepath: "../src/Solutions.js"
});
fs.writeFileSync("../src/Solutions.js", formatted);
