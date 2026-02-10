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

  const { busNumber, password } = req.body;

  const bus = buses.find(
    (b) => b.busNumber === busNumber && b.password === password,
  );

  if (bus) {
    res.json({
      role: "driver",
      busNumber: bus.busNumber,
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.post("/login/parent", (req, res) => {
  console.log("Parent login:", req.body);

  const student = students.find(
    (s) =>
      s.studentName === req.body.studentName &&
      s.password === req.body.password,
  );

  if (student) {
    res.json({
      role: "parent",
      studentName: student.studentName,
      busNumber: student.busNumber,
      stop: student.stop,
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
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

/* BUS TRACKING (IN-MEMORY) */
const busLocations = {};

app.post("/bus/update", (req, res) => {
  const { busNumber, location, route, nextStop, eta, etaLabel } = req.body;

  if (!busNumber || !location) {
    return res.status(400).json({ message: "Missing bus data" });
  }

  busLocations[busNumber] = {
    location,
    route, // Optional: store route if needed, or just current pos
    nextStop,
    eta,
    etaLabel,
    lastUpdated: new Date(),
  };

  res.json({ message: "Location updated" });
});

app.get("/bus/status", (req, res) => {
  const { busNumber } = req.query;
  const status = busLocations[busNumber];

  if (status) {
    // console.log(`Sending status for ${busNumber}:`, status.location); // Optional: Uncomment for verbose logs
    res.json(status);
  } else {
    // console.log(`Bus ${busNumber} not started`);
    res.status(404).json({ message: "Bus not started" });
  }
});
