import Course from "../models/course.model.js"
import AppError from "../utilities/error.util.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";

const getAllCourses = async (req, res, next) => {
    try {
        const courses = await Course.find({}).select('-lectures');

        if (!courses) {
            return next(AppError("OOPS!!!. No Courses found", 400));
        }

        res.status(200).json({
            success: true,
            message: "All courses",
            courses
        })
    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}

const getLecturesByCourseId = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        console.log(courseId);

        if (!courseId) {
            return next(new AppError("Invalid course id", 400));
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return next(new AppError("No courses found", 400));
        }

        res.status(200).json({
            success: true,
            message: 'course lectures fetched successfully',
            lectures: course.lectures
        })

        
    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}

const createCourse = async(req, res, next) => {
    try {
        const {title, description, category, createdBy} = req.body;

        if ( !(title || description || category || createdBy) ) {
            return next(new AppError("All fields are required", 400));
        }

        const course = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail: {
                public_id: title,
                secure_url: "https://images.pexels.com/photos/268533/pexels-photo-268533.jpeg?cs=srgb&dl=pexels-pixabay-268533.jpg&fm=jpg"
            }
        });

        if (!course) {
            return next(new AppError("failed to create course, please try again", 400));
        }

        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    height: 250,
                    width: 250,
                    crop: "fill"
                });
    
                if (result) {
                    course.thumbnail.public_id = result.public_id;
                    course.thumbnail.secure_url = result.secure_url;
                }
    
                fs.rm(`uploads/${req.file.filename}`);
            } catch (error) {
                return next(new AppError(error.message, 400));
            }
        }

        await course.save();

        res.status(200).json({
            success: true,
            message: "course created successfully",
            course,
        });

    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}

const updateCourse = async(req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
    
        if (!course) {
            return next(new AppError("course not found", 400));
        }

        res.status(200).json({
            success: true,
            message: "course updated successfully",
            course
        });

    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}

const removeCourse = async(req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findByIdAndDelete(id);

        if (!course) {
            return next(new AppError("course not found", 400));
        }

        res.status(200).json({
            success: true,
            message: "course deleted successfully",
        });

    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}

const addLecturesById = async(req, res, next) => {
    try {
        const { title, description } = req.body;
        const { id } = req.params;
    
        if (!(title || description)) {
            return next(new AppError("all fields are required", 400));
        }
    
        const course = await Course.findById(id);
    
        if (!course) {
            return next(new AppError("course not found", 400));
        }

        const lectureData = {
            title, 
            description,
            lecture: {
                public_id: "DUMMY",
                secure_url: "DUMMY"
            }
        };

        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    height: 250,
                    width: 250,
                    crop: "fill"
                });
    
                if (result) {
                    lectureData.lecture.public_id = result.public_id;
                    lectureData.lecture.secure_url = result.secure_url;
                }
    
                fs.rm(`uploads/${req.file.filename}`);

            } catch (error) {
                return next(new AppError(error.message, 400));
            }
        }

        course.lectures.push(lectureData);
        course.numberOfLectures = course.lectures.length;
        await course.save();

        res.status(200).json({
            success: true,
            message: "lectures added successfully",
            course
        });

    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}

const deleteLectureById = async(req, res, next) => {
    try {
        const { id } = req.params;
        const { lectureId } = req.params;
        
        const course = await Course.findByIdAndUpdate(
            id,
            { $pull: {lectures: { _id: lectureId } } },
            { new: true }
        );

        if (!course) {
            return next(new AppError("course not found", 404));
        }

        res.status(200).json({
            success: true,
            message: "lecture deleted successfully",
            course
        });

    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}

export{
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    removeCourse,
    addLecturesById,
    deleteLectureById
}