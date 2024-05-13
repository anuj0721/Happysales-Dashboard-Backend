import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoConnection, postgresConnection } from "../db/database_connection.js";
import { DB_NAME } from "../constants.js";

const avgUserPerWs = asyncHandler(async (req, res) => {
    try{
        const client = await postgresConnection();

        const result1 = await client.query('SELECT COUNT(*) FROM public.\"user\";')

        const UsersCount = result1.rows[0].count;

        const result2 = await client.query('SELECT COUNT(*) FROM workspace;')

        const WorkspacesCount = result2.rows[0].count;

        let result = UsersCount / WorkspacesCount;

        result = result.toFixed(4);

        console.log(result)
        res.status(200).json(new ApiResponse(200, {"avgUserPerWs": result}, "OK"));

    }catch(err){
        throw new ApiError(500, "Couldn't find average user per workspace data");
    }
});

const avgProsPerWs = asyncHandler(async (req, res) => {
    try {
        const post_client = await postgresConnection();

        const mongo_client = await mongoConnection();

        const db = mongo_client.db(DB_NAME);

        const collection = db.collection("prospect")

        const ProspectsCount = await collection.countDocuments();

        const queryResult = await post_client.query("SELECT COUNT(*) FROM workspace;");

        const WorkspacesCount = queryResult.rows[0].count;

        let result = ProspectsCount / WorkspacesCount;

        result = result.toFixed(4);

        res.status(200).json(new ApiResponse(200, { "avgProsPerWs": result }, "OK")); 

    } catch (err) {
        throw new ApiError(500, "Couldn't find average prospect per workspace data");
    }
});

const avgProsPerUser = asyncHandler(async (req, res) => {
    try {
        const post_client = await postgresConnection();

        const mongo_client = await mongoConnection();

        const db = mongo_client.db(DB_NAME);

        const collection = db.collection("prospect");

        const ProspectsCount = await collection.countDocuments();

        const queryresult = await post_client.query('SELECT COUNT(*) FROM public."user";');

        const UsersCount = queryresult.rows[0].count;

        console.log(UsersCount)

        let result = ProspectsCount / UsersCount;

        result = result.toFixed(4);

        res.status(200).json(new ApiResponse(200, {"avgProsPerUser" : result}, "OK"))
    } catch (err) {
        throw new ApiError(500, "Couldn't find average prospect per user data");
    }
});

const avgRoleplayPerUser = asyncHandler(async (req, res) => {
    try {
        const post_client = await postgresConnection();

        const mongo_client = await mongoConnection();

        const db = mongo_client.db(DB_NAME);

        const collection = db.collection("practice_pitch");

        const RoleplaysCount = await collection.countDocuments();

        const queryresult = await post_client.query('SELECT COUNT(*) FROM public."user";');

        const UsersCount = queryresult.rows[0].count;
        
        console.log(RoleplaysCount, UsersCount)

        let result = RoleplaysCount / UsersCount;

        result = result.toFixed(4);

        res.status(200).json(new ApiResponse(200, {"avgRoleplayPerUser" : result}, "OK"))
    } catch (err) {
        throw new ApiError(500, "Couldn't find average roleplay per user data");
    }
});

export { avgUserPerWs, avgProsPerWs, avgProsPerUser, avgRoleplayPerUser };
