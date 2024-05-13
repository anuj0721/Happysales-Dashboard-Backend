import { Router } from "express";
import {
    avgUserPerWs,
    avgProsPerWs,
    avgProsPerUser,
    avgRoleplayPerUser,
} from "../controllers/analyticsutils.controller.js";

const router = Router();

router.route("/avgUserPerWs").get(avgUserPerWs);
router.route("/avgProsPerWs").get(avgProsPerWs);
router.route("/avgProsPerUser").get(avgProsPerUser);
router.route("/avgRoleplayPerUser").get(avgRoleplayPerUser);

export default router;
