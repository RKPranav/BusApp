const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const attendanceFile = path.join(__dirname, "data", "attendance.json");
const busesFile = path.join(__dirname, "data", "buses.json");
const studentsFile = path.join(__dirname, "data", "students.json");
const adminsFile = path.join(__dirname, "data", "admins.json"); // New admin file

// Helper to read data
const readData = (filePath) => {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath));
  }
  return [];
};

// Helper to write data
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

let buses = readData(busesFile);
let students = readData(studentsFile);
let admins = readData(adminsFile);

/* ADMIN LOGIN */
app.post("/login/admin", (req, res) => {
  console.log("Admin login:", req.body);
  const { username, password } = req.body;
  const admin = admins.find(
    (a) => a.username === username && a.password === password,
  );

  if (admin) {
    res.json({ role: "admin", username: admin.username });
  } else {
    res.status(401).json({ message: "Invalid admin credentials" });
  }
});

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

/* ADMIN: GET ALL BUSES */
app.get("/buses/all", (req, res) => {
  res.json(busLocations);
});

/* ADMIN: CRUD DRIVERS (BUSES) */
app.get("/admin/drivers", (req, res) => {
  buses = readData(busesFile); // Refresh
  res.json(buses);
});

app.post("/admin/drivers", (req, res) => {
  const newBus = req.body;
  buses = readData(busesFile);
  if (buses.find((b) => b.busNumber === newBus.busNumber)) {
    return res.status(400).json({ message: "Bus number already exists" });
  }
  buses.push(newBus);
  writeData(busesFile, buses);
  res.json({ message: "Driver added", buses });
});

app.put("/admin/drivers/:busNumber", (req, res) => {
  const { busNumber } = req.params;
  const updatedData = req.body;
  buses = readData(busesFile);
  const index = buses.findIndex((b) => b.busNumber === busNumber);
  if (index !== -1) {
    buses[index] = { ...buses[index], ...updatedData };
    writeData(busesFile, buses);
    res.json({ message: "Driver updated", buses });
  } else {
    res.status(404).json({ message: "Driver not found" });
  }
});

app.delete("/admin/drivers/:busNumber", (req, res) => {
  const { busNumber } = req.params;
  buses = readData(busesFile);
  const newBuses = buses.filter((b) => b.busNumber !== busNumber);
  if (buses.length !== newBuses.length) {
    writeData(busesFile, newBuses);
    buses = newBuses; // update reference
    res.json({ message: "Driver deleted", buses });
  } else {
    res.status(404).json({ message: "Driver not found" });
  }
});

/* ADMIN: CRUD PARENTS (STUDENTS) */
app.get("/admin/students", (req, res) => {
  students = readData(studentsFile); // Refresh
  res.json(students);
});

app.post("/admin/students", (req, res) => {
  const newStudent = req.body;
  students = readData(studentsFile);
  if (students.find((s) => s.studentName === newStudent.studentName)) {
    // Simple check, ideally check ID or uniqueness
    // Allowing same name but logically might want unique ID. For now just push.
  }
  students.push(newStudent);
  writeData(studentsFile, students);
  res.json({ message: "Student added", students });
});

app.put("/admin/students/:studentName", (req, res) => {
  const { studentName } = req.params;
  const updatedData = req.body;
  students = readData(studentsFile);
  const index = students.findIndex((s) => s.studentName === studentName);
  if (index !== -1) {
    students[index] = { ...students[index], ...updatedData };
    writeData(studentsFile, students);
    res.json({ message: "Student updated", students });
  } else {
    res.status(404).json({ message: "Student not found" });
  }
});

app.delete("/admin/students/:studentName", (req, res) => {
  const { studentName } = req.params;
  students = readData(studentsFile);
  const newStudents = students.filter((s) => s.studentName !== studentName);
  if (students.length !== newStudents.length) {
    writeData(studentsFile, newStudents);
    students = newStudents;
    res.json({ message: "Student deleted", students });
  } else {
    res.status(404).json({ message: "Student not found" });
  }
});
