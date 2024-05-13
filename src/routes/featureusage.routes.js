import { Router } from "express";
import { featureusage } from "../controllers/featureusage.controller.js";

const router = Router();

router.route("/").get(featureusage);

export default router;
