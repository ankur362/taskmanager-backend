import mongoose, { Schema } from "mongoose";


const taskSchema = new Schema(
    {
        agenda: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending','completed'],
            default: 'pending',            
        },
        proof:{
            type:String
        }
        ,
        lastdate:{
            type:String,
            required:true
        }
        ,
        assingnedAttendees:  {
            type: Schema.Types.ObjectId,
            ref: "User",

        },
        relatedEvent:{
            type: Schema.Types.ObjectId,
                ref: "Event",
                required:"true",
        }
    },
{
    timestamps: true
}
);




export const Alltask = mongoose.model("Alltask", taskSchema);
