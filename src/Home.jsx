import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { use } from "react";

import { Card, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';

function Home() {
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [addFavorite, setAddFavorite] = useState();

  const [userId, setUserId] = useState();

  const [searchKeyword, setSearchKeyword] = useState('');

  const observerRef = useRef(null); // Reference for IntersectionObserver

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');


  // use dotenv to get the node_url and node_port




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

  // Fetch stores and users when component mounts
  useEffect(() => {
    getStores();
    getUsers();
  }, []);

  
  const addProductToFavorites = async (userId, productId) => {

// how to make sure the initializeUser function is finished before calling the addProductToFavorites function

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

        // get the user id from the result and set it to the state

        setAddFavorite(productId);
        

        //getAllProducts(userId);
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

        // set the user id to the state

        console.log('initialize data.userId:', data.userId);

        setUserId(data.userId);

      } else {
        console.error('Failed to initialize user');
      }
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }

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
      setAddFavorite(0);
      //getAllProducts(userId);
    }
  }
  catch (error) {
    console.error('Error removing product from favorites:', error);
  }
};

  // ✅ 1. Fix the API function for useInfiniteQuery
  const getAllProducts = async ({ pageParam = 1, queryKey }) => {
    const [, userId, storeId, isFavorite, onSale] = queryKey; // Extract params

    if (!userId || userId === undefined) {
      await initializeUser();
    }

    try {
      console.log("Fetching products with:", { userId, storeId, isFavorite, onSale, pageParam });

      const response = await fetch(
        `${node_url}/getProducts?userId=${encodeURIComponent(userId)}
        &page=${pageParam}
        &storeId=${encodeURIComponent(storeId)}
        &isFavorite=${encodeURIComponent(isFavorite)}
        &onSale=${encodeURIComponent(onSale)}
        &keyword=${encodeURIComponent(searchKeyword)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch products");
      }

      return {
        products: result.data,
        nextPage: result.data.length > 0 ? pageParam + 1 : undefined, // If there are products, increment page
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  };

  // ✅ 2. Use `useInfiniteQuery` to handle infinite scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["products", userId, selectedStore, isFavorite, onSale, addFavorite, searchKeyword?.length > 2  ? searchKeyword : ""],
    queryFn: getAllProducts,
    getNextPageParam: (lastPage) => lastPage?.nextPage || undefined,
  });

  // ✅ 3. Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!observerRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage(); // Fetch next page when user reaches bottom
        }
      },
      { threshold: 0.9 }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect(); // Cleanup observer
  }, [fetchNextPage, hasNextPage]);

  // ✅ 4. Fetch stores and users
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

  // ✅ 5. Render UI
  return (
<div className="container">
      <InputGroup className="mb-3">
        <Form.Control
          type="text"
          placeholder="Kerko..."
          onKeyDown={(e) => { if (e.key === 'Enter') setSearchKeyword(e.target.value); }}
        />
        <Button variant="outline-secondary" onClick={() => setSearchKeyword('')}>Clear</Button>
      </InputGroup>

      <h2>Filter Products</h2>
      <Form.Group controlId="storeFilter" className="mb-3">
        <Form.Select onChange={(e) => setSelectedStore(e.target.value)}>
          <option value="">All Stores</option>
          {stores.map((store) => (
            <option key={store.storeId} value={store.storeId}>
              {store.storeName}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Check
        type="checkbox"
        label="Favorite"
        checked={isFavorite}
        onChange={(e) => setIsFavorite(e.target.checked)}
        className="mb-3"
      />

      <Form.Check
        type="checkbox"
        label="On Sale"
        checked={onSale}
        onChange={(e) => setOnSale(e.target.checked)}
        className="mb-3"
      />



      <Row xs={2} md={2} lg={4} className="g-4">
        {data?.pages.map((page, pageIndex) => (
          page.products.map((product, productIndex) => (
            <Col key={`${pageIndex}-${productIndex}`}>
              <Card className="h-100 p-1" >
                <Card.Img
                  variant="top"
                  src={`https://res.cloudinary.com/dt7a4yl1x/image/upload/w_auto,f_auto,q_auto/uploads/${product.image_url}`}
                  alt={product.product_description}
                  onClick={() =>
                    openModal(
                      `https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_600/uploads/${product.image_url}`
                    )
                  }
                  className = "p-0"
                  style={{ cursor: 'pointer',  padding: '0.5rem'  }}
                />
                <Card.Body>
                <Card.Text className="product-description">
  {product.product_description}
</Card.Text>
                  <Form.Check
                    type="checkbox"
                    label="Favorite"
                    checked={product.isFavorite}
                    onChange={(e) => {
                      if (e.target.checked) {
                        addProductToFavorites(userId, product.productId);
                      } else {
                        removeProductFromFavorites(userId, product.productId);
                      }
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
          ))
        ))}
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
              maxWidth: '90%',
              maxHeight: '90%',
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
    </div>
  );
}

export default Home;
