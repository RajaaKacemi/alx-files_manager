// utils/db.js
import mongodb from 'mongodb';
const { MongoClient } = mongodb;

/**
 * DBClient class that handles the connection to MongoDB
 */
class DBClient {
  /**
   * Constructor for DBClient
   * Initializes the MongoDB client and connects to the database
   */
  constructor () {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
      })
      .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
      });
  }

  /**
   * Checks if the MongoDB client is connected
   * @returns {boolean} True if the client is connected, otherwise false
   */
  isAlive () {
    return this.client && this.client.isConnected();
  }

  /**
   * Gets the number of documents in the "users" collection
   * @returns {Promise<number>} The number of documents in the "users" collection
   */
  async nbUsers () {
    if (!this.db) {
      return 0;
    }
    return this.db.collection('users').countDocuments();
  }

  /**
 * get concern collection from database
 * @param {*} collectionName
 * @returns {import("mongodb").Collection} users collection
 */
  getCollection (collectionName) {
    return this.db.collection(collectionName);
  }

  /**
   * Gets the number of documents in the "files" collection
   * @returns {Promise<number>} The number of documents in the "files" collection
   */
  async nbFiles () {
    // if (!this.db) {
    //   return 0;
    // }
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
if (process.argv[2]) console.log(dbClient);
