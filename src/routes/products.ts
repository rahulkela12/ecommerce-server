import  express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import { deleteProduct, getAdminProduct, getAllCategories, getAllProduct, getSingleProduct, getlatestProduct, newProduct, updateProduct } from '../controllers/product.js';
import { singleUpload } from '../middlewares/multer.js';

const app = express.Router();
//create new - /api/v1/product/new
app.post("/new",adminOnly,singleUpload,newProduct);
//get all - /api/v1/product/all
app.get("/all",getAllProduct);
//get latest 5 - /api/v1/product/latest
app.get("/latest",getlatestProduct);
//get all categories  - /api/v1/product/categories
app.get("/categories",getAllCategories);
//get all products - /api/v1/product/admin-products
app.get("/admin-products",adminOnly,getAdminProduct);

app.route("/:id").get(getSingleProduct)
.put(adminOnly,singleUpload,updateProduct)
.delete(adminOnly,deleteProduct); 
export default app;