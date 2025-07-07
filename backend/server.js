import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDb from "./src/db/db.config.js";

// Import routes
import userRouter from "./src/routes/user.routes.js";
import eventRoutes from "./src/routes/event.routes.js";
import clubRouter from "./src/routes/club.routes.js";
import registrationRouter from "./src/routes/registrations.routes.js";
import attendanceRouter from "./src/routes/attendance.routes.js";
// import notificationRouter from "./src/routes/notification.routes.js";

dotenv.config();
const app = express();

// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());


// Routes
app.use("/api/v1/users", userRouter);
app.use('/api/v1/events', eventRoutes);
app.use("/api/v1/clubs", clubRouter);
app.use("/api/v1/registrations", registrationRouter);
app.use("/api/v1/attendance", attendanceRouter);
// app.use("/api/v1/notifications", notificationRouter);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Welcome to the Unisphere Server!");
});
connectDb()

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});