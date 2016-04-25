import bluebird from 'bluebird';
import redis from 'redis';

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const client = redis.createClient();

client.on('error', error => {
  throw error;
});

client.on('connect', () => console.log('Redis: Connected'));
client.on('ready', () => console.log('Redis: Ready'));

export default client;
