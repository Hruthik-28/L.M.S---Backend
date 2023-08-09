import app from "./app.js";
import connectToDb from "./config/dbConnect.js";
import cloudinary from "cloudinary";

const PORT = process.env.PORT || 5000;

// Cloudinary configaration
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})
app.listen(PORT, () => {
    connectToDb();
    console.log(`server listening on http://localhost:${PORT}`);
})