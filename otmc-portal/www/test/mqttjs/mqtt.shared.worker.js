const bc = new BroadcastChannel('WebSocketChannel');
console.log(':::bc=:<',bc,'>');

import mqtt from 'https://cdn.jsdelivr.net/npm/mqtt@5.3.3/+esm';
console.log(':::mqtt=:<',mqtt,'>');
self.addEventListener('connect', evt => {
  console.log('::addEventListener-connect:evt=:<',evt,'>');
});
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');
console.log(':::client=:<',client,'>');
client.on('connect', () => {
  console.log('::client.on-connect:client.connected=:<',client.connected,'>');
})
