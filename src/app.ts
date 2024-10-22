import express from "express";
const app = express();
const storeRoutes = require('./routes/storeRoutes');

require('dotenv').config();
require('./database/connection');

const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', storeRoutes);

app.listen(port, () => {
    console.log(`Servidor rodando na porta: ${port}.`);
});