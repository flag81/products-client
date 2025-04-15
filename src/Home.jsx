import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { use } from "react";

import RegistrationModal from "./RegistrationModal";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

// import image in the current directory

// i get error [plugin:vite:import-analysis] Failed to resolve import "./star-full.jpg" from "src/Home.jsx". Does the file exist

import Card from 'react-bootstrap/Card';

function Home({mode}) {
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [addFavorite, setAddFavorite] = useState();

  const[isFavoriteProduct, setIsFavoriteProduct] = useState(false);

  const [userId, setUserId] = useState();

  const [email, setEmail] = useState('');

  const [searchKeyword, setSearchKeyword] = useState('');

  const observerRef = useRef(null); // Reference for IntersectionObserver

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');

  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [start, setStar] = useState('star-empty.jpg');

  const [allProducts, setAllProducts] = useState([]); // Initialize with your product list

  const CLOUD_NAME = 'dt7a4yl1x';

  const width = 200;
  const width2 = 600; // Set the width for the second image
  var baseUrl = "https://res.cloudinary.com/dt7a4yl1x/image/upload";
  const transformation = `w_${width},c_scale`;
  const transformation2 = `w_${width2},c_scale`;
  const directory = "uploads";

  // use dotenv to get the node_url and node_port

  const [favoriteProductId, setFavoriteProductId] = useState(0);

  const node_url = import.meta.env.VITE_NODE_URL;
  const node_port = import.meta.env.VITE_NODE_PORT;

  console.log(`Node URL: ${node_url}`);
  console.log(`Node Port: ${node_port}`);

  const openModal = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImageUrl('');
  };

  // add usereffect when the searchkeyword changes

  // Fetch user session on page load
  useEffect(() => {
    checkUserSession();
  }, []);

  useEffect(() => {
    console.log('Search keyword changed:', searchKeyword);
  }
  , [searchKeyword]);

  useEffect(() => { 
    console.log('User ID changed:', userId);
    if (userId) {
      getAllProducts(userId);
    }
  }, [userId]);

  useEffect(() => {
    // Check if Apple SDK is already loaded
    if (!document.getElementById("apple-signin-sdk")) {
        const script = document.createElement("script");
        script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
        script.id = "apple-signin-sdk";
        script.async = true;
        script.onload = () => console.log("✅ Apple SDK Loaded");
        document.body.appendChild(script);
    }
}, []);

  // Fetch stores and users when component mounts
  useEffect(() => {
    getStores();
    getUsers();
  }, []);

  const signInWithApple = () => {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_APPLE_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_APPLE_CALLBACK_URL,
      response_type: "code",
      scope: "name email",
      response_mode: "form_post",
    });
  
    window.location.href = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  };

  const handleAppleLogin = async () => {
    try {
        // Ensure Apple SDK is loaded
        if (!window.AppleID || !window.AppleID.auth) {
            console.error("❌ Apple SDK is not loaded.");
            return;
        }

        // Configure AppleID settings
        window.AppleID.auth.init({
            clientId: import.meta.env.VITE_APPLE_CLIENT_ID, // Ensure this matches Apple Developer Console
            scope: "email name",
            redirectURI: import.meta.env.VITE_APPLE_CALLBACK_URL, // Ensure it's the correct callback
            usePopup: true, // Avoids redirection
        });

        // Start Apple login process
        const response = await window.AppleID.auth.signIn();
        console.log("🍏 Apple Sign-In Response:", response);

        const idToken = response.authorization.id_token;

        // Send ID token to backend
        const res = await fetch(`${import.meta.env.VITE_NODE_URL}/auth/apple/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: idToken }),
            credentials: "include",
        });
        
        const data = await res.json();
        console.log("✅ Apple Login Success:", data);
        setIsLoggedIn(true);
        window.location.href = `${import.meta.env.VITE_NODE_URL}?loginSuccess=true`;
    } catch (error) {
        console.error("❌ Apple Login Error:", error);
    }
  };

  const checkUserSession = async () => {
    try {
        const response = await fetch(`${node_url}/check-session`, { credentials: "include" });
        const data = await response.json();

        if (data.isLoggedIn) {
            setUserId(data.userId);
            setEmail(data.email);
            setIsLoggedIn(true);
            console.log("✅ User session active:", data.userId);
        } else {
            setUserId(1000000);
            setIsLoggedIn(false);
            console.log("⚠️ No active session found.");
        }
    } catch (error) {
        console.error("Error checking user session:", error);
    }
};

const addProductToFavorites = async (userIs, productId, isFavorite) => {
    console.log('Adding product to favorites...', userId, productId);
    if (!isLoggedIn) {
      setShowRegisterModal(true);
      console.log('User not logged in...showing registration modal');
      return;
    }

    try {
      const response = await fetch(`${node_url}/addFavorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, productId }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Product added to favorites:", result);
        setFavoriteProductId(productId);
        setIsFavoriteProduct(true);
      }
    } catch (error) {
      console.error("Error adding product to favorites:", error);
    }
};

const logout = async () => {
    try {
      await fetch(`${node_url}/logout`, { credentials: "include" });
      setUserId(null);
      console.log("User logged out");
      setIsLoggedIn(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
};

const addProductToFavorites2 = async (userId, productId) => {
    await initializeUser();
    console.log('Adding product to favorites...');
    console.log('userId:', userId);
    console.log('productId:', productId);

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
        setAddFavorite(productId);
      }
    }
    catch (error) {
      console.error('Error adding product to favorites:', error);
    }
};

async function initializeUser() {
    console.log('Initializing user...');  
    try {
      const response = await fetch(`${node_url}/initialize`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        console.log('User initialized:', data);
        console.log('initialize data.userId:', data.userId);
      } else {
        console.error('Failed to initialize user');
      }
    } catch (error) {
      console.error('Error during initialization:', error);
    }
}

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
      setAddFavorite(0);
      setIsFavoriteProduct(false);
    }
  }
  catch (error) {
    console.error('Error removing product from favorites:', error);
  }
};

const getAllProducts = async ({ pageParam = 1, queryKey }) => {
  console.log('getAllProducts called with:', queryKey);
  const [, userId, storeId, isFavorite, onSale] = queryKey;
  let finalUserId = userId;
  if (!finalUserId || finalUserId === undefined) {
      const session = await checkUserSession();
      if (!session.loggedIn) {
          console.warn("User not logged in, waiting for login...");
          return { products: [], nextPage: undefined };
      }
      finalUserId = session.userId;
  }

  try {
      console.log("Fetching products with:", { finalUserId, storeId, isFavorite, onSale, pageParam });
      const response = await fetch(
          `${node_url}/getProducts?userId=${encodeURIComponent(finalUserId)}
          &page=${pageParam}
          &storeId=${encodeURIComponent(storeId)}
          &isFavorite=${encodeURIComponent(isFavorite)}
          &onSale=${encodeURIComponent(onSale)}
          &keyword=${encodeURIComponent(searchKeyword)}`.replace(/\s+/g, ""),
          {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
          }
      );

      const result = await response.json();
      console.log("Products fetched:", result);

      if (!response.ok) {
          throw new Error(result.message || "Failed to fetch products");
      }

      return {
          products: result.data,
          nextPage: result.data.length > 0 ? pageParam + 1 : undefined,
      };
  } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
  }
};



const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ["products", userId, selectedStore, isFavorite, onSale, addFavorite , searchKeyword?.length > 2  ? searchKeyword : ""],
  queryFn: getAllProducts,
  getNextPageParam: (lastPage) => lastPage?.nextPage || undefined,
});

useEffect(() => {
  if (!observerRef.current || !hasNextPage) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    },
    { threshold: 0.9 }
  );

  observer.observe(observerRef.current);

  return () => observer.disconnect();
}, [fetchNextPage, hasNextPage]);

const getStores = async () => {
  try {
    const response = await fetch(`${node_url}/getStores` );
    const result = await response.json();
    setStores(result);
  } catch (error) {
    console.error("Error fetching stores:", error);
  }
};

const getUsers = async () => {
  try {
    const response = await fetch(`${node_url}/getUsers`);
    const result = await response.json();
    setUsers(result);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

const handleButtonClick = (newKeyword) => {
  console.log('Button clicked:', newKeyword);
  setSearchKeyword(newKeyword);
};

return (
  <div className="container">
    <div></div>

    {isLoggedIn ? 
      <p>Miresevini! {email}</p>           
      :  
      <Container>
        <Row className="mb-3 justify-content-center align-items-center">
          <Col xs={12}>
            <InputGroup>
              <Button
                className="responsive-button" 
                onClick={() =>
                  (window.location.href = `${node_url}/auth/google`)
                }
              >
                Login Google
              </Button>
              <Button className="responsive-button"  onClick={signInWithApple}>Login Apple</Button>
              <Button className="responsive-button" onClick={signInWithApple}>Regjistohu</Button>
            </InputGroup>
          </Col>
        </Row>
      </Container>
    }

    <Container>
      {/* Search Input Group */}
      <Row className="mb-3">
        <Col xs={12} md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Kerko produkte..."
              className="me-2 flex-grow-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearchKeyword(e.target.value);
              }}
            />
            <Button
              className="responsive-button"
              onClick={(e) =>
                handleButtonClick(e.target.previousSibling.value)
              }
            >
              Kerko
            </Button>
          </InputGroup>
        </Col>
      </Row>

      {/* Store Filter */}
      <Row className="mb-3">
        <Col xs={12} md={6}>
          <Form.Group controlId="storeFilter">
            <Form.Select onChange={(e) => setSelectedStore(e.target.value)}>
              <option value="">Te gjitha dyqanet</option>
              {stores.map((store) => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* User Filter (Checkboxes) */}
      <Row className="mb-3">
        <Col xs={12}>
          <Form.Group controlId="userFilter">
            <div className="d-flex flex-row flex-md-row gap-2 justify-content-between"
              style={{ width: '50%' }}
            >
              {/* Favoritet toggle */}
              <div
                role="button"
                className="d-flex flex-column align-items-center"
                onClick={() => setIsFavorite((prev) => !prev)}
              >
                <img
                  src={
                    isFavorite
                      ? "/star-fill.jpg"
                      : "/star-empty.jpg"
                  }
                  alt="Favoritet"
                  style={{ width: "32px", height: "32px", cursor: "pointer" }}
                />
                <span style={{ fontSize: '10px' }}>Favoritet</span>
              </div>

              {/* Ne Zbritje toggle */}
              <div
                role="button"
                className="d-flex flex-column align-items-center"
                onClick={() => setOnSale((prev) => !prev)}
              >
                <img
                  src={
                    onSale
                      ? "/sale-fill.jpg"
                      : "/sale-empty.jpg"
                  }
                  alt="Ne Zbritje"
                  style={{ width: "32px", height: "32px", cursor: "pointer" }}
                />
                <span style={{ fontSize: '10px' }}>Ne Zbritje</span>
              </div>
            </div>
          </Form.Group>
        </Col>
      </Row>
    </Container>

    <Row xs={2} md={2} lg={4} className="g-4">
      {data?.pages.map((page, pageIndex) =>
        page.products.map((product, productIndex) => (
          <Col key={`${pageIndex}-${productIndex}`}>
            <Card className="h-100 p-1">
              <Card.Img
                variant="top"
                src={`${baseUrl}/${transformation}/${directory}/${product.image_url.split('/').pop()}`}
                alt={product.product_description}
                onClick={() =>
                  openModal(
                    `${baseUrl}/${transformation2}/${directory}/${product.image_url.split('/').pop()}`
                  )
                }
                className="p-0"
                style={{ cursor: 'pointer', padding: '0.5rem' }}
              />
              <Card.Body>
                <Card.Text className="product-description">
                  {product.product_description}
                </Card.Text>
                <Card.Text className="product-description">
                  {product.old_price}eu - {product.new_price}eu
                </Card.Text>

                <img
                  id={product.productId}
                  src={product.isFavorite ? 'star-fill.jpg' : 'star-empty.jpg'}
                  alt={product.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={() => {
                    if (product.isFavorite) {
                      removeProductFromFavorites(userId, product.productId, product.isFavorite);
                    } else {
                      addProductToFavorites(userId, product.productId, product.isFavorite);
                    }
                  }}
                  style={{ cursor: 'pointer', width: '24px', height: '24px', marginRight: '20px' }}
                />

                <img
                  src={product.onSale ? 'sale-full.jpg' : 'sale-empty.jpg'}
                  alt={product.onSale ? 'On sale' : 'Not on sale'}
                  style={{ cursor: 'pointer', width: '24px', height: '24px' }}
                />
              </Card.Body>
            </Card>
          </Col>
        ))
      )}
    </Row>

    {/* Modal logic for image preview */}
    {isModalOpen && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={closeModal}
      >
        <div
          style={{
            position: 'relative',
            backgroundColor: '#fff',
            padding: '10px',
            borderRadius: '8px',
            maxWidth: '95%',
            maxHeight: '95%',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={modalImageUrl}
            alt="Product Modal"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'contain',
              maxWidth: '600px',
              maxHeight: '90vh',
              cursor: 'zoom-in',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
          <Button
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'red',
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
            onClick={closeModal}
          >
            X
          </Button>
        </div>
      </div>
    )}

    <div ref={observerRef} style={{ height: '20px', margin: '10px 0' }}></div>

    {isFetching && !isFetchingNextPage && <p>Loading...</p>}

    <RegistrationModal
      show={showRegisterModal}
      setShowRegisterModal={setShowRegisterModal}
      setUserId={setUserId}
      setIsLoggedIn={setIsLoggedIn}
      setEmail={setEmail}
    />
  </div>
);
}

export default Home;
