const express = require("express");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require('cors'); // Import the cors package
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(cors()); // Use the CORS middleware
const db = mysql.createConnection({
  host: "sql12.freesqldatabase.com",
  user: "sql12738346",
  password: "7PdfWzrgBk",
  database: "sql12738346",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
});

// Register User
app.post("/register", (req, res) => {
  const { username, email, password, phone_number, birthdate, socialnumber } =
    req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);
  db.query(
    "INSERT INTO users (username, email, password, phone_number, birthdate, socialnumber) VALUES (?, ?, ?, ?, ?, ?)",
    [username, email, hashedPassword, phone_number, birthdate, socialnumber],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ message: "User registered successfully" });
    }
  );
});

// Login User
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).send(err);
    if (!results.length)
      return res.status(404).send({ message: "User not found" });

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid)
      return res.status(401).send({ auth: false, token: null });

    const token = jwt.sign({ id: user.id }, "secretkey", { expiresIn: 86400 });
    res.status(200).send({ auth: true, token });
  });
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token)
    return res.status(403).send({ auth: false, message: "No token provided" });

  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err)
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token" });
    req.userId = decoded.id;
    next();
  });
};

// Get Courses
app.get("/courses", verifyToken, (req, res) => {
  db.query("SELECT * FROM courses", (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(results);
  });
});
// Endpoint to add a new course
app.post("/add-course", (req, res) => {
  const { title, img, lessons, teachingtime, date, author, students, price } =
    req.body;
  db.query(
    "INSERT INTO courses (title, img, lessons, teachingtime, date, author, students, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [title, img, lessons, teachingtime, date, author, students, price],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res
        .status(201)
        .send({ message: "Course added successfully", id: result.insertId });
    }
  );
});

// Buy Course
app.post("/buy-course", verifyToken, (req, res) => {
  const { courseId } = req.body;
  db.query(
    "INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)",
    [req.userId, courseId],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ message: "Course purchased successfully" });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
