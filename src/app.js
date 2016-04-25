import redis from './services/redis';
var server = require('http').createServer()
var io = require('socket.io')(server);

io.on('connection', (socket) => {
  redis.on('message', (channel, message) => {
    switch (channel) {
      case 'positive_changed':
        socket.emit(channel, parseInt(message, 10));
        break;

      case 'negative_changed':
        socket.emit(channel, parseInt(message, 10));
        break;

      default: break;
    }
  });
});

redis.subscribe('positive_changed');
redis.subscribe('negative_changed');

const port = process.env.PORT || 3000;
server.listen(port);
console.log('Listening on port: ', port);
