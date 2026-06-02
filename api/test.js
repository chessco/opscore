const WebSocket = require('ws');
const ws = new WebSocket('wss://opscore-api.pitayacode.io/agent', {
    headers: {
        'User-Agent': 'browser',
        'Origin': 'https://pitayaone.pitayacode.io'
    }
});

ws.on('open', () => {
    console.log('Connected!');
});

ws.on('close', (code, reason) => {
    console.log('Disconnected', code, reason.toString());
});

ws.on('error', (err) => {
    console.error('Error', err);
});
