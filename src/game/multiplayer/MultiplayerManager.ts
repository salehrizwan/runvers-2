import { HeroOutfitVariant, MultiplayerPlayer, RivalState } from '../../types/game';

export class MultiplayerManager {
  private ws: WebSocket | null = null;
  public roomCode: string | null = null;
  public playerId: string | null = null;
  public isHost = false;
  public myVariant: HeroOutfitVariant = 'teal_rebel';
  public rivalVariant: HeroOutfitVariant = 'crimson_rebel';
  public myName = 'Player';
  public rivalName = 'Rival';

  public onRoomCreated?: (code: string) => void;
  public onGuestJoined?: (guestName: string) => void;
  public onRoomJoined?: (code: string, hostName: string) => void;
  public onRaceCountdown?: (countdown: number, seed: number) => void;
  public onRivalSync?: (state: RivalState) => void;
  public onRivalStumble?: () => void;
  public onRivalCrashed?: (distance: number, score: number) => void;
  public onRivalRevived?: () => void;
  public onRivalFinished?: (distance: number, score: number) => void;
  public onRaceCompleted?: (players: MultiplayerPlayer[]) => void;
  public onRivalLeft?: (message: string) => void;
  public onError?: (error: string) => void;

  private connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(this.ws);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/ws`;

      const socket = new WebSocket(url);

      socket.onopen = () => {
        this.ws = socket;
        resolve(socket);
      };

      socket.onerror = (err) => {
        console.error('Multiplayer WebSocket error:', err);
        reject(err);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('Error parsing socket message:', e);
        }
      };

      socket.onclose = () => {
        this.ws = null;
      };
    });
  }

  private handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'room_created':
        this.roomCode = msg.code;
        this.playerId = msg.playerId;
        this.isHost = true;
        this.myVariant = msg.colorVariant || 'teal_rebel';
        this.rivalVariant = 'crimson_rebel';
        if (this.onRoomCreated) this.onRoomCreated(msg.code);
        break;

      case 'guest_joined':
        this.rivalName = msg.guestName || 'Rival';
        this.rivalVariant = msg.colorVariant || 'crimson_rebel';
        if (this.onGuestJoined) this.onGuestJoined(this.rivalName);
        break;

      case 'room_joined':
        this.roomCode = msg.code;
        this.playerId = msg.playerId;
        this.isHost = false;
        this.myVariant = msg.colorVariant || 'crimson_rebel';
        this.rivalVariant = 'teal_rebel';
        this.rivalName = msg.hostName || 'Host';
        if (this.onRoomJoined) this.onRoomJoined(msg.code, this.rivalName);
        break;

      case 'join_error':
        if (this.onError) this.onError(msg.message || 'Unable to join room.');
        break;

      case 'race_starting':
        if (this.onRaceCountdown) {
          this.onRaceCountdown(msg.countdown || 3, msg.seed || 12345);
        }
        break;

      case 'rival_sync':
        if (this.onRivalSync) {
          this.onRivalSync({
            x: msg.x ?? 0,
            y: msg.y ?? 0,
            z: msg.z ?? 0,
            lane: msg.lane ?? 0,
            animState: msg.animState || 'RUN',
            speed: msg.speed ?? 20,
            distance: msg.distance ?? 0,
            score: msg.score ?? 0,
            isAlive: msg.isAlive ?? true,
          });
        }
        break;

      case 'rival_stumble':
        if (this.onRivalStumble) this.onRivalStumble();
        break;

      case 'rival_crashed':
        if (this.onRivalCrashed) this.onRivalCrashed(msg.distance || 0, msg.score || 0);
        break;

      case 'rival_revived':
        if (this.onRivalRevived) this.onRivalRevived();
        break;

      case 'rival_finished':
        if (this.onRivalFinished) this.onRivalFinished(msg.distance || 0, msg.score || 0);
        break;

      case 'race_game_over':
        if (this.onRaceCompleted) this.onRaceCompleted(msg.players || []);
        break;

      case 'rival_left':
        if (this.onRivalLeft) this.onRivalLeft(msg.message || 'Your rival left the race.');
        break;

      default:
        break;
    }
  }

  public async createRoom(playerName: string) {
    this.myName = playerName.trim() || 'Runner 1';
    const socket = await this.connect();
    socket.send(JSON.stringify({ type: 'create_room', name: this.myName }));
  }

  public async joinRoom(roomCode: string, playerName: string) {
    this.myName = playerName.trim() || 'Runner 2';
    const socket = await this.connect();
    socket.send(JSON.stringify({ type: 'join_room', code: roomCode, name: this.myName }));
  }

  public startRace() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'start_race', code: this.roomCode }));
  }

  public sendPlayerSync(syncData: {
    x: number;
    y: number;
    z: number;
    lane: number;
    animState: string;
    speed: number;
    distance: number;
    score: number;
    isAlive: boolean;
  }) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'player_sync', code: this.roomCode, ...syncData }));
  }

  public sendStumble() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'player_stumble', code: this.roomCode }));
  }

  public sendFatalCrash(distance: number, score: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'player_fatal_crash', code: this.roomCode, distance, score }));
  }

  public sendRevive() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'player_revive', code: this.roomCode }));
  }

  public sendFinished(distance: number, score: number, coins: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'player_finished', code: this.roomCode, distance, score, coins }));
  }

  public requestRematch() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'rematch_request', code: this.roomCode }));
  }

  public leaveRoom() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = null;
    this.roomCode = null;
    this.playerId = null;
    this.isHost = false;
  }
}

export const multiplayerManager = new MultiplayerManager();
