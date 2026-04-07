// class/Player.js
export class Player {
  #id;
  #spotifyId;
  #displayName;
  #isHost;
  #isReady = false;
  #score = 0;

  constructor(socketId, userData, isHost = false) {
    this.#id = socketId;
    this.#spotifyId = userData.spotifyId;
    this.#displayName = userData.display_name;
    this.#isHost = isHost;
  }

  // Getters
  get id() { return this.#id; }
  get displayName() { return this.#displayName; }
  get isHost() { return this.#isHost; }
  get isReady() { return this.#isReady; }
  get score() { return this.#score; }
  get spotifyId() { return this.#spotifyId; }

  // Setters protetti da logica
  set isHost(value) {
    if (typeof value !== 'boolean') return;
    this.#isHost = value;
  }

  set isReady(value) {
    this.#isReady = !!value;
  }

  // Metodi pubblici per modificare lo stato in modo sicuro
  updateScore(points) {
    if (points > 0) {
      this.#score += points;
    }
  }


 // Metodo per ottenere i dati da inviare al client, escludendo informazioni sensibili
  getData() {
    return {
      id: this.#id,
      displayName: this.#displayName,
      isHost: this.#isHost,
      isReady: this.#isReady,
      score: this.#score
    };
  }
}