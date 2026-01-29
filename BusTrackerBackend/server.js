const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const attendanceFile = path.join(__dirname, 'data', 'attendance.json');
const buses = require('./data/buses.json');
const students = require('./data/students.json');

/* DRIVER LOGIN */
app.post('/login/driver', (req, res) => {
  const { busNumber, password } = req.body;

  const driver = buses.find(
    b => b.busNumber === busNumber && b.password === password
  );

  if (!driver) {
    return res.status(401).json({ message: 'Invalid driver credentials' });
  }

  res.json({ role: 'driver', busNumber });
});

/* PARENT LOGIN */
app.post('/login/parent', (req, res) => {
  const { studentName, password } = req.body;

  const parent = students.find(
    s => s.studentName === studentName && s.password === password
  );

  if (!parent) {
    return res.status(401).json({ message: 'Invalid parent credentials' });
  }

  res.json({
    role: 'parent',
    busNumber: parent.busNumber,
    stop: parent.stop,
    studentName: parent.studentName,
  });
});

/* STUDENTS AT STOP (Driver) */
app.get('/students', (req, res) => {
  const { busNumber, stop } = req.query;

  const list = students.filter(
    s => s.busNumber === busNumber && s.stop === stop
  );

  res.json(list.map(s => s.studentName));
});

/* SAVE ATTENDANCE */
app.post('/attendance', (req, res) => {
  const { busNumber, stopNumber, students } = req.body;

  if (!busNumber || !stopNumber || !students) {
    return res.status(400).json({ message: 'Invalid data' });
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
  res.json({ message: 'Attendance saved successfully' });
});

app.listen(3000, () => {
  console.log('🚍 BusTracker Backend running on http://localhost:3000');
});
