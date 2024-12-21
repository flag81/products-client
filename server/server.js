import express from 'express';
import multer from 'multer';
import cloudinary from './cloudinaryConfig.js';
import cors from 'cors';
import fs from 'fs';
import { format } from 'path';
import db from './connection.js';

export const app = express();

app.use(express.json());

app.use(cors()); // Allow all origins, especially Vite's localhost:5173

const upload = multer({ dest: 'uploads/' }); // Define upload middleware

app.post('/insertProducts', (req, res) => {
  // Extract the array of products from the request body
  const products = req.body;


  // Check if the data is an array
  if (Array.isArray(products)) {
    // Loop through each product in the array
    products.forEach(product => {
      console.log('Product Description:', product.product_description);
      console.log('Old Price:', product.old_price);
      console.log('New Price:', product.new_price);
      console.log('Discount Percentage:', product.discount_percentage);
      console.log('Sale End Date:', product.sale_end_date);
      console.log('Store ID:', product.storeId);
      console.log('Keywords:', product.keywords.join(', '));
      console.log('---');
    });

    // Send a response back to the client
    res.status(200).json({ message: 'Products processed successfully' });
  } else {
    res.status(400).json({ message: 'Invalid data format. Expected an array of products.' });
  }
});


// POST endpoint to insert products
app.post('/insertProducts3', async (req, res) => {
  //const products = req.body;

  // make products iterable , data is send like body: JSON.stringify({ products: [{ product_description: productData }] }),

   const products = req.body



  
  console.log('products received:', products);

  if (!Array.isArray(products)) {
    return res.status(400).json({ message: 'Invalid data format. Expected an array of products.' });
  }
  else {
    console.log('products received is an array:', products);
  }

  /*



  */

  try {
    // Loop over each product in the JSON array
    //for (let product of products) {

      products.forEach(product => {
      
      const { product_description, old_price, new_price, discount_percentage, sale_end_date, storeId, keywords } = product;

        console.log('individual product:', product_description);

      // Start a transaction
      db.query('START TRANSACTION');

      // Insert the product into the products table
      const [productResult] = db.query(
        `INSERT INTO products (product_description, old_price, new_price, discount_percentage, sale_end_date, storeId) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [product_description, old_price, new_price, discount_percentage, sale_end_date, storeId]
      );

      console.log('productResult:......');

      // Get the last inserted productId
      const productId = productResult.insertId;

      console.log('last inserted productId:', productId);

      // Insert the keywords and link them to the product
      //for (let keyword of keywords) {


      //check if keywords is an array
      if (Array.isArray(keywords)) {
        // Loop through each keyword in the array
        console.log('keywords is an arraay:', keywords);

      } else {
        console.log('keywords is not an array');
      }

        keywords.forEach(keyword => {
        // Insert keyword if it doesn't exist, otherwise get the existing keywordId
        const [keywordResult] =  db.query(
          `INSERT INTO keywords (keyword) VALUES (?) 
          ON DUPLICATE KEY UPDATE keywordId = LAST_INSERT_ID(keywordId)`,
          [keyword]
        );

        // Get the last inserted or updated keywordId
        const keywordId = keywordResult.insertId;

        // Insert into ProductKeywords table to link product and keyword
        db.query(
          `INSERT INTO ProductKeywords (productId, keywordId) VALUES (?, ?)`,
          [productId, keywordId]
        );
      });

      // Commit the transaction
      db.query('COMMIT');
    });

    res.status(200).json({ message: 'All products and keywords inserted successfully!' });
  } catch (error) {
    // Rollback in case of an error
    db.query('ROLLBACK');
    console.error('Error inserting products and keywords:', error);
    res.status(500).json({ error: 'Failed to insert products and keywords' });
  }
});


app.post('/insertProducts1', async (req, res) => {
  const products = req.body;
  let responseSent = false;  // Track if the response has been sent

  console.log('Products received:', products);

  if (!Array.isArray(products)) {
    if (!responseSent) {
      res.status(400).json({ message: 'Invalid data format. Expected an array of products.' });
      responseSent = true;
    }
    return;
  }

  const dbQuery = (query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  };

  try {
    await dbQuery('START TRANSACTION');

    // Loop through each product
    for (const product of products) {
      const { product_description, old_price, new_price, discount_percentage, sale_end_date, storeId, keywords, image_url } = product;
      console.log('Processing product:', product_description);

      const productResult = await dbQuery(
        `INSERT INTO products (product_description, old_price, new_price, discount_percentage, sale_end_date, storeId, image_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [product_description, old_price, new_price, discount_percentage, sale_end_date, storeId, image_url]
      );

      const productId = productResult.insertId;
      console.log('Inserted productId:', productId);

      // Ensure keywords is an array
      if (!Array.isArray(keywords)) {
        console.log('Keywords is not an array:', keywords);
        throw new Error('Keywords must be an array');
      }

      for (const keyword of keywords) {
        const keywordResult = await dbQuery(
          `INSERT INTO keywords (keyword) VALUES (?) 
          ON DUPLICATE KEY UPDATE keywordId = LAST_INSERT_ID(keywordId)`,
          [keyword]
        );

        const keywordId = keywordResult.insertId;

        await dbQuery(
          `INSERT INTO productkeywords (productId, keywordId) VALUES (?, ?)`,
          [productId, keywordId]
        );
      }
    }

    await dbQuery('COMMIT');
    if (!responseSent) {
      res.status(200).json({ message: 'All products and keywords inserted successfully!' });
      responseSent = true;
    }

  } catch (err) {
    console.error('Error during product insertion:', err);
    if (!responseSent) {
      await dbQuery('ROLLBACK');
      res.status(500).json({ error: 'Failed to insert products and keywords' });
      responseSent = true;
    }
  }
});





app.get("/getProducts", (req, res) => {

  //const q = "SELECT tableid,  users.id  FROM orders join users on orders.userid = users.id WHERE orders.status = 0 ";
  const q = `SELECT * from products `;
  

  console.log("getUserEmail:", q);

  const userId= req.query.userId;

  db.query(q, (err, data) => {

    if (err) {


      console.log("getUserEmail error:", err);
      return res.json(err);
    }

    return res.json(data);
  });
});


app.delete('/delete-image', async (req, res) => {
    const { public_id } = req.body;
  
    if (!public_id) {
      return res.status(400).json({ error: 'Missing public_id' });
    }
  
    try {
      // Delete image from Cloudinary
      const result = await cloudinary.uploader.destroy(public_id);
  
      if (result.result === 'ok') {
        res.status(200).json({ message: 'Image deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete image' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


// Function to upload an image to a specific folder in Cloudinary
app.post('/upload', upload.single('image'), async (req, res) => {
  const imagePath = req.file.path;
  const { folderName } = req.body; // Get folder name from request body

  console.log('folderName:', folderName);

  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: folderName || 'default-folder', // If no folder is specified, use 'default-folder'
    });

    console.log('result from upload:', result);

    // Clean up the local uploaded file
    fs.unlinkSync(imagePath);

    // Return the Cloudinary URL and public ID of the uploaded image
    res.json({ success: true, url: result.secure_url, public_id: result.public_id , format: result.format});
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
