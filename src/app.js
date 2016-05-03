import http from 'http';
import socketIO from 'socket.io';
import chunk from 'lodash.chunk';
import redis from './services/redis';

const server = http.createServer()
const io = socketIO(server)

const redisClient = redis.createClient();
const redisSubscriber = redis.createClient();

let sockets = [];
io.on('connection', (socket) => {
  sockets = sockets.concat(socket)

  redisClient.getAsync('positive')
    .then((positive) => {
      socket.emit('positive', parseInt(positive, 10));
    })
    .then(() => redisClient.getAsync('negative'))
    .then((negative) => {
      socket.emit('negative', parseInt(negative, 10));
    })
    .then(() => redisClient.zrangebyscoreAsync('positive_words', '-inf', '+inf', 'WITHSCORES'))
    .then((words) => {
      const payload = chunk(words, 2).map((word) => {
        return {
          word: word[0],
          value: parseInt(word[1])
        };
      });

      socket.emit('positive_words', payload);
    })
    .then(() => redisClient.zrangebyscoreAsync('negative_words', '-inf', '+inf', 'WITHSCORES'))
    .then((words) => {
      const payload = chunk(words, 2).map((word) => {
        return {
          word: word[0],
          value: parseInt(word[1])
        };
      });

      socket.emit('negative_words', payload);
    })
    .catch((err) => {
      throw err
    });

  socket.on('disconnect', () => {
    sockets = sockets.filter(s => s !== socket);
  });
});


redisSubscriber.on('message', (channel, message) => {
  switch (channel) {
    case 'positive':
      sockets.forEach(socket => {
        socket.emit(channel, parseInt(message, 10))
      });
      break;

    case 'negative':
      sockets.forEach(socket => {
        socket.emit(channel, parseInt(message, 10))
      });
      break;

    case 'positive_words':
      sockets.forEach(socket => {
        socket.emit(channel, JSON.parse(message))
      });
      break;

    case 'negative_words':
      sockets.forEach(socket => {
        socket.emit(channel, JSON.parse(message))
      });
      break;

    default: break;
  }
});

redisSubscriber.subscribe('positive');
redisSubscriber.subscribe('negative');
redisSubscriber.subscribe('positive_word_changed');
redisSubscriber.subscribe('negative_word_changed');

const port = process.env.PORT || 3000;
server.listen(port);
console.log('Listening on port: ', port);
