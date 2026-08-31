const oldToNewId: Record<string, string> = {
    "https://soundcloud.com/they-might-be-giants/all-time-what":
        "https://soundcloud.com/they-might-be-giants/all-time-what-1",
    "https://soundcloud.com/they-might-be-giants/an-insult-to-the-fact-checkers":
        "https://soundcloud.com/they-might-be-giants/an-insult-to-the-fact",
    "https://soundcloud.com/they-might-be-giants/by-the-time-you-get-this-note":
        "https://soundcloud.com/they-might-be-giants/by-the-time-you-get-this",
    "https://soundcloud.com/they-might-be-giants/i-broke-my-own-rule":
        "https://soundcloud.com/they-might-be-giants/i-broke-my-own-rule-4",
    "https://soundcloud.com/they-might-be-giants/i-cant-remember-the-dream":
        "https://soundcloud.com/they-might-be-giants/i-cant-remember-the-dream-6",
    "https://soundcloud.com/they-might-be-giants/i-left-my-body":
        "https://soundcloud.com/they-might-be-giants/i-left-my-body-1",
    "https://soundcloud.com/they-might-be-giants/i-like-fun":
        "https://soundcloud.com/they-might-be-giants/i-like-fun-1",
    "https://soundcloud.com/they-might-be-giants/i-lost-thursday":
        "https://soundcloud.com/they-might-be-giants/i-lost-thursday-204363153",
    "https://soundcloud.com/they-might-be-giants/lake-monsters":
        "https://soundcloud.com/they-might-be-giants/lake-monsters-1",
    "https://soundcloud.com/they-might-be-giants/last-wave": "https://soundcloud.com/they-might-be-giants/last-wave-1",
    "https://soundcloud.com/they-might-be-giants/lets-get-this-over-with":
        "https://soundcloud.com/they-might-be-giants/lets-get-this-over-with-1",
    "https://soundcloud.com/they-might-be-giants/mccaffertys-bib":
        "https://soundcloud.com/they-might-be-giants/mccaffertys-bib-1",
    "https://soundcloud.com/they-might-be-giants/mrs-bluebeard":
        "https://soundcloud.com/they-might-be-giants/mrs-bluebeard-1",
    "https://soundcloud.com/they-might-be-giants/part-of-you-wants-to-believe":
        "https://soundcloud.com/they-might-be-giants/part-of-you-wants-to-believe-2",
    "https://soundcloud.com/they-might-be-giants/push-back-the-hands":
        "https://soundcloud.com/they-might-be-giants/push-back-the-hands-1",
    "https://soundcloud.com/they-might-be-giants/robot-parade-adult-version":
        "https://soundcloud.com/they-might-be-giants/robot-parade-adult-version-2",
    "https://soundcloud.com/they-might-be-giants/spy-unreleased-live-version":
        "https://soundcloud.com/they-might-be-giants/spy-1",
    "https://soundcloud.com/they-might-be-giants/super-cool":
        "https://soundcloud.com/they-might-be-giants/super-cool-2",
    "https://soundcloud.com/they-might-be-giants/the-bright-side":
        "https://soundcloud.com/they-might-be-giants/the-bright-side-1",
    "https://soundcloud.com/they-might-be-giants/the-greatest":
        "https://soundcloud.com/they-might-be-giants/the-greatest-1",
    "https://soundcloud.com/they-might-be-giants/this-microphone":
        "https://soundcloud.com/they-might-be-giants/this-microphone-1",
    "https://soundcloud.com/they-might-be-giants/when-the-lights-come-on":
        "https://soundcloud.com/they-might-be-giants/when-the-light-comes-on",
    "https://soundcloud.com/they-might-be-giants/wu-tang": "https://soundcloud.com/they-might-be-giants/wu-tang-4",

    "https://soundcloud.com/they-might-be-giants/and-mom-and-kid-1":
        "https://soundcloud.com/they-might-be-giants/and-mom-and-kid",
    "https://soundcloud.com/they-might-be-giants/another-first-kiss-1":
        "https://soundcloud.com/they-might-be-giants/another-first-kiss-2",
    "https://soundcloud.com/they-might-be-giants/apophenia": "https://soundcloud.com/they-might-be-giants/apophenia-2",
    "https://soundcloud.com/they-might-be-giants/bangs-1": "https://soundcloud.com/they-might-be-giants/bangs-2",
    "https://soundcloud.com/they-might-be-giants/bills-bills-bills":
        "https://soundcloud.com/they-might-be-giants/bills-bills-bills-2",
    "https://soundcloud.com/they-might-be-giants/black-ops-alt":
        "https://soundcloud.com/they-might-be-giants/black-ops-alt-2",
    "https://soundcloud.com/they-might-be-giants/boss-of-me":
        "https://soundcloud.com/they-might-be-giants/boss-of-me-1",
    "https://soundcloud.com/they-might-be-giants/cloissone": "https://soundcloud.com/they-might-be-giants/cloisonne-2",
    "https://soundcloud.com/they-might-be-giants/cyclops-rock-1":
        "https://soundcloud.com/they-might-be-giants/cyclops-rock-2",
    "https://soundcloud.com/they-might-be-giants/daylight": "https://soundcloud.com/they-might-be-giants/daylight-2",
    "https://soundcloud.com/they-might-be-giants/definition-of-good-1":
        "https://soundcloud.com/they-might-be-giants/definition-of-good",
    "https://soundcloud.com/they-might-be-giants/doctor-worm":
        "https://soundcloud.com/they-might-be-giants/doctor-worm-6",
    "https://soundcloud.com/they-might-be-giants/drink-2": "https://soundcloud.com/they-might-be-giants/drink-3",
    "https://soundcloud.com/they-might-be-giants/ecnalubma": "https://soundcloud.com/they-might-be-giants/ecnalubma-2",
    "https://soundcloud.com/they-might-be-giants/elephants-feat-danny":
        "https://soundcloud.com/they-might-be-giants/elephants-feat-danny-weinkauf",
    "https://soundcloud.com/they-might-be-giants/feast-of-lights-1":
        "https://soundcloud.com/they-might-be-giants/feast-of-lights-3",
    "https://soundcloud.com/they-might-be-giants/finished-with-lies-1":
        "https://soundcloud.com/they-might-be-giants/finished-with-lies-2",
    "https://soundcloud.com/they-might-be-giants/got-getting-up-so-down":
        "https://soundcloud.com/they-might-be-giants/got-getting-up-so-down-2",
    "https://soundcloud.com/they-might-be-giants/hello-mrs-wheelyke-1":
        "https://soundcloud.com/they-might-be-giants/hello-mrs-wheelyke",
    "https://soundcloud.com/they-might-be-giants/hovering-sombrero-1":
        "https://soundcloud.com/they-might-be-giants/hovering-sombrero-2",
    "https://soundcloud.com/they-might-be-giants/i-am-alone":
        "https://soundcloud.com/they-might-be-giants/i-am-alone-2",
    "https://soundcloud.com/they-might-be-giants/i-am-invisible-1":
        "https://soundcloud.com/they-might-be-giants/i-am-invisible",
    "https://soundcloud.com/they-might-be-giants/i-havent-seen-you-in-forever-1":
        "https://soundcloud.com/they-might-be-giants/i-havent-seen-you-in-forever",
    "https://soundcloud.com/they-might-be-giants/i-just-want-to-dance-1":
        "https://soundcloud.com/they-might-be-giants/i-just-want-to-dance",
    "https://soundcloud.com/they-might-be-giants/i-love-you-for-psychological":
        "https://soundcloud.com/they-might-be-giants/i-love-you-for-psychological-2",
    "https://soundcloud.com/they-might-be-giants/i-made-a-mess-1":
        "https://soundcloud.com/they-might-be-giants/i-made-a-mess",
    "https://soundcloud.com/they-might-be-giants/i-wasnt-listening":
        "https://soundcloud.com/they-might-be-giants/i-wasnt-listening-2",
    "https://soundcloud.com/they-might-be-giants/ill-be-haunting-you":
        "https://soundcloud.com/they-might-be-giants/ill-be-haunting-you-2",
    "https://soundcloud.com/they-might-be-giants/ive-got-a-fang-1":
        "https://soundcloud.com/they-might-be-giants/ive-got-a-fang-2",
    "https://soundcloud.com/they-might-be-giants/impossibly-new":
        "https://soundcloud.com/they-might-be-giants/impossibly-new-2",
    "https://soundcloud.com/they-might-be-giants/it-said-something":
        "https://soundcloud.com/they-might-be-giants/it-said-something-2",
    "https://soundcloud.com/they-might-be-giants/long-white-beard-feat-robin":
        "https://soundcloud.com/they-might-be-giants/long-white-beard-feat-robin-1",
    "https://soundcloud.com/they-might-be-giants/macgyver": "https://soundcloud.com/they-might-be-giants/macgyver-1",
    "https://soundcloud.com/they-might-be-giants/man-its-so-loud-in-here-1":
        "https://soundcloud.com/they-might-be-giants/man-its-so-loud-in-here-2",
    "https://soundcloud.com/they-might-be-giants/mink-car-1": "https://soundcloud.com/they-might-be-giants/mink-car-2",
    "https://soundcloud.com/they-might-be-giants/moles-hounds-bears-bees-and":
        "https://soundcloud.com/they-might-be-giants/moles-hounds-bears-bees-and-1",
    "https://soundcloud.com/they-might-be-giants/my-man-1": "https://soundcloud.com/they-might-be-giants/my-man-2",
    "https://soundcloud.com/they-might-be-giants/o-tannenbaum-1":
        "https://soundcloud.com/they-might-be-giants/o-tannenbaum-3",
    "https://soundcloud.com/they-might-be-giants/oh-you-did-feat-robin":
        "https://soundcloud.com/they-might-be-giants/oh-you-did-feat-robin-1",
    "https://soundcloud.com/they-might-be-giants/old-pine-box":
        "https://soundcloud.com/they-might-be-giants/old-pine-box-2",
    "https://soundcloud.com/they-might-be-giants/older-2": "https://soundcloud.com/they-might-be-giants/older-3",
    "https://soundcloud.com/they-might-be-giants/omnicorn-1": "https://soundcloud.com/they-might-be-giants/omnicorn",
    "https://soundcloud.com/they-might-be-giants/or-so-i-have-read-1":
        "https://soundcloud.com/they-might-be-giants/or-so-i-have-read",
    "https://soundcloud.com/they-might-be-giants/out-of-a-tree-1":
        "https://soundcloud.com/they-might-be-giants/out-of-a-tree",
    "https://soundcloud.com/they-might-be-giants/santa-claus-1":
        "https://soundcloud.com/they-might-be-giants/santa-claus-3",
    "https://soundcloud.com/they-might-be-giants/say-nice-things-about-detroit":
        "https://soundcloud.com/they-might-be-giants/say-nice-things-about-2",
    "https://soundcloud.com/they-might-be-giants/severe-tire-damage-theme":
        "https://soundcloud.com/they-might-be-giants/severe-tire-damage-theme-2",
    "https://soundcloud.com/they-might-be-giants/shape-shifter":
        "https://soundcloud.com/they-might-be-giants/shape-shifter-2",
    "https://soundcloud.com/they-might-be-giants/she-thinks-shes-edith-head-2":
        "https://soundcloud.com/they-might-be-giants/she-thinks-shes-edith-head-3",
    "https://soundcloud.com/they-might-be-giants/so-crazy-for-books-1":
        "https://soundcloud.com/they-might-be-giants/so-crazy-for-books",
    "https://soundcloud.com/they-might-be-giants/sold-my-mind-to-the-kremlin":
        "https://soundcloud.com/they-might-be-giants/sold-my-mind-to-the-kremlin-2",
    "https://soundcloud.com/they-might-be-giants/then-the-kids-took-over-1":
        "https://soundcloud.com/they-might-be-giants/then-the-kids-took-over",
    "https://soundcloud.com/they-might-be-giants/thinking-machine-1":
        "https://soundcloud.com/they-might-be-giants/thinking-machine",
    "https://soundcloud.com/they-might-be-giants/to-a-forest":
        "https://soundcloud.com/they-might-be-giants/to-a-forest-2",
    "https://soundcloud.com/they-might-be-giants/trouble-awful-devil-evil-1":
        "https://soundcloud.com/they-might-be-giants/trouble-awful-devil-evil-3",
    "https://soundcloud.com/they-might-be-giants/walking-my-cat-named-dog-1":
        "https://soundcloud.com/they-might-be-giants/walking-my-cat-named-dog",
    "https://soundcloud.com/they-might-be-giants/what-did-i-do-to-you":
        "https://soundcloud.com/they-might-be-giants/what-did-i-do-to-you-2",
    "https://soundcloud.com/they-might-be-giants/wicked-little-critta-1":
        "https://soundcloud.com/they-might-be-giants/wicked-little-critta-2",
    "https://soundcloud.com/they-might-be-giants/working-undercover-for-the-1":
        "https://soundcloud.com/they-might-be-giants/working-undercover-for-the-2",
    "https://soundcloud.com/they-might-be-giants/yeh-yeh-1": "https://soundcloud.com/they-might-be-giants/yeh-yeh-2",
    "https://soundcloud.com/they-might-be-giants/your-moms-alright":
        "https://soundcloud.com/they-might-be-giants/your-moms-alright-1"
};

export function remapUrl(url: string): string {
    // follow the full remap chain.
    // Only to a certain depth in case I mess it up and make a loop.
    // Not detecting loops today.
    for (let i = 0; i < 10; i++) {
        if (oldToNewId[url]) {
            url = oldToNewId[url];
        } else {
            return url;
        }
    }
    throw new Error(`remapUrl: Max depth reached for ${url}`);
}
