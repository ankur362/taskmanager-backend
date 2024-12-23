import { User } from "../models/Attendee.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT =asyncHandler(async(req,res,next)=>
{
    try {
        console.log("hello");
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ","")
        console.log("hello");
        
        console.log(token);
        
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
       const decodedToken= jwt.verify(token,process.env.JWT_SECRET)
       console.log(decodedToken);
        const user = await User.findById(decodedToken?.id).select(
        "-password " )
        
        if(!user)
        {   
            throw new ApiError(401,"Invalid Token")
        }
        
        
        req.user =user;
        next()
    } 
    catch (error) {
        throw new ApiError(401,error?.message || "Invalid Token")

}
}
)