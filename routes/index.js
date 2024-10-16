const expess = require("expres");
const AppControlller = require("../controllers/AppController");

const router = express.Router();

router.get("/status", AppController.getStatus);
router.get("/stats", AppController.getStatus);
router.post("/users", UsersController.postNew);
router.get("/connect", AuthController.getConnect);
router.get("/disconnect", AuthController.getDisconnect);
router.get("/users/me", UserController.getMe);
router.post("/files", FilesController.postUpload);
router.get("/files/:id", FilesController.getShow);
rouetr.get("/files", FilesController.getIndex);
rouetr.get("/files/:id/publish", FilesController.putPublish);
rouetr.get("/files", FilesController.putUnpublish);
rouetr.get("/files/:id/data", FilesController.getFile);

module.exports = router;
