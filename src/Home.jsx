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
import Placeholder from "react-bootstrap/Placeholder";
import Toast from 'react-bootstrap/Toast';




function Home({ mode }) {
  // ─── State & Refs ─────────────────────────────────────────────────────────────
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedStoreName, setSelectedStoreName] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); // NEW: Track registration status  
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const observerRef = useRef(null);

  const [modalProduct, setModalProduct] = useState({});


  const [activeFilters, setActiveFilters] = useState([]);


  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const [isCardImageLoaded, setIsCardImageLoaded ] = useState(false);

  const autoTransformation = "f_auto,q_auto,dpr_auto";

  // ─── Config ───────────────────────────────────────────────────────────────────
  const node_url = import.meta.env.VITE_NODE_URL;
  const baseUrl = "https://res.cloudinary.com/dt7a4yl1x/image/upload";
  const transformation = `w_300,c_scale`;
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

  

  // // Infinite‐scroll query
  // const {
  //   data,
  //   fetchNextPage,
  //   hasNextPage,
  //   isFetching,
  //   isFetchingNextPage,
  // } = useInfiniteQuery({
  //   queryKey: productsQueryKey,
  //   queryFn: getAllProducts,
  //   getNextPageParam: (lastPage) => lastPage.nextPage,
  // });

    // --- Data Fetching ---
    const {
      data,
      fetchNextPage,
      hasNextPage,
      isFetching,
      isFetchingNextPage,
      isLoading, // Added for initial load state
      error, // Added for error handling
    } = useInfiniteQuery({
      queryKey: productsQueryKey,
      queryFn: getAllProducts,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      enabled: !!userId || userId === null, // Fetch initially even if userId is null (for truly anon), refetch when userId changes
      // Consider staletime if needed
    });

  // add func to chech if user is logged in before toggle favorite by checking the variable isLoggedIn

  // Check if user is logged in before allowing to toggle favorite

  // MODIFIED: Handle favorite toggle click
  const handleToggleFavorite = async (productId, productIsCurrentlyFavorite) => {




    console.log("[DEBUG] handleToggleFavorite called, " + productId + " " + productIsCurrentlyFavorite);

    if (!userId) {
      // If no userId (neither anonymous nor registered), prompt to register/initialize
      console.log("[DEBUG] No userId, initializing anonymous session...");
      //setShowRegisterModal(true); // Or trigger initialization first?
      //return;
      await initializeAnonymousSession();
    }
    // If userId exists (anonymous or registered), proceed with mutation
    console.log(`[DEBUG] User ${userId} attempting to toggle favorite for product ${productId}`);
    toggleFavMutation.mutate({ productId, productIsCurrentlyFavorite });


    console.log("[DEBUG] Toggling favorite for product:", productId, modalProduct.productId);

      // Refetch the updated product data and update the modal
  if (modalProduct.productId === productId) {

    console.log("[DEBUG] Modal product ID matches, refetching product data...");

 
    setModalProduct((prev) => ({
      ...prev,
      isFavorite: !prev.isFavorite,
    }));



  }
  };

    // MODIFIED: Handle actions requiring registration
    const handleLoginOrRegisterPrompt = () => {
      if (!isRegistered) { // Prompt only if not fully registered
           console.log("[DEBUG] User not registered, showing registration modal.");
           setShowRegisterModal(true);
      } else {
          console.log("[DEBUG] User is already registered.");
          // Optionally navigate to profile or perform another action
      }
  };


  // DEBUG: log whenever modal opens, URL changes or load flag changes
useEffect(() => {
  console.log("[DEBUG] Modal Open:", isModalOpen);
  console.log("[DEBUG] Modal image URL:", modalImageUrl);
  console.log("[DEBUG] isImageLoaded:", isImageLoaded);
}, [isModalOpen, modalImageUrl, isImageLoaded]);

 const handleLogin = () => {

  // ─── Mutations ────────────────────────────────────────────────────────────────

  // ─── Mutations ────────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    setShowRegisterModal(true);
    return;
  }

 }





 const addOrReplaceFilter = (filter) => {
  const filterType = filter.split(":")[0].trim(); // Extract the filter type (e.g., "Keyword", "Store")
  setActiveFilters((prevFilters) => {
    // Remove existing filter of the same type
    const updatedFilters = prevFilters.filter((f) => !f.startsWith(filterType));
    // Add the new filter
    return [...updatedFilters, filter];
  });
};


    // Function to remove a filter
    const removeFilter = (filter) => {
      setActiveFilters(activeFilters.filter((f) => f !== filter));
      // Reset the corresponding filter logic
      if (filter === `Keyword: "${searchKeyword}"`) {
        setSearchKeyword(""); // Reset keyword
        // clear the input field search id
        document.getElementById("search").value = "";
      } else if (filter === "Favorites") {
        setIsFavorite(false); // Reset favorites
      } else if (filter === "On Sale") {
        setOnSale(false); // Reset on sale
      } else if (filter.startsWith("Store: ")) {
        setSelectedStore(0); // Reset store dropdown
        //set the store dropdown to the first option
        document.getElementById("store").value = 0;
      }
    };


    useEffect(() => {
      if (isFavorite === true) {
        addOrReplaceFilter("Favorites");
        console.log("[DEBUG] Favorites filter added");
      } else if (isFavorite === false) {
        removeFilter("Favorites");
        console.log("[DEBUG] Favorites filter removed");
      }
    
      if (onSale === true) {
        addOrReplaceFilter("On Sale");
        console.log("[DEBUG] On Sale filter added");
      } else if (onSale === false) {
        removeFilter("On Sale");
        console.log("[DEBUG] On Sale filter removed");
      }
    
      if (selectedStore) {
        addOrReplaceFilter("Store");
        console.log("[DEBUG] Store filter added");
      } else {
        removeFilter("Store");
        console.log("[DEBUG] Store filter removed");
      }
    }, [isFavorite, onSale, selectedStore]);


useEffect(() => {

console.log("[DEBUG] Active Filters:", activeFilters);

}, [activeFilters]);

  // Optimistic toggle‐favorite mutation
  const toggleFavMutation = useMutation({

  


    mutationFn: async ({ productId, productIsCurrentlyFavorite }) => {

      
      const url = productIsCurrentlyFavorite ? "/removeFavorite" : "/addFavorite";

      console.log("[DEBUG] Toggle favorite mutation called");

      console.log("[DEBUG] function called:", url);

      console.log("[DEBUG] isFav:", productIsCurrentlyFavorite);
      console.log("[DEBUG] productId:", productId);
  

      const method = productIsCurrentlyFavorite ? "DELETE" : "POST";
      const res = await fetch(`${node_url}${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, productId }),
      });
      if (!res.ok) throw new Error("Network error");
      return res.json();
    },
    onMutate: async ({ productId, productIsCurrentlyFavorite }) => {
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
                  ? { ...p, isFavorite: !productIsCurrentlyFavorite }
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


    // Fetch products function (pass all query key parts for clarity)
    async function getAllProducts({ pageParam = 1, queryKey }) {
      const [, currentUserId, storeId, favFilter, saleFilter, keyword] = queryKey;
      // Construct URL, pass userId if available
      const url = new URL(`${node_url}/getProducts`);
      url.searchParams.append('page', pageParam);
      if (currentUserId) {
          url.searchParams.append('userId', currentUserId);
      }
      if (storeId) {
          url.searchParams.append('storeId', storeId);
      }
      if (favFilter) { // Send the favorite filter parameter only if it's true
          url.searchParams.append('isFavorite', 'true');
      }
       if (saleFilter) {
          url.searchParams.append('onSale', 'true');
      }
      if (keyword) {
          url.searchParams.append('keyword', keyword);
      }
  
      console.log(`[DEBUG] Fetching products with URL: ${url.toString()}`);
  
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important to send the jwt cookie
      });
  
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to fetch products" }));
        console.error("[ERROR] Fetching products failed:", res.status, errorData);
        throw new Error(errorData.message || `HTTP error ${res.status}`);
      }
  
      const json = await res.json();
      console.log("[DEBUG] Fetched products:", json);
      console.log("[DEBUG] Fetched products page", pageParam, ":", json.data?.length);
  
      return {
        products: json.data || [], // Ensure products is always an array
        nextPage: json.nextPage, // Use nextPage directly from backend
      };
    }

  const openModal = (imageUrl, product) => {
    console.log("[DEBUG] openModal()", imageUrl);
    console.log("[DEBUG] setModalImageUrl()", modalImageUrl);
    setModalImageUrl(false);
    setIsImageLoaded(false); // Reset the loaded state when opening the modal
    console.log("[DEBUG] setModalImageUrl()", modalImageUrl);
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);

    setModalProduct(product);
    console.log("[DEBUG] setModalProduct()", product);

  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalImageUrl(false);
  };

    // --- Check User Session ---
    const checkUserSession = async () => {
      console.log("[DEBUG] checkUserSession called");
      try {
        // Use the /auth/check-session endpoint
        const response = await fetch(`${node_url}/check-session`, {
          credentials: "include", // Send cookies
        });
        const data = await response.json();
        console.log("[DEBUG] /check-session response:", data);
  
        if (data.isLoggedIn) { // isLoggedIn means a valid userId exists
          setUserId(data.userId); // Set userId (can be anonymous or registered)
          setIsRegistered(!!data.isRegistered); // Update registration status
          setEmail(data.email || ""); // Set email if available
        } else {
          // No valid session, potentially first visit or expired token
          setUserId(null);
          setIsRegistered(false);
          setEmail("");
          // Attempt to initialize an anonymous session if no userId yet
          if (!userId) { // Avoid loop if already tried initializing
              console.log("[DEBUG] No user ID found, calling /initialize...");
              initializeAnonymousSession();
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setUserId(null); // Reset on error
        setIsRegistered(false);
        setEmail("");
      }
    };



       // --- Initialize Anonymous Session ---
   const initializeAnonymousSession = async () => {
    try {
        const response = await fetch(`${node_url}/initialize`, {
             method: 'GET', // Or POST if needed
             credentials: 'include'
         });
         const data = await response.json();
         if (response.ok && data.userId) {
             console.log("[DEBUG] Anonymous session initialized, userId:", data.userId);
             // Set the user ID, but mark as not registered
             setUserId(data.userId);
             //setIsRegistered(false);
             //setEmail("");
             // Optionally refetch data if needed now that userId is set
             // queryClient.invalidateQueries({ queryKey: ['products'] });
         } else {
             console.error("[ERROR] Failed to initialize anonymous session:", data.message);
         }
     } catch (error) {
         console.error("Error initializing anonymous session:", error);
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
    //getUsers();
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
 
  style={{
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start", // Aligns child elements to the top
    alignItems: "center", // Centers the content horizontally
    height: "100vh", // Ensures the parent takes the full viewport height
    //padding: "1rem", // Adds padding for better spacing
    //border: "1px solid #ccc", // Optional: Adds a border for better visibility
    flexShrink: 0, // Prevents the container from shrinking
    minWidth: "100%", // Ensures the container takes the full width
    boxSizing: "border-box", // Includes padding and border in width calculation
    //border: "1px solid #ccc",


  }}
>
    <div className="container" 
    
    style={{
      width: "100%", // Ensures the container takes the full width
      maxWidth: "1200px", // Limits the maximum width for better readability
      marginTop: 0, // Ensures no extra margin at the top
      position: "relative", // Optional: Ensures proper positioning
      top: 0, // Aligns the container to the top
      // add border to this div 
      //border: "1px solid #ccc", // Optional: Adds a border for better visibility
      flexShrink: 0, // Prevents the container from shrinking
      minWidth: "100%",
      boxSizing: "border-box",

    }}
    
    >
      
      <Container>

      <div
        role="button" 
        
       className="d-flex flex-row align-items-center justify-content-between"
        
      >

<img
                  src={"/logo.png"}
                  alt="Meniven.com"
                  style={{ width: 150, cursor: "pointer", margin: 5 }}
                />


<div className="d-flex flex-column align-items-center"

onClick={() => handleLogin()}

>
{/* <img
          src={"/profile.png"}
          alt="Profile"
          style={{ width: 32, height: 32 }}
        />


   <span className="icon-description">
    
     {isRegistered && email ? email : "Hyrja"}
    
    </span>   */}

</div>
        


      </div>
        
      </Container>

<Container>
  {/* Search and Store Filter */}
  <Row className="mb-3 d-flex d-md-flex flex-column flex-md-row align-items-center"
 style={{ flexWrap: "wrap", minWidth: "100%" }}
  >
    {/* Search */}
    <Col xs={12} md={6} 
    className="mb-3 mb-md-0 d-flex align-items-center justify-content-between">



      <InputGroup className="w-100">
        <Form.Control className="select-description flex-grow-1" 
          type="text"
          id="search"
          maxLength={20}
          placeholder="Kerko produkte ne zbritje"
          onKeyDown={(e) => {

                  // Allow only alphanumeric characters, Backspace, and Enter
                const isAlphanumeric = /^[a-zA-Z0-9\s-]$/.test(e.key);
                if (!isAlphanumeric && e.key !== "Backspace" && e.key !== "Enter") {
                  e.preventDefault();
                }

            // add condition if the field value is going from 1 to 0 to call the search function

            if (e.key === "Backspace" && e.target.value.length === 1) {
              handleSearch("");
            } else if (e.key === "Enter") handleSearch(e.target.value);
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
                {/* <div style={{marginRight:5, fontSize: 10}}>
                <img
                  src={"/filter.png"}
                  alt="Meniven.com"
                  style={{ width: 30, cursor: "pointer", marginRight: 0 }}
                />
                  
                  Filtro </div> */}

      <Form.Select  className="select-description" 
      id="store"
        style={{ width: "50%" }}
        onChange={(e) => {
          const selectedStoreId = e.target.value;
          const selectedStoreName = e.target.options[e.target.selectedIndex].text;


          //console.log("[DEBUG] Selected Store ID:", selectedStoreId);
          //console.log("[DEBUG] Selected Store Name:", selectedStoreName);

          setSelectedStore(selectedStoreId);
      
          // Set the selected store name
          const store = stores.find((store) => store.storeId === selectedStoreId);

         

          setSelectedStoreName(selectedStoreName);
        }}
      >
        
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
          className="icon-image"
          
        />
        <span  className="icon-description" >Favoritet</span>

      </div>
      <div
        role="button" 
        className="d-flex flex-column align-items-center "
        onClick={() => setOnSale((prev) => !prev)}
      >
        <img
          src={onSale ? "/sale-fill-2.png" : "/sale-empty.jpg"}
          alt="Ne Zbritje"
          className="icon-image"
        />
        <span  className="icon-description" >Zbritjet</span>
      </div>


      </div>
    </Col>
  </Row>



</Container>




<div className="d-flex flex-row align-items-center " 
style={{ width: "100%" }}>



{searchKeyword.length > 2 && (

<div className="select-description" 
  style={{ marginLeft: 5, marginRight: 5, 
    
    border: searchKeyword.length > 2 ? "1px solid #ccc" : "",
   padding:3 , borderRadius: 5 , marginBottom: 5 }}>
{searchKeyword.length > 2 ? "" + searchKeyword  : "" }


<span
  onClick={() => {
    setSearchKeyword("");
    document.getElementById("search").value = "";
  }}
  style={{ marginLeft: 5, marginRight:5 , cursor: "pointer", color: "red" }}
>
  X

</span>

</div>

)}

{selectedStore > 0  && (
<div className="select-description"

style={{ marginLeft: 5, marginRight: 5, 

border: selectedStore > 0 ? "1px solid #ccc" : "", padding:3 ,borderRadius: 5, marginBottom: 5 }}
>
  
  {selectedStore > 0 ? `${selectedStoreName}` : ""}



  <span
  onClick={() => {
    setSelectedStore(0);
    document.getElementById("store").value = 0;
  }}
  style={{ marginLeft: 5, marginRight:5 , cursor: "pointer", color: "red" }}
>
  X
</span>

  
  </div>

)}

{ isFavorite  && (
<div className="select-description"

style={{ marginLeft: 5, marginRight: 5, border: isFavorite ? "1px solid #ccc" : "", padding:3 ,borderRadius: 5, marginBottom: 5 }}>
{isFavorite ? "Favorit " : "" }


<span
  onClick={() => {
    setIsFavorite(false);
  }}
  style={{ marginLeft: 5, marginRight:5 , cursor: "pointer", color: "red" }}
>
  X
</span>



</div>

)}


{onSale  && (


<div className="select-description"

style={{ marginLeft: 5, marginRight: 5, border: "1px solid #ccc", padding:3 ,borderRadius: 5 , marginBottom: 5}}>

{onSale ? " Zbritje" : "" }



<span

  onClick={() => {
    setOnSale(false);
  }}
  style={{ marginLeft: 5, marginRight:5 , cursor: "pointer", color: "red" }}
>
  X
</span>



</div>

)}



</div>

{data?.pages[0].products.length === 0 && (

  <div className="select-description">


  Nuk u gjenden produkte me keta filtra 



  </div>
)








}





      {/* Products */}

     
        <Row 

            xs={2}
            sm={2}
            md={2}
            lg={lgCols}
        
        
         
        className="g-2 justify-content-start ">
          {data?.pages.map((page, pi) =>
            page.products.map((product, idx) => (
          <Col key={`${pi}-${idx}`} className="d-flex ">
            <Card className="h-100 p-1  product-card"        
            
                // if product.productOnSale make card border red else make it white
                style={{ borderColor: product.productOnSale ? "green" : null }}
                
                >
            <div >

            {!isCardImageLoaded && (
              <Placeholder as="div" animation="glow">
                <Placeholder
                  style={{
                    width: "100%",
                    height: "200px", // Adjust to match the image dimensions
                  }}
                  className="rounded" // Optional: Add rounded corners
                />
              </Placeholder>
            )}


              {/* <Card.Img

                    variant="top"
                    className="product-image"
                  
                    src={`${baseUrl}/${transformation}/${directory}/${product.image_url
                      .split("/")
                      .pop()}`}
                    alt={product.product_description}
                    onLoad={() => setIsCardImageLoaded(true)} // Set loaded to true when the image loads
                    onClick={() =>
                      openModal(
                        `${baseUrl}/${transformation2}/${directory}/${product.image_url
                      .split("/")
                      .pop()}`, product
                      )
                    }
          
              /> */}


      {(() => {
        const filename = product.image_url.split("/").pop();
        // use single, auto-format/DPR transformation for max resolution
        const imgUrl = `${baseUrl}/${autoTransformation}/${directory}/${filename}`;

        return (
          <img
            className="card-img-top product-image"
            src={imgUrl}
            alt={product.product_description}
            loading="lazy"
            onLoad={() => setIsCardImageLoaded(true)}
            onClick={() => openModal(imgUrl, product)}
            style={{ cursor: "pointer", width: "100%", height: "auto" }}
          />
        );
     })()}

            <div
            className="overlay-container"
            role="button"
              style={{
                position: "absolute",
                top: "5px", // Same position as the image
                right: "5px", // Same position as the image
                //
                backgroundColor: "rgb(249, 245, 245)", // Semi-transparent background
                padding: "15px", // Optional: Add padding around the image
                borderRadius: "20%", // Optional: Make it circular
                
              }}
            >

                <img

                

                // check screen size for mobile or desktop USING @MEDIA CSS
                // if screen size is less than 768px use smaller image

                  src={"/loop.png"} // Replace with your overlay image path
                  
                  alt="Overlay"
                  style={{
                    position: "absolute",
                    top: "0px", // Adjust as needed
                    right: "0px", // Adjust as needed

                    
                  }}
                  onClick={() =>
                    openModal(
                      `${baseUrl}/${directory}/${product.image_url
                    .split("/")
                    .pop()}`
                    )
                  }
                />


</div>

              </div>
              <Card.Body>
            <Card.Text className="product-description">
              {product.product_description}
            </Card.Text>


            
            <Card.Text className="product-description">
              <span style={{ color: "red" }}>{product.old_price && product.old_price > 0 ? product.old_price + "€ - " : ""}</span>
              <span style={{ color: "green" }}>
                {product.new_price}€ 
                {product.old_price > 0 && product.new_price && (
                  <> (-{Math.round(((product.old_price - product.new_price) / product.old_price) * 100)}%)</>
                )}
              </span>
            </Card.Text>

            <Card.Text className="product-description">
               {product.storeName}
            </Card.Text>
            <Card.Text className="sale-date">
              {product.sale_end_date ? (
                

                <>Deri me: <span style={{ color: product.productOnSale ? "green" : "red" }}>



                  
               

              {new Date(product.sale_end_date).toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                }
              )}


              <br />
              </span>
                </>
              ) 
              
              : null}

              
              
            </Card.Text>

            {/* Favorite toggle */}
            <div style={{ display: "flex", width:"100%",
               flexDirection: "row", alignItems: "center", 
                padding: 5,  borderRadius: 5,justifyContent: "space-between"  }}>

            <div style={{ display: "flex", flexDirection: "column",  alignItems: "center", // Centers items horizontally
    justifyContent: "center", borderColor: "red", 
    //borderWidth: 1, // Border width
   // borderStyle: "solid", // Solid border style



     }} role="button">
                  <img
                    src={product.isFavorite ? "star-fill-2.png" : "star-empty.jpg"}
                    alt={product.isFavorite ? "Unfavorite" : "Favorite"}
                    style={{
                     
                      width: 24,
                      height: 24,
                      
                    }}
                    onClick={() =>
                      handleToggleFavorite(product.productId, product.isFavorite)
                    }
                  />

                  <span className="icon-description">
                      {product.isFavorite ? "" : "Shto favorit"}
                    </span>
              </div>
                 {/* Sale icon */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }} role="button">
                  <img
                    src={product.productOnSale ? "sale-fill-2.png" : "sale-empty.jpg"}
                    alt={product.productOnSale ? "On sale" : "Not on sale"}
                    style={{ cursor: "hand", width: 24, height: 24 }}
                  />
                  <span className="icon-description" style={{ color:product.productOnSale ? "green" : "red" }}>
                    {product.productOnSale ? "Aktive" : "Skaduar"}
                  </span>
                </div>
              </div>  
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

{!isImageLoaded && (
<>


  <Placeholder as="div" animation="glow">
    <Placeholder
      style={{
        width: 300,
        maxWidth: 300,
        height: "60vh",    // match your maxHeight
      }}
    />
  </Placeholder>
  </>
)}

      <img
          src={modalImageUrl}
          alt="Product Modal"
          onLoad={() => setIsImageLoaded(true)} // Set loaded to true when the image loads

          style={{
            display: isImageLoaded ? "block" : "none",
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


<span style={{ fontSize: 16, fontWeight: "bold", marginTop: 10 }}>
{modalProduct.product_description}:
  </span>

{modalProduct.old_price && modalProduct.old_price > 0 ? (
  <span style={{ color: "red" }}>
    {modalProduct.old_price}€ -
  </span>
) : (
  <span style={{ color: "red" }}></span>
)}
<span style={{ color: "green" }}>
  {modalProduct.new_price}€
  {modalProduct.old_price > 0 && modalProduct.new_price && (
    <> (-{Math.round(((modalProduct.old_price - modalProduct.new_price) / modalProduct.old_price) * 100)}%)</>
  )}



</span>

<span style={{ color: "black" }}>
    <br />
    {modalProduct.storeName}

  </span>
  <span style={{ color: "black" }}>

    <br />
    {
    
    // check is products sale_end_date is not null and if it is in the future
    modalProduct.sale_end_date && new Date(modalProduct.sale_end_date) > new Date()
    ? (
      <>

        <span style={{ color: "green" }}>
          Deri me:{" "}
          {new Date(modalProduct.sale_end_date).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            }
          )}
        </span>
      </>
    ) : (
      ""
    )}
  </span>

  <div
    style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",

      justifyContent: "space-between",
      marginTop: 10,
      padding: 5,
      borderRadius: 5,
    }}
  >
    <div

      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      onClick={() =>
        handleToggleFavorite(modalProduct.productId, modalProduct.isFavorite)
        // setModalProduct((prev) => ({
        //   ...prev,
        //   isFavorite: !prev.isFavorite,
        // }))

      }
    >
      <img

        src={
          modalProduct.isFavorite

            ? "/star-fill-2.png"
            : "/star-empty.jpg"
        }
        alt={modalProduct.isFavorite ? "Unfavorite" : "Favorite"}
        style={{
          width: 24,
          height: 24,
        }}
      />
      <span className="icon-description">
        {modalProduct.isFavorite ? "Hiq favorit" : "Shto favorit"}
      </span>
    </div>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <img

        src={
          modalProduct.productOnSale
            ? "/sale-fill-2.png"
            : "/sale-empty.jpg"
        }
        alt={
          modalProduct.productOnSale ? "On sale" : "Not on sale"
        }
        style={{ width: 24, height: 24 }}
      />
      <span className="icon-description"
      
      style={{
        color: modalProduct.productOnSale ? "green" : "red",
      }}
      
      
      >
        {modalProduct.productOnSale ? "Aktive" : "Skaduar"}
      </span>
    </div>
  </div>
  {/* Close button */}



            <Button
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "white",
                color: "black",
                border: "none",
                width: 40, // Set a fixed width
                height: 40, // Set a fixed height
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "30%", // Ensure it's square
                cursor: "pointer",
                //make font color black

             

              }}
              onClick={closeModal}
            >
              X

            </Button>

            <Button
              style={{
                position: "absolute",

                // position the button in the center of the image
                top: "50%",
                left: "50%",


                
                // make background transparent

                background: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                border: "none",
                width: 40, // Set a fixed width
                height: 40, // Set a fixed height
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "30%", // Ensure it's square
                cursor: "pointer",
              }}
              
            >

                      <img

                      src={


                          "/zoom.png"

                      }

                      style={{
                        width: 24,
                        height: 24,
                      }}
                      />
              
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