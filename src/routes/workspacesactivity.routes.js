import { Router } from "express";
import { workspacesactivity } from "../controllers/workspacesactivity.controller.js";

const router = Router();

router.route("/").get(workspacesactivity);

export default router;
