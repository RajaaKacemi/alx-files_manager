const redis = require('redis');
const { promisify } = require('util');

	class RedisCient {
		constructor(){
			this.client = redis.createClient();
			this.client.on('error', (error) => {
				console.error(‵Redis client error: ${error}‵);
			});

		//Promisify Redis commands
		this.getAsync = promisify(this.client.get).bind(this.client);
		this.setAsync = promisify(this.client.set).bind(this.client);
		this.delAsync = promisify(this.client.del).bind(this.client);
		}

		isAlive(){
			return this.client.connected;
		}

		async get(key){
			return this.getAsync(key);
		}

		async set(key, value,duration){
			await this.setAsync(key, value, 'Ex', duration);
		}

		async del(key){
			await this.delAsync(key);
		}
	}

const redisClient = new RedisClient();
module.experts = redisClient;
