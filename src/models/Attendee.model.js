import mongoose, { Schema } from "mongoose";


const userSchema = new Schema(
    {
        username: {
            type: String, 
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String, 
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String, 
            required: true,
            trim: true,
            index: true
        },
        
        coverImage: {
            type: String, 
            required:true
        },
        
        password: {
            type: String, 
            required: [true, 'Password is required']
        },
        task: [
            {
                type: Schema.Types.ObjectId,
                ref: "Task",
            }
        ],
        tasksubmited:[
            {
                type: Schema.Types.ObjectId,
                ref: "Task",
            }
        ]
    },
    {
        timestamps: true
    }
);




export const User = mongoose.model("User", userSchema);
