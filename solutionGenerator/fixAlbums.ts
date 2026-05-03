const albumFixes = [
        // Album tracks posted before the album was released. They were given different album names for some reason.
        [
            "https://soundcloud.com/they-might-be-giants/wu-tang",
            "The World Is to Dig"
        ],
        [
            "https://soundcloud.com/they-might-be-giants/outside-brain",
            "The World Is to Dig"
        ],
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
