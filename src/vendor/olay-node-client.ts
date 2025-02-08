import * as ws from 'ws';

/////////////////////////////////////////////
////// INTERNAL TYPES FOR OLAY TRACKER //////
/////////////////////////////////////////////
export type CustomClientAddEventMessageData = {
  sessionId: string;
  type: string;
  metadata: { [key: string]: unknown };
};

export type CustomClientUpdateMetadataMessageData = {
  sessionId: string;
  metadata: { [key: string]: unknown };
};

export enum WebSocketMessageType {
  WEB_CLIENT_INIT = 'wc_inited',
  WEB_CLIENT_ADD_EVENT = 'wc_add_event',
  CUSTOM_CLIENT_UPDATE_METADATA = 'cc_update_metadata',
  CUSTOM_CLIENT_ADD_EVENT = 'cc_add_event',
}

export type WebSocketMessage<TData = { [key: string]: unknown }> = {
  type: WebSocketMessageType;
  data: TData;
};

////////////////////////////////////////////////
//////////// RECONNECTING WEBSOCKET ////////////
////////////////////////////////////////////////
// I wanna keep all the client-node code in a single file
// because I want it portable as much as possible. Because
// I don't have any plan to distribute it via npm.

enum ReconnectingWebSocketError {
  NOT_OPEN = 'not-open',
}

type ReconnectingWebSocketOptions = {
  url: string;
  minReconnectionDelay?: number;
  maxReconnectionDelay?: number;
  reconnectionDelayGrowFactor?: number;
};

class ReconnectingWebSocket {
  private options: Required<ReconnectingWebSocketOptions>;
  private reconnectionDelay: number;
  private ws: ws.WebSocket | undefined;

  // User-side callback functions
  public onopen: (ev: ws.Event) => any = () => undefined;
  public onmessage: (ev: ws.MessageEvent) => any = () => undefined;
  public onerror: (ev: ws.ErrorEvent) => any = () => undefined;
  public onclose: (ev: ws.CloseEvent) => any = () => undefined;

  constructor(options: ReconnectingWebSocketOptions) {
    this.options = {
      minReconnectionDelay: 250,
      maxReconnectionDelay: 5000,
      reconnectionDelayGrowFactor: 1.3,
      ...options,
    };

    this.reconnectionDelay = this.options.minReconnectionDelay;

    this.createNewWebSocket();
  }

  private createNewWebSocket() {
    this.ws = new ws.WebSocket(this.options.url);
    this.ws.onopen = this.onWebSocketOpen.bind(this);
    this.ws.onmessage = this.onWebSocketMessage.bind(this);
    this.ws.onerror = this.onWebSocketError.bind(this);
    this.ws.onclose = this.onWebSocketClose.bind(this);
  }

  private onWebSocketOpen(ev: ws.Event) {
    this.reconnectionDelay = this.options.minReconnectionDelay;
    this.onopen(ev);
  }

  private onWebSocketMessage(ev: ws.MessageEvent) {
    this.onmessage(ev);
  }

  private onWebSocketClose(ev: ws.CloseEvent) {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws = undefined;
    }

    this.reconnectionDelay = Math.min(
      this.reconnectionDelay * this.options.reconnectionDelayGrowFactor,
      this.options.maxReconnectionDelay
    );
    setTimeout(() => this.createNewWebSocket(), this.reconnectionDelay);

    this.onclose(ev);
  }

  private onWebSocketError(ev: ws.ErrorEvent) {
    this.onerror(ev);
  }

  /**
   * !!! Node `ws` package's `send` method has a callback !!!!
   * https://github.com/websockets/ws/blob/master/doc/ws.md#websocketsenddata-options-callback
   *
   * It's different from browser's WebSocket implementation.
   */
  async send(data: string) {
    if (!this.ws || this.ws.readyState !== 1) {
      throw new Error(ReconnectingWebSocketError.NOT_OPEN);
    }

    return new Promise<void>((resolve, reject) => {
      this.ws!.send(data, (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }
}

/////////////////////////////////////
//////////// CLIENT-NODE ////////////
/////////////////////////////////////

export type NodeClientOptions = {
  wsRoot: string;
  project: string;
};

export class NodeClient {
  private rws: ReconnectingWebSocket;
  private messagesToRetry: WebSocketMessage[] = [];

  constructor(options: NodeClientOptions) {
    const wsUrl = new URL(options.wsRoot);
    wsUrl.pathname = wsUrl.pathname.replace(/\/?$/, '/') + 'ws';
    wsUrl.searchParams.set('project', options.project);

    this.rws = new ReconnectingWebSocket({ url: wsUrl.href });
    this.rws.onopen = () => this.onConnected();
  }

  private onConnected() {
    // Retry sending messages
    if (this.messagesToRetry.length > 0) {
      const messagesToRetry = this.messagesToRetry;
      this.messagesToRetry = [];
      messagesToRetry.forEach((message) => this.send(message));
    }
  }

  private send(message: WebSocketMessage) {
    this.rws.send(JSON.stringify(message)).catch(() => {
      // TODO: Bi saniye, eger connection kopmadan send patlarsa, bu cocugu bi daha retry etmiyorum?
      this.messagesToRetry.push(message);

      if (this.messagesToRetry.length > 500) {
        this.messagesToRetry.splice(0, this.messagesToRetry.length - 500);
      }
    });
  }

  updateMetadata(sessionId: string, metadata: { [key: string]: unknown } = {}) {
    const data: CustomClientUpdateMetadataMessageData = {
      sessionId,
      metadata,
    };
    this.send({
      type: WebSocketMessageType.CUSTOM_CLIENT_UPDATE_METADATA,
      data,
    });
  }

  addEvent(
    sessionId: string,
    type: string,
    metadata: { [key: string]: unknown } = {}
  ) {
    const data: CustomClientAddEventMessageData = {
      sessionId,
      type,
      metadata,
    };
    this.send({
      type: WebSocketMessageType.CUSTOM_CLIENT_ADD_EVENT,
      data,
    });
  }
}
