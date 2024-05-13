import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoConnection, postgresConnection } from "../db/database_connection.js";
import { DB_NAME } from "../constants.js";

const extractworkspaceid = asyncHandler(async (req, res) => {

	try{
		const post_client = await postgresConnection();

		const criteria = req.query.criteria;

		const search_string = req.query.search_string;

		const matching_workspaces = [];

		if(criteria === "Name"){

			let creator_ids = new Set()

			let workspace_ids = new Set()

			const workspaceSearchQuery = `SELECT * FROM workspace WHERE LOWER(name) = LOWER($1)`;
			
			const workspaces = await post_client.query(workspaceSearchQuery, [search_string])

			if(!workspaces.rows.length){

				res.status(200).json(new ApiResponse(200, {}, `There is no workspace with name ${search_string}`));
				return;
				
			}

			for (const row of workspaces.rows) {
			
				creator_ids.add(row.created_by);
				workspace_ids.add(row.id)
			
			}
		
			creator_ids = [...creator_ids]
			workspace_ids = [...workspace_ids]

			const user_email_dict = {};

			const placeholders = creator_ids.map(() => "$1").join(", ");

			const userid_email_query = `SELECT id, email FROM public."user" WHERE id IN (${placeholders})`;

			const results = await post_client.query(userid_email_query, creator_ids);

			for (const row of results.rows){
				user_email_dict[row.id] = row.email;
			}

			const placeholders2 = workspace_ids.map(() => '$1').join(', ');

			const workspace_status_query = `
				SELECT workspace_id,
						COUNT(*) AS total_users,
						COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_users
						FROM public."user"
						WHERE workspace_id IN (${placeholders2})
						GROUP BY workspace_id;
				`;

			const active_users_count = await post_client.query(workspace_status_query, workspace_ids);

			const active_user_count_dict = {}

			for (const row of active_users_count.rows){

				active_user_count_dict[row.workspace_id] = {
					"# Active Users": row.active_users,
					"# Total Users": row.total_users,
				};
			}

			for (const row of workspaces.rows) {
				
				const workspace_data = {
					"id": row.id,
					"name": row.name,
					"creator_email": user_email_dict[row.created_by] || "NA",
					"# Active Users": active_user_count_dict[row.id]["# Active Users"],
					"# Total Users": active_user_count_dict[row.id]["# Total Users"]
				}
				
				matching_workspaces.push(workspace_data)
			}

			console.log(matching_workspaces)

		}

		else if(criteria === "Email/Domain"){

			let creator_ids = new Set()

			let workspace_ids = new Set()

			const workspaceSearchQuery = `SELECT * FROM workspace WHERE LOWER(email) = LOWER($1)`;
			
			const workspaces = await post_client.query(workspaceSearchQuery, [search_string])

			for (const row of workspaces.rows) {
			
				creator_ids.add(row.created_by);
				workspace_ids.add(row.id)
			
			}
		
			creator_ids = [...creator_ids]
			workspace_ids = [...workspace_ids]

			const user_email_dict = {};

			const placeholders = creator_ids.map(() => "$1").join(", ");

			const userid_email_query = `SELECT id, email FROM public."user" WHERE id IN (${placeholders})`;

			const results = await post_client.query(userid_email_query, creator_ids);

			for (const row of results.rows){
				user_email_dict[row.id] = row.email;
			}

			const placeholders2 = workspace_ids.map(() => '$1').join(', ');

			const workspace_status_query = `
				SELECT workspace_id,
						COUNT(*) AS total_users,
						COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_users
						FROM public."user"
						WHERE workspace_id IN (${placeholders2})
						GROUP BY workspace_id;
				`;

			const active_users_count = await post_client.query(workspace_status_query, workspace_ids);

			const active_user_count_dict = {}

			for (const row of active_users_count.rows){

				active_user_count_dict[row.workspace_id] = {
					"# Active Users": row.active_users,
					"# Total Users": row.total_users,
				};
			}

			for (const row of workspaces.rows) {
				
				const workspace_data = {
					"id": row.id,
					"name": row.name,
					"creator_email": user_email_dict[row.created_by] || "NA",
					"# Active Users": active_user_count_dict[row.id]["# Active Users"],
					"# Total Users": active_user_count_dict[row.id]["# Total Users"]
				}
				
				matching_workspaces.push(workspace_data)
			}

			console.log(matching_workspaces)

		}

		return res
			.status(200)
			.json(new ApiResponse(200, {"Workspaces": matching_workspaces}, "OK"));
	}catch(err){

		throw new ApiError(500, "Couldn't extract workspace ids");

	}
});

const workspacedetail = asyncHandler(async (req, res) => {
    try{
		const post_client = await postgresConnection();

		const mongo_client = await mongoConnection();

		const db = mongo_client.db(DB_NAME);

		const workspace_id = req.query.id;

		const workspace_data_query = `SELECT id, name, created_at FROM workspace WHERE id = $1`;

		const workspaceData = await post_client.query(workspace_data_query, [workspace_id]);

		if (workspaceData.rows.length === 0) {
			console.log(`Workspace with ID ${workspace_id} not found.`);
		}
		
		const workspaceDetail = workspaceData.rows[0]

		const workspaceId = workspaceDetail.id;
		const workspaceName = workspaceDetail.name;
		const created_at = workspaceDetail.created_at;

		// Prepare parameterized query to prevent SQL injection
		const user_data_query = `SELECT name, email, role_id, id, created_at, status FROM public."user" WHERE workspace_id = $1`;
		
		let userDetails = await post_client.query(user_data_query, [workspaceId]);

		userDetails = userDetails.rows
		// const userDetailsDict = {"userDeatils" : userDetails.rows};

		const user_ids = []

		for (const user of userDetails) {
			user_ids.push(user.id);
		}

		const user_prospect_collection = db.collection("user_prospect")
		const call_script_collection = db.collection("practice_pitch")

		const pipeline = [
			{
				$match: {
				user_id: { $in: user_ids }, // Filter by IDs in user_ids array
				},
			},
			{
				$group: {
				_id: "$user_id", // Maintain user_id as the grouping key
				documents: {
					$push: "$$ROOT", // Push entire document to the "documents" array
				},
				},
			},
		];

		const userGroupsForEmailIcebreaker = await user_prospect_collection.aggregate(pipeline).toArray();
		const userGroupsForPracticePitch = await call_script_collection.aggregate(pipeline).toArray();

		const countEmailIcebreaker = {};
		const countPracticePitch = {};

		for (const group of userGroupsForEmailIcebreaker) {
			const user_id = group._id;
			let usedEmails = 0, usedIcebreakaers = 0;
			for ( const doc of group.documents){
				if (doc.emails.length) usedEmails++;
				if (doc.used_prospect_icebreaker) usedIcebreakaers++;
			}

			countEmailIcebreaker[user_id] = {
				"# of Emails": usedEmails,
				"# of Icebreakers": usedIcebreakaers,
			};
		}

		for (const group of userGroupsForPracticePitch) {
			const user_id = group._id; // Assuming user_id is the grouping key
			const uniqueProspectIds = new Set();

			for (const doc of group.documents) {
				uniqueProspectIds.add(doc.prospect_id); // Add prospect_id to Set
			}

			countPracticePitch[user_id] = {"# of Call Scripts": uniqueProspectIds.size} // Count of unique elements in Set
		}
		
		const user_email_query = `SELECT id, email FROM public."user" WHERE id = ANY($1)`;
		
		const user_email_data = await post_client.query(user_email_query, [user_ids]);

		const user_email_dict = {};

		if (user_email_data && user_email_data.rows) {
			for (const row of user_email_data.rows) {
				user_email_dict[row.id] = row.email;
			}
		}

		const activityDetails = {}

		for (const user_id of user_ids) {
			if ( countEmailIcebreaker[user_id] !== undefined || countPracticePitch[user_id] !== undefined) {
				activityDetails[user_id] = {}; // Initialize empty object for user

				activityDetails[user_id]["email"] = user_email_dict[user_id];

				if (countEmailIcebreaker[user_id]) {
					activityDetails[user_id]["# of Emails"] = countEmailIcebreaker[user_id]["# of Emails"];
					
					activityDetails[user_id]["# of Icebreakers"] = countEmailIcebreaker[user_id]["# of Icebreakers"];
				}

				if (countPracticePitch[user_id]) {
					activityDetails[user_id]["# of Call Scripts"] = countPracticePitch[user_id]["# of Call Scripts"];
				}
			}
		}
		
		console.log(activityDetails)


		return res
		.status(200)
		.json(
			new ApiResponse(
			200,
			{
				"Workspace id": workspace_id,
				"Workspace name": workspaceName,
				"Created Date": created_at,
				"User Details": userDetails,
				"Activity Details": activityDetails,
			},
				"OK"
			)
		);
	}catch(err){

		throw new ApiError(500, "Couldn't find workspace detail");

	}
});

export { extractworkspaceid, workspacedetail };
