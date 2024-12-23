import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Event } from "../models/Event.model.js";
import { Alltask } from "../models/Task.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/Attendee.model.js";
import bcrypt from "bcrypt"



const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!(email && password)) {
        return res.status(400).json(new ApiResponse(400, null, "Email and password are required."));
    }

    const fixedUsers = [
        { email: process.env.FIXED_USER_1_EMAIL, password: process.env.FIXED_USER_1_PASSWORD },
        { email: process.env.FIXED_USER_2_EMAIL, password: process.env.FIXED_USER_2_PASSWORD },
        { email: process.env.FIXED_USER_3_EMAIL, password: process.env.FIXED_USER_3_PASSWORD },
    ];


    const authenticatedUser = fixedUsers.find(
        user => user.email === email && user.password === password
    );

    if (!authenticatedUser) {
        throw new ApiError(400, "email and password is required");
    }


    const atoken = jwt.sign({ email: authenticatedUser.email }, process.env.JWT_SECRET, {
        expiresIn: "4h",
    });

    const options = {
        httpOnly: true,
        secure: true,
        maxAge: 4 * 60 * 60 * 1000,
    };




    return res
        .cookie("atoken", atoken, options)
        .json(new ApiResponse(200, { atoken }, "Login successful."));
});
const adminlogout = asyncHandler(async (req, res) => {
    res.clearCookie("atoken", {
        httpOnly: true,
        secure: true, // Ensure secure flag is used in production
    });

    return res.json(new ApiResponse(200, null, "Logout successful."));
});

const addEvent = asyncHandler(async (req, res) => {
    const { name, location, description, date } = req.body;
    if (!(name && location && description && date)) {
        throw new ApiError(400, "All field required")
    }
    const event = await Event.create({
        name,
        location,
        description,
        date
    })
    if (!event) {
        throw new ApiError(401, "Something went wrong");
    }
    return res
        .json(new ApiResponse(200, "Event created successfully"))

});
const updateEvent = asyncHandler(async (req, res) => {
    const { eventid, name, location, description, date } = req.body;
    if (!eventid) {
        throw new ApiError(400, "select any task")
    }
    const even = await Event.findById(eventid);
    if (!even) {
        throw new ApiError(401, "Task does not exist")
    }

    if (!(name && description && description && date)) {
        return res.json({ success: false, message: 'All field required' })
    }
    await Event.findByIdAndUpdate(eventid, { name, location, description, date })
    const eve = await Event.findById(eventid)
    return res
        .json(new ApiResponse(201, { eve }, "updated successfully"))


})
const deleteEvent = asyncHandler(async (req, res) => {
    const { eventid } = req.body;
    console.log(eventid);

    const eve = await Event.findById(eventid);
    if (!eve) {
        throw new ApiError(401, "Event does not exist")
    }
    await Event.findByIdAndDelete(eventid);
    return res
        .json(new ApiResponse(201, "deleted successfully"))

})
const getEventsForCalendar = asyncHandler(async (req, res) => {
    // date format is yyyy-mm-dd
    const events = await Event.find().sort({ date: 1 });

    if (!events || events.length === 0) {
        return res.json(new ApiResponse(201, "No events found"));
    }

    const calendarEvents = events.map((event) => ({
        _id: event._id,
        title: event.name,
        description: event.description,
        location: event.location,
        date: event.date,
        totalAttendees: event.totalAttendees,
        taskIds: event.task,
        completedTaskIds: event.taskCompleted,
    }));

    return res.json(new ApiResponse(200, calendarEvents, "Events fetched successfully"));
});



const getTasksForEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.body; // Get the event ID from the body

    // Find the event
    const event = await Event.findById(eventId);

    if (!event) {
        return res.status(404).json(new ApiResponse(404, "Event not found"));
    }

    // Find tasks related to the event
    const tasks = await Alltask.find({ relatedEvent: eventId }).sort({ lastdate: 1 });

    if (!tasks || tasks.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No tasks found for this event"));
    }

    // Map tasks to formattedTasks using Promise.all
    const formattedTasks = await Promise.all(
        tasks.map(async (task) => {
            const user = await User.findById(task.assingnedAttendees); // Fetch assigned user
            return {
                taskId: task._id, // Include taskId in the formatted task
                agenda: task.agenda,
                status: task.status,
                proof: task.proof || "Not Done",
                lastdate: task.lastdate,
                assignedAttendees: user ? { fullName: user.fullName, email: user.email } : null, // Include user details if found
            };
        })
    );

    return res.json(new ApiResponse(200, { formattedTasks }, "Tasks found"));
});


const createTask = asyncHandler(async (req, res) => {
    const { eventid, agenda, lastdate } = req.body;
    console.log(eventid, agenda, lastdate);


    // Validate required fields
    if (!(eventid && agenda && lastdate)) {
        throw new ApiError(400, "Event ID, agenda, and last date are required.");
    }

    // Validate lastdate (ensure it's not before today's date)
    const currentDate = new Date();
    const taskDate = new Date(lastdate);


    if (taskDate < currentDate) {
        throw new ApiError(400, "Last date cannot be in the past.");
    }



    // Create the task
    const task = await Alltask.create({
        agenda,
        relatedEvent: eventid,
        lastdate,
    });
    if (!task) {
        throw new ApiError(401, "Failed to create the task.");
    }

    // Push task to the related event
    await Event.findByIdAndUpdate(
        eventid,
        { $push: { task: task._id } },
        { new: true }
    );

    // Send success response
    return res.json(new ApiResponse(201, { task }, "Task successfully created."));
});


const getAllTasks = asyncHandler(async (req, res) => {
    // Fetch all tasks and populate related event and assigned attendee information
    const tasks = await Alltask.find()
        .populate("relatedEvent", "name date location")  // Populate relatedEvent fields (e.g., name, date, location)
        .populate("assingnedAttendees", "name email");  // Populate assignedAttendees fields (e.g., name, email)

    console.log("Tasks:", tasks);

    if (!tasks || tasks.length === 0) {
        throw new ApiError(401, "No tasks found");
    }

    return res.json(new ApiResponse(200, { tasks }, "Tasks found"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { taskid, agenda, lastdate, } = req.body;
    const taskexist = await Alltask.findById(taskid);
    if (!taskexist) {
        throw new ApiError(401, "Task does not existed")

    }
    await Alltask.findByIdAndUpdate(taskid, { agenda, lastdate })



})
const deleteTask = asyncHandler(async (req, res) => {
    const { taskid } = req.body
    const task = await Alltask.findById(taskid);
    if (!task) {
        throw new ApiError(400, "task does exist")
    }
    const { relatedEvent } = task
    await Event.findByIdAndUpdate(relatedEvent, { $pull: { task: relatedEvent } }, { new: true })
    await Alltask.findByIdAndDelete(taskid);
    return res
        .json(201, "deletionsuccessfull")
})
const assingnAttendeeForTask = asyncHandler(async (req, res) => {
    const { taskid, userid } = req.body;
    console.log(taskid);
    
    if (!(taskid && userid)) {
        throw new ApiError(400, "All Field Required")
    }
    
    const taskexist = await Alltask.findById(taskid);
    console.log("gfgf");
    
    if (!(taskexist)) {
        throw new ApiError(401, "Task does not exist")
    }
    const attendeexist = await User.findById(userid);
    if (!(attendeexist)) {
        throw new ApiError(401, "attendee does not exist")
    }
    await User.findByIdAndUpdate(userid, { $push: { task: taskid } }, { new: true })
    await Alltask.findByIdAndUpdate(taskid, { assingnedAttendees: userid })
    return res.json(new ApiResponse(201, "attendee added to task successfully"))



})
const removeAttendeeFromTask = asyncHandler(async (req, res) => {
    const { taskid, userid } = req.body;

    if (!(taskid && userid)) {
        throw new ApiError(400, "All fields are required");
    }


    const taskExist = await Alltask.findById(taskid);
    if (!taskExist) {
        throw new ApiError(401, "Task does not exist");
    }


    const attendeeExist = await User.findById(userid);
    if (!attendeeExist) {
        throw new ApiError(401, "Attendee does not exist");
    }


    await User.findByIdAndUpdate(userid, { $pull: { task: taskid } }, { new: true });


    await Alltask.findByIdAndUpdate(taskid, { assingnedAttendees: null }, { new: true });

    return res.json(new ApiResponse(200, null, "Attendee successfully removed from the task"));
});
const addattendee = asyncHandler(async (req, res) => {

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
        password: hashedPassword,
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
});
const deleteattendee = asyncHandler(async (req, res) => {
    const { userid } = req.body;
    const user = await User.findById(userid)
    if (!user) {
        throw new ApiError(401, "User does not Exist")
    }
    const { task: taskIds } = user;

    taskIds.forEach(async (taskId) => {
        const task = await Task.findById(taskId);
        if (task && task.assignedAttendees.includes(userid)) {
            await Task.findByIdAndUpdate(
                taskId,
                { $pull: { assignedAttendees: userid } },
                { new: true }
            );
        }
    });



    await User.findByIdAndDelete(userid)
    return res
        .json(new ApiResponse(201, "user Deleted successfully"))
})
const getAllAttendeesforevent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!eventId) {
        throw new ApiError(400, "Event ID is required.");
    }


    const attendees = await User.find({ eventsAttending: eventId }).select("fullName email");

    if (!attendees || attendees.length === 0) {

        throw new ApiError(401, "No attendees found for this event.")
    }

    return res.json(new ApiResponse(201, { attendees }, "Attendees retrieved successfully."));
});
const getAllAttendees = asyncHandler(async (req, res) => {
    const attendees = await User.find({}).select("fullName email coverImage");

    if (!attendees || attendees.length === 0) {

        throw new ApiError(401, "No attendees found for this event.")
    }

    return res.json(new ApiResponse(201, { attendees }, "Attendees retrieved successfully."));
});









export {
    adminLogin,
    addEvent,
    updateEvent,
    deleteEvent,
    createTask,
    updateTask,
    deleteTask,
    removeAttendeeFromTask,
    addattendee,
    deleteattendee,
    getEventsForCalendar,
    getAllAttendees,
    getAllAttendeesforevent,
    assingnAttendeeForTask,
    adminlogout,
    getTasksForEvent, getAllTasks
};
