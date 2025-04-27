import React, { useState, useEffect, useRef } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import RegistrationModal from "./RegistrationModal";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";

function Home({ mode }) {
  // ─── State & Refs ─────────────────────────────────────────────────────────────
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const observerRef = useRef(null);

  // ─── Config ───────────────────────────────────────────────────────────────────
  const node_url = import.meta.env.VITE_NODE_URL;
  const baseUrl = "https://res.cloudinary.com/dt7a4yl1x/image/upload";
  const transformation = `w_200,c_scale`;
  const transformation2 = `w_600,c_scale`;
  const directory = "uploads";

  // ─── React Query Setup ─────────────────────────────────────────────────────────
  const queryClient = useQueryClient();
  const productsQueryKey = [
    "products",
    userId,
    selectedStore,
    isFavorite,
    onSale,
    searchKeyword?.length > 2 ? searchKeyword : "",
  ];

  // Infinite‐scroll query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: productsQueryKey,
    queryFn: getAllProducts,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // add func to chech if user is logged in before toggle favorite by checking the variable isLoggedIn

  // Check if user is logged in before allowing to toggle favorite

  const handleToggleFavorite = (productId, isFav) => {
    if (!isLoggedIn) {
      setShowRegisterModal(true);
      return;
    }
    toggleFavMutation.mutate({ productId, isFav });
  }

 const handleLogin = () => {

  // ─── Mutations ────────────────────────────────────────────────────────────────

  // ─── Mutations ────────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    setShowRegisterModal(true);
    return;
  }

 }







  // Optimistic toggle‐favorite mutation
  const toggleFavMutation = useMutation({


    mutationFn: async ({ productId, isFav }) => {
      const url = isFav ? "/removeFavorite" : "/addFavorite";
      const method = isFav ? "DELETE" : "POST";
      const res = await fetch(`${node_url}${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, productId }),
      });
      if (!res.ok) throw new Error("Network error");
      return res.json();
    },
    onMutate: async ({ productId, isFav }) => {
      await queryClient.cancelQueries({ queryKey: productsQueryKey });
      const previous = queryClient.getQueryData(productsQueryKey);
      queryClient.setQueryData(
        { queryKey: productsQueryKey },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              products: page.products.map((p) =>
                p.productId === productId
                  ? { ...p, isFavorite: !isFav }
                  : p
              ),
            })),
          };
        }
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          { queryKey: productsQueryKey },
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });

  // ─── Data‐fetchers & Helpers ───────────────────────────────────────────────────
  async function getAllProducts({ pageParam = 1, queryKey }) {
    const [, uId, storeId, fav, sale] = queryKey;
    const url = `${node_url}/getProducts?userId=${encodeURIComponent(
      uId
    )}&page=${pageParam}&storeId=${encodeURIComponent(
      storeId
    )}&isFavorite=${encodeURIComponent(
      fav
    )}&onSale=${encodeURIComponent(sale)}&keyword=${encodeURIComponent(
      searchKeyword
    )}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to fetch products");

    console.log("Fetched products:", json.data); // ✅ Debugging log

    return {
      products: json.data,
      nextPage: json.data.length > 0 ? pageParam + 1 : undefined,
    };
  }

  const openModal = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalImageUrl("");
  };

  const checkUserSession = async () => {
    try {
      const response = await fetch(`${node_url}/check-session`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.isLoggedIn) {
        setUserId(data.userId);
        setEmail(data.email);
        setIsLoggedIn(true);
      } else {
        setUserId(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking session:", error);
    }
  };

  const getStores = async () => {
    try {
      const response = await fetch(`${node_url}/getStores`);
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
      if (!window.AppleID || !window.AppleID.auth) {
        console.error("Apple SDK not loaded");
        return;
      }
      window.AppleID.auth.init({
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
        scope: "email name",
        redirectURI: import.meta.env.VITE_APPLE_CALLBACK_URL,
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const idToken = response.authorization.id_token;
      const res = await fetch(`${node_url}/auth/apple/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
        credentials: "include",
      });
      const data = await res.json();
      setIsLoggedIn(true);
      window.location.href = `${node_url}?loginSuccess=true`;
    } catch (error) {
      console.error("Apple Login Error:", error);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${node_url}/logout`, { credentials: "include" });
      setUserId(null);
      setIsLoggedIn(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    checkUserSession();
    getStores();
    getUsers();
  }, []);

  useEffect(() => {
    if (!observerRef.current || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.9 }
    );
    obs.observe(observerRef.current);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage]);

  const handleSearch = (value) => setSearchKeyword(value);

  const allProducts = data?.pages.flatMap(p => p.products) ?? [];
const count       = allProducts.length;
const lgCols      = count >= 4 ? 4 : count || 1;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (

    <div
  className="parent-container"
  style={{
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start", // Aligns child elements to the top
    alignItems: "center", // Centers the content horizontally
    height: "100vh", // Ensures the parent takes the full viewport height
    padding: "1rem", // Adds padding for better spacing
  }}
>
    <div className="container" 
    
    style={{
      width: "100%", // Ensures the container takes the full width
      maxWidth: "1200px", // Limits the maximum width for better readability
      marginTop: 0, // Ensures no extra margin at the top
      position: "relative", // Optional: Ensures proper positioning
      top: 0, // Aligns the container to the top
    }}
    
    >
      
      <Container>

      <div
        role="button" 
        
       className="d-flex flex-row align-items-center justify-content-between"
        
      >

<img
                  src={"/logo3.jpg"}
                  alt="Meniven.com"
                  style={{ width: 50, cursor: "pointer", margin: 5 }}
                />


<div className="d-flex flex-column align-items-center"

onClick={() => handleLogin()}

>
<img
          src={"/profile.png"}
          alt="Profile"
          style={{ width: 32, height: 32 }}
        />


   <span style={{fontSize: 10 }}>
     { email ? email : "Hyrja" }
    
    </span>  

</div>
        


      </div>
        
      </Container>

<Container>
  {/* Search and Store Filter */}
  <Row className="mb-3 d-flex d-md-flex flex-column flex-md-row align-items-center">
    {/* Search */}
    <Col xs={12} md={6} className="mb-3 mb-md-0 d-flex align-items-center justify-content-between">



      <InputGroup>
        <Form.Control
          type="text"
          maxLength={20}
          placeholder="Kerko produkte..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(e.target.value);
          }}
        />
        <Button
          className="responsive-button"
          onClick={(e) => handleSearch(e.target.previousSibling.value)}
          style={{ marginLeft: 5 }}
        >
          Kerko
        </Button>
      </InputGroup>
    </Col>

    {/* Store Filter */}
    <Col xs={12} md={6} className="d-flex align-items-center justify-content-between">

<br />
                <div style={{marginRight:5, fontSize: 10}}>
                <img
                  src={"/filter.png"}
                  alt="Meniven.com"
                  style={{ width: 30, cursor: "pointer", marginRight: 0 }}
                />
                  
                  Filtro </div>

      <Form.Select
        style={{ width: "50%" }}
        onChange={(e) => setSelectedStore(e.target.value)}
      >
        <option value="">Dyqanet</option>
        {stores.map((store) => (
          <option key={store.storeId} value={store.storeId}>
            {store.storeName}
          </option>
        ))}
      </Form.Select>

      <div className="d-flex flex-row align-items-center justify-content-between" style={{ width: "40%" }}>

      <div 
        role="button"
        className="d-flex flex-column align-items-center justify-content-between"
        style={{ width: "40%" }}
        onClick={() => setIsFavorite((prev) => !prev)}
      >
        <img
          src={isFavorite ? "/star-fill-2.png" : "/star-empty.jpg"}
          alt="Favoritet"
          style={{ width: 32, height: 32 }}
        />
        <span style={{ fontSize: 10 }}>Favoritet</span>
      </div>
      <div
        role="button" 
        className="d-flex flex-column align-items-center "
        onClick={() => setOnSale((prev) => !prev)}
      >
        <img
          src={onSale ? "/sale-fill-2.png" : "/sale-empty.jpg"}
          alt="Ne Zbritje"
          style={{ width: 32, height: 32, cursor: "pointer" }}
        />
        <span style={{ fontSize: 10 }}>Zbritjet</span>
      </div>


      </div>
    </Col>
  </Row>
</Container>



{data?.pages[0].products.length === 0 && (

  <div className="text-center">

    <h4 style={{ marginTop: 20 }}>
      Nuk u gjenden produkte.
    </h4>
  </div>
)}


      {/* Products */}

     
        <Row 

xs={2}
sm={2}
md={2}
lg={lgCols}
        
        
        
        
        className="g-4 justify-content-start">
          {data?.pages.map((page, pi) =>
            page.products.map((product, idx) => (
          <Col key={`${pi}-${idx}`} className="d-flex">
            <Card className="h-100 p-1">
            <div style={{ position: "relative", display: "inline-block" }}>
              <Card.Img
            variant="top"
            src={`${baseUrl}/${transformation}/${directory}/${product.image_url
              .split("/")
              .pop()}`}
            alt={product.product_description}
            onClick={() =>
              openModal(
                `${baseUrl}/${transformation2}/${directory}/${product.image_url
              .split("/")
              .pop()}`
              )
            }
            style={{ cursor: "pointer", padding: "0.5rem" }}
              />
                <img
    src="/loop.png" // Replace with your overlay image path
    alt="Overlay"
    style={{
      position: "absolute",
      top: "10px", // Adjust as needed
      right: "10px", // Adjust as needed

      cursor: "pointer",
    }}
    onClick={() => console.log("Overlay clicked")} // Optional: Add click functionality
  />
              </div>
              <Card.Body>
            <Card.Text className="product-description">
              {product.product_description}
            </Card.Text>
            <Card.Text className="product-description">
              {product.old_price}€ - {product.new_price}€
            </Card.Text>
            <Card.Text className="sale-date">
              {product.sale_end_date ? (
                <>Deri me: 
              {new Date(product.sale_end_date).toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                }
              )}
              <br />
                </>
              ) : null}
            </Card.Text>

            {/* Favorite toggle */}
                  <img
                    src={product.isFavorite ? "star-fill-2.png" : "star-empty.jpg"}
                    alt={product.isFavorite ? "Unfavorite" : "Favorite"}
                    style={{
                      cursor: "pointer",
                      width: 24,
                      height: 24,
                      marginRight: 20,
                    }}
                    onClick={() =>
                      handleToggleFavorite(product.productId, product.isFavorite)
                    }
                  />

                  {/* Sale icon */}
                  <img
                    src={product.productOnSale ? "sale-fill-2.png" : "sale-empty.jpg"}
                    alt={product.productOnSale ? "On sale" : "Not on sale"}
                    style={{ cursor: "pointer", width: 24, height: 24 }}
                  />
                </Card.Body>
              </Card>
            </Col>




          ))
        )}



      </Row>

      {/* Image Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 8,
              maxWidth: "95%",
              maxHeight: "95%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalImageUrl}
              alt="Product Modal"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                maxWidth: 600,
                maxHeight: "90vh",
                cursor: "zoom-in",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.3)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
            <Button
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "red",
                color: "#fff",
                border: "none",
                width: 40, // Set a fixed width
                height: 40, // Set a fixed height
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%", // Ensure it's square
                cursor: "pointer",
              }}
              onClick={closeModal}
            >
              X
            </Button>
          </div>
        </div>
      )}

      <div ref={observerRef} style={{ height: 20, margin: "10px 0" }} />
      {isFetching && !isFetchingNextPage && <p>Duke ngarkuar...</p>}

      <RegistrationModal
        show={showRegisterModal}
        setShowRegisterModal={setShowRegisterModal}
        setUserId={setUserId}
        setIsLoggedIn={setIsLoggedIn}
        setEmail={setEmail}
      />
    </div>

    </div>
  );
}

export default Home;
