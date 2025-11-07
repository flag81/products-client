import React, { useState, useEffect, useRef } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery
} from "@tanstack/react-query";


import FlyerSlider from "./FlyerSlider";
import RegistrationModal from "./RegistrationModal";
import ProductModal from "./ProductModal";




import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Placeholder from "react-bootstrap/Placeholder";
import Toast from 'react-bootstrap/Toast';
import Slider from "react-slick";
import { Spinner } from "react-bootstrap";







function Home({ mode }) {
  // ─── State & Refs ─────────────────────────────────────────────────────────────
  const [stores, setStores] = useState([]);
  const [flyerBook, setFlyerBook] = useState([]);
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
  const [isFlyerModalOpen, setIsFlyerModalOpen ] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const observerRef = useRef(null);

  const [flyerBookId, setFlyerBookId] = useState(null);

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


  const handleFlyerModal = (id) => {
  setFlyerBookId(id);
  setIsFlyerModalOpen(true);
};

const {
  data: flyerBookData,
  isLoading: isFlyerLoading,
  error: flyerBookError,
} = useQuery({
  queryKey: ['flyerBook', flyerBookId],
  queryFn: () => getFlyerBook(flyerBookId),
  enabled: !!flyerBookId && isFlyerModalOpen,
});


  // DEBUG: log whenever modal opens, URL changes or load flag changes
useEffect(() => {
  console.log("[DEBUG] Modal Open:", isModalOpen);
  console.log("[DEBUG] Modal image URL:", modalImageUrl);
  console.log("[DEBUG] isImageLoaded:", isImageLoaded);
}, [isModalOpen, modalImageUrl, isImageLoaded]);


useEffect(() => {

  console.log("[DEBUG] Flyer Modal Open:", isFlyerModalOpen);
  console.log("[DEBUG] FlyerBook CHANGED:", flyerBook);
}, [isFlyerModalOpen,  flyerBook]);


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
  
      // console.log(`[DEBUG] Fetching products with URL: ${url.toString()}`);
  
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
     // console.log("[DEBUG] Fetched products page", pageParam, ":", json.data?.length);
  
      return {
        products: json.data || [], // Ensure products is always an array
        nextPage: json.nextPage, // Use nextPage directly from backend
      };
    }

  const openModal = (imageUrl, product) => {
    console.log("[DEBUG] openModal()", product);
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



  const openFlyerModal = (imageUrl, product) => {
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
  
  const closeFlyerModal = () => {
    setIsFlyerModalOpen(false);
    //setImageUrl(false);
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

  const getFlyerBook = async (flyerBookId) => {
    try {


      console.log("[DEBUG] getFlyerBook called with flyerBookId:", flyerBookId);

      // add the flyerBookId to the url as req.query.flyerBookId
      const response = await fetch(`${node_url}/getImagesByFlyerBookId?flyerBookId=${flyerBookId}`);

      const result = await response.json();
      //setFlyerBook(result);

      return result;

      //console.log("[DEBUG] FlyerBook fetched:", result);
    } catch (error) {
      console.error("Error fetching FlyerBook:", error);
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


const onSaleProducts = allProducts.filter(p => p.productOnSale);
const notOnSaleProducts = allProducts.filter(p => !p.productOnSale);



const settings = {
  dots: true,
  infinite: true,
  speed: 300,
  slidesToShow: 1,
  slidesToScroll: 1,
  adaptiveHeight: true, 
};






  // ─── Render ──────────────────────────────────────────────────────────────────
  return (

    

    <div
 
  style={{
    width: "100%",
    boxSizing: "border-box",
    // By removing `display: "flex"`, this div reverts to a standard block element.
    // A block element naturally occupies the full available width and provides a stable
    // foundation for the content inside, preventing the layout from shrinking.
    // The margin and padding have been set to 0 to avoid unwanted spacing.
    margin: 0,
    padding: 0,


  }}
>
    <div className="container-fluid" 
    
          id="home-container"

          // --- FIX: Removed redundant and conflicting inline styles ---
          // The container-fluid class handles the width correctly.
          style={{
          marginTop: 0,
          position: "relative",
          top: 0,
          boxSizing: "border-box",
          border: "1px solid #060101ff",
    }}
    
    >
      
      <Container fluid>

      <div
        role="button" 
        
       className="d-flex flex-row align-items-center justify-content-between"

       style={{  
        
        border: "1px solid #9f1d78ff"


       }} 
        
      >

      <img
                  src={"mainlogo.png"}
                  alt="Meniven.com"
                  style={{ width: 250, cursor: "pointer", margin: 5 }}
      />

      </div>
        
      </Container>


<div className="d-flex flex-row " 

id="search-container"

style={{  

  display: "flex", // Enables flexbox layout
  justifyContent: "flex-start",
  border: "1px solid green",
  width: "100%",
  maxWidth: "100%", // Ensure it fills the parent width
// stetch div to fill the width of the parent 

// make sure it not shrunk


boxSizing: "border-box",


}} 

>

  
<Container

style={{ 
  display: "flex",
  width: "100%", // Ensure it fills the parent width
  justifyContent: "flex-start",
  boxSizing: "border-box",
  

}}


>
 {/* Search and Store Filter */}
 <Row className="mb-3 d-flex flex-column flex-md-row "
 style={{ 
  flexWrap: "wrap",
  display: "flex",
  width: "100%", // Ensure it fills the parent width
  flex: "1",
  justifyContent: "flex-start",
  //border: "1px solid red",
  // stetch div to fill the width of the parent
  boxSizing: "border-box",

}}
  >
    {/* Search */}
    <Col xs={12} md={6} 
   
    
    style={{

      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      marginLeft: "0", // Removes any left margin
      paddingLeft: "0", // Removes any left padding

    }}
    
    >

 <InputGroup className="w-100"
 
 
 
 >
  <div className="select-description flex-grow-1 form-control-lg" 
  
  
  style={{ 
    
    width: "100%",
    //border: "1px solid YELLOW", // Optional: Add a border for visibility
    margin: "0", // Removes any left margin
    padding: "0", // Removes any left padding

    display: "flex",



   }}>

        <Form.Control className="select-description flex-grow-1 form-control-lg" 

        style={{

          //width: "100%", // Ensure it fills the parent width
        }}
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
          style={{ marginLeft: 5 


          }}
        >
          Kerkoni
        </Button>
     

  </div>      

  </InputGroup>
      
      <div 
        role="button"
        style={{
          margin: 0,
          padding: 0
        }}

        onClick={() => setIsFavorite((prev) => !prev)}
      >
        <img
          src={isFavorite ? "/star-fill-2.png" : "/star-empty.jpg"}
          alt="Favoritet"
          className="icon-image"
          
        />
        <span  className="icon-description" >Favoritet</span>

      </div>

      
    </Col>

    {/* Store Filter */}

  </Row>
  </Container>

</div>
     












<div 

id="store-filter-container"

style={{

overflowX: "scroll",
whiteSpace: "nowrap",
margin: "10px 0",
padding: "2px 0",
//borderBottom: "1px solid #eee",
//maxWidth: "78vw", // Prevents exceeding screen width
width: "100%",     // Fills parent width
boxSizing: "border-box",
// hide scrollbar horizontally but allow scrolling horizontally

scrollbarWidth: "none", // Hide scrollbar for Firefox
msOverflowStyle: "none", // Hide scrollbar for IE/Edge

//border: "1px solid red", // Debugging border
cursor: "grab",

//border: "1px solid #ccc"


}}




>


{stores.map((store) => (

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
          setSelectedStore(store.storeId);
          setSelectedStoreName(store.storeName);
        } }
        
        
        
        >
          
          
          <span key={store.storeId} style={{  textAlign: "center" }}>
{store.storeName}
  </span>      
        
        </div>



))}

</div>


<div className="d-flex flex-row align-items-center " 
style={{ width: "100%", 

//border: "1px solid #ccc" 

}}>



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
  <div
    id="store-filter-container"



        style={{
      borderRadius: 5,
      border: "1px solid #ccc",
      margin: "10px auto", // Center the div horizontally
      padding: "10px",
      width: "90%", // Set width to 90% of the parent container
      textAlign: "center", // Center the text inside
    }}

  >
  Nuk u gjenden produkte me keta filtra Nuk u gjenden produkte me keta filtra
  </div>
)}



{


  
}


{/* Products */}


<Row xs={1} sm={2} md={2} lg={lgCols} className="g-2 justify-content-start">
  {onSaleProducts.map((product, idx) => (
          <Col key={`onsale-${idx}`} className="d-flex ">
            <Card className="h-100 p-1  product-card d-flex flex-column"        
            
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


                  src={"/loop.png"} // Replace with your overlay image path
                  
                  alt="Overlay"
                  style={{
                    position: "absolute",
                    top: "0px", // Adjust as needed
                    right: "0px", // Adjust as needed

                    
                  }}

                />


</div>

<div
            className="overlay-container2"
            
              style={{
                position: "absolute",

                top: "5px",
                left: "5px",
                //
                //background: "rgba(0, 0, 0, 0.2)",
               
                backgroundColor: "rgba(255, 255, 255, 0.9)", // Semi-transparent white background 
                padding: "12px", // Optional: Add padding around the image
                borderRadius: "20%", // Optional: Make it circular
                
              }}
            >

                <img

                

                // check screen size for mobile or desktop USING @MEDIA CSS
                // if screen size is less than 768px use smaller image

                  src={"/click.png"} // Replace with your overlay image path
                  
                  alt="Overlay"
                  style={{
                    position: "absolute",
                    top: "0px", // Adjust as needed
                    left: "0px", // Adjust as needed
                    width: 24,

                    
                  }}
                 
                />


</div>


<div
            className="overlay-container3"
            
              style={{
                position: "absolute",

                top: "5px",
                right: "5px",
                
                //background: "rgba(0, 0, 0, 0.2)",
                backgroundColor: "rgba(255, 255, 255, 0.9)", // Semi-transparent white background 
               
                borderRadius: "20%", // Optional: Make it circular
                
              }}
            >

              <span style={{ color: "green", fontWeight: "bold"}}>
                {product.old_price > 0 && product.new_price && (
                  <> -{Math.round(((product.old_price - product.new_price) / product.old_price) * 100)}%</>
                )}
              </span>


</div>

              </div>
              <Card.Body   style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,             // <-- body now expands to fill the card
              }}>
            <Card.Text className="product-description">
              {product.product_description}
            </Card.Text>


            
            <Card.Text className="product-description">
              <span style={{ color: "red" }}>{product.old_price && product.old_price > 0 ? product.old_price + "€ - " : ""}</span>
              <span style={{ color: "green" }} className="bold-text">
                {product.new_price > 0 ? `${product.new_price}€` : ''}
              </span>
            </Card.Text>



<div style={{ display: "flex", alignItems: "center", justifyContent: "center", alignContent: "center", marginBottom: 5, paddingTop: 5 }}>
          {product.logoUrl ? (
                <img src={`${product.logoUrl.replace('/upload/', '/upload/w_100,c_scale/')}`} alt="Store Logo" style={{ width: 50}} />
               ) : (
            <span style={{ color: "black", marginRight: 5 }}>
              {product.storeName || 'N/A'}
            </span>
          )}


</div>          
            <Card.Text className="sale-date">
              {product.sale_end_date ? (
                

                <><span style={{ color: product.productOnSale ? "green" : "red" }} className="bold-text">



{product.productOnSale ? "Deri" : "Skaduari" } :  
               

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


<div  

// make this div take the rest of the space vertically

style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}


>
  {/* ...existing code... */}
            {/* Favorite toggle */}
            <div id="bottom-menu" style={{ display: "flex", width:"100%",
               flexDirection: "row", alignItems: "center", // add vertical alignment to bottom
               //border: "1px solid #ccc", // Optional: Add a border to separate the footer
                alignItems: "flex-end", 
                justifyContent: "space-between", // horizontal alignment to left
                 borderRadius: 5,justifyContent: "space-between" }}>

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


                  

             
              </div>
                 {/* Sale icon */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }} role="button">
                  <img
                    src={product.productOnSale ? "sale-fill-2.png" : "sale-empty.jpg"}
                    alt={product.productOnSale ? "On sale" : "Not on sale"}
                    style={{ cursor: "hand", width: 24, height: 24 }}
                  />
                
                </div>
              </div>  
</div>

                </Card.Body>
              </Card>
            </Col>
  ))}
</Row>


      {/* Not On Sale Products */}
      

{
// if not onSaleProducts is empty, do not render this section

notOnSaleProducts.length > 0 && (


        <div className="select-description"
        style={{ marginLeft: 5, 
        marginRight: 5, border: "1px solid #ccc", padding:3 ,borderRadius: 5 , marginBottom: 20,
        marginTop: 20

        }}>
        <span style={{ fontWeight: "bold", fontSize: 18 }}>
                Te skaduara
              </span>
        </div>

)
}


      
     



<Row xs={1} sm={1} md={2} lg={lgCols} className="g-2 justify-content-start"

style={{
  //border: "1px solid black", // Add a black border
  //borderRadius: "5px", // Optional: Add rounded corners
  //padding: "10px", // Optional: Add padding inside the row
}}

>
  {notOnSaleProducts.map((product, idx) => 
  {


    const filename = product.image_url.split("/").pop();
    // use single, auto-format/DPR transformation for max resolution
    const imgUrl = `${baseUrl}/${autoTransformation}/${directory}/${product.image_url.split("/").pop()}`;

    
  return (
          <Col key={`notonsale-${idx}`} className="d-flex"

          style={{
            //border: "1px solid black", // Add a black border
            //borderRadius: "5px", // Optional: Add rounded corners
            //padding: "10px", // Optional: Add padding inside the row
          }}
          



          >
            <Card className="h-100 p-1  product-card d-flex flex-column"        
            
                // if product.productOnSale make card border red else make it white
                style={{ borderColor: product.productOnSale ? "green" : null, 

                  width: "100%",

                }}

                
                >
            <div  style={{ width: "100%", height: "100%" }}>

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








      {(() => {
        //const filename = product.image_url.split("/").pop();
        // use single, auto-format/DPR transformation for max resolution
        //const imgUrl = `${baseUrl}/${autoTransformation}/${directory}/${product.image_url.split("/").pop()}`;

        //return this two variables to the image tag

        

        return (
          <img
            className="card-img-top product-image"
            src={imgUrl}
            alt={product.product_description}
            loading="lazy"
            onLoad={() => setIsCardImageLoaded(true)}
            onClick={() => openModal(imgUrl, product)}
            style={{ cursor: "pointer", width: "100%", height: "auto" ,
            filter: "grayscale(100%)", // Apply grayscale effect

            }}
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


                  src={"/loop.png"} // Replace with your overlay image path
                  
                  alt="Overlay"
                  style={{
                    position: "absolute",
                    top: "0px", // Adjust as needed
                    right: "0px", // Adjust as needed

                    
                  }}
                

                  onClick={() => openModal(imgUrl, product)}
                />


</div>

<div
            className="overlay-container2"
            
              style={{
                position: "absolute",

                top: "5px",
                left: "5px",
                //
                //background: "rgba(0, 0, 0, 0.2)",
               
                backgroundColor: "rgba(255, 255, 255, 0.9)", // Semi-transparent white background 
                padding: "12px", // Optional: Add padding around the image
                borderRadius: "20%", // Optional: Make it circular
                
              }}
            >

                <img


                  src={"/click.png"} // Replace with your overlay image path
                  
                  alt="Overlay"
                  style={{
                    position: "absolute",
                    top: "0px", // Adjust as needed
                    left: "0px", // Adjust as needed
                    width: 24,

                    
                  }}

              

                  onClick={() => openModal(imgUrl, product)}
                 
                />


</div>


<div
            className="overlay-container3"
            
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",   
                //background: "rgba(0, 0, 0, 0.2)",
                backgroundColor: "rgba(255, 255, 255, 0.9)", // Semi-transparent white background              
                borderRadius: "20%", // Optional: Make it circular
                
              }}
            >

          <span style={{ color: "green", fontWeight: "bold"}}>
                {(() => {
                  const oldPrice = parseFloat(product.old_price);
                  const newPrice = parseFloat(product.new_price);
                  if (oldPrice > 0 && newPrice && oldPrice > newPrice) {
                    const percentage = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
                    return <>-{percentage}%</>;
                  }
                  return null;
                })()}
              </span>


</div>

              </div>
              <Card.Body   style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,             // <-- body now expands to fill the card
              }}>
            <Card.Text className="product-description">
              {product.product_description}
            </Card.Text>


            
            <Card.Text className="product-description">
              <span style={{ color: "red" }}>{product.old_price && product.old_price > 0 ? product.old_price + "€ - " : ""}</span>
              <span style={{ color: "green" }}>
               {product.old_price > product.new_price ? product.new_price + "€ " : product.new_price + "€*" }
              </span>
            </Card.Text>

            <Card.Text className="product-description bold-text">
               {product.storeName}
            </Card.Text>
            <Card.Text className="sale-date">
              {product.sale_end_date ? (
                

                <><span style={{ color: product.productOnSale ? "green" : "red" }}>



{product.productOnSale ? "Deriiiii" : "Skaduar" } :  
               

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


<div  

// make this div take the rest of the space vertically

style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}


>
  {/* ...existing code... */}
            {/* Favorite toggle */}
            <div id="bottom-menu" style={{ display: "flex", width:"100%",
               flexDirection: "row", alignItems: "center", // add vertical alignment to bottom
               //border: "1px solid #ccc", // Optional: Add a border to separate the footer
                alignItems: "flex-end", 
                justifyContent: "space-between", // horizontal alignment to left
                 borderRadius: 5,justifyContent: "space-between" }}>

            <div style={{ display: "flex", flexDirection: "column",  alignItems: "center", // Centers items horizontally
                justifyContent: "center", borderColor: "red", 
                //borderWidth: 1, // Border width
              // borderStyle: "solid", // Solid border style

            }} role="button">



                  

             
              </div>
                 {/* Sale icon */}

              </div>  
</div>

                </Card.Body>
              </Card>
            </Col>
  
)
}
  
  )}
</Row>

      {/* Image Modal */}
{/* Image Modal */}
<ProductModal
  isOpen={isModalOpen}
  onClose={closeModal}
  modalImageUrl={modalImageUrl}
  isImageLoaded={isImageLoaded}
  setIsImageLoaded={setIsImageLoaded}
  modalProduct={modalProduct}
  handleToggleFavorite={handleToggleFavorite}
  handleFlyerModal={handleFlyerModal}
/>


{/* your existing modal wrapper */}
{isFlyerModalOpen && (
  <FlyerSlider
    flyerBook={flyerBookData}
    baseUrl={baseUrl}
    isFlyerModalOpen={isFlyerModalOpen}
    closeFlyerModal={closeFlyerModal}
    isLoading={isFlyerLoading}
    error={flyerBookError}
  />
)}

      <div ref={observerRef} style={{ height: 20, margin: "10px 0" }} />
      {
      isFetching && !isFetchingNextPage && <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
      
      }

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