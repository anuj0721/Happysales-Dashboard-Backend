import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();


app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import featureusageRouter from "./routes/featureusage.routes.js";
import weeklysignupsRouter from "./routes/weeklysignups.routes.js";
import analyticsutilsRouter from "./routes/analyticsutils.routes.js";
import workspacesactivityRouter from "./routes/workspacesactivity.routes.js"
import searchworkspaceRouter from "./routes/searchworkspace.routes.js"

//routes declaration
app.use("/api/users", userRouter);
app.use("/api/healthcheck", healthcheckRouter);
app.use("/api/featureusage", featureusageRouter);
app.use("/api/weeklysignups", weeklysignupsRouter);
app.use("/api/analyticsusage", analyticsutilsRouter);
app.use("/api/workspacesactivity", workspacesactivityRouter);
app.use("/api/searchworkspace", searchworkspaceRouter);

export { app };
