import { User } from "../models/Attendee.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"

export const verifyAdminJWT =asyncHandler(async(req,res,next)=>
{
    try {
        const token = req.cookies?.atoken || req.header("Authorization")?.replace("Bearer ","")
        console.log("hello");
        
        console.log(token);
        
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
       const decodedToken= jwt.verify(token,process.env.JWT_SECRET)
       console.log(decodedToken);
       const fixedUsers = [
        { email: process.env.FIXED_USER_1_EMAIL },
        { email: process.env.FIXED_USER_2_EMAIL},
        { email: process.env.FIXED_USER_3_EMAIL},
                    ];

 
       const authenticatedUser = fixedUsers.find(
        user => user.email === decodedToken.email 
       )
       if(!authenticatedUser)
        {   
            throw new ApiError(401,"Invalid Token")
        }
        
        
        next()
    } 
    catch (error) {
        throw new ApiError(401,error?.message || "Invalid Token")

}
}
)