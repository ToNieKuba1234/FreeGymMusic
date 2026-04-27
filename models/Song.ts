export default class Song {
  title: string;
  duration: number;
  uri: string;

  constructor(title: string, duration: number, uri: string) {
    this.title = title;
    this.duration = duration;
    this.uri = uri;
  }
}