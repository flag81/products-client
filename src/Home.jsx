import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

function Home() {
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [addFavorite, setAddFavorite] = useState();

  const [userId, setUserId] = useState();

  const observerRef = useRef(null); // Reference for IntersectionObserver

  // Fetch stores and users when component mounts
  useEffect(() => {
    getStores();
    getUsers();
  }, []);

  
  const addProductToFavorites = async (userId, productId) => {

    initializeUser();

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

    try {
      console.log("Fetching products with:", { userId, storeId, isFavorite, onSale, pageParam });

      const response = await fetch(
        `http://localhost:3000/getProducts?userId=${encodeURIComponent(userId)}
        &page=${pageParam}
        &storeId=${encodeURIComponent(storeId)}
        &isFavorite=${encodeURIComponent(isFavorite)}
        &onSale=${encodeURIComponent(onSale)}`,
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
    queryKey: ["products", userId, selectedStore, isFavorite, onSale, addFavorite],
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
      { threshold: 1.0 }
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
        <h2>Filter Products</h2>
        <select name="store" onChange={(e) => setSelectedStore(e.target.value)}>
          <option value="">All Stores</option>
          {stores.map((store) => (
            <option key={store.storeId} value={store.storeId}>
              {store.storeName}
            </option>
          ))}
        </select>

        <select name="user" onChange={(e) => setSelectedUser(e.target.value)}>
          <option value="">All Users</option>
          {users.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.userName}
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
      </div>

      <div>
      <table border="1" cellPadding="10" cellSpacing="0">
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
                          style={{ display: 'block', margin: 'auto' }}
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
    </div>

      {/* 👇 Invisible div at the bottom to trigger fetching the next page */}
      <div ref={observerRef} style={{ height: "20px", margin: "10px 0" }}></div>

      {isFetching && !isFetchingNextPage && <p>Loading...</p>}
    </div>
  );
}

export default Home;
