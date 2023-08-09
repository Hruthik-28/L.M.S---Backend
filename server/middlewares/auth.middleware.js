import AppError from "../utilities/error.util.js";
import jwt from "jsonwebtoken";

const isLoggedIn = (req, res, next) => {
    const token = (req.cookies && req.cookies.token) || null;

    if (!token) {
        return new AppError('Not authorized, please login again', 401);
    }

    const userDetails = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = userDetails;

    next();
}

export {
    isLoggedIn
} 