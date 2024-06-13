import { NextFunction,Request,Response} from "express";
import { Error } from "mongoose";
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware =  (
    err:ErrorHandler,
    req:Request,
    res:Response
    ,next:NextFunction)=>{
    
    //err.message = err.message || ""
    err.message ||= "Internal Error";
    err.statusCode ||= 500;

    if(err.name === "CastError")err.message = "Invalid ID";
    
    return res.status(400).json({
       success:false,
       message:err.message,
    });
}

//function returning a function
export const TryCatch = (func:ControllerType)=>(req:Request,res:Response,next:NextFunction)=>{
   return Promise.resolve(func(req,res,next)).catch(next);
};