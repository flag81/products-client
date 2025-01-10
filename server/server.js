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


import Tesseract from 'tesseract.js';

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

// create a get endpoint that will extarct text from image using tesseract.js and return the extracted text as response GIVE THE IMAGE URL AS QUERY PARAMETER

app.get('/extractText', async (req, res) => {
  const  imageUrl  = "./sample1.jpg";

  try {
    const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', { logger: m => console.log(m) });

    console.log('Extracted Text:', text); // Output the extracted text

    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// create a api endpoint to rename the image file in cloudinary with the public_id and new name as query parameters


app.put('/rename-image', async (req, res) => {

  const { public_id, new_name } = req.body;

  if (!public_id || !new_name) {
    return res.status(400).json({ error: 'Missing public_id or new_name' });
  }

  try {
    const result = await cloudinary.uploader.rename(public_id, new_name);

    if (result.result === 'ok') {
      res.status(200).json({ message: 'Image renamed successfully' });
    } else {
      res.status(500).json({ error: 'Failed to rename image' });
    }
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
});




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

// add api to add a keword to a product in the database table productkeywords and keywords

app.post("/addKeyword", (req, res) => {

  const { productId, keyword } = req.body;

  const q = `INSERT INTO keywords (keyword) VALUES (?) ON DUPLICATE KEY UPDATE keywordId = LAST_INSERT_ID(keywordId)`;

  db.query(q, [keyword], (err, result) => {
    if (err) {
      console.error('Error adding keyword:', err);
      return res.status(500).json({ error: 'Failed to add keyword' });
    }

    const keywordId = result.insertId;

    db.query(
      `INSERT INTO productkeywords (productId, keywordId) VALUES (?, ?)`,
      [productId, keywordId],
      (err, result) => {
        if (err) {
          console.error('Error adding keyword to product:', err);
          return res.status(500).json({ error: 'Failed to add keyword to product' });
        }
        res.status(200).json({ message: 'Keyword added successfully' });
      }
    );
  }
  );
});

// add api to remove a keword from a product in the database table productkeywords and keywords



app.delete("/removeKeyword", (req, res) => {

  const { productId, keyword } = req.body;

  db.query(
    `SELECT keywordId FROM keywords WHERE keyword = ?`,
    [keyword],
    (err, result) => {
      if (err) {
        console.error('Error getting keywordId:', err);
        return res.status(500).json({ error: 'Failed to get keywordId' });
      }

      const keywordId = result[0]?.keywordId;

      db.query(
        `DELETE FROM productkeywords WHERE productId = ? AND keywordId = ?`,
        [productId, keywordId],
        (err, result) => {
          if (err) {
            console.error('Error removing keyword from product:', err);
            return res.status(500).json({ error: 'Failed to remove keyword from product' });
          }
          res.status(200).json({ message: 'Keyword removed successfully' });
        }
      );
    }

  );
});


// add api to edit the product description for a product with product id and new description

app.put("/editProductDescription", (req, res) => {
  
  const { productId, newDescription } = req.body;

  const q = `UPDATE products SET product_description = ? WHERE productId = ?`;

  db.query(q, [newDescription, productId], (err, result) => {
    if (err) {
      console.error('Error updating product description:', err);
      return res.status(500).json({ error: 'Failed to update product description' });
    }
    res.status(200).json({ message: 'Product description updated successfully' });
  }
  );
}
);

//update getProducts endpoint to order the results by keyword count matches between the keywords of the favorite products and the keywords of the products in the database descending

app.get("/getProducts", (req, res) => {
  const userId = req.query.userId || null;
  let storeId = parseInt(req.query.storeId, 10);
  const isFavorite = req.query.isFavorite || null;
  const onSale = req.query.onSale || null;
  const today = new Date().toISOString().split('T')[0];

  if (isNaN(storeId) || storeId <= 0) {
    storeId = null;
  }
  

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
      s.storeName,
      GROUP_CONCAT(k.keyword) AS keywords,
      CASE WHEN f.userId IS NOT NULL THEN TRUE ELSE FALSE END AS isFavorite,
      CASE WHEN p.sale_end_date >= ? THEN TRUE ELSE FALSE END AS productOnSale,
      (
        SELECT COUNT(*)
        FROM productkeywords pkf
        JOIN keywords kf ON pkf.keywordId = kf.keywordId
        WHERE pkf.productId = p.productId
          AND kf.keyword IN (
            SELECT k.keyword
            FROM favorites f
            JOIN productkeywords pk ON f.productId = pk.productId
            JOIN keywords k ON pk.keywordId = k.keywordId
            WHERE f.userId = ?
          )
      ) AS keywordMatchCount
    FROM 
      products p
    LEFT JOIN 
      productkeywords pk ON p.productId = pk.productId
    LEFT JOIN 
      keywords k ON pk.keywordId = k.keywordId
    LEFT JOIN 
      favorites f ON p.productId = f.productId AND f.userId = ?
      LEFT JOIN
      stores s ON p.storeId = s.storeId
  `;

  if (storeId !== null) {
    q += ` WHERE p.storeId = ?`;
  }

  if (isFavorite === 'true') {
    q += storeId !== null ? ` AND f.userId IS NOT NULL` : ` WHERE f.userId IS NOT NULL`;
  }

  if (onSale === 'true') {
    q += (storeId !== null || isFavorite === 'true') ? ` AND p.sale_end_date >= ?` : ` WHERE p.sale_end_date >= ?`;
  }

  q += `
    GROUP BY 
      p.productId
    ORDER BY productOnSale DESC , isFavorite DESC,
      keywordMatchCount DESC, p.productId DESC
  `;

  const params = storeId !== null ? [today, userId, userId, storeId] : [today, userId, userId];
  if (onSale === 'true') {
    params.push(today);
  }

  db.query(q, params, (err, data) => {
    if (err) {
      console.log("getProducts error:", err);
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
  


  //create a get endpoint that will take storeId and prompt string as query parameters and return the response from openai chat completions api

  app.get('/chatgptExtractProducts', async (req, res) => {

    const { storeId, imageUrl } = req.query;

    const imageBaseUrl = "https://res.cloudinary.com/dt7a4yl1x/image/upload/";

    // get image name as the last part of the URL split with forward slash /
    
    const imageName = imageUrl.split('/').pop();

    


    console.log('storeId:', storeId);
    console.log('imageUrl:', imageUrl);
    console.log('imageName:', imageName);

  

    const prompt = `Can you extract product sale information in albanian language from this sales flyer for each product in the image , if available.
  Convert ë letter to e for all the keywords. Do not include conjunctions, articles words in albanian, in keywords.
  Do not include size info for keywords and only words with more than 2 characters as keywords. 
  The storeId is:${storeId}. 
 populate the "image_url" field with a variable ${imageName} from above". 
 If some data is not available, leave the field empty.
  The response should be in the JSON format,  like the following example: 
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
      model: "gpt-4-turbo",
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
      use_filename: true,                       // Keep the original filename
      unique_filename: false,    
      
    });

    console.log('result from upload:', result.public_id);

    const publicId = result.public_id;

    // split the public_id with forward slash / and get the last part of the string

    const imageName = publicId.split('/').pop();
      
    // can you add option to add text overlay at the bottom also



    const transformationResult = await cloudinary.uploader.upload(publicId, {
      type: 'upload',
      overwrite: true, // Ensure the image is replaced
      transformation: [
        {
          overlay: {
            font_family: 'Arial',
            font_size: 30,
            padding: 10,
            text: '#'+ imageName,
          },
          gravity: 'north',
          y: -30,
          x: 10
        },

        {
          overlay: {
            font_family: 'Arial',
            font_size: 30,
            text: '#'+ imageName,
          },
          gravity: 'south_east',
          y: 10,
          x:10
        },
      ],
    });

    console.log('Transformed image URL:', transformationResult.secure_url);
  
  

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
