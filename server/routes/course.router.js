import {Router} from "express";
import { addLecturesById, createCourse, deleteLectureById, getAllCourses, getLecturesByCourseId, removeCourse, updateCourse } from "../controllers/course.controller.js";
import { authorizedRole, isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = new Router();

router.route('/')
    .get(getAllCourses)
    .post(isLoggedIn, authorizedRole("ADMIN"), upload.single('thumbnail'), createCourse)
;

router.route('/:id')
    .get(isLoggedIn, getLecturesByCourseId)
    .put(isLoggedIn, authorizedRole("ADMIN"), updateCourse)
    .delete(isLoggedIn, authorizedRole("ADMIN"), removeCourse)
    .post(isLoggedIn, authorizedRole("ADMIN"), upload.single('lecture'), addLecturesById)
;

router.route('/:id/lectures/:lectureId')
    .delete(isLoggedIn, authorizedRole("ADMIN"), deleteLectureById)


export default router;