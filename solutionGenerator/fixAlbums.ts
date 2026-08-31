const albumFixes = [
    // Album tracks posted before the album was released. They were given different album names for some reason.
    /*[
            "https://soundcloud.com/they-might-be-giants/wu-tang",
            "The World Is to Dig"
        ],*/
    ["https://soundcloud.com/they-might-be-giants/outside-brain", "The World Is to Dig"],

    // These aren't really "fixing", but someone has royally jacked things up, and some tracks are duplicated.
    // For now I'm keeping the older version until that bites me.
    ["https://soundcloud.com/they-might-be-giants/experimental-film-4", "The Spine (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/damn-good-times-4", "The Spine (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/moonbeam-rays-2", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/synopsis-for-latecomers-2", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/drown-the-clown-2", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/brontosaurus-3", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/quit-the-circus-2", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/wait-actually-yeah-no-2", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/darling-the-dose-2", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/lord-snowdon-1", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/if-day-for-winnipeg-2", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/less-than-one-2", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/i-cant-remember-the-dream-3", "BOOK (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/i-broke-my-own-rule-8", "Book (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/super-cool-4", "Book (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/part-of-you-wants-to-believe-3", "Book (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/i-lost-thursday-5", "Book (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/wu-tang-5", "The World Is to Dig (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/who-are-the-electors-2", "Who Are the Electors? (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/robot-parade-adult-version-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/lazy-2", "Lazy (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/my-man-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/man-its-so-loud-in-here-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/your-moms-alright-2", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/working-undercover-for-the-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/bangs-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/finished-with-lies-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/older-4", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/hovering-sombrero-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/cyclops-rock-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/yeh-yeh-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/mink-car-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/she-thinks-shes-edith-head-4", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/ive-got-a-fang-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/drink-4", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/wicked-little-critta-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/another-first-kiss-3", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/macgyver-2", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/boss-of-me-2", "Mink Car (Duplicate)"],
    ["https://soundcloud.com/they-might-be-giants/certain-people-i-could-name-4", "Long Tall Weekend (Duplicate)"],
];

export function fixAlbum(album: string, url: string): string {
    const fix = albumFixes.find((af) => af[0] === url);
    if (fix) {
        return fix[1];
    }

    return album;
}

export function fixAlbums(songs: { album: string; url: string }[]) {
    songs.forEach((s) => {
        s.album = fixAlbum(s.album, s.url);
    });
}
