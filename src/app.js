const express = require('express');
const cors = require('cors');

const routineRoutes = require('./routes/routine.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/routines', routineRoutes);

module.exports = app;
