import {config} from "dotenv";
import morgan from "morgan";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js"
import courseRoutes from "./routes/course.router.js"
import paymentRoutes from "./routes/payment.routes.js"
import errorMidlleware from "./middlewares/error.middleware.js";

config();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true
}))


app.use(morgan('dev'));

app.use('/ping', (req, res) => {
    res.send('pong');
})

// Routes of 3 modules
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payments', paymentRoutes);

app.use('*', (req, res) => {
    res.status(404).send(`OOPS!! 404 Page Not Found`);
})

app.use(errorMidlleware);

export default app;