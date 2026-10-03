const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false })); // form data
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// In-memory storage
const users = [];     // { username, _id }
const exercises = []; // { userId, description, duration, date (Date object) }

const newId = () => crypto.randomBytes(12).toString('hex');

// Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.json({ error: 'username is required' });
  }

  const user = { username, _id: newId() };
  users.push(user);
  res.json(user);
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Add an exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const user = users.find((u) => u._id === req.params._id);
  if (!user) {
    return res.json({ error: 'unknown user id' });
  }

  const { description, duration, date } = req.body;

  if (!description || !duration || isNaN(Number(duration))) {
    return res.json({ error: 'description and a numeric duration are required' });
  }

  let exerciseDate = date ? new Date(date) : new Date();
  if (isNaN(exerciseDate.getTime())) {
    return res.json({ error: 'invalid date' });
  }

  exercises.push({
    userId: user._id,
    description,
    duration: Number(duration),
    date: exerciseDate,
  });

  res.json({
    _id: user._id,
    username: user.username,
    date: exerciseDate.toDateString(),
    duration: Number(duration),
    description,
  });
});

// Get a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const user = users.find((u) => u._id === req.params._id);
  if (!user) {
    return res.json({ error: 'unknown user id' });
  }

  const { from, to, limit } = req.query;

  let log = exercises.filter((e) => e.userId === user._id);

  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      log = log.filter((e) => e.date >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      log = log.filter((e) => e.date <= toDate);
    }
  }

  if (limit && !isNaN(parseInt(limit, 10))) {
    log = log.slice(0, parseInt(limit, 10));
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});