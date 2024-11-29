import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0);

  console.log("starting...");

  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(''); // State for copy success messag


  const CLOUD_NAME = 'dt7a4yl1x';
  const API_KEY = '443112686625846';
  const API_SECRET = 'e9Hv5bsd2ECD17IQVOZGKuPmOA4';

   // Fetch media files from Cloudinary
    // Fetch media files from your backend API using fetch
    useEffect(() => {
      const fetchMediaFiles = async () => {
        try {
          // Fetch the data from your backend API
          const response = await fetch('https://qg048c0c0wos4o40gos4k0kc.128.140.43.244.sslip.io/media-library-json');
  
          // Check if the response is successful (status 200)
          if (!response.ok) {
            throw new Error('Failed to fetch media files');
          }
  
          // Parse the JSON response
          const data = await response.json();
  
          // Check if response data is an array
          if (Array.isArray(data)) {
            // Set the media files into state
            setMediaFiles(data);
          } else {
            setError('Unexpected data format');
          }
          setLoading(false);
        } catch (err) {
          setError('Error fetching media files');
          setLoading(false);
        }
      };
  
      fetchMediaFiles();
    }, []);


      // Copy the secure_url to the clipboard
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(
      () => {
        setCopySuccess('Copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
      },
      () => {
        setCopySuccess('Failed to copy');
        setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
      }
    );
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
             <h1>Cloudinary Media Library</h1>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Public ID</th>
            <th>Format</th>
            <th>URL</th>
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
            </tr>
          ))}
        </tbody>
      </table>

    </>
  )
}

export default App
