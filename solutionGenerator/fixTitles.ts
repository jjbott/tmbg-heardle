function removeAnnotations(url: string, title: string): string {
    // Remove "annotations" like ` (Alternate Version)` or ` (Single Mix)`
    if (
        // These all have "annotations" that we want to keep
        url === "https://soundcloud.com/they-might-be-giants/200-sbemails-for-homestar" ||
        url === "https://soundcloud.com/they-might-be-giants/electronic-istanbul-not" ||
        url === "https://soundcloud.com/they-might-be-giants/istanbul-not-constantinople" ||
        url === "https://soundcloud.com/they-might-be-giants/why-does-the-sun-really" ||
        url === "https://soundcloud.com/they-might-be-giants/istanbul-not-constantinople-2" ||
        url === "https://soundcloud.com/they-might-be-giants/seven-days-of-the-week-i-never" ||
        url === "https://soundcloud.com/they-might-be-giants/the-ballad-of-davy-crockett-in" ||
        url === "https://soundcloud.com/they-might-be-giants/why-does-the-sun-really-shine" ||
        url === "https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine" ||
        url === "https://soundcloud.com/they-might-be-giants/the-worlds-address-joshua-1" ||
        url === "https://soundcloud.com/they-might-be-giants/black-ops-alt" ||
        url === "https://soundcloud.com/they-might-be-giants/istanbul-not-constantinople-1" ||
        url === "https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine-the-sun" ||
        url === "https://soundcloud.com/they-might-be-giants/the-worlds-address-joshua" ||
        url === "https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine-the-1" ||
        url === "https://soundcloud.com/they-might-be-giants/fake-believe-type-b"
    ) {
        return title;
    }

    const match = /^(.*)( \(.*\))$/.exec(title);
    if (match && (match?.length ?? 0) > 0) {
        console.log(`Removing ${match[2]} from ${match[0]}`);
        return match[1];
    }

    return title;
}

const titleFixes = [
        // Missing '(The Sun Is a Mass of Incandescent Gas)'
        [
            "https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine",
            "Why Does the Sun Shine? (The Sun Is a Mass of Incandescent Gas)"
        ],
        /*[
        "https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine-the-1",
        "Why Does the Sun Shine? (The Sun Is a Mass of Incandescent Gas)"
    ],*/
        // Missing '(The Sun Is a Miasma of Incandescent Plasma)'
        [
            "https://soundcloud.com/they-might-be-giants/why-does-the-sun-really-shine",
            "Why Does the Sun Really Shine? (The Sun Is a Miasma of Incandescent Plasma)"
        ],
        // These names are swapped on Soundcloud. Neat.
        [
            "https://soundcloud.com/they-might-be-giants/i-hope-that-i-get-old-before-i",
            "I Hope That I Get Old Before I Die (Version 1)"
        ],
        [
            "https://soundcloud.com/they-might-be-giants/hope-that-i-get-old-before-i",
            "I Hope That I Get Old Before I Die"
        ],
        // "Spiralling"
        ["https://soundcloud.com/they-might-be-giants/spiralling-shape", "Spiraling Shape"],

        // Misspelling
        ["https://soundcloud.com/they-might-be-giants/cloissone", "Cloisonné"],

        // Artist in title
        ["https://soundcloud.com/they-might-be-giants/infinity-they-might-be-giants", "Infinity"],

        // Punctuation differences
        ["https://soundcloud.com/they-might-be-giants/am-i-awake", "Am I Awake?"],

        // Missing `The`, different `in` capitalization, extra `(Album Version)`
        [
            "https://soundcloud.com/they-might-be-giants/ballad-of-davy-crockett-in",
            "The Ballad of Davy Crockett (in Outer Space)"
        ],

        // Capitalization fixes, to make them consistent with matching tracks
        // Casing style is all over the place. 🤷‍♂️
        // In general I'm picking whatever style the most matches have,
        // or what the main album release has,
        // or what the last change on SoundCloud was.
        
        ["https://soundcloud.com/they-might-be-giants/the-darlings-of-lumberland-1", "The Darlings of Lumberland"],
        ["https://soundcloud.com/they-might-be-giants/we-live-in-a-dump-3", "We Live in a Dump"],
        ["https://soundcloud.com/they-might-be-giants/she-was-a-hotel-detective", "(She Was A) Hotel Detective"],
        ["https://soundcloud.com/they-might-be-giants/feast-of-lights", "Feast of Lights"],
        //["https://soundcloud.com/they-might-be-giants/by-the-time-you-get-this-note", "By the Time You Get This"],
        ["https://soundcloud.com/they-might-be-giants/lets-get-this-over-with-1", "Let's Get This Over With"],
        ["https://soundcloud.com/they-might-be-giants/mccaffertys-bib-1", "McCafferty's Bib"],
        ["https://soundcloud.com/they-might-be-giants/lady-is-a-tramp-1", "Lady is a Tramp"],
        ["https://soundcloud.com/they-might-be-giants/everything-right-is-wrong-1", "Everything Right is Wrong Again"],

        
        
        
        
        
        
        
        
        
        
        
        

        // "Light Comes" should be "Lights Come"
        ["https://soundcloud.com/they-might-be-giants/when-the-light-comes-on", "When the Lights Come On"],

        // Should be "Sleepybones", not "Sleepybones"
        ["https://soundcloud.com/they-might-be-giants/lazyhead-and-sleepbones", "Lazyhead and Sleepybones"],


        // 2026-08-29 fixes. 
        ["https://soundcloud.com/they-might-be-giants/how-can-i-sing-like-a-girl-1", "How Can I Sing Like a Girl?"],
        ["https://soundcloud.com/they-might-be-giants/or-so-i-have-read", "Or So I Have Read"],
        ["https://soundcloud.com/they-might-be-giants/09-all-the-lazy-boyfriends", "All The Lazy Boyfriends"],
        ["https://soundcloud.com/they-might-be-giants/all-the-lazy-boyfriends", "All The Lazy Boyfriends"],
        ["https://soundcloud.com/they-might-be-giants/push-back-the-hands", "Push Back The Hands"],
        ["https://soundcloud.com/they-might-be-giants/push-back-the-hands-1", "Push Back The Hands"],
        [
            "https://soundcloud.com/they-might-be-giants/an-insult-to-the-fact-checkers",
            "An Insult To The Fact Checkers"
        ],
        [
            "https://soundcloud.com/they-might-be-giants/an-insult-to-the-fact",
            "An Insult To The Fact Checkers"
        ],
        ["https://soundcloud.com/they-might-be-giants/by-the-time-you-get-this-note", "By The Time You Get This"],
        ["https://soundcloud.com/they-might-be-giants/by-the-time-you-get-this", "By The Time You Get This"],
        ["https://soundcloud.com/they-might-be-giants/boat-of-car", "Boat Of Car"],
        ["https://soundcloud.com/they-might-be-giants/boat-of-car-1", "Boat Of Car"],
        ["https://soundcloud.com/they-might-be-giants/snowball-in-hell", "Snowball In Hell"],
        ["https://soundcloud.com/they-might-be-giants/snowball-in-hell-1", "Snowball In Hell"],
        [
            "https://soundcloud.com/they-might-be-giants/put-your-hand-inside-the",
            "Put Your Hand Inside The Puppet Head"
        ],
        [
            "https://soundcloud.com/they-might-be-giants/put-your-hand-inside-the-1",
            "Put Your Hand Inside The Puppet Head"
        ],
        ["https://soundcloud.com/they-might-be-giants/kiss-me-son-of-god", "Kiss Me, Son Of God"],
        ["https://soundcloud.com/they-might-be-giants/kiss-me-son-of-god-1", "Kiss Me, Son Of God"],
        ["https://soundcloud.com/they-might-be-giants/kiss-me-son-of-god-alternate", "Kiss Me, Son Of God"],
        ["https://soundcloud.com/they-might-be-giants/kiss-me-sun-of-god-alternate", "Kiss Me, Son Of God"],
        ["https://soundcloud.com/they-might-be-giants/ive-got-a-match", "I've Got A Match"],
        ["https://soundcloud.com/they-might-be-giants/ive-got-a-match-1", "I've Got A Match"],
        ["https://soundcloud.com/they-might-be-giants/alienations-for-the-rich", "Alienation's For The Rich"],
        ["https://soundcloud.com/they-might-be-giants/alienations-for-the-rich-1", "Alienation's For The Rich"],
        ["https://soundcloud.com/they-might-be-giants/shes-an-angel", "She's An Angel"],
        ["https://soundcloud.com/they-might-be-giants/shes-an-angel-1", "She's An Angel"],
        ["https://soundcloud.com/they-might-be-giants/shes-an-angel-2", "She's An Angel"],
        ["https://soundcloud.com/they-might-be-giants/shes-an-angel-4", "She's An Angel"],
        ["https://soundcloud.com/they-might-be-giants/shoehorn-with-teeth", "Shoehorn With Teeth"],
        ["https://soundcloud.com/they-might-be-giants/shoehorn-with-teeth-1", "Shoehorn With Teeth"],
        ["https://soundcloud.com/they-might-be-giants/stand-on-your-own-head", "Stand On Your Own Head"],
        ["https://soundcloud.com/they-might-be-giants/stand-on-your-head", "Stand On Your Own Head"],
        ["https://soundcloud.com/they-might-be-giants/piece-of-dirt", "Piece Of Dirt"],
        ["https://soundcloud.com/they-might-be-giants/piece-of-dirt-1", "Piece Of Dirt"],
        ["https://soundcloud.com/they-might-be-giants/theyll-need-a-crane", "They'll Need A Crane"],
        ["https://soundcloud.com/they-might-be-giants/theyll-need-a-crane-1", "They'll Need A Crane"],
        ["https://soundcloud.com/they-might-be-giants/xtc-vs-adam-ant", "XTC vs. Adam Ant"],
        ["https://soundcloud.com/they-might-be-giants/xtc-vs-adam-ant-1", "XTC vs. Adam Ant"],
        ["https://soundcloud.com/they-might-be-giants/xtc-vs-adam-ant-3", "XTC vs. Adam Ant"],
    ];

export function fixTitle(title: string, url: string): string {
    title = removeAnnotations(url, title);

    // Override titles that should match but don't, or are just wrong
    const fix = titleFixes.find((tf) => tf[0] === url);
    if (fix) {
        return fix[1];
    }

    return title;
}

export function fixTitles(songs: { title: string; url: string }[]) {
    songs.forEach((s) => {
        s.title = fixTitle(s.title, s.url);
    });    
}
