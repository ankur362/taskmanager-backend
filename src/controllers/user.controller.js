import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { json } from "express";
import { User } from "../models/Attendee.model.js";
import { Alltask } from "../models/Task.model.js";


const registerUser = asyncHandler(async (req, res) => {
   
//fetching data
    const { fullName, email, username, password } = req.body


    
    
    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }


    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(400, "User with email or username already existed")
    }
   
    
   //COVER image
    const coverImageLocalPath = req.files.coverImage[0].path;

    
    

    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file is required")
    }
    
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage) {
        throw new ApiError(400, "cover image file is required")
    }
    //validate password
    if (password.length < 8 || password.length > 15) {
        console.log('Error in userRegister:', error);

        return res.status(400).json({ error: "Password must be at least 8 characters and less than 15 characters" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
   
    const user = await User.create({
        fullName,
        coverImage: coverImage?.url,
        email,
        password:hashedPassword,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password "
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    )
})
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
   console.log(password);
   

    if (!(email || password)) {
        throw new ApiError(400, "email and password is required");
    }
    const loggedinUser = await User.findOne({ email });
    if (!loggedinUser) {
        throw new ApiError(400, "User is not present.Register first");
    }
    const isPasswordValid = await bcrypt.compare(password, loggedinUser.password);
   
    
    if (!isPasswordValid) {
        throw new ApiError(400, "Wrong password");
    }
    const token = jwt.sign({ id: loggedinUser._id }, process.env.JWT_SECRET, {
        expiresIn: "4h",
    });;
    const options = {
        httpOnly: true,
        secure: true,
        maxAge: 4 * 60 * 60 * 1000,
    }
    return res
        .cookie("token", token, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedinUser, token

                }, "User Logged In successfully"
            )
        )
})
 

const logout = asyncHandler(async (req, res) => {
    
    

   
        res.cookie("token", "", {
            httpOnly: true,
            secure: true,
            maxAge: 0, 
        });

        return res.json(
            new ApiResponse(200, null, `User logged out successfully`)
        );
   
});
const deleteattendee=asyncHandler(async(req,res)=>{
    const user =req.user
  
    if(!user){
        throw new ApiError(401,"User does not Exist")
    }
    const { task: taskIds } = user;

    taskIds.forEach(async (taskId) => {
    const task = await Task.findById(taskId);
    if (task && task.assignedAttendees.includes(user.id)) {
        await Task.findByIdAndUpdate(
            taskId,
            { $pull: { assignedAttendees: user._id } },
            { new: true } 
        );
    }
});



    await User.findByIdAndDelete(user._id)
    return res
    .json(new ApiResponse(201,"user Deleted successfully"))
})
const submitTask = asyncHandler(async (req, res) => {
    const {taskid } = req.body; 
    const user= req.user;
   
    

  
    if ( !taskid) {
        throw new ApiError(400, "User ID and Task ID are required.");
    }

    
    const task = await Alltask.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found.");
    }
//proof
    const proofLocalPath = req.files.proof[0].path;

    
    

    if (!proofLocalPath) {
        throw new ApiError(400, "cover image file is required")
    }
    
    
    const proof = await uploadOnCloudinary(proofLocalPath)
    if (!proof) {
        throw new ApiError(400, "cover image file is required")
    }
  
    
    

    if (user.tasksubmited.includes(taskId)) {
        throw new ApiError(400, "Task has already been submitted.");
    }

    
    user.tasksubmited.push(taskId);
    await user.save();

    task.status = "completed"; 
    task.proof = proof.url;
    await task.save();
    await Event.findByIdAndUpdate(relatedEvent,{$push:{taskCompleted:taskid}})

    return res.json(new ApiResponse(200, { user, task }, "Task completed successfully."));
});

    






export{registerUser,
    login,
    logout,
    deleteattendee,
    submitTask}