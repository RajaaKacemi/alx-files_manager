const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  static async postUpload(req, res) {
    // Authenticate user
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Check parentId if provided
    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Create file document
    const newFile = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : ObjectId(parentId)
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(newFile);
      newFile._id = result.insertedId;
      return res.status(201).json(newFile);
    }

    // Store file locally
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    await fs.mkdir(folderPath, { recursive: true });
    const filename = uuidv4();
    const localPath = path.join(folderPath, filename);
    const fileContent = Buffer.from(data, 'base64');
    await fs.writeFile(localPath, fileContent);

    // Add localPath to file document and save to DB
    newFile.localPath = localPath;
    const result = await dbClient.db.collection('files').insertOne(newFile);
    newFile._id = result.insertedId;

    // Return new file document
    return res.status(201).json(newFile);
  }
 
 static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId)
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page) || 0;
    const pageSize = 20;

    const pipeline = [
      { $match: { userId: ObjectId(userId) } },
      { $match: { parentId: parentId === '0' ? 0 : ObjectId(parentId) } },
      { $skip: page * pageSize },
      { $limit: pageSize }
    ];

    const files = await dbClient.db.collection('files').aggregate(pipeline).toArray();

    return res.status(200).json(files);
  }
 
 static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId)
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: ObjectId(fileId) },
      { $set: { isPublic: true } }
    );

    const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });
    return res.status(200).json(updatedFile);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId)
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: ObjectId(fileId) },
      { $set: { isPublic: false } }
    );

    const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });
    return res.status(200).json(updatedFile);
  }
 
 static async getFile(req, res) {
    const fileId = req.params.id;
    const token = req.headers['x-token'];

    // Find the file
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Check if the file is public or if the user is authenticated and is the owner
    if (!file.isPublic) {
      if (!token) {
        return res.status(404).json({ error: 'Not found' });
      }
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId || file.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    // Check if it's a folder
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    // Check if the file exists locally
    if (!file.localPath || !(await fs.access(file.localPath).then(() => true).catch(() => false))) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Get the MIME type
    const mimeType = mime.lookup(file.name) || 'application/octet-stream';

    // Set the content type header
    res.setHeader('Content-Type', mimeType);

    // Read and send the file
    const fileContent = await fs.readFile(file.localPath);
    return res.status(200).send(fileContent);
  }
}

module.exports = FilesController;
