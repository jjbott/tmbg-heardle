import { diceCoefficient } from "dice-coefficient";

export function findNearDuplicateTitles(songs:{ title: string, url: string }[]) {
    songs.forEach((song) => {
        // These are just warnings.
        // Anything it finds could be a spelling problem or something.
        // Ex: `Cloissoné` should be `Cloisonné`, hence the fix above.
        // I usually test with a limit of 0.7, but that currently only shows cases that are fine.
        // May need to get edit distance in here as another warning
        // Cases where we're 1 letter off produce different dice coefficients.
        // Ex:
        // * The mispelled `Cloissoné` vs `Cloisonné` is 0.875
        // * `Radio They Might Be Giants #1` vs `Radio They Might Be Giants #2` is 0.964
        // Makes choosing a `limit` tricky
        const limit = 0.875;
        const matches = songs.filter((t) => t.title != song.title && diceCoefficient(t.title, song.title) >= limit);
        if (matches.length >= 1) {
            console.log("Dice Coefficient Match");
            console.log(`    this: '${song.title}', ${song.url}`);
            matches.forEach((match) => {
                console.log(
                    `    match: (${diceCoefficient(match.title, song.title).toFixed(3)}) '${match.title}', ${match.url}`
                );
            });
        }
    });
}
