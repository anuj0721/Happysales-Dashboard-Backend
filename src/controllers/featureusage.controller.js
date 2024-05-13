import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoConnection } from "../db/database_connection.js";
import { DB_NAME } from "../constants.js";

const featureusage = asyncHandler(async (req, res) => {
	const client = await mongoConnection();

	const db = client.db(DB_NAME);

	const collection = db.collection("user_prospect")
	
	let prospect_insight = 0;
	let prospect_icebreaker = 0;
	let email = 0;
	let disc = 0;
	let key_challenges = 0;
	let pitch = 0;
	let organization_insight = 0;

	const cursor = collection.find({}); // Find all documents

	for await (const document of cursor) {
		if (document["used_prospect_insight"] === true) {
			prospect_insight += 1;
		}
		if (document["used_prospect_icebreaker"] === true) {
			prospect_icebreaker += 1;
		}
		if (document.emails.length) {
			email += 1;
		}
		if (document["used_disc"] === true) {
			disc += 1;
		}
		if (document["used_key_challenges"] === true) {
			key_challenges += 1;
		}
		if (document["used_pitch"] === true) {
			pitch += 1; // Assuming "used_pitch" instead of just "pitch"
		}
		if (document["used_organization_insight"] === true) {
			organization_insight += 1;
		}
	}

	const result = {
		"Prospect Insight Usage": prospect_insight,
		"Prospect Icebreaker Usage": prospect_icebreaker,
		"Email Usage": email,
		"DISC Usage": disc,
		"Key Challenges Usage": key_challenges,
		"Prospect Pitch Usage": pitch,
		"Organization Insight Usage": organization_insight,
	};

	return res.status(200).json(new ApiResponse(200, result, "OK"))
});

export { featureusage };
