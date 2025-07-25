import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8081 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Handle incoming messages if needed
  });
  // ws.send('WebSocket connection established');
  // console.log()
});

export { wss };