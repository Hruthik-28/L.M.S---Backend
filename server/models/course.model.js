import {model, Schema} from "mongoose";

const courseSchema = new Schema({
    title: {
        type: String,
        required: [true, 'title is required'],
        minLength: [8, 'title must be atleast 8 characters'],
        maxlength: [50, 'title must be less than 50 characters'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'description is required'],
        minLength: [8, 'title must be atleast 8 characters'],
        maxlength: [200, 'title must be less than 200 characters'],
        trim: true
    },
    category:{
        type: String,
        required: [true, 'category is required'],
    },
    thumbnail: {
        public_id:{
            type: String,
            required: [true, 'public_id is required'],
        },
        secure_url: {
            type: String,
            required: [true, 'secure_url is required'],
        }
    },
    lectures: [
        {
            title:{
                type: String
            },
            description:{
                type: String
            },
            lecture:{
                public_id:{
                    type: String
                },
                secure_url: {
                    type: String
                }
            }
        }
    ],
    numberOfLectures: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        required: [true, 'createdBy is required']
    }

}, {
    timestamps: true
})

const Course = model("Course", courseSchema)
export default Course;