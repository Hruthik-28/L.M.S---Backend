import { error } from "console";
import mongoose from "mongoose";

mongoose.set('strictQuery', false);

const connectToDb = () => {
    mongoose.connect(process.env.MONGODB_URL)
    .then((conn) => {
        console.log(`connected to DB: ${conn.connection.host}`);
    })
    .catch((e) => {
        console.log(e);
        process.exit(1);
    });
}

export default connectToDb