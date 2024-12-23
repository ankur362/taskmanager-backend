import mongoose, { Schema } from "mongoose";


const eventSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,

        },
        description: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        totalAttendees: {
            type: Number,
            default: 0,

        },
        date: {
            type: String,
            required: true,
        },
        task: [
            {
                type: Schema.Types.ObjectId,
                ref: "Task",
            }
        ],
        taskCompleted:[
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




export const Event = mongoose.model("Event", eventSchema);
