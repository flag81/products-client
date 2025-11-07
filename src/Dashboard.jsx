import { useState, useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { use } from 'react';
import Home from './Home';
import Calendar from 'react-calendar';

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { all } from 'axios';
import { post } from 'jquery';



function Dashboard() {
  const [count, setCount] = useState(0);

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');


  const [selectedFiles, setSelectedFiles] = useState([]);
  const [extractedText, setExtractedText] = useState('');
const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const resultDivRef = useRef(null);
  const fileInputRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(0);

  const [ facebookUrl , setFacebookUrl ] = useState(null); // State for single file upload


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

const [userId, setUserId] = useState();

const [userName, setUserName] = useState();


const [email, setEmail] = useState('');

const [mode, setMode] = useState('dashboard');

const [responseMessage, setResponseMessage ] = useState('');

const [selectedStore, setSelectedStore] = useState('0'); // Default to "All Stores"
const [selectedStoreName, setSelectedStoreName] = useState('All Stores'); // Default to "All Stores"
const [selectedStoreFacebookPageId, setSelectedStoreFacebookPageId ] = useState(''); // State for selected store's Facebook URL


  const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const API_KEY = import.meta.env.CLOUDINARY_API_KEY;
  const API_SECRET = import.meta.env.CLOUDINARY_API_SECRET;


  const node_url = import.meta.env.VITE_NODE_URL;


  const imageBaseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/`;

  // NEW: State to track selected public_id values
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedProduct , setSelectedProduct] = useState('');
  const [selectedProductDescription , setSelectedProductDescription] = useState('');

  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);


  const [facebookPhotos, setFacebookPhotos] = useState([]);

  const[facebookPhotosCount, setFacebookPhotosCount] = useState(0);

  const [saleEndDate, setSaleEndDate] = useState(''); // State for sale end date
  const [storeId, setStoreId] = useState(0); // State for store ID

  const [postIds, setPostIds] = useState([]);
  

const width = 200;
var baseUrl = "https://res.cloudinary.com/dt7a4yl1x/image/upload";
const transformation = `w_${width},c_scale`;
const directory = "uploads";


useEffect(() => {
  // Initialize user preferences or settings if needed


  console.log('useEffect for facebookPhotos called with facebookPhotos:', facebookPhotos);

  //initializeUser();
  setFacebookPhotosCount(facebookPhotos.length);


}, [facebookPhotos]);


// ADD USEEFFECT  for products to log when products change

useEffect(() => {
  console.log('useEffect for products called with products:', products);
}, [products]);

useEffect(() => {
  console.log('useEffect for postIds:', postIds);
}, [postIds]);


// add function to handle to api end point to in server.js , extract-sale-end-date with item.image tag for every item in facebookPhotos array, and set it to the to the new sale_end_date field in the item object of the facebookPhotos array, if not fund return null


// Add this function below your other functions in Dashboard

/**
 * For each item in facebookPhotos, call the /extract-sale-end-date API with item.image,
 * and set the returned value to item.sale_end_date. If not found, set to null.
 * Updates the facebookPhotos state with the new array.
 */
const extractSaleEndDatesForFacebookPhotos = async () => {
  console.log('extractSaleEndDatesForFacebookPhotos called with facebookPhotos:', facebookPhotos);

  if (!facebookPhotos.length) {
    setStatus('No Facebook photos to process.');
    return;
  }
  setStatus('Extracting sale end dates from Facebook photos...');

  // Extract only the image tag from each photo object
  const imageArray = facebookPhotos.map(item => item.image).filter(Boolean);

  console.log('Image array for API:', imageArray);

  try {
    // Send only the array of image URLs to the API
    const response = await fetch(`${node_url}/extract-sale-end-date`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: imageArray }),
    });
    const result = await response.json();

    // Expecting result to be an array of { image, sale_end_date }
    if (response.ok && Array.isArray(result)) {
      // Merge sale_end_date back into facebookPhotos by matching image
      const updatedPhotos = facebookPhotos.map(photo => {
        const found = result.find(r => r.image === photo.image);
        return { ...photo, sale_end_date: found ? found.sale_end_date : null };
      });
      setFacebookPhotos(updatedPhotos);
      setStatus('Sale end dates extracted for Facebook photos.');
    } else {
      setStatus('Failed to extract sale end dates.');
    }
  } catch (error) {
    console.error('Error extracting sale end dates:', error);
    setStatus('Error extracting sale end dates.');
  }
};




/**
 * Fetches the latest Facebook posts for each store using your backend /facebook-posts endpoint.
 * Handles posts with multiple or single images and extracts the message.
 * Updates facebookPhotos state with the results.
 * Adds extensive debugging for transparency.
 */
const handleFetchFacebookPostsRapidApi = async (pageId) => {
  setStatus('Fetching Facebook posts via backend endpoint...');
  setFacebookPhotos([]);
  setFacebookPhotosCount(0);

  console.log('handleFetchFacebookPostsRapidApi called for all stores (sequential with delay).', pageId);

  let allPhotos = [];
  let allMessages = [];

  try {
    const storesWithFacebookId = stores.filter(store => store.facebookPageId && Number(store.facebookPageId) > 0);
    console.log('Stores to be processed (backend):', storesWithFacebookId.map(s => ({ name: s.storeName, id: s.facebookPageId })));

    for (const store of storesWithFacebookId) {
      try {
        setStatus(`Fetching posts for ${store.storeName}...`);
        const response = await fetch(`${node_url}/facebook-posts?facebookPageId=${store.facebookPageId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error(`HTTP error for ${store.storeName}! status: ${response.status}`);
          allMessages.push(`Failed to fetch for ${store.storeName}: ${response.statusText}`);
          continue;
        }

        const result = await response.json();
        console.log(`[${store.storeName}] /facebook-posts result:`, result.items);

        if (result.debugMessages) {
          result.debugMessages.forEach(msg => console.log(`[${store.storeName}] DEBUG:`, msg));
          allMessages = allMessages.concat(result.debugMessages);
        }

        if (result.items && result.items.length > 0) {
          console.log(`Found ${result.items.length} images for ${store.storeName} with storeId ${store.storeId}.`);
          // Add storeId and storeName to each item for context
          result.items.forEach(item => {
            item.storeId = store.storeId;
            item.storeName = store.storeName;
            // Add a flyerBookId for grouping if needed
            item.flyerBookId = Math.floor(100000 + Math.random() * 900000);
          });
          allPhotos = allPhotos.concat(result.items);
        } else {
          console.log(`No images returned for ${store.storeName}.`);
        }

        // 



        // Wait 250ms between requests to avoid rate-limiting
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (error) {
        console.error(`Error fetching posts for ${store.storeName}:`, error);
        allMessages.push(`Error for ${store.storeName}: ${error.message}`);
      }
    }

// i have all existing postIds array of objects that have postId as int type
// allPhotos is an array of objects with postId field as string
// i need to filter allPhotos array to remove any objects that have postId that matches with any of the postIds in the postIds array
  

console.log('Filtering allPhotos. postIds:', postIds);
console.log('allPhotos before filtering:', allPhotos);

// Convert all postIds to string for reliable comparison
const postIdSet = new Set(postIds.map(obj => String(obj.postId)));
console.log('postIdSet for filtering:', postIdSet);

// Filter out photos whose postId matches any in postIds
const filteredPhotos = allPhotos.filter(photo => {
  const match = postIdSet.has(String(photo.postId));
  if (match) {
    console.log(`Filtered out photo with postId: ${photo.postId}`);
  }
  return !match;
});

//filteredPhotos = allPhotos ;

console.log('allPhotos after filtering:', allPhotos); // Log the correct array

// --- FIX: Use the 'filteredPhotos' array instead of 'allPhotos' ---
setFacebookPhotos(allPhotos);
//setAllMessages(allMessages);
setStatus(`Fetched ${allPhotos.length} total photos. After filtering, ${filteredPhotos.length} are new.`);






    setFacebookPhotos(allPhotos);
    setFacebookPhotosCount(allPhotos.length);
    setStatus(`Fetched ${allPhotos.length} Facebook post images via backend /facebook-posts.`);
    console.log('All messages:', allMessages);
  } catch (error) {
    setStatus('A critical error occurred in handleFetchFacebookPostsRapidApi.');
    console.error('Critical error:', error);
  }
};

// ...existing




const handleFetchFacebookPhotos = async (storeId) => {



  console.log('handleFetchFacebookPhotos called with selectedStore:', storeId);

  setFacebookPhotos([]); // Clear previous photos
  


    // get the facebookUrl field from the stores array that matched the storeId 
    const store = stores.find(s => s.storeId === parseInt(storeId, 10)); 

 

    const facebookUrl = store ? store.facebookUrl : null;
  
    setFacebookUrl(facebookUrl); // Update state with Facebook URL
  
    console.log('Facebook URL for store:', facebookUrl);

  if (!facebookUrl) {
    alert('Please select a store with a valid Facebook URL.');
    return;
  }





  try {
    const response = await fetch(`${node_url}/get-facebook-photos`,

      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      //+ `?storeId=${encodeURIComponent(selectedStore)}`, // Use selectedStore state
      //+ `&facebookUrl=${encodeURIComponent(facebookUrl)}`, // Include Facebook URL in the request
      body: JSON.stringify({
        selectedStore,
        facebookUrl, // Include Facebook URL in the request
      }),

    }




  
  );
    const result = await response.json();

    if (response.ok) {
      setFacebookPhotos(result.items || []);
      setFacebookPhotosCount(result.items.length || 0);

      console.log('Facebook photos count:', result.items.length);

      // order the  facebookPhotos  array by facebookId tag in each item

      // setFacebookPhotos(prevPhotos => prevPhotos.sort((a, b) => {
      //   return a.facebookId.localeCompare(b.facebookId);
      // }));


      setFacebookPhotos(prevPhotos =>
        [...prevPhotos].sort((a, b) => {
          const idA = a.facebookId || '';
          const idB = b.facebookId || '';
          return idA.localeCompare(idB);
        })
      );
      

      console.log('Facebook photos fetched:', result.items);
    } else {
      alert(`Failed: ${result.error}`);
    }
  } catch (err) {
    console.error('Error fetching Facebook photos:', err);
    alert('An error occurred while fetching Facebook photos.');
  }
};

 const handleFileChange2 = (event) => {
  setSelectedFile(event.target.files[0]);
};

const handleFileChange = (e) => {
  // turn FileList → Array<File>
  const files = Array.from(e.target.files);


   setSelectedFiles(files);
  console.log('Picked files:', files);
};




// ...existing code...

/**
 * Extracts text for each group of facebookPhotos with the same postId.
 * Calls the API separately for each postId group, not the whole array at once.
 * Results are collected and merged for display.
 */
const extractTextSingle = async () => {
  console.log('extractTextSingle called with:', facebookPhotos);

  if (!facebookPhotos.length) {
    setStatus('No Facebook photos to process.');
    return null;
  }

  setStatus('Extracting text from Facebook photos by postId groups...');
  const results = [];
  const groupedByPostId = {};

  // Group facebookPhotos by postId
  facebookPhotos.forEach(photo => {
    const postId = photo.postId || 'no_post_id';
    if (!groupedByPostId[postId]) groupedByPostId[postId] = [];
    groupedByPostId[postId].push(photo);
  });

  // Debug: log the grouping
  console.log('Grouped facebookPhotos by postId:', groupedByPostId);

  // Process each group separately
  for (const postId in groupedByPostId) {
    //const group = groupedByPostId[postId];
    // Prepare payload for the API

  

const group = groupedByPostId[postId];
// Take imageData from the first item (all items have the same imageData for this post)
const imageDataArr = group[0]?.imageData || [];

console.log(`Processing postId group "${postId}" with imageData:`, imageDataArr);

if (!Array.isArray(imageDataArr) || imageDataArr.length === 0) {
  console.warn(`No imageData found for postId "${postId}", skipping...`);
  continue; // Skip this group if no imageData
}


const imagesPayload = imageDataArr.map((imgObj, imgIdx) => ({
  imageUrl: imgObj.uri,
  imageId: imgObj.id,
  storeId: group[0].storeId,
  flyerBookId: group[0].flyerBookId || Math.floor(100000 + Math.random() * 900000),
  facebookUrl: facebookUrl || group[0].facebookUrl || '',
  postText: group[0].message || '',
  created_time: group[0].created_time || null,
  userId: group[0].userId || userId || 1,
  postId: postId,
  timestamp: group[0].timestamp, // Use the first item's timestamp or current time
}));



    console.log(`Processing postId group "${postId}" with ${imagesPayload.length} images:`, imagesPayload);

    console.log('All imageIds in imagesPayload:', imagesPayload.map(img => img.imageId));


    const idSet = new Set();
imagesPayload.forEach(img => {
  if (idSet.has(img.imageId)) {
    console.warn('Duplicate imageId found:', img.imageId);
  }
  idSet.add(img.imageId);
});



    try {
      const response = await fetch(`${node_url}/extract-text-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imagesPayload }),
      });
      const result = await response.json();

      if (response.ok) {
        console.log(`Extracted data for postId "${postId}":`, result);
        if (result.allMessages) {
          console.log(`🔍 Debug Messages from Server for postId "${postId}":`, result.allMessages);
          setResponseMessage(prev => prev + '\n' + result.allMessages.join('\n'));
        }
        results.push({ postId, extracted: result });
      } else {
        console.error(`Failed to extract text for postId "${postId}":`, result);
        results.push({ postId, extracted: null, error: result });
      }
    } catch (error) {
      console.error(`Error calling /extract-text-single for postId "${postId}":`, error);
      results.push({ postId, extracted: null, error: error.message });
    }
  }

  setStatus('Extraction complete.');
  console.log('Extraction complete:', results);
  // Optionally, update state or display results as needed
  // setExtractedText(JSON.stringify(results, null, 2));
  return results;
};

// ...existing code...


// Bulk “upload & extract” handler
const handleUploadImagesManual = async () => {
  // 1️⃣ Ensure at least one file is selected
  if (selectedFiles.length === 0) {
    alert('Please select at least one image.');
    return;
  }

  // 2️⃣ Filter out non-image files
  const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) {
    alert('Please select valid image files.');
    return;
  }

  // 3️⃣ Kick off status
  setStatus('Uploading images and extracting text…');

  // get the date from the date picker input element and and convert it to YYYY-MM-DD format for the sale_end_date field

  const saleEndDate = document.getElementById('sale_end_date').value || '';
  const storeId = document.querySelector('select[name="store"]').value;



  console.log('saleEndDate from picker:', saleEndDate);

  // conver to a date object and then to a string in the format YYYY-MM-DD

  // check if saleEndDate is valid date and not empty from sale_end_date input element in format YYYY-MM-DD

  const dateParts = saleEndDate.split('-');
  //const month = parseInt(dateParts[1], 10) - 1; // Months are zero-based in JS


  // day and month can have zero in front of them, so we need to parse them as int with base 10 for date in format YYYY-MM-DD

  const month = parseInt(dateParts[1], 10) - 1; // Months are zero-based in JS

  const day = parseInt(dateParts[1], 10); // Day is first in the date string


  //console.log('dateParts:', dateParts[1], dateParts[0], dateParts[2]);

  const year = parseInt(dateParts[0], 10); // Year is last in the date string


  //const day = parseInt(dateParts[2], 10);
  //const year = parseInt(dateParts[0], 10);


  console.log('dateParts:', year, month, day);

  const date = new Date(year, month, day);


  // check id year, day and month are valid numbers and not NaN

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    setStatus(<font style={{color:'red'}}><b>Please select a valid date</b></font>);
    return;
  }


  //console.log('formattedDate:', formattedDate);

  // check if storeId is selected and not empty from store select element

  if (!storeId || storeId === '0') {
    setStatus(<font style={{color:'red'}}><b>Please select a store</b></font>);
    return;
  }



// generate a randon 6 digit number to use as flyer book id

const flyerBookId = Math.floor(100000 + Math.random() * 900000);

console.log('flyerBookId:', flyerBookId);





  // Arrays to collect results
  const allTexts = [];
  const allUrls = [];

  // 4️⃣ Loop over each image file
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];

    

    console.log('file:', file);
    console.log(`▶️ [${i + 1}/${imageFiles.length}] Processing "${file.name}"…`);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folderName', folderName);

    // add saleEndDate to formData as sale_end_date field
    formData.append('saleEndDate', saleEndDate);
    formData.append('storeId', storeId); // Send storeId in request
    formData.append('flyerBookId', flyerBookId ); // Send storeId in request

    console.log('formData:', formData , formData.get('saleEndDate'), formData.get('storeId'), formData.get('flyerBookId'));

    try {
      const res = await fetch(`${node_url}/extract-text`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(`⚠️ Extraction failed for "${file.name}":`, err);
        allTexts.push(`Error (${file.name}): ${err.message || 'unknown'}`);
      } else {
        const data = await res.json();
        console.log(`✅ Extracted from "${file.name}":`, data);

        // adapt these keys if your API uses different names
        const text = data.extractedText ?? data.text ?? '';
        const imageUrl = data.imageUrl;
        allTexts.push(text);
        allUrls.push(imageUrl);
      }
    } catch (networkErr) {
      console.error(`❌ Network error for "${file.name}":`, networkErr);
      allTexts.push(`Error (${file.name}): ${networkErr.message}`);
    }

    // 5️⃣ Pause 3s between requests (optional, but avoids rate‐limit issues)
    //    Remove or adjust the delay if not needed.
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 3000));
  }

  // 6️⃣ Update state with aggregated results
  setExtractedText(allTexts.join('\n\n'));
  setUploadedImageUrls(allUrls);
  
  

  // 7️⃣ Final success status
  setStatus(
    <font style={{ color: 'green' }}>
      <b>Te gjitha produket ne aksion jane futur me sukses.</b>
    </font>
  );

  // set the store element to the first store in the list of stores
  const storeSelect = document.querySelector('select[name="store"]');

  if (storeSelect && stores.length > 0) {
    storeSelect.value = stores[0].storeId;
  }

  // 8️⃣ Clear file input
  setSelectedFiles([]);
  if (fileInputRef.current) fileInputRef.current.value = '';
};









 const handleLogin = async () => {
  try {
    const response = await fetch(`${node_url}/dashboardLogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
    });

    const result = await response.json();

    console.log('user result:', result);

    if (response.ok) {

      console.log('Login successful:', result.user);
      setLoggedInUser(true);
      //setEmail(result.user.email);
      setUserName(result.user.userName);
      setLoginError('');
    } else {
      setLoginError(result.message || 'Login failed');
    }
  } catch (error) {
    setLoginError('Error logging in', error);
    console.error(error);
  }
};


 //change

 useEffect(() => {

  getStores();
  getUsers();

  getPostIds();

 // storeId = document.querySelector('select[name="store"]').value;
  //getAllProducts();
}, []);


// add function to call getpostids endpoint to get all post ids and set them to the postIds state




const getPostIds = async () => {
  try {
    const response = await fetch(`${node_url}/getPostIds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    if (response.ok) {
      setPostIds(result);
      console.log('Post IDs fetched:', result);
    }
    else {
      console.error('Failed to fetch post IDs:', result.message);
    }
  } catch (error) {
    console.error('Error fetching post IDs:', error);
  }
};

// --- NEW: Handler to trigger notifications for all users ---
const handleSendAllNotifications = async () => {
  if (!window.confirm('Jeni i sigurt që doni të dërgoni njoftime për të gjithë përdoruesit? Ky veprim nuk mund të kthehet mbrapsht.')) {
    return;
  }

  setStatus('Duke filluar procesin e njoftimeve...');
  try {
    const response = await fetch(`${node_url}/trigger-all-user-notifications`, {
      method: 'POST',
    });
    const result = await response.json();
    if (response.ok) {
      setStatus(<font style={{color:'green'}}><b>{result.message}</b></font>);
    } else {
      setStatus(<font style={{color:'red'}}><b>Gabim: {result.error}</b></font>);
    }
  } catch (error) {
    console.error('Error triggering all user notifications:', error);
    setStatus(<font style={{color:'red'}}><b>Gabim rrjeti gjatë dërgimit të kërkesës.</b></font>);
  }
};


async function initializeUser() {
  try {
    const response = await fetch(`${node_url}/initialize`, { credentials: 'include' });

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
    const response = await fetch(`${node_url}/get-preferences`, { credentials: 'include' });

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

    const response = await fetch(`${node_url}/getUsers`, {
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
      const response = await fetch(`${node_url}/getStores`, {
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
      const response = await fetch(`${node_url}/addFavorite`, {
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
    const response = await fetch(`${node_url}/removeFavorite`, {
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
    const response = await fetch(`${node_url}/editProductDescription`, {
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


const editStore = async (productId, storeId) => {

console.log('editStore called:', productId, storeId);

  try {
    const response = await fetch(`${node_url}/editStore`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, storeId }),
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
      const response = await fetch(`${node_url}/searchProducts?keyword=${encodeURIComponent(keyword)}`, {
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


  const getAllProducts = async (page = 1, userId, storeId, isFavorite, onSale) => {
    try {

      console.log('getAllProducts userId:', userId);
      console.log('getAllProducts storeId:', storeId);
      console.log('getAllProducts isFavorite:', isFavorite);
      console.log('getAllProducts onSale:', onSale);

      
      const response = await fetch(`${node_url}/getProductsWithKeywords?
      userId=${encodeURIComponent(userId)}
      &storeId=${encodeURIComponent(storeId)}
      &isFavorite=${encodeURIComponent(isFavorite)}
      &page=${page}
      &onSale=${encodeURIComponent(onSale)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        
      });

      const result = await response.json();

      console.log('getAllProducts result:', result);

            if (!response.ok) throw new Error(result.message);
      
            // on page 1 replace, otherwise append
            if (page === 1) {
              setProducts(result);
            } else {
              setProducts(prev => [...prev, ...result]);
            }
           } catch (error) {
             console.error('Error fetching prod:', error);
           }



  };
  

  // Fetch media files from Cloudinary
  const fetchMediaFiles = async () => {
    try {
      const response = await fetch(`${node_url}/media-library-json`);
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
    const storeId = document.querySelector('select[name="store"]').value;

    console.log('storeId image upload:', storeId);

    console.log('files:', files);

    if (files.length === 0 || storeId === '0') {
      setStatus(<font style={{color:'red'}}><b>Please select a store and image</b></font>);
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
      console.log('files[i]:', files[i]);
    }
    formData.append('folderName', folderName); // Send folder name in request
    formData.append('storeId', storeId); // Send folder name in request

    console.log('formData:', formData);
    console.log('folderName:', folderName);

    try {
      const response = await fetch(`${node_url}/upload-multiple`, {
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
      const response = await fetch(`${node_url}/delete-image`, {
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

console.log('copySelectedProduct product:', product);


    const storeId = document.querySelector('select[name="store"]').value;
    //const userId = document.querySelector('select[name="user"]').value;
    //const imageUrl = document.getElementById('selectedImages').value;

    // conver product.sale_end_date to a date object and then to a string in the format YYYY-MM-DD

    const saleEndDate = new Date(product.sale_end_date).toISOString().split('T')[0];



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

    //document.getElementById('products').value = JSON.stringify(productData, null, 2);

    console.log('productData:', productData);

        // set the keyword text input element value to the product description

    document.getElementById('keyword').value = product.product_description || '';

    document.getElementById('oldPrice').value = product.old_price || '';
    document.getElementById('newPrice').value = product.new_price || '';


    //document.getElementById('keyword').value = product.product_description;

    //document.getElementById('keyword').value = product.product_description;

    // set the keyword text input element value to the product description








  }




    // NEW: Copy the list of selected public_id values to the clipboard



// add a new function to call the server api addKeyword to add a keyword to a product

const addKeyword = async (productId, keyword) => {
  try {

      //check if productId or keyword is empty and return from the function if it is empty

      if (!productId || !keyword) {
        setStatus(<font style={{color:'red'}}><b>Please select a product and keyword</b></font>);
        return;
      }

    const response = await fetch(`${node_url}/addKeyword`, {
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
    const response = await fetch(`${node_url}/removeKeyword`, {
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


      const response = await fetch(`${node_url}/chatgptExtractProducts?storeId=${storeId}&imageUrl=${imageUrl}`, {
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




    const handleDeleteProduct = async (productId) => {
      try {

        console.log('productId sent delete:', productId);
        const response = await fetch(`${node_url}/deleteProduct/${productId}`, {
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
        const response = await fetch(`${node_url}/extractText?imageUrl=${imageUrl}`, {
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


    const updateProductSaleDate= async (productId, sale_end_date) => {

      console.log('updateProductSaleDate called:', productId, sale_end_date);

      if(!productId || !sale_end_date) {
        setStatus('Please enter product ID, sale date.');
        return; 
      }

      //check if date format is correct YYYY/MM/DD or YYYY-MM-DD or YYYY.MM.DD

      const dateRegex = /^\d{4}[-/.]\d{2}[-/.]\d{2}$/; // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD



      //const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
      if (!dateRegex.test(sale_end_date)) {
        setStatus('Please enter a valid date in the format MM/DD/YYYY.');
        console.error('Invalid date format:', sale_end_date);
        return;
      }

    
          try {

             console.log('updateProductSaleDate called:', productId, sale_end_date);
            const response = await fetch(`${node_url}/editProductSaleDate`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ productId, sale_end_date }),
            });
        
            const result = await response.json();
        
            if (response.ok) {
              console.log('result:', result);
              getAllProducts();
            }
          }
          catch (error) {
            console.error('Error updating product sale date:', error);
          }
        };

  const updateProductPrices = async (productId, oldPrice, newPrice) => {

  if(!productId || !oldPrice || !newPrice) {
    setStatus('Please enter product ID, old price and new price.');
    return; 
  }

      try {
        const response = await fetch(`${node_url}/updateProductPrices`, {
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
        const response = await fetch(`${node_url}/rename-image`, {
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

  if (!loggedInUser) {
    return (
      <div style={{ margin: '50px', border: '1px solid black', marginBottom : '100px' }}>
        <h2>Please Login</h2>
        <input
         style={{ margin:  '20px' }}
          type="text"
          placeholder="Username"
          value={loginForm.username}
          onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={loginForm.password}
          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
        />
        <br />
        <button style={{ margin:  '20px' }} onClick={handleLogin}>Login</button>
        <p style={{ color: 'red' }}>{loginError}</p>
      </div>
    );
  }

  return (

    

<div style={{ margin: '0', padding: '0', width: '90vw', 



 }}>



{/* 
<div style={{ display: 'flex', flexDirection: 'row',  flexWrap: 'wrap', gap: '10px' , width: '100vw', justifyContent: 'center' }}>


                    User Id: {loggedInUser}   - user : {userName} - status: {status}

</div>



      <div style={{ display: 'flex', flexDirection: 'row',  flexWrap: 'wrap', gap: '10px' , width: '100vw' }}>
        <div  style={{ gap: '10px' }}>
          
          <form onSubmit={handleImageUpload}>
          Shto foto:
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
            <button type="submit">Upload photo</button>
          </form>


          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}> 
             
              <input type="text" id = "image_name"/>
          </div>

        </div>
{
        <div>
         
          <textarea id = "selectedImages"
            value={selectedImages.join(', ')}
            rows="4"
            cols="30"
          />
          <br />
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
          <button onClick={copySelectedImages}>Copy Selected IDs</button>
          <button onClick={() => document.getElementById('selectedImages').value = ''}>Clear</button>
          <p>{copySuccess}</p>
          </div>
        </div> }

        <div>
       
          <textarea id="prompt"
            value={prompt}   
            rows="4"
            cols="30"
          />
          <br />
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
          <button onClick={copyPrompt}>Copy prompt</button>
          <button onClick={() => document.getElementById('prompt').value = ''}>Clear</button>
</div>
          <p>{copySuccess}</p>
        </div>


        

</div> */}

{/* <div>
  <button onClick={requestNotificationPermission}>Enable Notifications</button>
  </div> */}

<div>
<p>{status}</p>
  </div>


{



}

<div style={{ display: 'flex', flexDirection: 'row', gap: '10px', 




 }}>

  <div  style={{ display: 'flex', flexDirection: 'column', gap: '10px' , width : '50%' }}>

    

<div style={{ 

border: '1px solid red', 
padding: '10px', marginBottom: '20px', width: '100%' ,


 }}>

<div style={{ display: 'flex', flexDirection: 'row', gap: '10px', 

padding: '10px', marginBottom: '10px', width: '100%'

 }}>


<input autofocus  type="date" id="sale_end_date" name="sale_end_date" style={{width:150}}  />







<select name='store' id = 'store' style={{width : 100}}>
{stores.map(store => (
  <option value={store.storeId}>{store.storeName}</option>
))}

</select>
</div>

<div

style={{ display: 'flex', flexDirection: 'row', gap: '10px', marginBottom: '10px' }}

>
    <input
      type="file"
      id="imageUpload"
      accept="image/*"
      name="images" 
      multiple // Allows selecting multiple images
      onChange={handleFileChange}
      ref={fileInputRef}
     
    />
    <button onClick={handleUploadImagesManual}>Process Images manual</button>


  


    <div id="result" ref={resultDivRef}>
      {extractedText && <p>{extractedText}</p>}
    </div>
</div>



</div>
  
  <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>


{/* 
  <select name='user'>
    {users.map(user => (
      <option value={user.userId}>{user.userName}</option>
    ))}

  </select> */}

<button onClick={() => updateProductSaleDate(selectedProduct, document.getElementById('sale_end_date').value, document.getElementById('newPrice').value)}>Update Date {selectedProduct}</button>





  Favorite:
      <input
        type="checkbox"
        id="favorites"
        name="favorites"
        onChange={() => {
          setCurrentPage(1);
          getAllProducts(
            1,
            loggedInUser,
            document.getElementById('store').value,
            document.getElementById('favorites').checked,
            document.getElementById('onSale').checked
          );
        }}
      />





  On Sale:
      <input
        type="checkbox"
        id="onSale"
        name="onSale"
        onChange={() => {
          setCurrentPage(1);
          getAllProducts(
            1,
            loggedInUser,
            document.getElementById('store').value,
            document.getElementById('favorites').checked,
            document.getElementById('onSale').checked
          );
        }}
      />

  

  </div>

{/* <button onClick={() => extractProducts(document.querySelector('select[name="store"]').value, document.getElementById('selectedImages').value)}>Extract Products</button> */}


  <input type="text" id="keyword" name="keyword" placeholder='Pershkrimi ose keyword' style={{width : 400}}/>

  <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
  <button onClick={() => addKeyword(selectedProduct, document.getElementById('keyword').value)}>Add Keyword to {selectedProduct}</button>
  <button onClick={() => editProductDescription(selectedProduct, document.getElementById('keyword').value)}>Edit description for {selectedProduct}</button>
  <button onClick={() => editStore(selectedProduct, document.getElementById('store').value)}>Edit Store for {selectedProduct}</button>
</div>




{/* add a div with two input fields to update old\-price and  */}

<div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>

  <input type="text" id="oldPrice" name="oldPrice" style={{width:150}} placeholder='0.00' />
  <input type="text" id="newPrice" name="newPrice" style={{width:150}} placeholder='0.00'/>
  <button onClick={() => updateProductPrices(selectedProduct, document.getElementById('oldPrice').value, document.getElementById('newPrice').value)}>Update Prices for {selectedProduct}</button>

</div>




  </div>


<div  style={{ display: 'flex' }}>

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


  </div>



  </div>

<pre>{}</pre>


<div>





<div style={{ display: 'flex', flexDirection: 'row', gap: '10px', margin : '10px', justifyContent: 'center', alignItems: 'center' }}>

Search Products: <input type="text" id="keyword_search" name="keyword_search" onKeyDown={(e) => { if (e.key === 'Enter') searchProducts(e.target.value); }} />

  <button onClick={() => document.getElementById('keyword_search').value = ''}>Clear</button>
  
  


  <button
      onClick={() => {
        const next = currentPage + 1;
        setCurrentPage(next);
        getAllProducts(
          next,
          loggedInUser,
          document.querySelector('select[name="store"]').value,
          document.getElementById('favorites').checked,
          document.getElementById('onSale').checked
        );
      }}
    >
      Get Products (page {currentPage + 1})
    </button>

    <button
      onClick={() => {
        const next = 1;
        setCurrentPage(next);
        getAllProducts(
          next,
          loggedInUser,
          document.querySelector('select[name="store"]').value,
          document.getElementById('favorites').checked,
          document.getElementById('onSale').checked
        );
      }}
    >
      Refresh Products
    </button>
  
    {/* --- NEW: Button to trigger notifications for all users --- */}
    <button onClick={handleSendAllNotifications} style={{ backgroundColor: '#c9302c', color: 'white', borderColor: '#ac2925', fontWeight: 'bold' }}>
      Dërgo Njoftime Për Të Gjithë
    </button>
</div>  
    


</div>




<div style={{ 

  display: "inline-block",
  
  fontSize: 12,
 color: "#333" ,
 // add a border with rounded corners
  border: "1px solid #ccc",
  borderRadius: 5,
  padding: 10,
  cursor: "pointer",
  margin: "0 5px",
  



}}

onClick={() => {
  //setSelectedStore(store.storeId);
  //setStoreId(store.storeId);
  //setSelectedStoreName(store.storeName);
  //handleFetchFacebookPhotos(store.storeId); // Fetch photos for the selected store
  handleFetchFacebookPostsRapidApi(store.facebookPageId); // Fetch photos for the selected store using Rapid API

} }



>
  
  
  <span style={{  textAlign: "center" }}>
  Fetch Photos for all Facebook Posts
</span>      

</div>




<div id="prod_image" style={{ display: 'flex', flexDirection: 'row', gap: '10px', margin : '10px', justifyContent: 'center', alignItems: 'center' }}>


  <button onClick={extractTextSingle}>Process images</button>


</div>



<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
  <h3>Facebook Posts - {selectedStoreName}</h3>
  {(() => {
    const postsMap = {};
    facebookPhotos.forEach(photo => {
      if (!postsMap[photo.postId]) {
        postsMap[photo.postId] = {
          message: photo.message,
          created_time: photo.created_time,
          images: [],
        };
      }
      postsMap[photo.postId].images.push(photo.uri);
    });
    return Object.entries(postsMap).map(([postId, post]) => (
      <div key={postId} style={{ border: '1px solid #ccc', borderRadius: 5, marginBottom: 20, padding: 10 }}>
        <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#333' }}>
          {post.message || <span style={{ color: '#888' }}>[No message]</span>}
        </div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
          {post.created_time ? `Posted: ${new Date(post.created_time * 1000).toLocaleString()}` : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', flexWrap: 'wrap' }}>
          {post.images.map((uri, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <img
                src={uri}
                alt={`Facebook Post ${postId} Photo ${idx + 1}`}
                style={{ width: '200px', height: 'auto', cursor: 'pointer', borderRadius: 4, border: '1px solid #eee' }}
                onClick={() => window.open(uri, '_blank')}
              />
              <button
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: 0,
                }}
                title="Remove photo"
                onClick={() => {
                  setFacebookPhotos(facebookPhotos.filter(p => !(p.postId === postId && p.uri === uri)));
                  setStatus(`Removed photo from post ${postId}`);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    ));
  })()}
</div>







<div style={{ display: 'flex',flexDirection: 'row', gap: '10px', borderColor : "red", borderWidth: 1, width: '100%' }}>



  
      <div className='scrollable-div' style={{ flexGrow:1, width: '100vw' }}>

        

            <table name="products" border="1" cellPadding="10" cellSpacing="0" borderColor="black">
            <tr>
              <th>Selected</th>
              <th>Product ID</th>
              <th>Product Description</th>
              <th>Image</th>
              <th>Keywords</th>
              <th>Favorite</th>
              <th>Delete</th>

            </tr>
            {products?.map(product => ( 

<tr
  key={product.productId}
  style={{ backgroundColor: selectedProduct === product.productId ? 'lightblue' : 'white' }}
  onClick={() => {
    const newSelectedProduct = product.productId === selectedProduct ? '' : product.productId;
    setSelectedProduct(newSelectedProduct);
    if (newSelectedProduct) {
      copySelectedProduct(product); // Call copySelectedProduct after setting the selected product
    }
  }}
>

                {/* //add  td with checkbox with productId value , when check is set to selectedProduct */}



                <td><input type="checkbox" checked={selectedProduct === product.productId} onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProduct(product.productId);
                    copySelectedProduct(product);
                    document.getElementById('keyword').value = product.product_description;
                    document.getElementById('image_name').value = product.image_url;
                    document.getElementById('sale_end_date').value = product.sale_end_date;
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
                  <td>       


{

// product.image_url contains the full url to the image, so we need to extract the public_id and format from it a specific width 
// currenty is in the format liek: 'https://res.cloudinary.com/dt7a4yl1x/image/upload/v1743425169/extracted_text_images/59c3ceb10cd36a36883ab50582106032_sb80d9.jpg'

// i need to specify the width of the image to be 100px and the height to be auto

// and the image should be clickable to show the full image in a new tab


// and the image should be double clickable to remove the image from the div with id prod_image


// how to set a const var in this section and use it in the src of the image




 //const imageUrl = product.image_url.split('/').pop();

 // get the full image name from the image_url and set it to the imageUrl variable as last part of the / 


}




                    <img
                      src={`${baseUrl}/${transformation}/${directory}/${product?.image_url?.split('/').pop()}`} alt={product.product_description}
                      onClick={() => {
                    
                      document.getElementById('prod_image').innerHTML = `<img id="largeImage" src="https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_600/uploads/${product.image_url.split('/').pop()}" />`;
                      document.getElementById('selectedImages').value = product.image_url;
                    
                  }}

                  onDoubleClick={() => {
                    
                    document.getElementById('prod_image').innerHTML = '';
                  }
                }
                 
                />
                </td>


<td>
  {(Array.isArray(product.keywords)
    ? product.keywords
    : typeof product.keywords === 'string' && product.keywords.length > 0
      ? product.keywords.split(',')
      : []
  ).map((keyword, idx) => (
    <div key={idx} style={{ gap: '10px', margin: '10px', fontSize: '10px' }}>
      <button onClick={() => removeKeyword(selectedProduct, keyword)}>{keyword} X</button>
    </div>
  ))}
</td>



             




                <td><button onClick={() => handleDeleteProduct(product.productId)}>Delete</button></td>
              
              </tr>
            ))}
          </table></div>
          
          <div id="prod_image" />

 
          <br />

  </div> 


 


    </div>
  );
}

export default Dashboard;