import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";
import { User } from "../models/user.js";

//middleware to make sure only admin is allowed
// /api/v1/user/:id?key = 25
//req.query is an object - here ={key = 25}
export const adminOnly = TryCatch(async(req,res,next)=>{
    const {id} = req.query;
    if(!id)return next(new ErrorHandler("Please login first",401));
    const user  = await User.findById(id);
    if(!user) return next(new ErrorHandler("Incorrect Id",401));
    if(user.role !== "admin") return next(new ErrorHandler("Cannot Access",403));
    //as we have not passed error so the next handler(middleware) in line would be called
    next();
});