import { NextFunction ,Request} from "express";
import { TryCatch } from "../middlewares/error.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { create } from "domain";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";

//Revalidate on New,Update,Delete product & on New Order
export const getlatestProduct = TryCatch(async( req,res,next)=>{
    let products = [];
    if(myCache.has("latest-product"))products = JSON.parse(myCache.get("latest-product") as string);
    else{
    products = await Product.find({}).sort({ createAt: -1 }).limit(5);
    myCache.set("latest-product",JSON.stringify(products));
    }
    return res.status(201).json({
        success:true,
        products,
    });
});

//Revalidate on New,Update,Delete product & on New Order
export const getAllCategories = TryCatch(async( req,res,next)=>{

    let categories ;
    
    if(myCache.has("categories")){
        categories = JSON.parse(myCache.get("categories")!);
    }else{
    categories = await Product.distinct("category");
    myCache.set("categories",JSON.stringify(categories));
    }
    return res.status(201).json({
        success:true,
        categories,
    });
});

//Revalidate on New,Update,Delete product & on New Order
export const getAdminProduct = TryCatch(async( req,res,next)=>{
    let products;
    
    if(myCache.has("all-products")){
        products = JSON.parse(myCache.get("all-products") as string);
    }else{
    products = await Product.find({});
    myCache.set("all-products",JSON.stringify(products));
    }
    return res.status(201).json({
        success:true,
        products,
    });
});

//Revalidate on New,Update,Delete product & on New Order
export const getSingleProduct = TryCatch(async( req,res,next)=>{

    let product;

    const id = req.params.id;
    if(myCache.has(`product-${id}`)){
     product = JSON.parse(myCache.get(`product-${id}`) as string);
    }else{
        product = await Product.findById(id);

    if(!product) return next(new ErrorHandler("Product not found",404));
    
    myCache.set(`product-${id}`,JSON.stringify(product));
    }
    return res.status(201).json({
        success:true,
        product,
    });
});

export const newProduct = TryCatch(
    async(
    req:Request<{},{},NewProductRequestBody>,
    res,
    next
)=>{
    const {name,category,price,stock} = req.body;
    const photo = req.file;
    if(!photo) return next(new ErrorHandler("Please Add Photo",400));
    if(!name || !category || !price || !stock) {
        rm(photo.path,()=>{
            console.log("deleted");
        })
        return next(new ErrorHandler("Please enter All Fields",400));
    }
    await Product.create({
        name,
        price,
        stock,
        category:category.toLowerCase(),
        photo:photo?.path,
    });

    invalidatesCache({ product:true,admin:true});

    return res.status(201).json({
        success:true,
        message:"Product Created"
    });
});


export const updateProduct = TryCatch(
    async(
      req,
      res,
      next
)=>{
    const {id} = req.params;
    const {name,category,price,stock} = req.body;
    const photo = req.file;
    const product = await Product.findById(id);

    if(!product) return next(new ErrorHandler("Product not found",404));

    if(photo) {
        rm(product.photo!,()=>{
            console.log("old deleted");
        })
        product.photo = photo.path;
    }
    
    if(name) product.name = name;
    if(price) product.price = price;
    if(stock) product.stock = stock;
    if(category )product.category = category;

    const updateProduct =  await product.save();

    invalidatesCache({ product:true,productId:String(product._id),admin:true});

    return res.status(200).json({
        success:true,
        message:"Product Updated successfully",
    });
});

export const deleteProduct = TryCatch(async( req,res,next)=>{
    const id = req.params.id;
    const product = await Product.findById(id);

    if(!product) return next(new ErrorHandler("Product not found",404));
     
    rm(product.photo!,()=>{
        console.log("product photo deleted");
    })

    await product.deleteOne();

    invalidatesCache({ product:true,productId:String(product._id),admin:true});

    return res.status(201).json({
        success:true,
        message:"Product deleted successfully"
    });
});

export const getAllProduct = TryCatch(async( 
    req:Request<{},{},{},SearchRequestQuery>
    ,res
    ,next)=>{
    const {search,sort,category,price} = req.query;

    const page = Number(req.query.page) || 1;
    //1,2,3,4,5,6,7,8
    //9,10,11,12,13,14,15,16
    //17,18,19,20,21,22,23,24
    //for page 2 we need to skip first 8
    //for 3 first 16

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;  
   //if we are on page n then we need to skip products from 1 to n-1 and present the products on next page according to limit 
    const skip = limit*(page-1);

    const baseQuery:BaseQuery = {};

    if(search)baseQuery.name = {
         //regex used for if search is a part of name then to find it
        $regex:search,
        //case of letter does not matter
        $options:"i",
    }

    if(price)baseQuery.price = {
        //less than equal to
        $lte:Number(price),
    }

    if(category)baseQuery.category = category;

    const productPromise = Product.find(baseQuery)
    .sort(sort && { price:sort === "asc" ? 1 : -1 })
    .limit(limit)
    .skip(skip);
     
    const [products,FilteredProducts] = await Promise.all([
        productPromise,
        Product.find(baseQuery)
    ])

    const totalPage = Math.ceil(FilteredProducts.length / limit);

    return res.status(201).json({
        success:true,
        products,
        totalPage,
    });
});