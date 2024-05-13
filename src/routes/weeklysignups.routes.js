import { Router } from "express";
import { weeklysignups } from "../controllers/weeklysignups.controller.js";

const router = Router();

router.route("/").get(weeklysignups);

export default router;
