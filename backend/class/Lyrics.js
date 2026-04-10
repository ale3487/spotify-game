//class/Lyrics.js

export class Lyrics {
    #name;
    #artist;
    #lyrics;
    #chorus;
    #timestamp;
    #syncedLyrics;
    #syncedLines;

    constructor(name, artist) {
        this.#name = name;
        this.#artist = artist;
    }

//getters
    get name() { return this.#name; }
    get artist() { return this.#artist; }
    get lyrics() { return this.#lyrics; }
    get chorus() { return this.#chorus; }
    get syncedLyrics() { return this.#syncedLyrics; }
    get syncedLines() { return this.#syncedLines; }
    get timestamp() { return this.#timestamp; }

//setters
    set lyrics(value) {
        this.#lyrics = value;
    }

    set chorus(value) {
        this.#chorus = value;
    }

    set syncedLyrics(value) {
        this.#syncedLyrics = value;
    }

    set syncedLines(value) {
        this.#syncedLines = value;
    }

    set timestamp(value) {
        this.#timestamp = value;
    }

    toJSON() {
        return {
            track: this.name,
            artist: this.artist,
            lyrics: this.lyrics,
            chorus: this.#chorus,
            syncedLyrics: this.syncedLyrics,
            syncedLines: this.syncedLines,
            timestamp: this.timestamp
        };
    }
}