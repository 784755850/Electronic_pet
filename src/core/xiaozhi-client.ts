import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface XiaoZhiConfig {
  url: string;
  token: string;
}

export class XiaoZhiClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: XiaoZhiConfig;
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(config: XiaoZhiConfig) {
    super();
    this.config = config;
  }

  public connect() {
    if (this.ws) {
      this.ws.close();
    }

    try {
      console.log(`Connecting to XiaoZhi Server: ${this.config.url}`);
      this.ws = new WebSocket(this.config.url, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Protocol-Version': '1'
        }
      });

      this.ws.on('open', this.onOpen.bind(this));
      this.ws.on('message', this.onMessage.bind(this));
      this.ws.on('error', this.onError.bind(this));
      this.ws.on('close', this.onClose.bind(this));

    } catch (error) {
      console.error('XiaoZhi Connection Error:', error);
      this.emit('error', error);
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('XiaoZhi Client is not connected. Cannot send message.');
    }
  }

  private onOpen() {
    console.log('XiaoZhi WebSocket Connected');
    this.isConnected = true;
    this.emit('connected');
    
    // Start Heartbeat if needed, though protocol doesn't strictly specify it, 
    // it's good practice or we rely on server ping
  }

  private onMessage(data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());
      this.handleMessage(message);
    } catch (error) {
      console.error('Failed to parse XiaoZhi message:', error);
    }
  }

  private handleMessage(message: any) {
    // console.log('XiaoZhi Message:', message);
    this.emit('message', message);

    if (message.type === 'hello') {
      console.log('XiaoZhi Handshake Successful:', message);
      this.emit('ready', message);
    } else if (message.type === 'llm') {
      // Forward LLM chunks or full text
      if (message.text) {
        this.emit('llm_text', message.text);
      }
    } else if (message.type === 'tts') {
       // We might use this for future voice features
    }
  }

  private onError(error: Error) {
    console.error('XiaoZhi WebSocket Error:', error);
    this.emit('error', error);
  }

  private onClose(code: number, reason: string) {
    console.log(`XiaoZhi WebSocket Closed: ${code} - ${reason}`);
    this.isConnected = false;
    this.emit('disconnected');
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 5000); // Retry every 5 seconds
    }
  }
}
