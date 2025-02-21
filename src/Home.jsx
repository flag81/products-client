import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { use } from "react";

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
      const response = await fetch('http://localhost:3000/initialize', { credentials: 'include' });
  
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
        `http://localhost:3000/getProducts?userId=${encodeURIComponent(userId)}
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
      const response = await fetch("http://localhost:3000/getStores");
      const result = await response.json();
      setStores(result);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const getUsers = async () => {
    try {
      const response = await fetch("http://localhost:3000/getUsers");
      const result = await response.json();
      setUsers(result);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // ✅ 5. Render UI
  return (
    <div style={{ margin: "0", padding: "0", width: "90vw" }}>
      <div>

      <input type="text" id="keyword_search" name="keyword_search" onKeyDown={(e) => { if (e.key === 'Enter') setSearchKeyword(e.target.value); }} />

      <button onClick={() => setSearchKeyword('')}>Clear</button>

        <h2>Filter Products</h2>
        <select name="store" onChange={(e) => setSelectedStore(e.target.value)}>
          <option value="">All Stores</option>
          {stores.map((store) => (
            <option key={store.storeId} value={store.storeId}>
              {store.storeName}
            </option>
          ))}
        </select>



        <label>
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
          />
          Favorite
        </label>

        <label>
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => setOnSale(e.target.checked)}
          />
          On Sale
          
        </label>
        <label>
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => setOnSale(e.target.checked)}
          />
          Active
        </label>
      </div>

      <div>
      <table border="0" cellPadding="10" cellSpacing="0">
        <tbody>
          {data?.pages.map((page, pageIndex) => (
            <>
              {page.products
                .reduce((rows, product, index) => {
                  // Start a new row every 5 products
                  if (index % 5 === 0) rows.push([]);
                  rows[rows.length - 1].push(product);
                  return rows;
                }, [])
                .map((row, rowIndex) => (
                  <tr key={`${pageIndex}-${rowIndex}`}>
                    {row.map((product) => (
                      <td key={product.productId} style={{ textAlign: 'center', verticalAlign: 'top' }}>
                        <img
                          src={`https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_200/uploads/${product.image_url}`}
                          alt="Product"
                          
                          style={{ display: 'block', margin: 'auto', cursor: 'pointer' }}
                          onClick={() =>
                            openModal(
                              `https://res.cloudinary.com/dt7a4yl1x/image/upload/c_thumb,w_600/uploads/${product.image_url}`
                            )
                          }
                        />
                        <div>{product.product_description}</div>
                        <div>
                          {product.storeName} -{' '}
                          {new Date(product.sale_end_date).toLocaleDateString('EN-UK')}
                        </div>
                        <div>
                          {product.old_price} - {product.new_price}
                        </div>
                        <div>
                          <input
                            type="checkbox"
                            checked={product.isFavorite}
                            onChange={(e) => {
                              if (e.target.checked) {
                                addProductToFavorites(userId, product.productId);
                              } else {
                                removeProductFromFavorites(userId, product.productId);
                              }
                            }}
                          />
                          <label>Favorite</label>
                        </div>
                      </td>
                    ))}
                    {/* Fill empty cells if row has less than 5 products */}
                    {row.length < 5 &&
                      [...Array(5 - row.length)].map((_, i) => (
                        <td key={`empty-${rowIndex}-${i}`}></td>
                      ))}
                  </tr>
                ))}
            </>
          ))}
        </tbody>
      </table>


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
              padding: '20px',
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
    objectFit: 'contain', // Ensures the image fits within the container without stretching
    maxWidth: '600px',    // Limits the maximum width to 600px
    maxHeight: '90vh',    // Ensures the image doesn't exceed the viewport height
    transition: 'transform 0.3s ease',  // Smooth transition for zoom effect
    cursor: 'zoom-in',   // Cursor changes to indicate zoom action
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'} // Zoom in on hover
  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}  // Reset zoom on mouse leave
/>
            <button
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
            </button>
          </div>

          </div>
      )}
        

    </div>

      {/* 👇 Invisible div at the bottom to trigger fetching the next page */}
      <div ref={observerRef} style={{ height: "20px", margin: "10px 0" }}></div>

      {isFetching && !isFetchingNextPage && <p>Loading...</p>}
    </div>
  );
}

export default Home;
