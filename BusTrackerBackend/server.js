const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const attendanceFile = path.join(__dirname, "data", "attendance.json");
const buses = require("./data/buses.json");
const students = require("./data/students.json");

/* DRIVER LOGIN */
app.post("/login/driver", (req, res) => {
  console.log("Driver login:", req.body);

  res.json({
    role: "driver",
    busNumber: req.body.busNumber,
  });
});

app.post("/login/parent", (req, res) => {
  console.log("Parent login:", req.body);

  res.json({
    role: "parent",
    studentName: req.body.studentName,
  });
});

/* STUDENTS AT STOP (Driver) */
app.get("/students", (req, res) => {
  const { busNumber, stop } = req.query;

  const list = students.filter(
    (s) => s.busNumber === busNumber && s.stop === stop,
  );

  res.json(list.map((s) => s.studentName));
});

/* SAVE ATTENDANCE */
app.post("/attendance", (req, res) => {
  const { busNumber, stopNumber, students } = req.body;

  if (!busNumber || !stopNumber || !students) {
    return res.status(400).json({ message: "Invalid data" });
  }

  let attendanceData = [];
  if (fs.existsSync(attendanceFile)) {
    attendanceData = JSON.parse(fs.readFileSync(attendanceFile));
  }

  attendanceData.push({
    date: new Date().toISOString(),
    busNumber,
    stopNumber,
    students,
  });

  fs.writeFileSync(attendanceFile, JSON.stringify(attendanceData, null, 2));
  res.json({ message: "Attendance saved successfully" });
});

app.listen(3000, "0.0.0.0", () => {
  console.log("🚍 BusTracker Backend running on http://0.0.0.0:3000");
});

app.get("/", (req, res) => {
  res.send("Backend is working 🚍");
});

/* SAVE NOTIFICATION */

const notificationsFile = path.join(__dirname, "data", "notifications.json");

/* SAVE NOTIFICATION */
app.post("/notification", (req, res) => {
  const { busNumber, stopNumber, studentName, message } = req.body;

  if (!busNumber || !message) {
    return res.status(400).json({ message: "Invalid data" });
  }

  let notifications = [];

  if (fs.existsSync(notificationsFile)) {
    notifications = JSON.parse(fs.readFileSync(notificationsFile));
  }

  notifications.push({
    time: new Date().toISOString(),
    busNumber,
    stopNumber,
    studentName,
    message,
  });

  fs.writeFileSync(notificationsFile, JSON.stringify(notifications, null, 2));

  res.json({ message: "Notification saved" });
});
