const { MongoClient } = require('mongodb');

	class DBClient{
		constructor(){
			const host = process.env.DB_HOST || 'localhost';
			const port = process.env.DB_PORT || 27017;
			const database = process.env.DB_DATABASE || 'files_manager';

			const url = `mongodb://${host}:${port}/${database}`;

			this.client = new MongoClient(url, { useUnifiedTopology: true });
			this.client.connect()
				.then(() => {
					this.db = this.client.db(database);
					console.log("Connected successfully to MongoDB");
				})
				.catch((e) => {
					console.error("Failed to connect to MongoDB:", e);
				});
		}
	isAlive(){
		return !!this.client && !!this.client.topology && this.client.topology.isConnected();
	}

	async nbUsers(){
		if(!this.db) return 0;
		return this.db.collection('users').countDocuments();
	}

	async nbFiles(){
		if(!this.db) return 0;
		return this.db.collection('files').countDocuments();
	}
	}
const dbClient = new DBClient();
module.exports = dbClients;
