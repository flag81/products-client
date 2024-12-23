import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { use } from 'react';

function App() {
  const [count, setCount] = useState(0);

  console.log("starting...");

  const [mediaFiles, setMediaFiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(''); // State for copy success message
  
  const [status, setStatus] = useState('');
  const [folderName, setFolderName] = useState('uploads'); // Folder name input
  const [insertStatus, setInsertStatus] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');

  const [stores, setStores] = useState([]);

  const CLOUD_NAME = 'dt7a4yl1x';
  const API_KEY = '443112686625846';
  const API_SECRET = 'e9Hv5bsd2ECD17IQVOZGKuPmOA4';

  // NEW: State to track selected public_id values
  const [selectedImages, setSelectedImages] = useState([]);

  const prompt = 

  'You are a product data extractor from sales flyer. Can you extract product sale information in albanian language from this sales flyer in the format for each product' +
' Convert ë letter to e for all the keywords. Do not include conjunctions, articles words in albanian, in keywords.\n' +
 ' Do not include size info for keywords and only words with more than 2 characters as keywords, \n' + 
 ' The the image url(s) is(are): ';


 //change

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
        console.log('result:', result);
      } else {
        console.error('Failed to fetch stores:', result.message);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
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


  const getAllProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/getProducts', {
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

  // Handle image upload
  const handleImageUpload = async (event) => {
    event.preventDefault();
    const fileInput = event.target.elements.image;
    const file = fileInput.files[0];

    console.log('file:', file);

    if (!file) {
      setStatus('Please select an image to upload.');
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
        setCopySuccess('Copied selected image IDs to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
      },
      () => {
        setCopySuccess('Failed to copy');
        setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
      }
    );
  };


    // NEW: Copy the list of selected public_id values to the clipboard
    const copyPrompt = () => {
      const selectedIdsString = selectedImages.join(', ');
  
      // GET THE CONTENT OF THE TEXTAREA AND COPY IT TO THE CLIPBOARD
  
      navigator.clipboard.writeText(prompt + selectedIdsString).then(
  
        () => {
          setCopySuccess('Copied selected image IDs to clipboard!');
          setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
        },
        () => {
          setCopySuccess('Failed to copy');
          setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
        }
      );
    };
  

    // Handle product insertion
    const insertProducts = async () => {
      const textarea = document.getElementById('products');
      const productData = textarea.value;

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
          setInsertStatus('Product data should be an array of products.');
          return;
        }
      } catch (error) {
        setInsertStatus('Invalid product data. Please enter valid JSON.');
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
          setInsertStatus('Products inserted successfully!');
        } else {
          setInsertStatusatus(`Failed to insert products: ${result.error}`);
        }
      } catch (error) {
        setInsertStatus('An error occurred while inserting products.');
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
          setDeleteStatus(`Product with ID ${productId} deleted successfully.`);
          console.log(`Product with ID ${productId} deleted successfully.`);
        } else {
          console.error('Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    };
  

  // If loading or error occurs
  if (loading) {
    return <div>Loading media files...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2>Upload Image to Specific Folder</h2>
          <form onSubmit={handleImageUpload}>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              required
            />
            <br />
            <input type="file" name="image" accept="image/*" required />
            <button type="submit">Upload</button>
          </form>
          <p>{status}</p>
        </div>

        <div>
          <h2>Selected Image IDs</h2>
          <textarea
            value={selectedImages.join(', ')}
            readOnly
            rows="4"
            cols="50"
          />
          <br />
          <button onClick={copySelectedImages}>Copy Selected IDs</button>
          <p>{copySuccess}</p>
        </div>

        <div>
          <h2>Prompt</h2>
          <textarea
            value={prompt}
            readOnly
            rows="4"
            cols="50"
          />
          <br />
          <button onClick={copyPrompt}>Copy prompt</button>
          <p>{copySuccess}</p>
        </div>

        

</div>

<div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>

        <div><p>{deleteStatus}</p>
          <button onClick={getAllProducts}>Get Products</button>
          <table border="1" cellPadding="10" cellSpacing="0" width="50%">
            {products.map(product => (
              <tr>
              <td>{product.productId}</td>
                <td>{product.product_description}</td> 
                  <td>       <img
                  src={`https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_100/${product.image_url}`}
                 
                />{product.image_url}</td>
                <td><button onClick={() => handleDeleteProduct(product.productId)}>Delete</button></td>
              
              </tr>
            ))}
          </table>
        </div>

        <div>
          <h1>Insert Products</h1>
          <textarea id="products" name="products" rows="20" cols="50" />
          <br />
          <button onClick={insertProducts}>Insert Products</button>


          <button onClick={() => document.getElementById('products').value = ''}>Clear</button>

          <p>{insertStatus}</p>
        </div>
  </div> 

      <h1>Cloudinary Media Library</h1>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Public ID</th>
            <th>Format</th>
            <th>URL</th>
            <th>Actions</th>
            <th>Select</th> {/* NEW: Select column */}
          </tr>
        </thead>
        <tbody>
          {mediaFiles.map((file) => (
            <tr key={file.public_id}>
              <td>
                <img
                  src={`https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_100/${file.public_id}.${file.format}`}
                  alt={file.public_id}
                />
              </td>
              <td>{file.public_id}</td>
              <td>{file.format}</td>
              <td>
                <a href={file.secure_url} target="_blank" rel="noopener noreferrer">
                  View Image
                </a>
                <br />
                <button onClick={() => copyToClipboard(`https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_150/${file.public_id}.${file.format}`)}>Copy</button>
              </td>
              <td>
                <button onClick={() => handleDeleteImage(file.public_id)}>Delete</button>
              </td>
              <td> {/* NEW: Checkbox for selecting images */}
                <input
                  type="checkbox"
                  onChange={() => handleCheckboxChange(file.public_id + '.'+ file.format)}
                  checked={selectedImages.includes(file.public_id + '.'+ file.format)}
                />
              </td>
              <td>
                <button
                  onClick={() =>
                    handleDownload(
                      file.secure_url,
                      `media-${file.public_id}.${file.format}`
                    )
                  }
                >
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>


    </>
  );
}

export default App;
