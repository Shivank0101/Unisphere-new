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
// app.use(cors({
//     origin: "https://unisphere-frontend.onrender.com",
//   //   origin: [
//   //   "http://localhost:3000",                     // for local dev
//   //   "https://unisphere-frontend.onrender.com",    // ✅ your deployed frontend
//   // ],
//     credentials: true
// }));


// ✅ Define allowed origins
// const allowedOrigins = [
//   "http://localhost:3000",
//   "https://unisphere-frontend.onrender.com"
// ];

// // ✅ Proper CORS middleware
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));

// // ✅ Handle preflight requests
// app.options("*", cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));

// Handles preflight requests manually (app.options("*")) to ensure CORS headers are sent every time

const allowedOrigins = [
  "http://localhost:3000",
  "https://unisphere-frontend.onrender.com"
];

// ✅ Main CORS setup
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ Preflight: respond manually
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  } else {
    return res.status(403).send("CORS Forbidden");
  }
});



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
