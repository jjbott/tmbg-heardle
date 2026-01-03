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