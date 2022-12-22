// On `All` page
// jQueryify
// Scroll to load everything
// `jQuery('a.compactTrackList__moreLink').each((i,e) => e.click())` to click all "View X Tracks"

var data = []
var albumsDivs = jQuery('.sound__body')

albumsDivs.each((i, e) => {
    var title = $(e).find('a.soundTitle__title span').text()
    var albumSongs = $(e).find('span.compactTrackListItem__trackTitle');
    if (albumSongs.length > 0) {
        albumSongs.each((i, e) => {
            data.push({
                title: e.textContent.trim(),
                url: 'https://soundcloud.com' + e.attributes['data-permalink-path'].value.split('?')[0],
                album: title
            })
        });

    }
    else {
        data.push({
            title: title,
            url: $(e).find('a.soundTitle__title')[0].href
        })
    }
})

data.forEach(e => {
    // Store off original titles so I can filter based on them easier
    // For example, I may not want "(In Situ)" tracks in the app at all. If I clean up the title, that would be more difficult.
    e.originalTitle = e.title;
})

// Override titles that should match but don't, or are just wrong

var titleFixes = [
    ['https://soundcloud.com/they-might-be-giants/xtc-vs-adam-ant', 'XTC vs. Adam Ant'],
    ['https://soundcloud.com/they-might-be-giants/stand-on-your-head', 'Stand on Your Own Head'],
    ['https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine', 'Why Does the Sun Shine? (The Sun Is a Mass of Incandescent Gas)'],
    ['https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine-the-1', 'Why Does the Sun Shine? (The Sun Is a Mass of Incandescent Gas)'],
    ['https://soundcloud.com/they-might-be-giants/why-does-the-sun-really-shine', 'Why Does the Sun Really Shine? (The Sun Is a Miasma of Incandescent Plasma)'],
    // These names are swapped on Soundcloud. Neat.
    ['https://soundcloud.com/they-might-be-giants/i-hope-that-i-get-old-before-i', 'I Hope That I Get Old Before I Die (Version 1)'],
    ['https://soundcloud.com/they-might-be-giants/hope-that-i-get-old-before-i', 'I Hope That I Get Old Before I Die'],
    // "Sun"
    ['https://soundcloud.com/they-might-be-giants/kiss-me-sun-of-god-alternate', 'Kiss Me, Son of God (Alternate Version)'],
    // "Spiralling"
    ['https://soundcloud.com/they-might-be-giants/spiralling-shape', 'Spiraling Shape'],

    ['https://soundcloud.com/they-might-be-giants/cloissone', 'Cloissonné'],

    // Artist in title
    ['https://soundcloud.com/they-might-be-giants/infinity-they-might-be-giants', 'Infinity'],

]

titleFixes.forEach(f => {
    data.filter(t => t.url === f[0]).forEach(e => e.title = f[1])
})

// Filtering out all tracks that are also listed in an album
var data2 = []
var albumTracks = data.filter(e => e.album)
data.forEach(e => {
    if (!e.album) {
        var at = albumTracks.find(at => at.url == e.url);
        if (!at) {
            data2.push(e);
        }
        else {
            //console.log(`${e.title} found in ${at.album}: ${at.url}, ${e.url}`)
        }
    }
    else if (e.album) {
        data2.push(e);
    }
});

data = data2;

// Duplicate URL check

data2 = []
data.forEach(e => {

    if (data2.filter(t => t.url == e.url).length > 0) {
        return;
    }

    if (e.album == 'Idlewild: A Compilation') {
        return;
    }

    var matches = data.filter(t => t.url == e.url && t.album != 'Idlewild: A Compilation');
    if (matches.length == 1) {
        data2.push(e)
    }
    else if (matches.length > 1) {

        var sameAlbumMtches = matches.filter(t => t.album == e.album);

        if (sameAlbumMtches.length == matches.length) {
            // Got multiples for the same album somehow. Just use one.
            data2.push(e)
        }
        // Prefer main releases
        else if (e.album == 'No!'
            || e.album == 'Mink Car'
            || e.album == 'BOOK') {
            data2.push(e)
            //console.log(`Using ${e.album}`)
            //console.log(matches.filter(t => t != e))
        }

        else {
            //console.log(`Duplicate track: ${e.title}`)
            //console.log(matches)
        }
    }
});

// Just double checking that I dont have any url dupes left, and I didnt miss anything
data.forEach(e => {

    var matches = data2.filter(t => t.url == e.url);
    if (matches.length == 0) {
        console.log("Lost a track")
        console.log(e)
    }
    else if (matches.length > 1) {
        console.log("Missed some dupes")
        console.log(matches)
    }
})

data = data2;

console.log("All tracks")
console.log(JSON.stringify(data));

function normalize(title) {
    return title.toLowerCase().replace(/[^a-z0-9 ]/g, '')
}

// Duplicate title check
data2 = []
data.forEach(e => {

    if (e.album == "Severe Tire Damage"
        || e.album == "At Large") {
        // Letting these live versions create "duplicates". Their titles match the studio versions.
        // I think thats fine. Dont really want both a (for example) `Ana Ng` and `Ana Ng (Live)` in the answer list
        data2.push(e)
        return;
    }

    var existingTitleMatches = data2.filter(t =>
        normalize(t.title) == normalize(e.title)
        // Ignore the albums we allowed above, otherwise they'll block studio albums
        && t.album != "Severe Tire Damage"
        && t.album != "At Large")

    if (e.url === 'https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine'
        || e.url === 'https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine-the-1') {
        // These are distinct versions, so keep them both
        data2.push(e)
        return;
    }

    if (existingTitleMatches.length > 0) {
        //console.log(`Throwing away ${e.title} - ${e.album}, ${e.url}`)
        return;
    }

    var titleMatches = data.filter(t => normalize(t.title) == normalize(e.title))
    if (titleMatches.length > 1) {

        // If any tracks have an album, remove any without one
        if (titleMatches.filter(t => !!t.album).length > 0) {
            titleMatches = titleMatches.filter(t => !!t.album)
        }

        // removing compilations and live albums
        var titleMatches = titleMatches.filter(t =>
            t.album != 'Then: The Earlier Years'
            && t.album != 'They Got Lost'
            && t.album != "Severe Tire Damage"
            && t.album != "At Large")


        if (titleMatches.length == 1 && e.url == titleMatches[0].url) {
            data2.push(e)
        }
        else if (e.album == 'Long Tall Weekend'
            || e.album == 'Flood'
            || e.album == 'Lincoln'
            || e.album == 'The Spine'
            || e.album == 'Mink Car'
            || e.album == 'Nanobots'
            || e.album == 'No!') {
            data2.push(e)
            //console.log(`Using ${e.album}`)
            //console.log(matches.filter(t => t != e))
        }
        else if (titleMatches.filter(t => t.album === e.album).length === titleMatches.length) {
            // All matches are for the same album
            // Some albums are in there multiple times. Just grab the first instance of each track we see
            data2.push(e)
        }
        else {
            //console.log(`Throwing away ${e.title} - ${e.album}, ${e.url}`)
            //console.log(titleMatches)
        }
    }
    else {
        data2.push(e)
    }
});

data.forEach(e => {

    var titleMatches = data2.filter(t => normalize(t.title) == normalize(e.title))
    if (titleMatches.length == 0) {
        console.log("Lost a track")
        console.log(e)
    }/*
    else if (titleMatches.length > 1) {
        console.log("Missed some dupes")
        console.log(titleMatches)
    }*/
})

data = data2;

console.log(JSON.stringify(data));

// Editorial decisions

// Title tweaks
data.forEach(e => {
    // Make these match with the non "In Situ" versions, so you dont have to choose between them
    e.title = e.title.replace(" (In Situ)", "");

    e.title = e.title.replace(" (Live)", "");
    e.title = e.title.replace(/ \([\w ]*?Live Version\)/g, "");
})
// Dropping the `(Alternate Version)` bit
data.filter(t => t.url === 'https://soundcloud.com/they-might-be-giants/kiss-me-sun-of-god-alternate')[0].title = 'Kiss Me, Son of God';

// Removals
data = data.filter(t =>
    t.title.indexOf("Single Mix") < 0
    && t.title.indexOf("(Demo") < 0
    && t.title.indexOf("Radio They Might Be Giants #") < 0 // Could call them all "Radio They Might Be Giants" to make it easier I suppose
    && t.url !== 'https://soundcloud.com/they-might-be-giants/i-hope-that-i-get-old-before-i' // demo version
    && t.url !== 'https://soundcloud.com/they-might-be-giants/ballad-of-davy-crockett-in' // Dupe
    && t.url !== 'https://soundcloud.com/they-might-be-giants/bloodmobile' // Dupe
    && t.url !== 'https://soundcloud.com/they-might-be-giants/fake-believe-type-b' // Essentially a dupe
    && t.url !== 'https://soundcloud.com/they-might-be-giants/13-1' // Ugh this one kills me. But it doesnt really have a title
    && t.url !== 'https://soundcloud.com/they-might-be-giants/ballad-of-davy-crockett-in' // Dupe
    && t.url !== 'https://soundcloud.com/they-might-be-giants/here-come-the-abcs' // intro
    && t.url !== 'https://soundcloud.com/they-might-be-giants/here-come-the-123s' // intro
    && t.url !== 'https://soundcloud.com/they-might-be-giants/careless-santa-1' // Not technically TMBG (but maybe should be included at some point)

    // I think these are all probably fine, but going to remove them to start with.
    && (!!t.album // Some decent stuff without an album, but removing them for now
        || t.url === 'https://soundcloud.com/they-might-be-giants/other-father-song') // This one stands out as needing to stay in
    && t.album != 'The Communists Have the Music'
    && t.album != 'Severe Tire Damage' // Live album
    // Maybe some of 'They Got Lost' can be included, but at a glance they seem way too obscure
    // A few songs are already included from other albums
    && t.album != 'They Got Lost'
    && t.album != 'At Large' // Live album
    && (t.album != 'Album Raises New and Troubling Questions'
        // Most of the album feels too obsure, but this one is a keeper
        || t.url === 'https://soundcloud.com/they-might-be-giants/tubthumping-feat-the-onion-av')
    && t.album != 'Venue Songs' // Live album / Too obscure??
    && (t.album != 'Then: The Earlier Years' // Mainstream stuff is on other albums. Rest might be too obscure? Needs curating
        // At a quick glance I think these are fine. I hope... *I* like them anyways
        || t.url === 'https://soundcloud.com/they-might-be-giants/now-that-i-have-everything'
        || t.url === 'https://soundcloud.com/they-might-be-giants/weep-day'
        || t.url === 'https://soundcloud.com/they-might-be-giants/im-gettin-sentimental-over-you'
        || t.url === 'https://soundcloud.com/they-might-be-giants/become-a-robot'
    )
    //&& t.album != 'Holidayland' // Can I limit these to December? Hm.
    && (t.album !== 'Cast Your Pod to the Wind' // Needs curating. 
        // Including most popular for now
        || t.url === 'https://soundcloud.com/they-might-be-giants/we-live-in-a-dump-2'
        || t.url === 'https://soundcloud.com/they-might-be-giants/brain-problem-situation-1'
    )
    // Allowing most kids albums. We'll see how that goes...
    //&& t.album != 'Why?'
    //&& t.album != 'No!'
    && t.album != 'No! (Deluxe Edition)' // extended/live versions
    //&& t.album != 'Here Comes Science'
    //&& t.album != 'Here Come the 123s'
    //&& t.album != 'They Might Be Giants: Here Come the ABCs'
)

// Not sure about Black Ops vs Black Ops Alt. They're both on studio albums, and pretty different sounding...

var bigram = nGram(2);
// Appears to be a minified version of https://github.com/words/n-gram/blob/ea29ab8493a837f3ce5983bf583f5433c4a5dd8b/index.js#L9
function nGram(e) {
    if (
        "number" != typeof e ||
        Number.isNaN(e) ||
        e < 1 ||
        e === Number.POSITIVE_INFINITY
    )
        throw new Error("`" + e + "` is not a valid argument for `n-gram`");
    return function (t) {
        var n,
            r,
            s = [];
        if (null == t) return s;
        if (((r = t.slice ? t : String(t)), (n = r.length - e + 1) < 1)) return s;
        for (; n--;) s[n] = r.slice(n, n + e);
        return s;
    };
}
// Appears to be a minified version of https://github.com/words/dice-coefficient/blob/eca6ad69a664633c156f57e587ee504f17708b88/index.js#L19
function diceCoefficient(value, other) {
    let n, r, left, right;
    Array.isArray(value)
        ? (left = value.map((e) => String(e).toLowerCase()))
        : ((n = String(value).toLowerCase()), (left = 1 === n.length ? [n] : bigram(n))),
        Array.isArray(other)
            ? (right = other.map((e) => String(e).toLowerCase()))
            : ((r = String(other).toLowerCase()), (right = 1 === r.length ? [r] : bigram(r)));
    let leftPair,
        rightPair,
        offset,
        index = -1,
        intersections = 0;
    for (; ++index < left.length;)
        for (leftPair = left[index], offset = -1; ++offset < right.length;)
            if (((rightPair = right[offset]), leftPair === rightPair)) {
                intersections++, (right[offset] = "");
                break;
            }
    return (2 * intersections) / (left.length + right.length);
}


// Just logging some warnings if titles are "too close" to one another. Used to catch minor differences that we can smooth out
data.forEach(e => {
    var m = data.filter(t => normalize(t.title) == normalize(e.title) && (t.title != e.title || e.url == t.url))
    if (m.length > 1) {
        console.log("Normalized Match")
        console.log(m)
    }

    m = data.filter(t => diceCoefficient(t.title, e.title) > 0.7 && (t.title != e.title || e.url == t.url))
    if (m.length > 1) {
        console.log("Dice Coefficient Match")
        console.log(m)
    }
})


console.log("Filtered tracks")
console.log(JSON.stringify(data));

//JSON.stringify(data2.sort((a, b) => (a.title < b.title) ? -1 : (a.title > b.title) ? 1 : (a.album < b.album) ? -1 : (a.album > b.album) ? 1 : 0))
// map to index array:
// p == potentialSolutions
newQueue.map(e => e.url).map(e => p.map(e2 => e2.url).indexOf(e)) 
