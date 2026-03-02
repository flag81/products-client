import React, { useState, useEffect, useRef } from "react";
import { useQueryClient , useInfiniteQuery, useQuery, useMutation} from "@tanstack/react-query";

import FlyerSlider from "./FlyerSlider";
import RegistrationModal from "./RegistrationModal";
import ProductModal from "./ProductModal";

import { enablePushNotifications } from './pushNotifications';
import { apiFetch } from "./api/apiFetch";

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




export default function Home({ mode }) {



  const initStartedRef = useRef(false);

    const initialize = async () => {
  // Was: POST /initialize (server only has GET)
  const res = await apiFetch("/initialize", { method: "GET" });
  const data = await res.json();

  if (data?.token) localStorage.setItem("token", data.token);
  return data;
  };



useEffect(() => {
  if (initStartedRef.current) return; // prevents StrictMode double-run
  initStartedRef.current = true;

  (async () => {
    // One single bootstrap flow:
    // 1) check current session
    // 2) only if not logged in, call /initialize
    // 3) re-check session to get canonical user id
    const session = await checkSession();
    if (!session?.isLoggedIn) {
      await initialize();
      await checkSession();
    }
    await getStores();
  })();
}, []);





  // ─── State & Refs ─────────────────────────────────────────────────────────────
  const [stores, setStores] = useState([]);
  const [flyerBook, setFlyerBook] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]); // store ids as strings
  const [selectedStoreName, setSelectedStoreName] = useState(""); // optional: keep for a display label
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

  // Store scroller ref + desktop arrows
  const storeScrollRef = useRef(null);
  const [canScrollStoresLeft, setCanScrollStoresLeft] = useState(false);
  const [canScrollStoresRight, setCanScrollStoresRight] = useState(false);

  const updateStoreScrollButtons = () => {
    const el = storeScrollRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;
    const epsilon = 2;
    setCanScrollStoresLeft(left > epsilon);
    setCanScrollStoresRight(maxScrollLeft - left > epsilon);
  };

  const scrollStoresBy = (direction) => {
    const el = storeScrollRef.current;
    if (!el) return;
    const amount = Math.max(180, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  // reset key to tell ProductModal to reset zoom when screen gets focus
  const [zoomResetKey, setZoomResetKey] = useState(0);

  // Prevent iOS from zooming/introducing horizontal scroll on input focus:
  useEffect(() => {
    const prevOverflowX = document.body.style.overflowX;
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = prevOverflowX || "";
    };
  }, []);

  // Keep store scroller arrows in sync (desktop)
  useEffect(() => {
    // Defer until after layout so scrollWidth/clientWidth are correct
    const id = window.requestAnimationFrame(() => updateStoreScrollButtons());
    const el = storeScrollRef.current;
    if (!el) return () => window.cancelAnimationFrame(id);

    const handle = () => updateStoreScrollButtons();
    el.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      window.cancelAnimationFrame(id);
      el.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, [stores.length]);

  // Keep horizontal overflow hidden while focusing the search field and avoid viewport jump
  const handleSearchFocus = (e) => {
    document.body.style.overflowX = "hidden";
    setTimeout(() => window.scrollTo(0, window.scrollY), 0);
  };
  const handleSearchBlur = () => {
    document.body.style.overflowX = "hidden";
  };

  // Clear search field, reset state and trigger empty search
  const clearSearch = () => {
    setSearchKeyword("");
    const el = document.getElementById("search");
    if (el) {
      el.value = "";
      el.focus();
    }
    handleSearch("");
  };

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
    (selectedStores.length ? selectedStores.join(",") : ""), // send CSV of selected store ids
    isFavorite,
    onSale,
    searchKeyword?.length > 2 ? searchKeyword : "",
  ];

  // NOTE: Anonymous initialization is handled by the single bootstrap effect at the top of this component.

  


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
    
      if (selectedStores.length > 0) {
        addOrReplaceFilter("Store");
        console.log("[DEBUG] Store filter added");
      } else {
        removeFilter("Store");
        console.log("[DEBUG] Store filter removed");
      }
    }, [isFavorite, onSale, selectedStores]);


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
        headers: (function(){
          const base = { "Content-Type": "application/json" };
          try {
            const t = localStorage.getItem('token') || localStorage.getItem('jwtToken');
            if (t) return { ...base, Authorization: `Bearer ${t}` };
          } catch (e) {
            console.warn('Could not read token from localStorage', e);
          }
          return base;
        })(),
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

      // Include Authorization fallback for cross-site requests where cookies may not be sent.
      const token = localStorage.getItem('token') || localStorage.getItem('jwtToken');
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: token
          ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
          : { "Content-Type": "application/json" },
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
    const checkSession = async () => {
      console.log("[DEBUG] checkSession called");

      const t = localStorage.getItem("jwtToken") || localStorage.getItem("token");
      const response = await fetch(`${node_url}/check-session`, {
        credentials: "include",
        headers: t ? { Authorization: `Bearer ${t}` } : undefined,
      });

      const data = await response.json();
      console.log("[DEBUG] /check-session response:", data);

      if (data.isLoggedIn) {
        setIsLoggedIn(true);
        setUserId(data.userId);
        setIsRegistered(!!data.isRegistered);
        setEmail(data.email || "");
        return data;
      }

      setIsLoggedIn(false);
      setUserId(null);
      setIsRegistered(false);
      setEmail("");
      return data;
    };



       // --- Initialize Anonymous Session ---
   const initializeAnonymousSession = async () => {
    try {
      const session = await checkSession();
      if (session?.isLoggedIn) return session;

      console.log('[INIT] Calling /initialize to ensure anonymous session');
      await initialize();
      const session2 = await checkSession();
      if (!session2?.isLoggedIn) {
        console.error('[ERROR] Anonymous session initialization did not result in a logged-in session.');
      }
      return session2;
    } catch (error) {
      console.error('Error initializing anonymous session:', error);
      return null;
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
  // Session + stores bootstrap is handled in the single init effect near the top.

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

  // REMOVED: The dynamic lgCols calculation is no longer needed.
  // const count       = allProducts.length;
  // const lgCols      = count >= 4 ? 4 : count || 1;

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
         width: "100vw",
        maxWidth: "100%",
        boxSizing: "border-box",
        margin: 0,
        padding: 0,
        overflowX: "hidden",            // hide any accidental horizontal overflow
        WebkitOverflowScrolling: "touch",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        // added rules to further prevent horizontal panning on iOS
        overscrollBehaviorX: "contain",
        touchAction: "pan-y",
      }}
    >
      <div className="container-fluid" id="home-container" style={{ marginTop: 0, position: "relative", top: 0, boxSizing: "border-box",
        border: "0px solid #060101ff",
          maxWidth: 1200,
           marginLeft: "auto",
           marginRight: "auto",
           paddingLeft: 12,
           paddingRight: 12,
            flex: 1,
        }}>
         <Container fluid>
 
       <div
        role="button" 
        
       className="d-flex flex-row align-items-center justify-content-between"

       style={{  
        
        border: "0px solid #9f1d78ff"


       }} 
        
      >

      <img
                  src={"mainlogo.png"}
                  alt="Meniven.com"
                  style={{
                    width: "auto",
                    maxWidth: 250,                // never larger than 250px
                    height: "auto",
                    cursor: "pointer",
                    margin: 5,
                    display: "block",
                  }}
      />

      </div>
         
       </Container>


{/* Search section - remove outer flex that could stretch width */}
<div id="search-container" style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
  <Container style={{ width: "100%", boxSizing: "border-box" }}>
    {/* Search and Store Filter */}
    <Row className="mb-3 d-flex flex-column flex-md-row"
      style={{
        // Removed display:flex, flexWrap and flex:1 (Bootstrap handles this)
        width: "100%",
        justifyContent: "flex-start",
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

 <InputGroup className="w-100">
    <div className="select-description flex-grow-1 form-control-lg" style={{ width: "100%", margin: 0, padding: 0, display: "flex" }}>
      {/* Controlled input so we can show an inline clear button */}
      <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
        <Form.Control
          className="select-description flex-grow-1 form-control-lg"
          style={{
            fontSize: 16,
            WebkitTextSizeAdjust: "100%",
            width: "100%",
            paddingRight: 40, // space for clear button
          }}
          type="text"
          id="search"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          maxLength={20}
          placeholder="Kerko produkte ne zbritje"
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          onKeyDown={(e) => {
            const isAlphanumeric = /^[a-zA-Z0-9\s-]$/.test(e.key);
            if (!isAlphanumeric && e.key !== "Backspace" && e.key !== "Enter") {
              e.preventDefault();
            }
            if (e.key === "Backspace" && e.target.value.length === 1) {
              handleSearch("");
            } else if (e.key === "Enter") handleSearch(e.target.value);
          }}
        />

        {/* Inline clear button positioned inside the input area */}
        {searchKeyword?.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={clearSearch}
            style={{
              position: "absolute",
              right: 6,
              background: "transparent",
              border: "none",
              fontSize: 16,
              cursor: "pointer",
              padding: 6,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Use state for searching instead of DOM traversal */}
      <Button
        className="responsive-button"
        onClick={() => handleSearch(searchKeyword)}
        style={{ marginLeft: 5 }}
      >
        Kerko
      </Button>
    </div>
  </InputGroup>
      
      <div 
        role="button"
        style={{
          margin: 0,
          padding: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          
        }}

        onClick={() => setIsFavorite((prev) => !prev)}
      >
        <img
          src={isFavorite ? "/star-fill-2.png" : "/star-empty.jpg"}
          alt="Favoritet"
          className="icon-image"
          
        />
     

      </div>

            <div 
        role="button"
        style={{
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          
        }}

        onClick={() => setIsFavorite((prev) => !prev)}
      >


<img
  src="/bell.png"
  alt="Enable notifications"
  style={{ cursor: 'pointer' }}
  className="icon-image"
  onClick={enablePushNotifications}
/>
     

      </div>

      
    </Col>

    {/* Store Filter */}

  </Row>
  </Container>
</div>
     
{/* Store logos scroller - keep inside width and avoid vertical overflow */}


<div

  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  }}
>
  {/* Desktop arrows to indicate more stores */}
  <Button
    type="button"
    variant="light"
    className="d-inline-flex"
    aria-label="Scroll stores left"
    disabled={!canScrollStoresLeft}
    onClick={() => scrollStoresBy(-1)}
    style={{
      flex: "0 0 auto",
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      lineHeight: 1,
      opacity: canScrollStoresLeft ? 1 : 0,
      pointerEvents: canScrollStoresLeft ? "auto" : "none",
    }}
    aria-hidden={!canScrollStoresLeft}
    tabIndex={canScrollStoresLeft ? 0 : -1}
  >
    ‹
  </Button>

  <div
    id="store-filter-container"
    ref={storeScrollRef}
    style={{
      flex: "1 1 auto",
      minWidth: 0,
      overflowX: "auto",
      overflowY: "hidden",
      whiteSpace: "nowrap",
      margin: "10px 0",
      padding: "2px 0",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      cursor: "grab",
      // keep scroll contained and smooth on mobile
      overscrollBehaviorX: "contain",
      WebkitOverflowScrolling: "touch",
    }}
  >
    {stores.map((store) => {
      const idStr = String(store.storeId);
      const isSelected = selectedStores.includes(idStr);
      return (
        <div
          key={store.storeId}
          role="button"
          aria-pressed={isSelected}
          onClick={() => {
            setSelectedStores((prev) =>
              prev.includes(idStr) ? prev.filter((s) => s !== idStr) : [...prev, idStr]
            );
            // optional: keep last clicked store name for display
            setSelectedStoreName((prevName) => (isSelected ? "" : store.storeName));
          }}
          style={{
            width: 72,
            height: 72,
            boxSizing: "border-box",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#333",
            borderRadius: 8,
            padding: 8,
            cursor: "pointer",
            margin: "0 6px",
            border: isSelected ? "2px solid #0d6efd" : "2px solid transparent",
            boxShadow: isSelected ? "0 4px 12px rgba(13,110,253,0.15)" : "none",
            transform: isSelected ? "translateY(-2px)" : "none",
            transition: "box-shadow 150ms ease, transform 120ms ease, border-color 150ms ease",
            verticalAlign: "middle",
            background: "white",
          }}
        >
          {store.logoUrl ? (
            <img
              src={`${store.logoUrl.replace("/upload/", "/upload/w_100,c_scale/")}`}
              alt={store.storeName || "Store"}
              style={{
                maxWidth: "100%",
                maxHeight: 56,
                objectFit: "contain",
                display: "block",
              }}
            />
          ) : (
            <span style={{ color: "black", marginRight: 5 }}>{store.storeName || "N/A"}</span>
          )}
        </div>
      );
    })}
  </div>

  <Button
    type="button"
    variant="light"
    className="d-inline-flex"
    aria-label="Scroll stores right"
    disabled={!canScrollStoresRight}
    onClick={() => scrollStoresBy(1)}
    style={{
      flex: "0 0 auto",
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      lineHeight: 1,
      opacity: canScrollStoresRight ? 1 : 0,
      pointerEvents: canScrollStoresRight ? "auto" : "none",
    }}
    aria-hidden={!canScrollStoresRight}
    tabIndex={canScrollStoresRight ? 0 : -1}
  >
    ›
  </Button>
</div>




<div
  id="active-filters-container"
  style={{
    display: "flex",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
    overflowX: "auto",        // allow internal horizontal scrolling only
    overflowY: "hidden",
    whiteSpace: "nowrap",
    WebkitOverflowScrolling: "touch",
    padding: "6px 8px",
    gap: 8,
    msOverflowStyle: "none",
    scrollbarWidth: "thin",
  }}
>

  {searchKeyword.length > 2 && (

<div
  className="select-description"
  style={{
    display: "inline-flex",
    flex: "0 0 auto",
    alignItems: "center",
    marginLeft: 5,
    marginRight: 5,
    border: searchKeyword.length > 2 ? "1px solid #ccc" : "",
    padding: 3,
    borderRadius: 5,
    marginBottom: 5,
    maxWidth: 220,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }}
>
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

{selectedStores.length > 0  && (
<div className="select-description"
  style={{
    marginLeft: 5,
    marginRight: 5,
    padding: 3,
    borderRadius: 5,
    marginBottom: 0,
    display: "flex",
    alignItems: "center",
    gap: 2,
    maxWidth: 320,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }}
>


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
    id="no-products-message"
    style={{
      borderRadius: 5,
      border: "0px solid #ccc",
      margin: "10px auto", // Center the div horizontally
      padding: "10px",
      width: "90%", // Set width to 90% of the parent container
      textAlign: "center", // Center the text inside



    }}

  >
  Nuk u gjenden produkte.
  </div>
)}



{


  
}


{/* Products */}


{/* FIX: Updated Row props for a standard responsive grid. */}
<Row xs={1} sm={2} md={3} lg={4} className="g-2 justify-content-start">
  {onSaleProducts.map((product, idx) => (
          <Col key={`onsale-${idx}`} className="d-flex" style={{ minWidth: 0 /* allow shrink on small screens */ }}>
            <Card className="h-100 pt-1 px-1 pb-0 product-card d-flex flex-column" style={{ width: "100%", borderColor: product.productOnSale ? "green" : null }}>
                <div
                  style={{ position: "relative", width: "100%", height: "100%" }}
                >

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
            onClick={() => openModal((() => { const f = product.image_url.split("/").pop(); return `${baseUrl}/${autoTransformation}/${directory}/${f}`; })(), product)}
            style={{ display: "block", cursor: "pointer", width: "100%", height: "auto" }} // display:block avoids inline-img spacing
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



</div>

              </div>
              <Card.Body   style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,    
                //border: "1px solid #a12323ff",    
                paddingBottom: 2,
                paddingTop: 0,
                // <-- body now expands to fill the card
              }}>
            <Card.Text className="product-description">

              

            <b>
              {product.product_description.toUpperCase()}
            </b>
              
            </Card.Text>


            
            <Card.Text className="product-description"
            
            style={{

              //border: "1px solid #ccc",


             }}
            
            >
              
              <span style={{ color: "red" }}>{product.old_price && product.old_price > 0 ? product.old_price + "€ - " : ""}</span>
              <span style={{ color: "green" }} className="bold-text">
                {product.new_price > 0 ? `${product.new_price}€` : ''}
              </span>

                <span style={{ color: "green" }} className="bold-text">
                {product.discount_percentage ? ` (-${Math.round(product.discount_percentage)}%)` : ''}
              </span>
            </Card.Text>



       
   


<div  

// make this div take the rest of the space vertically

style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center"



 }}


>
  {/* ...existing code... */}
            {/* Favorite toggle */}
            <div id="bottom-menu" style={{ display: "flex", width:"100%",
               flexDirection: "row", alignItems: "center", // add vertical alignment to bottom
               //border: "1px solid #ccc", // Optional: Add a border to separate the footer
           
                paddingBottom: 0,
                paddingTop: 0,
                justifyContent: "space-between", // horizontal alignment to left
                 borderRadius: 0,
                 justifyContent: "space-between" }}>

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


 <div style={{ display: "flex", alignItems: "center", justifyContent: "center", alignContent: "center", marginBottom: 5, paddingTop: 5 




}}>
          {product.logoUrl ? (
                <img src={`${product.logoUrl.replace('/upload/', '/upload/w_100,c_scale/')}`} alt="Store Logo" style={{ width: 50}} />
               ) : (
            <span style={{ color: "black", marginRight: 5 }}>
              {product.storeName || 'N/A'}
            </span>
          )}


</div>  




                 {/* Sale icon */}
                  <div style={{ display: "flex",  verticalAlign: "middle"

                   }} role="button">


{product.sale_end_date ? (
  <>
    <div style={{ display: "flex", alignItems: "center", gap: 6 ,
      
      
      verticalAlign: "middle"}}>
      <img
        src={"/expire2.png"}
        alt="Expires"
        style={{
          width: 30,
          height: 30,
          objectFit: "contain"
        }}
      />
      <span style={{ color: product.productOnSale ? "green" : "red" }} className="bold-text">
        {new Date(product.sale_end_date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }
        )}
      </span>
    </div>
    <br />
  </>
) 
: null}


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


      
     



{/* FIX: Updated Row props for a standard responsive grid. */}
<Row xs={1} sm={2} md={3} lg={4} className="g-2 justify-content-start"

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
          <Col key={`notonsale-${idx}`} className="d-flex" style={{ minWidth: 0 }}>
            <Card className="h-100 pt-1 px-1 pb-0 product-card d-flex flex-column" 
            style={{ width: "100%", paddingBottom: 0, 
            
            
           
            borderColor: product.productOnSale ? "green" : null }}>
                    <div
            // NEW: keep absolute overlays contained
            style={{ position: "relative", width: "100%", height: "100%" }}
          >
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
            style={{ display: "block", cursor: "pointer", width: "100%", height: "auto", filter: "grayscale(100%)" }}
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
                flex: 1,    


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
                  {product.productOnSale ? "Deri" : "Skaduar"} :
                  {new Date(product.sale_end_date).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    }
                  )}
                  <br />
                </span></>
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
           
                paddingBottom: 0,
                paddingTop: 0,
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
  resetZoomKey={zoomResetKey} // <- new prop
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

