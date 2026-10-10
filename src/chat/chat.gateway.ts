import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket, 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  WebSocketServer 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import type { ChatHistoryPayload } from './chat.service.js';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('kidsChat')
  async handleKidsChat(
    @MessageBody() payload: ChatHistoryPayload,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Received kidsChat message from ${client.id}`);
    
    // Analyze intention
    const intentionResponse = await this.chatService.analyzeIntention(payload);
    
    // Emit response back on a dedicated event name
    client.emit('kidsChatResponse', intentionResponse);
    
    return intentionResponse; // Acknowledgment
  }
}
