export default class Song {
    title: string;
    artist: string;
    duration: number;
    uri: string;

    constructor(title: string, artist: string, duration: number, uri: string) {
        this.title = title;
        this.artist = artist;
        this.duration = duration;
        this.uri = uri;
    }
}