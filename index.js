require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const routes = require('./routes/main_routes');
app.use('/api', routes);

const PORT = process.env.LOCAL_PORT || 3306;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
