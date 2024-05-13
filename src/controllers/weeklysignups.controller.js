import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { postgresConnection } from "../db/database_connection.js";

// Function to extract date part and convert to string
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Add leading zero for single-digit months
    const day = String(date.getDate()).padStart(2, "0"); // Add leading zero for single-digit days
    return `${day}-${month}-${year}`;
}
function getLastDayOfWeek(date) {
    // Get the day of the week (0 for Monday, 6 for Sunday)
    const weekday = date.getDay();
    // Calculate the number of days to move to the previous Sunday
    const daysToAdd = (6 - weekday) % 7; // Handle negative values for Monday
    // Create a new Date object with the adjusted date
    return new Date(date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
}

const weeklysignups = asyncHandler(async (req, res) => {
    try{        
        const client = await postgresConnection();
        
        const result = await client.query(
            'SELECT created_at FROM public."user";'
        );
        
        // console.log(result.rows);
        
        let created_at_list = result.rows;
        let datelist = [];
        // Loop through each object in the created_at_list
        for (let user of created_at_list) {
            datelist.push(user.created_at);
        }
        // Sort the datelist using the sort method with a custom comparison function
        datelist.sort((date1, date2) => {
            // Use getTime() method to compare timestamps in milliseconds
            return date1.getTime() - date2.getTime();
        });
        
        let weeklySignupCounts = {};

        for (const date of datelist) {
            let lastDayOfWeek = formatDate(getLastDayOfWeek(date));
            weeklySignupCounts[lastDayOfWeek] =
                (weeklySignupCounts[lastDayOfWeek] || 0) + 1;
        }

        console.log(weeklySignupCounts);
        res.status(200).json(new ApiResponse(200, weeklySignupCounts, "OK"));
    }catch(err){
        throw new ApiError(500, "Couldn't find sign up data")
    }
    
});

export { weeklysignups };
