import bodyParser from "body-parser";
import express, { Express } from 'express';

// app configuration
const app: Express = express();
const port = 8080;

// middlewares
app.use(bodyParser.json());

// routes


// listener
app.listen(port, () => {
    console.log(`sales-tracker-backend listening on http://localhost:${port}`);
});
