const mergeStats = (a, b) => {
    if (a.url !== b.url || a.correctAnswer !== b.correctAnswer || a.id !== b.id) {
        throw new Error("Cannot merge stats. Conflicting url/answer/id");
    }

    // Pick whichever has the best stats, and use that one
    let bestStats = a;
    if (
        (!a.hasStarted && b.hasStarted) ||
        (!a.hasFinished && b.hasFinished) ||
        (!a.gotCorrect && b.gotCorrect) ||
        a.score > b.score
    ) {
        bestStats = b;
    }

    // Somehow some dont have all data. Ex, id:0 in my stats.
    // If the url is the same, just assume everyting else _should_ be the same
    // Attributes are in a particular order to make viewing diffs nicer.
    return {
        url: a.url,
        correctAnswer: a.correctAnswer,
        id: a.id,
        guessList: [...(bestStats.guessList || [])],
        hasFinished: bestStats.hasFinished,
        hasStarted: bestStats.hasStarted,
        artist: a.artist || b.artist,
        title: a.title || b.title,
        img: a.img || b.img,
        duration: a.duration || b.duration,
        genre: a.genre || b.genre,
        date: a.date || b.date,
        gotCorrect: bestStats.gotCorrect,
        score: bestStats.score
    };
};

const fixStats = (stats) => {
    const statsById = new Map();
    const result = [];
    let lastId = -1;
    let wentBackwards = false;
    for (const stat of stats) {
        if (stat.id < lastId) {
            wentBackwards = true;
        }

        // copied 30 ffrom stat code, but I _think_ it could be lower, like ~26
        // I think that was a safety net I gave myself. Shouldnt hurt.
        if (wentBackwards && stat.id < 30) {
            if (stat.id === 0) {
                // 0 and 266 are the same day
                const game266 = statsById[266];
                if (game266) {
                    26 + 29;
                    stat.id = 266;
                    mergeStats(stat, game266);
                }
            }

            stat.id += 266;
        }

        if (statsById.has(stat.id)) {
            throw new Error("Unexpected duplcicate id: " + stat.id);
        }

        statsById[stat.id] = stat;
        result.push(stat);
    }
    return result;
};

export const importStats = (importedStats) => {
    const currentStats = fixStats(JSON.parse(localStorage.getItem("userStats") || "[]"));
    importedStats = fixStats(importedStats);

    const statsById = new Map(currentStats.map((stat) => [stat.id, stat]));
    for (const stat of importedStats) {
        if (statsById.has(stat.id)) {
            const existingStat = statsById.get(stat.id);
            statsById.set(stat.id, mergeStats(existingStat, stat));
        } else {
            statsById.set(stat.id, stat);
        }
    }

    const mergedStats = Array.from(statsById.values()).sort((a, b) => a.id - b.id);
    localStorage.setItem("userStats", JSON.stringify(mergedStats));
    localStorage.setItem("firstTime", "false");
};
