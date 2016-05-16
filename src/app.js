import 'babel-polyfill';
import http from 'http';
import socketIO from 'socket.io';
import chunk from 'lodash.chunk';
import redis from './services/redis';
import {chain} from 'lodash'
const server = http.createServer()
const io = socketIO(server)

const redisClient = redis.createClient();
const redisSubscriber = redis.createClient();

let sockets = [];
io.on('connection', async function (socket) {
  sockets = sockets.concat(socket)

  try {
    const positive = await redisClient.getAsync('positive');
    const negative = await redisClient.getAsync('negative');

    const positiveWords = await redisClient.zrangebyscoreAsync('positive_words', '-inf', '+inf', 'WITHSCORES');
    const negativeWords = await redisClient.zrangebyscoreAsync('negative_words', '-inf', '+inf', 'WITHSCORES');

    const words = {
      positive: chain(positiveWords)
        .chunk(2)
        .map(([word, value]) => ({
          word,
          value: parseInt(value, 10)
        }))
        .value(),
      negative: chain(negativeWords)
        .chunk(2)
        .map(([word, value]) => ({
          word,
          value: parseInt(value, 10)
        }))
        .value()
    };

    socket.emit('positive', parseInt(positive, 10));
    socket.emit('negative', parseInt(negative, 10));
    socket.emit('words', words);
  } catch (err) {
    console.error(err);
  }

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

    case 'positive_word':
    case 'negative_word':
      sockets.forEach(socket => {
        const {word, value} = JSON.parse(message);
        socket.emit(channel, {
          word,
          value: parseInt(value, 10)
        })
      });
      break;

    default: break;
  }
});

redisSubscriber.subscribe('positive');
redisSubscriber.subscribe('negative');
redisSubscriber.subscribe('positive_word');
redisSubscriber.subscribe('negative_word');

const port = process.env.PORT || 3000;
server.listen(port);
console.log('Listening on port: ', port);
