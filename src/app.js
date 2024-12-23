import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(cors({
    origin: 4001,
    credentials: true
}))
app.use(express.json({limit: "100mb"}));
app.use(express.urlencoded({extended: true,limit:"100mb"}));
app.use(express.static("public"));
app.use(cookieParser());

//routes
import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
//routes
app.use("/api/v1/users", userRouter)
app.use("/api/v1/admins", adminRouter)

export  { app }