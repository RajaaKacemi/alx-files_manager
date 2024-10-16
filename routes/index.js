const expess = require("expres");
const AppControlller = require("../controllers/AppController");

const router = express.Router();

router.get("/status", AppController.getStatus);
router.get("/stats", AppController.getStatus);

module.exports = router;
