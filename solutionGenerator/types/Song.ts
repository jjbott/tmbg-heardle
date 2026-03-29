export interface RawSong {
    id: number;
    title: string;
    waveform_url: string;
    full_duration: number;
    permalink_url: string;
    publisher_metadata: {
        album_title?: string;
        artist?: string;
    };
    track_authorization: string | null;
    likes_count: number;
    playback_count: number;
    user: { followers_count: number };
}

export interface Song {
    id: number;
    url: string;
    title: string;
    album: string;
    artist: string;
    duration: number;
}

export interface ProcessedSong extends Song {
    originalTitle: string;
    exclusionReason?: string;
}
