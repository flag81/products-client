import express from 'express';
import multer from 'multer';
import cloudinary from './cloudinaryConfig.js';
import cors from 'cors';
import fs from 'fs';
import { format } from 'path';
import db from './connection.js';

import OpenAI from "openai";
const openai = new OpenAI();

export const app = express();

app.use(express.json());

app.use(cors()); // Allow all origins, especially Vite's localhost:5173

const upload = multer({ dest: 'uploads/' }); // Define upload middleware

app.delete('/deleteProduct/:productId', async (req, res) => {
  const productId = req.params.productId;

  console.log('productId received:', productId);

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
    // Start a transaction
    await dbQuery('START TRANSACTION');

    // Delete product-keyword relations from ProductKeywords
    await dbQuery('DELETE FROM ProductKeywords WHERE productId = ?', [productId]);

    // Optionally, clean up keywords that are no longer linked to any products
    await dbQuery(`
      DELETE FROM keywords 
      WHERE keywordId NOT IN (SELECT keywordId FROM ProductKeywords)
    `);

    // Delete the product from the products table
    await dbQuery('DELETE FROM products WHERE productId = ?', [productId]);

    // Commit the transaction
    await dbQuery('COMMIT');
    
    res.status(200).json({ message: 'Product and related data deleted successfully.' });
  } catch (error) {
    // Rollback transaction in case of error
    await dbQuery('ROLLBACK');
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'An error occurred while deleting the product.' });
  }
});

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

// write api to get all stores from database table stores

app.get("/getStores", (req, res) => {

  //const q = "SELECT tableid,  users.id  FROM orders join users on orders.userid = users.id WHERE orders.status = 0 ";
  const q = `SELECT * from stores order by storeId asc`;

  //console.log("getUserEmail:", q);

  const userId= req.query.userId;

    db.query(q, (err, data) => {

    if (err) {


      console.log("getStores error:", err);
      return res.json(err);
    }

    return res.json(data);
  });
});


// write api to add a product to favorites for a user

app.post("/addFavorite", (req, res) => {

  const { userId, productId } = req.body;

  const q = `INSERT INTO favorites (userId, productId) VALUES (?, ?)`;

  db.query(q, [userId, productId], (err, result) => {
    if (err) {
      console.error('Error adding favorite:', err);
      return res.status(500).json({ error: 'Failed to add favorite' });
    }
    res.status(200).json({ message: 'Favorite added successfully' });
  }
  );
});

// write api to remove a product from favorites for a user

app.delete("/removeFavorite", (req, res) => {

  const { userId, productId } = req.body;

  const q = `DELETE FROM favorites WHERE userId = ? AND productId = ?`;

  db.query(q, [userId, productId], (err, result) => {

    if (err) {

      console.error('Error removing favorite:', err);
      return res.status(500).json({ error: 'Failed to remove favorite' });
    }
    res.status(200).json({ message: 'Favorite removed successfully' });
  }
  );
});



app.get("/getUsers", (req, res) => {

  //const q = "SELECT tableid,  users.id  FROM orders join users on orders.userid = users.id WHERE orders.status = 0 ";
  const q = `SELECT * from users order by userId asc`;

  //console.log("getUserEmail:", q);

  const userId= req.query.userId;

    db.query(q, (err, data) => {

    if (err) {


      console.log("getStores error:", err);
      return res.json(err);
    }

    return res.json(data);
  });
});

app.get("/searchProducts", (req, res) => {
  const { keyword } = req.query;

  let q = `
    SELECT 
      p.productId as productId, 
      p.product_description as product_description, 
      p.old_price as old_price, 
      p.new_price as new_price, 
      p.discount_percentage as discount_percentage, 
      p.sale_end_date as sale_end_date, 
      p.storeId as storeId, 
      p.image_url as image_url,
      GROUP_CONCAT(k.keyword) AS keywords
    FROM 
      products p
    LEFT JOIN 
      productkeywords pk ON p.productId = pk.productId
    LEFT JOIN 
      keywords k ON pk.keywordId = k.keywordId
  `;

  const queryParams = [];

  if (keyword) {
    const keywords = keyword.split(' ').map(kw => kw.trim());
    const keywordConditions = keywords.map(() => `k.keyword LIKE ?`).join(' OR ');
    q += ` WHERE ${keywordConditions}`;
    queryParams.push(...keywords.map(kw => `%${kw}%`));
  }

  q += `
    GROUP BY 
      p.productId

  `;

  db.query(q, queryParams, (err, results) => {
    if (err) {
      console.error('Error searching products:', err);
      return res.status(500).json({ error: 'Failed to search products' });
    }
    res.status(200).json(results);
  });
});



app.get("/getProducts", (req, res) => {
  // Get userId and storeId from query parameters
  const userId = req.query.userId || null;
  let storeId = parseInt(req.query.storeId, 10);  // Convert storeId to integer

  // If storeId is not a valid number (NaN or <= 0), treat it as null
  if (isNaN(storeId) || storeId <= 0) {
    storeId = null;
  }

  // Base SQL query
  let q = `
    SELECT 
      p.productId, 
      p.product_description, 
      p.old_price, 
      p.new_price, 
      p.discount_percentage, 
      p.sale_end_date, 
      p.storeId, 
      p.image_url,
      GROUP_CONCAT(k.keyword) AS keywords,
      CASE WHEN f.userId IS NOT NULL THEN TRUE ELSE FALSE END AS isFavorite
    FROM 
      products p
    LEFT JOIN 
      productkeywords pk ON p.productId = pk.productId
    LEFT JOIN 
      keywords k ON pk.keywordId = k.keywordId
    LEFT JOIN 
      favorites f ON p.productId = f.productId AND f.userId = ?
  `;

  // Add storeId filtering if storeId is valid (greater than 0)
  if (storeId !== null) {
    q += ` WHERE p.storeId = ?`;
  }

  q += `
    GROUP BY 
      p.productId
    ORDER BY 
      p.productId DESC
  `;

  // Parameters array for the query
  const params = storeId !== null ? [userId, storeId] : [userId];

  // Execute the query, passing userId and optionally storeId
  db.query(q, params, (err, data) => {
    if (err) {
      console.log("getProducts error:", err);
      return res.json(err);
    }

    // Send the retrieved data back as a JSON response
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
  


  //create a get endpoint that will take storeId and prompt string as query parameters and return the response from openai chat completions api

  app.get('/chatgptExtractProducts', async (req, res) => {

    const { storeId, imageUrl } = req.query;

    const imageBaseUrl = "https://res.cloudinary.com/dt7a4yl1x/image/upload/";

    // get image name as the last part of the URL split with forward slash /
    
    const imageName = imageUrl.split('/').pop();


    console.log('storeId:', storeId);
    console.log('imageUrl:', imageUrl);
    console.log('imageName:', imageName);

  

    const prompt = `Can you extract product sale information in albanian language from this sales flyer in the format for each product
  Convert ë letter to e for all the keywords. Do not include conjunctions, articles words in albanian, in keywords.
  Do not include size info for keywords and only words with more than 2 characters as keywords. 
  The storeId is:${storeId}. 
 populate the "image_url" field with a variable ${imageName} from above". 
  The response should be in the JSON format only like the following example if the info is available: 
  [
    {
      "product_description": "Mandarina kg",
      "old_price": 0.89,
      "new_price": 0.69,
      "discount_percentage": 22,
      "sale_end_date": "2024-12-26",
      "storeId": 1,
      "image_url": ${imageName}, 
      "keywords": ["mandarina"]
    },
    {
      "product_description": "Kerpudhe pako",
      "old_price": 1.49,
      "new_price": 0.99,
      "discount_percentage": 33,
      "sale_end_date": "2024-12-26",
      "storeId": 1,
      "image_url": ${imageName}, 
      "keywords": ["kerpudhe"]
}]
      
` ;


    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                "url": imageUrl,
              },
            },
          ],
        },
      ],
    });




    //console.log('response:', response.choices[0]);

    let resp = response.choices[0];

    let content = resp.message.content;

// Remove the code block markers (```json and ```)
content = content.replace(/```json\n/, '').replace(/```$/, '');

// Parse the remaining content as JSON
const productList = JSON.parse(content);

console.log(productList);




    res.json(productList);
  }
  );




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
