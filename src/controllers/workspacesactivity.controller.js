import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoConnection, postgresConnection } from "../db/database_connection.js";
import { DB_NAME } from "../constants.js";

const workspacesactivity = asyncHandler(async (req, res) => {
    try {
        const mongo_client = await mongoConnection();

        const db = mongo_client.db(DB_NAME);

        const collection = db.collection("user_prospect");

        const post_client = await postgresConnection();

        const pipeline = [
            { 
                $match: { 
                    used_email: true 
                } 
            }, // Filter documents with "used_email" set to True
            { 
                $group: { 
                    _id: "$user_id", documents: { $push: "$$ROOT" } 
                } 
            }, // Group documents by user_id
        ];

        const userGroups = await collection.aggregate(pipeline).toArray();

        const user_group_sizes = {};

        for await (const doc of userGroups) {
            user_group_sizes[doc._id] = doc.documents.length; // Store _id and count in the dictionary
        }
        
        const user_ids = Object.keys(user_group_sizes).map((id) => parseInt(id, 10));

        let placeholder_clause = user_ids.map((id) => "$" + (user_ids.indexOf(id) + 1)).join(",");
        
        let query = `SELECT id, workspace_id FROM public.\"user\" WHERE id IN (${placeholder_clause})`;

        let result = await post_client.query(query, user_ids);

        let user_workspace_dict = {}

        for (const row of result.rows) {
            user_workspace_dict[row.id] = row.workspace_id;
        }

        const workspace_activity_count = {}

        let workspace_ids = new Set()

        for (const user_id in user_workspace_dict) {
            const workspace_id = user_workspace_dict[user_id];
            workspace_activity_count[workspace_id] = (workspace_activity_count[workspace_id] || 0) + user_group_sizes[user_id];
            workspace_ids.add(workspace_id);
        }

        workspace_ids = [...workspace_ids]

        const workspace_name_dict = {}, workspace_creator_dict = {};

        placeholder_clause = workspace_ids.map((id, index) => `$${index + 1}`).join(', ');

        query = `SELECT id, created_by, name FROM workspace WHERE id IN (${placeholder_clause})`;

        result = await post_client.query(query, workspace_ids);

        for (const row of result.rows) {
            workspace_name_dict[row.id] = row.name;
            workspace_creator_dict[row.id] = row.created_by;
        }
        const creator_email_dict = {}

        let creator_ids = new Set(Object.values(workspace_creator_dict));

        creator_ids = [...creator_ids]
        
        placeholder_clause = Array.from(creator_ids).map((_, index) => `$${index + 1}`).join(", ");

        query = `SELECT id, email FROM public."user" WHERE id IN (${placeholder_clause})`;

        result = await post_client.query(query, Array.from(creator_ids));

        for (const row of result.rows) {
            creator_email_dict[row.id] = row.email;
        }

        const workspace_data = [];

        // Combine information into dictionaries in a single loop (optional)
        for (const workspace_id in workspace_name_dict) {
            const name = workspace_name_dict[workspace_id];
            const creator_id = workspace_creator_dict[workspace_id];
            const creator_email = creator_email_dict[creator_id];
            const activity_count = workspace_activity_count[workspace_id];

            workspace_data.push([workspace_id, name, creator_email, activity_count]);
        }

        // Sort workspace_data based on activity_count in decreasing order
        const sorted_workspace_data = workspace_data.sort((a, b) => b[3] - a[3]);

        const workspaces_sorted_by_activity = {"workspace_activity": sorted_workspace_data}

        res.status(200).json(new ApiResponse(200, workspaces_sorted_by_activity, "OK"))
    } catch (err) {
        throw new ApiError(500, "Couldn't find workspace activity data");
    }
});

export { workspacesactivity };
