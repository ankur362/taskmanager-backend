import { Router } from "express";
import { upload } from "../middlewares/multter.middleware.js"
import { addattendee, addEvent, adminLogin, adminlogout, assingnAttendeeForTask, createTask, deleteattendee, deleteEvent, deleteTask, getAllAttendees, getAllAttendeesforevent, getAllTasks, getEventsForCalendar, getTasksForEvent, removeAttendeeFromTask, updateEvent, updateTask, } from "../controllers/admin.controller.js";
import { verifyAdminJWT } from "../middlewares/adminAuth.middleware.js";


const router = Router()

router.route("/login").post(adminLogin)
router.route("/logout").post(verifyAdminJWT, adminlogout)
router.route("/addEvent").post(verifyAdminJWT, addEvent)
router.route("/updateEvent").post(verifyAdminJWT, updateEvent)
router.route("/deleteEvent").post(verifyAdminJWT, deleteEvent)
router.route("/gettask").post(verifyAdminJWT, getTasksForEvent)
router.route("/createTask").post(
    upload.fields([
        {
            name: "proof",
            maxCount: 1
        }]),
    verifyAdminJWT, createTask)
router.route("/getTask").get(getAllTasks)
router.route("/updateTask").post(verifyAdminJWT, updateTask)
router.route("/deleteTask").post(verifyAdminJWT, deleteTask)
router.route("/assignAttendee").post(verifyAdminJWT, assingnAttendeeForTask)
router.route("/removeAttendee").post(verifyAdminJWT, removeAttendeeFromTask)
router.route("/addattendee").post(upload.fields([
    {
        name: "coverImage",
        maxCount: 1
    }]), verifyAdminJWT, addattendee)
router.route("/deleteattendee").post(verifyAdminJWT, deleteattendee)
router.route("/getEvent").post(verifyAdminJWT, getEventsForCalendar)
router.route("/attendeeforevent").post(verifyAdminJWT, getAllAttendeesforevent)
router.route("/getallattendees").post(verifyAdminJWT, getAllAttendees)

export default router