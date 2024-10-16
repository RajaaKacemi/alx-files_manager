const redisClient = require("../utils/redis");
const dbClient = require("../utils/db");

	class AppConroller{
		static async getStatus(req, res){
			const redisAlive = redisClient.isAlive();
			const dbAlive = dbClient.isAlive();
			res.status(200).json({ redis: redisAlive, db: dbAlive });
		}

		static async getStats(req, res){
			try{
				const usersCount = await dbClient.nbUsers();
				const filesCount = await dbClient.nbFiles();
				res.status(200).json({ users: usersCount, files: filesCount });
			}catch(error){
				console.log("Error getting stats:", error);
				res.status(500).json({error: "Internal server error"});
			}
		}
	}
module.exports = AppContorller;
