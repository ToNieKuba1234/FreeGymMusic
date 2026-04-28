export default class Playlist {
  id: string;
  name: string;
  songUris: string[];
  createdAt: number;
  artwork?: string;

  constructor(name: string, songUris: string[] = [], id?: string, createdAt?: number, artwork?: string) {
    this.id = id ?? Date.now().toString();
    this.name = name;
    this.songUris = songUris;
    this.createdAt = createdAt ?? Date.now();
    this.artwork = artwork;
  }
}