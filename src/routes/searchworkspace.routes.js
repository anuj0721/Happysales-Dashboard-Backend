import { Router } from "express";
import { extractworkspaceid, workspacedetail } from "../controllers/searchworkspace.controller.js";

const router = Router();

router.route("/extractworkspaceid").get(extractworkspaceid);
router.route("/workspacedetail").get(workspacedetail);

export default router;
