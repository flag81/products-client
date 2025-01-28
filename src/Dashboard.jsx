import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { use } from 'react';



function Dashboard() {
  const [count, setCount] = useState(0);

  console.log("starting...");

  const [mediaFiles, setMediaFiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(''); // State for copy success message
  
  const [status, setStatus] = useState('');
  const [statusError, setStatusError] = useState('');
  const [folderName, setFolderName] = useState('uploads'); // Folder name input
  const [insertStatus, setInsertStatus] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');

  const [stores, setStores] = useState([]);
const [users, setUsers] = useState([]);

  const CLOUD_NAME = 'dt7a4yl1x';
  const API_KEY = '443112686625846';
  const API_SECRET = 'e9Hv5bsd2ECD17IQVOZGKuPmOA4';


  const imageBaseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/`;

  // NEW: State to track selected public_id values
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedProduct , setSelectedProduct] = useState('');
  const [selectedProductDescription , setSelectedProductDescription] = useState('');


  const prompt = 

  'Can you extract product sale information in albanian language from this sales flyer in the format for each product' +
' Convert ë letter to e for all the keywords. Do not include conjunctions, articles words in Albanian language, in keywords.\n' +
 ' Do not include size info for keywords but only for description , and only words with more than 2 characters include as keywords, \n' + 
 ' After you have extracted data from firt image , pause for 3 seconds and continue with next one , untill all of them are finished. \n' +  
 ' Do not ask me to continue, just continue on your own\n' + 
 ' Do not show euro and percetage symbols. \n' + 
  ' The userId is:{userId}. \n' +

 
  'The response should be in the format for each product as object in an array of objects: \n' +
  `[

    {
      "product_description": "",
      "old_price": "",
      "new_price": "",
      "discount_percentage": "",
      "sale_end_date": "YYYY-MM-DD",
      "storeId": 1,
      "userId": 1,
      "image_url": "",
      "keywords": ["keyword1", "keyword2"]
}]` +
' Replace the placeholder data in the example with extracted and given data. \n' +

 ` The image url is the first text on top of the image starting with # sign. Do not include the # sign , but add .jpg at the end of string \n 
 
 Extract the store name from the flyer and try to match its storeId from the list bellow

 Viva Fresh - StoreId: 1
 Maxi - StoreId: 2
 Spar - StoreId: 3
 Meridian - StoreId: 4
 ETC - StoreId: 5
 KAM Market - StoreId: 6
 Interex - StoreId: 7
 Horeca - StoreId: 8
 
 
 \n` 
 ;


 //change

 useEffect(() => {

  getStores();
  getUsers();

 // storeId = document.querySelector('select[name="store"]').value;
  //getAllProducts();
}, []);

async function initializeUser() {
  try {
    const response = await fetch('http://localhost:3000/initialize', { credentials: 'include' });

    if (response.ok) {
      const data = await response.json();
      console.log('User initialized:', data.userId);
    } else {
      console.error('Failed to initialize user');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }
}

useEffect(() => {

  //initializeUser();
}, []);


async function getUserPreferences() {
  try {
    const response = await fetch('/get-preferences', { credentials: 'include' });

    if (response.ok) {
      const data = await response.json();
      console.log('User preferences:', data.preferences);
    } else {
      console.log('Failed to fetch preferences');
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
  }
}

async function saveUserPreferences(preferences) {
  try {
    const response = await fetch('/save-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ preferences }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Preferences saved:', data);
    } else {
      console.log('Failed to save preferences');
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};



async function requestNotificationPermission() {

console.log('requestNotificationPermission called');

  try {
    // Check if the Notifications API is supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications.');
      return false;
    }

    // Check the current permission status
    const permission = Notification.permission;

    if (permission === 'granted') {
      console.log('Notifications already granted.');
      return true;
    } else if (permission === 'denied') {
      console.log('Notifications are blocked.');
      return false;
    }

    // If permission is "default", request permission from the user
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      console.log('User granted notification permissions.');
      return true;
    } else {
      console.log('User denied or dismissed the notification request.');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}


function showNotification() {
  if (Notification.permission === 'granted') {
    new Notification('Hello!', {
      body: 'You have successfully enabled notifications.',
      icon: '/icon.png', // Optional icon for the notification
    });
  } else {
    console.log('Cannot show notification - permission not granted.');
  }
}



async function fetchUserPreferences() {
  try {
    const response = await fetch('http://localhost:3000/get-preferences', { credentials: 'include' });

    if (response.ok) {
      const data = await response.json();
      console.log('User preferences:', data.preferences);
    } else {
      console.error('Failed to fetch preferences');
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
  }
}


const getUsers = async () => {
  try {

    const response = await fetch('http://localhost:3000/getUsers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {

      setUsers(result);
      console.log('users result:', result);
    } else {
      console.error('Failed to fetch users:', result.message);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};



  const getStores = async () => {
    try {
      const response = await fetch('http://localhost:3000/getStores', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setStores(result);
        console.log('stores result:', result);
      } else {
        console.error('Failed to fetch stores:', result.message);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  // create a new function to add a product to favorites with user id and product id

  const addProductToFavorites = async (userId, productId) => {

    initializeUser();

    try {
      const response = await fetch('http://localhost:3000/addFavorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, productId }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('result:', result);
        getAllProducts(userId);
      }
    }
    catch (error) {
      console.error('Error adding product to favorites:', error);
    }
  };

// create a new function to remove a product from favorites with user id and product id

const removeProductFromFavorites = async (userId, productId) => {

  try {
    const response = await fetch('http://localhost:3000/removeFavorite', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, productId }),
    });

    const result = await response.json();

    if (response.ok) {

      console.log('result:', result);
      getAllProducts(userId);
    }
  }
  catch (error) {
    console.error('Error removing product from favorites:', error);
  }
};

// add function to edit the product description for a product with product id and new description

const editProductDescription = async (productId, newDescription) => {
  try {
    const response = await fetch('http://localhost:3000/editProductDescription', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, newDescription }),
    });

    const result = await response.json();

    
    if (response.ok) {
      console.log('result:', result);
      getAllProducts();
    }
  }
  catch (error) {
    console.error('Error editing product description:', error);
  }
};


  const searchProducts = async (keyword) => {
    try {
      const response = await fetch(`http://localhost:3000/searchProducts?keyword=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      const result = await response.json();
  
      if (response.ok) {
        setProducts(result);
        console.log('result:', result);
      } else {
        console.error('Failed to fetch products:', result.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  //change getAllProducts to include a keyword sent to the server to filter products


  const getAllProducts = async (userId, storeId, isFavorite, onSale) => {
    try {

      console.log('getAllProducts userId:', userId);
      console.log('getAllProducts storeId:', storeId);
      console.log('getAllProducts isFavorite:', isFavorite);
      console.log('getAllProducts onSale:', onSale);

      
      const response = await fetch(`http://localhost:3000/getProducts?userId=${encodeURIComponent(userId)}
      &storeId=${encodeURIComponent(storeId)}
      &isFavorite=${encodeURIComponent(isFavorite)}&onSale=${encodeURIComponent(onSale)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        
      });

      const result = await response.json();

      if (response.ok) {
        setProducts(result);
        console.log('result:', result);
      } else {
        console.error('Failed to fetch prod:', result.message);
      }
    } catch (error) {
      console.error('Error fetching prod:', error);
    }
  };
  

  // Fetch media files from Cloudinary
  const fetchMediaFiles = async () => {
    try {
      const response = await fetch('https://qg048c0c0wos4o40gos4k0kc.128.140.43.244.sslip.io/media-library-json');
      if (!response.ok) {
        throw new Error('Failed to fetch media files');
      }
      const data = await response.json();
      console.log('media files data:', data);
      if (Array.isArray(data)) {
        setMediaFiles(data);
      } else {
        setError('Unexpected data format');
      }
      setLoading(false);
    } catch (err) {
      setError(`Error fetching media files: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {


    fetchMediaFiles();
  }, []);

  useEffect(() => {
    console.log('error change:', error);
  }, [error]);

  // write the function bellow Handle image upload for multiple files at once and send the folder name in the request
  const handleImageUpload = async (event) => {
    event.preventDefault();
    const files = event.target.elements.images.files;

    console.log('files:', files);

    if (files.length === 0) {
      setStatus(`<font style={{color:"red"}}>Please select images to upload.</font>`);
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
      console.log('files[i]:', files[i]);
    }
    formData.append('folderName', folderName); // Send folder name in request

    console.log('formData:', formData);
    console.log('folderName:', folderName);

    try {
      const response = await fetch('http://localhost:3000/upload-multiple', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('Images uploaded successfully!');
        setMediaFiles((prevFiles) => [...prevFiles, ...result]); // Add new images to mediaFiles
        fetchMediaFiles(); // Fetch media files again to include the new images
      } else {
        setStatus(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      setStatus('An error occurred while uploading the images.');
      console.error('Error:', error);
    }
  };










  const handleImageUpload2 = async (event) => {
    event.preventDefault();
    const fileInput = event.target.elements.image;
    const file = fileInput.files[0];

    console.log('file:', file);

    if (!file) {
      setStatus(`<font style={{color:"red"}}>Please select an image to upload.</font>`);
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folderName', folderName); // Send folder name in request

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus(`Image uploaded successfully! URL: ${result.url}`);
        setMediaFiles((prevFiles) => [...prevFiles, result]); // Add new image to mediaFiles
        fetchMediaFiles(); // Fetch media files again to include the new image
      } else {
        setStatus(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      setStatus('An error occurred while uploading the image.');
      console.error('Error:', error);
    }
  };

  // NEW: Handle checkbox change
  const handleCheckboxChange = (public_id) => {


    setSelectedImages((prevSelected) => {
      if (prevSelected.includes(public_id)) {
        return prevSelected.filter(id => id !== public_id);
      } else {
        return [...prevSelected, public_id];
      }
    });
  };

  const handleDeleteImage = async (public_id) => {
    try {
      const response = await fetch('http://localhost:3000/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id }),
      });

      const result = await response.json();

      if (response.ok) {
        // Remove deleted image from the state
        setMediaFiles((prevFiles) => prevFiles.filter((file) => file.public_id !== public_id));
        setStatus('Image deleted successfully');
      } else {
        setStatus(`Failed to delete image: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error.message);
      setStatus('An error occurred while deleting the image.');
    }
  };

  // NEW: Copy the list of selected public_id values to the clipboard
  const copySelectedImages = () => {
    const selectedIdsString = selectedImages.join(', ');
    navigator.clipboard.writeText(selectedIdsString).then(
      () => {
        setStatus('Copied selected image IDs to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
      },
      () => {
        setStatus('Failed to copy');
        setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
      }
    );
  };


  //create a function to copy to generate a array of object from selected produc and properties and copy to textarea with id products
  // in format [{product_description: "product description", old_price: "old price", new_price: "new price", discount_percentage: "discount percentage", sale_end_date: "sale end date", storeId: 1, userId: 1, image_url: "image url", keywords: ["keyword1", "keyword2"]}]
  //replace the values of the properties with the values of the selected product
  // the product object is passed as a parameter to the function



  const copySelectedProduct = (product) => {
    const storeId = document.querySelector('select[name="store"]').value;
    const userId = document.querySelector('select[name="user"]').value;
    const imageUrl = document.getElementById('selectedImages').value;

    // conver product.sale_end_date to a date object and then to a string in the format YYYY-MM-DD

    const saleEndDate = new Date(product.sale_end_date).toISOString()?.split('T')[0];



    const productData = [
      {
        product_description: product.product_description,
        old_price: product.old_price,
        new_price: product.new_price,
        discount_percentage: product.discount_percentage,

        sale_end_date: saleEndDate,
        storeId: storeId,
        userId: userId,
        image_url: product.image_url,
        keywords: [],
      },
    ];

    document.getElementById('products').value = JSON.stringify(productData, null, 2);
  }




    // NEW: Copy the list of selected public_id values to the clipboard
    const copyPrompt = () => {
      const selectedIdsString = selectedImages.join(', ');
  
      // GET THE CONTENT OF THE TEXTAREA AND COPY IT TO THE CLIPBOARD

      // replace {storeId} text with the value of the store select element and {userId} with the value of the user select element in the promt variable 
      // and then copy the prompt and the selectedIdsString to the clipboard

      const storeId = document.querySelector('select[name="store"]').value;
      const userId = document.querySelector('select[name="user"]').value;

      const imageUrl = document.getElementById('selectedImages').value;

      
   
      let modifiedPrompt = prompt.replace('{storeId}', storeId).replace('{userId}', userId).replace('{imageUrl}', imageUrl);

       

  
      navigator.clipboard.writeText(modifiedPrompt + selectedIdsString).then(
  
        () => {
          setStatus('Copied selected image IDs to clipboard!');
          setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
        },
        () => {
          setStatus('Failed to copy');
          setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
        }
      );
    };


// add a new function to call the server api addKeyword to add a keyword to a product

const addKeyword = async (productId, keyword) => {
  try {
    const response = await fetch('http://localhost:3000/addKeyword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, keyword }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('result:', result);
      getAllProducts();
    }
  }
  catch (error) {
    console.error('Error adding keyword:', error);
  }
};

// add a new function to call the server api removeKeyword to remove a keyword from a product

const removeKeyword = async (productId, keyword) => {


// check if productId or keyword is empty and return from the function if it is empty


if (!productId || !keyword) {
  setStatus(<font style={{color:'red'}}><b>Please select a product and keyword</b></font>);
  return;
}


  try {
    const response = await fetch('http://localhost:3000/removeKeyword', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, keyword }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('result:', result);
      getAllProducts();
    }
  }
  catch (error) {
    console.error('Error removing keyword:', error);
  }
};




    // call server api   app.get('/chatgptExtractProducts', async (req, res) => {
    
    //  const { storeId, imageUrl } = req.query;
  // to get the data extrcted from image

  // Handle product extraction
  const extractProducts = async (storeId, imageUrl) => {
    try {


      console.log('extractProducts storeId:', storeId);
      console.log('extractProducts imageUrl:', imageUrl);


      const response = await fetch(`http://localhost:3000/chatgptExtractProducts?storeId=${storeId}&imageUrl=${imageUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        //setProducts(result);
        document.getElementById('products').value = JSON.stringify(result, null, 2);
        console.log('result:', result);
      } else {
        console.error('Failed to extract products:', result.message);
      }
    } catch (error) {
      console.error('Error extracting products:', error);
    }

  };


    // Handle product insertion
    const insertProducts = async () => {

      console.log('insertProducts called');


      const textarea = document.getElementById('products');
      const productData = textarea.value;

      const storeId = document.querySelector('select[name="store"]').value;


      //if storetId is not selected then show error message and return from the function

      if (!storeId || storeId === '0') {
        setStatusError('Please select a store.');
        return;
      }

      console.log('productData sent:', productData);
  
      if (!productData) {
        setStatus('Please enter product data.');
        return;
      }

      let parsedProductData;
  
      try {
        // Parse the product data to ensure it's a valid JSON array
        parsedProductData = JSON.parse(productData);
        
        // Check if parsed data is an array of objects
        if (!Array.isArray(parsedProductData)) {
          setStatus('Product data should be an array of products.');
          return;
        }
      } catch (error) {
        setStatus('Invalid product data. Please enter valid JSON.');
        console.error('Parsing error:', error);
        return;
      }
  
      try {
        const response = await fetch('http://localhost:3000/insertProducts1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          //body: JSON.stringify({ products: productData }),

          // make body an array of objects
           body: JSON.stringify(parsedProductData),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          setStatus('Products inserted successfully!');
        } else {
          setStatus(`Failed to insert products: ${result.error}`);
        }
      } catch (error) {
        setStatus('An error occurred while inserting products.');
        console.error('Error:', error);
      }
    };

    const handleDeleteProduct = async (productId) => {
      try {

        console.log('productId sent delete:', productId);
        const response = await fetch(`http://localhost:3000/deleteProduct/${productId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          setProducts((prevProducts) =>
            prevProducts.filter((product) => product.productId !== productId)
          );
          setStatus(`Product with ID ${productId} deleted successfully.`);
          console.log(`Product with ID ${productId} deleted successfully.`);
        } else {
          console.error('Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    };
  

    //crate a function to call api extractText
    // to extract text from an image

    const extractText = async (imageUrl) => {
      try {
        const response = await fetch(`http://localhost:3000/extractText?imageUrl=${imageUrl}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        const result = await response.json();
    
        if (response.ok) {
          console.log('result:', result);
        } else {
          console.error('Failed to extract text:', result.message);
        }
      } catch (error) {
        console.error('Error extracting text:', error);
      }
    }


  const updateProductPrices = async (productId, oldPrice, newPrice) => {

  if(!productId || !oldPrice || !newPrice) {
    setStatus('Please enter product ID, old price and new price.');
    return; 
  }

      try {
        const response = await fetch('http://localhost:3000/updateProductPrices', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, oldPrice, newPrice }),
        });
    
        const result = await response.json();
    
        if (response.ok) {
          console.log('result:', result);
          getAllProducts();
        }
      }
      catch (error) {
        console.error('Error updating product prices:', error);
      }
    };

    //create a function to call the server api rename-image to rename an image with a new name
    // the function will take the old name and new name as parameters

    const renameImage = async (oldName, newName) => {
      try {
        const response = await fetch('http://localhost:3000/rename-image', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ oldName, newName }),
        });

        const result = await response.json();

        if (response.ok) {
          console.log('result:', result);
          fetchMediaFiles();
        }
      }
      catch (error) {

        console.error('Error renaming image:', error);
      }
    };



  // If loading or error occurs
  if (loading) {
    return <div>Loading media files...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const clearImageDiv = () => {
    document.getElementById('prod_image ').innerHTML = '';
  };

  return (
    <div style={{ margin: '0', padding: '0', width: '90vw' }}>
      <div style={{ display: 'flex', flexDirection: 'row',  flexWrap: 'wrap', gap: '10px' , width: '100vw' }}>
        <div>
          <h2>Upload Image </h2>
          <form onSubmit={handleImageUpload}>
            <input
              type="text"
              value={folderName}

              placeholder="Enter folder name"
              required
              multiple

            />

              <input type="file" name="images" accept="image/*" multiple required />
            <br />
            <br />
            <button type="submit">Upload</button>
          </form>
          <h2>Image name </h2>
          <input
              type="text" id = "image_name"

            />
        
        </div>

        <div>
          <h2>Selected Image IDs</h2>
          <textarea id = "selectedImages"
            value={selectedImages.join(', ')}
            rows="4"
            cols="30"
          />
          <br />
          <button onClick={copySelectedImages}>Copy Selected IDs</button>
          <button onClick={() => document.getElementById('selectedImages').value = ''}>Clear</button>
          <p>{copySuccess}</p>
        </div>

        <div>
          <h2>Prompt</h2>
          <textarea id="prompt"
            value={prompt}   
            rows="4"
            cols="30"
          />
          <br />
          <button onClick={copyPrompt}>Copy prompt</button>
          <button onClick={() => document.getElementById('prompt').value = ''}>Clear</button>

          <p>{copySuccess}</p>
        </div>

        <div>
          <h2>Insert Products</h2>
          <textarea id="products" name="products" rows="10" cols="50" />
          <br />
          <button onClick={insertProducts}>Insert Products</button>


          <button onClick={() => document.getElementById('products').value = ''}>Clear</button>

          <p>{insertStatus}</p>
        </div>

        

</div>

<div>
<button onClick={requestNotificationPermission}>Enable Notifications</button>
  </div>

<div>
<p>{status}</p>
  </div>




<div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
  
  <select name='store'>
    {stores.map(store => (
      <option value={store.storeId}>{store.storeName}</option>
    ))}

  </select>

  <select name='user'>
    {users.map(user => (
      <option value={user.userId}>{user.userName}</option>
    ))}

  </select>



  Favorite:<input type="checkbox" id="favorites" name="favorites" />

  On Sale:<input type="checkbox" id="onSale" name="onSale" />

<button onClick={() => extractProducts(document.querySelector('select[name="store"]').value, document.getElementById('selectedImages').value)}>Extract Products</button>


  <input type="text" id="keyword" name="keyword" />
  <button onClick={() => addKeyword(selectedProduct, document.getElementById('keyword').value)}>Add Keyword to {selectedProduct}</button>
  <button onClick={() => editProductDescription(selectedProduct, document.getElementById('keyword').value)}>Edit description for {selectedProduct}</button>



</div>

{/* add a div with two input fields to update old\-price and  */}



<div style={{ display: 'flex', flexDirection: 'row', gap: '10px', margin: '10px', padding: '10px', borderColor: 'black', borderWidth: 1 }}>
  <input type="text" id="oldPrice" name="oldPrice" />
  <input type="text" id="newPrice" name="newPrice" />
  <button onClick={() => updateProductPrices(selectedProduct, document.getElementById('oldPrice').value, document.getElementById('newPrice').value)}>Update Prices for {selectedProduct}</button>
</div>

<pre>{}</pre>



<div>









<h2>Search Products</h2>
<input type="text" id="keyword_search" name="keyword_search" onKeyDown={(e) => { if (e.key === 'Enter') searchProducts(e.target.value); }} />

<button onClick={() => document.getElementById('keyword_search').value = ''}>Clear</button>
<button onClick={()=>getAllProducts(document.querySelector('select[name="user"]').value , document.querySelector('select[name="store"]').value, document.getElementById('favorites').checked, document.getElementById('onSale').checked ) }>Get Products</button>
          
</div>


<div style={{ display: 'flex',flexDirection: 'row', gap: '10px', borderColor : "black", borderWidth: 1, width: '100%' }}>



          
      <div className='scrollable-div' style={{ flexGrow:1, width: '100vw' }}>

            <table name="products" border="1" cellPadding="10" cellSpacing="0" borderColor="black">
            {products.map(product => (
              <tr>
                {/* //add  td with checkbox with productId value , when check is set to selectedProduct */}

                <td><input type="checkbox" checked={selectedProduct === product.productId} onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProduct(product.productId);
                    copySelectedProduct(product);
                    document.getElementById('keyword').value = product.product_description;
                    document.getElementById('image_name').value = product.image_url;
                  } else {
                    setSelectedProduct('');
                    document.getElementById('keyword').value = '';
                    document.getElementById('image_name').value = '';
                  }
                }} /></td>

                


              <td>{product.productId}</td>
                <td>{product.product_description}
                <br /> { new Date(product.sale_end_date).toLocaleDateString('EN-UK')  }
                <br /> { product.storeName }
                <br /> { product.old_price } -  { product.new_price }
                  </td> 
                  <td>       <img
                  src={`https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_100/uploads/${product.image_url}`}
                  onClick={() => {
                    
                    document.getElementById('prod_image').innerHTML = `<img id="largeImage" src="https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_600/uploads/${product.image_url}" />`;
                    document.getElementById('selectedImages').value = product.image_url;
                    
                  }}

                  onDoubleClick={() => {
                    
                    document.getElementById('prod_image').innerHTML = '';
                  }
                }
                 
                />
               
                </td>

                <td>{product?.keywords?.split(',').map(keyword => (
                  <div><button onClick={() => removeKeyword(selectedProduct, keyword)}>{keyword} X</button></div>
                ))}</td>




             

                <td><input type="checkbox" checked={product.isFavorite} onChange={(e) => {

                  const userId = document.querySelector('select[name="user"]').value;

                  console.log('userId:', userId);

                  if (e.target.checked) {

                    // get the user id from the select element with name user

                    addProductToFavorites(userId, product.productId);
                  } else {
                    removeProductFromFavorites(userId, product.productId);
                  }
                }
                } /></td>


                <td><button onClick={() => handleDeleteProduct(product.productId)}>Delete</button></td>
              
              </tr>
            ))}
          </table></div>
          
        

          <div id="prod_image" />

      <div className='scrollable-div2' style={{  width: '100%'}}> 


        

      <table name = "media" border="1" cellPadding="10" cellSpacing="0" >

        <tbody>
          {mediaFiles.map((file) => (
            <tr key={file.public_id}>
              <td style={{width:"30"}}>

                <img
                  src={`https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_100/${file.public_id}.${file.format}`}
                  alt={file.public_id}  onClick={() => {
                    document.getElementById('selectedImages').value = file.public_id;
                    document.getElementById('prod_image').innerHTML = `<img id="largeImage" src="https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_600/${file.public_id}.${file.format}" />`;
                    
                  }}

                  onDoubleClick={() => {
                    document.getElementById('selectedImages').value = file.public_id;
                    document.getElementById('prod_image').innerHTML = '';
                  }
                  }

                />

        



      
              </td>
              <td style={{fontSize:10, width: "20%"}}>{file.public_id}.{file.format}</td>

              <td style={{width:"15%"}}>
                <button onClick={() => handleDeleteImage(file.public_id)}>Delete</button>
              </td>
              <td style={{width:"5%"}}> {/* NEW: Checkbox for selecting images */}
              
                <input
                  type="checkbox"
                  onChange={() => handleCheckboxChange(file.public_id.split('/').pop() + '.'+ file.format)}
                  checked={selectedImages.includes(file.public_id.split('/').pop() + '.'+ file.format)}
                />
              </td>
              
            </tr>
          ))}
        </tbody>
      </table>
      
      </div>
          <br />

          
       




  </div> 





    </div>
  );
}

export default Dashboard;
