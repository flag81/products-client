import React, { useState, useEffect, useRef } from "react";
import { useQueryClient , useInfiniteQuery, useQuery, useMutation} from "@tanstack/react-query";

import FlyerSlider from "./FlyerSlider";
import RegistrationModal from "./RegistrationModal";
import ProductModal from "./ProductModal";

import { enablePushNotifications } from './pushNotifications';
import { apiFetch } from "./api/apiFetch";
import { fetchFlyerBookImages, fetchStores, logoutRequest } from "./api/homeApi";
import { fetchSession, initializeSession } from "./api/sessionApi";
import { useHorizontalScrollButtons } from "./hooks/useHorizontalScrollButtons";
import StoreScroller from "./components/StoreScroller";
import ActiveFiltersBar from "./components/ActiveFiltersBar";
import NoProductsMessage from "./components/NoProductsMessage";
import ProductCard from "./components/ProductCard";
import HomeModals from "./components/HomeModals";
import SectionHeader from "./components/SectionHeader";
import ProductsGrid from "./components/ProductsGrid";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Placeholder from "react-bootstrap/Placeholder";





export default function Home() {



  const initStartedRef = useRef(false);

  const initialize = async () => initializeSession(apiFetch);



useEffect(() => {
  if (initStartedRef.current) return; // prevents StrictMode double-run
  initStartedRef.current = true;

  (async () => {
    // One single bootstrap flow:
    // 1) check current session
    // 2) only if not logged in, call /initialize
    // 3) re-check session to get canonical user id
    let session = await checkSession();
    if (!session?.isLoggedIn) {
      await initialize();
      session = await checkSession();

      // Production-safe fallback: if still logged out but a token exists, the token may be stale.
      // Clear it once and retry initialization.
      const hasLocalToken = Boolean(localStorage.getItem('token') || localStorage.getItem('jwtToken'));
      if (!session?.isLoggedIn && hasLocalToken) {
        console.warn('[INIT] Still logged out after initialize; clearing local token and retrying once.');
        localStorage.removeItem('token');
        localStorage.removeItem('jwtToken');
        await initialize();
        await checkSession();
      }
    }
    await getStores();
  })();
}, []);





  // ─── State & Refs ─────────────────────────────────────────────────────────────
  const node_url = import.meta.env.VITE_NODE_URL;

  // Cloudinary image URL builder pieces (used in product cards + flyer modal)
  const baseUrl = "https://res.cloudinary.com/dt7a4yl1x/image/upload";
  const autoTransformation = "f_auto,q_auto,dpr_auto";
  const directory = "uploads";

  const [stores, setStores] = useState([]);
  const [flyerBook, setFlyerBook] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]); // store ids as strings
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
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [zoomResetKey, setZoomResetKey] = useState(0);
  const [modalImageFrame, setModalImageFrame] = useState(null);

  const [flyerBookData, setFlyerBookData] = useState([]);
  const [isFlyerLoading, setIsFlyerLoading] = useState(false);
  const [flyerBookError, setFlyerBookError] = useState(null);

  const [isCardImageLoaded, setIsCardImageLoaded] = useState(false);
  const observerRef = useRef(null);

  const queryClient = useQueryClient();

  const storeIdsCsv = selectedStores.join(",");
  const productsQueryKey = ["products", userId, storeIdsCsv, isFavorite, onSale, searchKeyword];

  // Show notification bell only when site notifications are allowed
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);

  const refreshNotificationsAllowed = () => {
    try {
      if (typeof window === "undefined") return;
      if (!("Notification" in window)) {
        setNotificationsAllowed(false);
        return;
      }
      setNotificationsAllowed(window.Notification.permission === "granted");
    } catch (_e) {
      setNotificationsAllowed(false);
    }
  };

  const handleEnableNotifications = async (e) => {
    // Avoid triggering any parent click handlers
    e?.stopPropagation?.();
    await enablePushNotifications();
    refreshNotificationsAllowed();
  };

  // Store scroller ref + desktop arrows
  const storeScrollRef = useRef(null);
  const {
    canScrollLeft: canScrollStoresLeft,
    canScrollRight: canScrollStoresRight,
    scrollBy: scrollStoresBy,
  } = useHorizontalScrollButtons(storeScrollRef, [stores.length]);

  const toggleStoreSelected = (idStr) => {
    setSelectedStores((prev) =>
      prev.includes(idStr) ? prev.filter((s) => s !== idStr) : [...prev, idStr]
    );
  };

  const deselectStore = (idStr) => {
    setSelectedStores((prev) => prev.filter((s) => s !== idStr));
  };


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

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: productsQueryKey,
    queryFn: getAllProducts,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
  });

  const openModal = (imageUrl, product, imageMeta) => {
    console.log("[DEBUG] openModal()", product);
    console.log("[DEBUG] setModalImageUrl()", modalImageUrl);
    setModalImageUrl(false);
    setIsImageLoaded(false); // Reset the loaded state when opening the modal
    setZoomResetKey((k) => k + 1);

    // If we already know the clicked card image dimensions, size the modal placeholder/frame now.
    // This prevents the placeholder from being larger/smaller than the final image.
    try {
      const naturalW = Number(imageMeta?.width);
      const naturalH = Number(imageMeta?.height);
      if (naturalW > 0 && naturalH > 0) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const paddingX = 24;
        const paddingY = 24 + 140; // leave room for details/buttons
        const maxW = Math.max(32, Math.floor(vw * 0.95) - paddingX);
        // Guardrail: keep image from consuming the full viewport height (mobile especially)
        const maxH = Math.max(32, Math.floor(vh * 0.75) - paddingY);
        const scale = Math.min(1, maxW / naturalW || 1, maxH / naturalH || 1);
        const targetW = Math.max(32, Math.round(naturalW * scale));
        const targetH = Math.max(32, Math.round(naturalH * scale));
        setModalImageFrame({ width: targetW, height: targetH });
      } else {
        setModalImageFrame(null);
      }
    } catch {
      setModalImageFrame(null);
    }

    console.log("[DEBUG] setModalImageUrl()", modalImageUrl);
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);

    setModalProduct(product);
    console.log("[DEBUG] setModalProduct()", product);

  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImageUrl(false);
    setModalImageFrame(null);
  };



  const openFlyerModal = (imageUrl, product) => {
    console.log("[DEBUG] openModal()", imageUrl);
    console.log("[DEBUG] setModalImageUrl()", modalImageUrl);
    setModalImageUrl(false);
    setIsImageLoaded(false); // Reset the loaded state when opening the modal
    setZoomResetKey((k) => k + 1);
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

  const handleToggleFavorite = (productId, productIsCurrentlyFavorite) => {
    if (!productId) return;
    toggleFavMutation.mutate({ productId, productIsCurrentlyFavorite });
  };

  const handleFlyerModal = async (flyerBookId) => {
    if (!flyerBookId) return;
    try {
      setFlyerBookError(null);
      setIsFlyerLoading(true);
      setIsFlyerModalOpen(true);

      const result = await getFlyerBook(flyerBookId);
      setFlyerBookData(Array.isArray(result) ? result : []);
    } catch (e) {
      setFlyerBookError(e);
    } finally {
      setIsFlyerLoading(false);
    }
  };

    // --- Check User Session ---
    const checkSession = async () => {
      console.log("[DEBUG] checkSession called");

      const data = await fetchSession(apiFetch);
      console.log("[DEBUG] /check-session response:", data);

      // Backend may ask client to reinitialize (e.g., stale header token user not in DB)
      if (data?.shouldReinitialize) {
        console.warn('[DEBUG] /check-session requested reinitialize:', data);
        if (data?.authSource === 'header') {
          localStorage.removeItem('token');
          localStorage.removeItem('jwtToken');
        }
        setIsLoggedIn(false);
        setUserId(null);
        setIsRegistered(false);
        setEmail('');
        return data;
      }

      if (data?.isLoggedIn) {
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
      const result = await fetchStores(node_url);
      setStores(result);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const getFlyerBook = async (flyerBookId) => {
    try {


      console.log("[DEBUG] getFlyerBook called with flyerBookId:", flyerBookId);

      // add the flyerBookId to the url as req.query.flyerBookId
      const result = await fetchFlyerBookImages(node_url, flyerBookId);
      //setFlyerBook(result);

      return result;

      //console.log("[DEBUG] FlyerBook fetched:", result);
    } catch (error) {
      console.error("Error fetching FlyerBook:", error);
    }
  };



  const logout = async () => {
    try {
      await logoutRequest(node_url);
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

  const handleSearchFocus = () => {
    // Intentionally minimal: keep existing UX, just avoid missing handler errors.
  };

  const handleSearchBlur = () => {
    // Intentionally minimal: keep existing UX, just avoid missing handler errors.
  };

  const handleSearch = (value) => setSearchKeyword(value);

  const clearSearch = () => {
    setSearchKeyword("");
  };

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

      {/* Desktop: single row header (logo + search + button + icons) */}
      <div className="d-none d-md-flex align-items-center gap-3 mb-3" style={{ width: "100%" }}>
        <img
          src={"mainlogo.png"}
          alt="Meniven.com"
          style={{
            width: "auto",
            maxWidth: 220,
            height: "auto",
            cursor: "pointer",
            margin: 0,
            display: "block",
            flexShrink: 0,
          }}
        />

        <div className="d-flex align-items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
          <Form.Control
            className="form-control-lg"
            style={{
              minWidth: 0,
              borderRadius: 24,
            }}
            type="text"
            id="search-desktop"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            maxLength={20}
            placeholder="Find related content"
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onKeyDown={(e) => {
              const isAlphanumeric = /^[a-zA-Z0-9\s-]$/.test(e.key);
              if (!isAlphanumeric && e.key !== "Backspace" && e.key !== "Enter") {
                e.preventDefault();
              }
              if (e.key === "Backspace" && e.target.value.length === 1) {
                handleSearch("");
              } else if (e.key === "Enter") {
                handleSearch(e.target.value);
              }
            }}
          />
          <Button onClick={() => handleSearch(searchKeyword)}>Kerko</Button>
        </div>

        <div className="d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
          {!notificationsAllowed && (
            <img
              src="/bell.png"
              alt="Enable notifications"
              style={{ height: 34, width: 34, objectFit: "contain", display: "block", cursor: "pointer" }}
              onClick={handleEnableNotifications}
            />
          )}
          <img
            src={isFavorite ? "/star-fill-2.png" : "/star-empty.jpg"}
            alt="Favoritet"
            style={{ height: 34, width: 34, objectFit: "contain", display: "block", cursor: "pointer" }}
            onClick={() => setIsFavorite((prev) => !prev)}
          />
        </div>
      </div>
 
       <div
        role="button" 

       className="d-flex d-md-none flex-row align-items-center justify-content-between"

       style={{  
        
        border: "0px solid #9f1d78ff"


       }} 
        
      >

      <img
                  src={"mainlogo.png"}
                  alt="Meniven.com"
                  style={{
                    width: "auto",
                    maxWidth: 220,                // never larger than 250px
                    height: "auto",
                    cursor: "pointer",
                    margin: 5,
                    display: "block",
                  }}
      />


{!notificationsAllowed && (
  <img
    src="/bell.png"
    alt="Enable notifications"
    style={{ height: 34, width: 34, objectFit: "contain", display: "block", cursor: "pointer" }}
    onClick={handleEnableNotifications}
  />
)}


        <img
          src={isFavorite ? "/star-fill-2.png" : "/star-empty.jpg"}
          alt="Favoritet"
            style={{ height: 34, width: 34, objectFit: "contain", display: "block", cursor: "pointer" }}
          onClick={() => setIsFavorite((prev) => !prev)}
        />

      </div>

         
       </Container>


{/* Search section - remove outer flex that could stretch width */}
<div id="search-container" className="home-search-shell d-md-none" style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
  <Container className="home-search-container" style={{ width: "100%", boxSizing: "border-box" }}>
    {/* Search and Store Filter */}
    <Row className="mb-3 d-flex flex-column flex-md-row home-search-row"
      style={{
        // Removed display:flex, flexWrap and flex:1 (Bootstrap handles this)
        width: "100%",
        justifyContent: "flex-start",
        boxSizing: "border-box",
        border: "0px solid rgb(65, 14, 142)",
      }}
    >
      {/* Search */}
      <Col xs={12} md={6} className="home-search-col"
   
    
    style={{

      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      gap: 10,
      marginLeft: "0", // Removes any left margin
      paddingLeft: "0", // Removes any left padding
       border: "0px solid rgb(80, 19, 19)" 

    }}
    
    >

<div className="home-search-inline" style={{ display: "flex", 

// keep search and buttons together alignt to left , but the favorite and notification icons to the right with space in between

 width: "100%",
  

  flexDirection: "row", border: "0px solid #060101ff" }}>

<div className="home-search-input-area" style={{
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  border: "0px solid #060101ff",
  flex: 1,
minWidth: 0,
  boxSizing: "border-box",
}}>



 <InputGroup className="flex-grow-1 home-search-group" style={{ minWidth: 0 }}>
    <div className="select-description flex-grow-1 form-control-lg home-search-control-wrap" style={{ width: "100%", margin: 0, padding: 0, display: "flex" }}>
      {/* Controlled input so we can show an inline clear button */}
      <div className="home-search-field-frame" style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
        <Form.Control
          className="select-description flex-grow-1 form-control-lg home-search-input"
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
          placeholder="Find related content"
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

        <span className="home-search-icon" aria-hidden="true" />

        {/* Inline clear button positioned inside the input area */}
        {searchKeyword?.length > 0 && (
          <button
            type="button"
            className="home-search-clear-btn"
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
        className="responsive-button home-search-action-btn"
        onClick={() => handleSearch(searchKeyword)}
        style={{ marginLeft: 5 }}
      >
        Kerko
      </Button>
    </div>
  </InputGroup>
      

      </div>

<div
  className="home-search-actions"
  style={{
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginLeft: "auto",
    border: "0px solid #060101ff",
    padding: 0,
  }}
>





            <div 
        role="button"
        style={{
          margin: 0,
          padding: 0,
            marginLeft: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "0px solid #060101ff"
          
        }}
      >



     

      </div>

      </div>


</div>
      
    </Col>

    {/* Store Filter */}

  </Row>
  </Container>
</div>
     
{/* Store logos scroller - keep inside width and avoid vertical overflow */}

<StoreScroller
  stores={stores}
  selectedStores={selectedStores}
  onToggleStore={toggleStoreSelected}
  onDeselectStore={deselectStore}
  storeScrollRef={storeScrollRef}
  canScrollLeft={canScrollStoresLeft}
  canScrollRight={canScrollStoresRight}
  onScrollBy={scrollStoresBy}
/>




<ActiveFiltersBar
  isFavorite={isFavorite}
  onClearFavorite={() => setIsFavorite(false)}
  onSale={onSale}
  onClearOnSale={() => setOnSale(false)}
/>


<NoProductsMessage show={data?.pages?.[0]?.products?.length === 0} />



{


  
}


{/* Products */}


{/* FIX: Updated Row props for a standard responsive grid. */}
<ProductsGrid
  className="g-2  justify-content-start"
  style={{
    background: "#d7d8db",
    borderRadius: 8,
    padding: 0,
    border: "0px solid #060101ff",
  }}
>
  {onSaleProducts.map((product, idx) => (
    <ProductCard
      key={`onsale-${idx}`}
      variant="onsale"
      product={product}
      baseUrl={baseUrl}
      autoTransformation={autoTransformation}
      directory={directory}
      isCardImageLoaded={isCardImageLoaded}
      setIsCardImageLoaded={setIsCardImageLoaded}
      onOpenModal={openModal}
      onToggleFavorite={handleToggleFavorite}
    />
  ))}
</ProductsGrid>


{/* Not On Sale Products */}
      

{
// if not onSaleProducts is empty, do not render this section

notOnSaleProducts.length > 0 && (

  <SectionHeader title="Te skaduara" />

)
}


      
     



{/* FIX: Updated Row props for a standard responsive grid. */}
<ProductsGrid
  className="g-2 justify-content-start"
  style={{
    //border: "1px solid black", // Add a black border
    //borderRadius: "5px", // Optional: Add rounded corners
    //padding: "10px", // Optional: Add padding inside the row
  }}
>
  {notOnSaleProducts.map((product, idx) => (
    <ProductCard
      key={`notonsale-${idx}`}
      variant="notonsale"
      product={product}
      baseUrl={baseUrl}
      autoTransformation={autoTransformation}
      directory={directory}
      isCardImageLoaded={isCardImageLoaded}
      setIsCardImageLoaded={setIsCardImageLoaded}
      onOpenModal={openModal}
      onToggleFavorite={handleToggleFavorite}
    />
  ))}

</ProductsGrid>


      <HomeModals
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        modalImageUrl={modalImageUrl}
        modalImageFrame={modalImageFrame}
        isImageLoaded={isImageLoaded}
        setIsImageLoaded={setIsImageLoaded}
        modalProduct={modalProduct}
        handleToggleFavorite={handleToggleFavorite}
        handleFlyerModal={handleFlyerModal}
        zoomResetKey={zoomResetKey}
        isFlyerModalOpen={isFlyerModalOpen}
        flyerBookData={flyerBookData}
        baseUrl={baseUrl}
        closeFlyerModal={closeFlyerModal}
        isFlyerLoading={isFlyerLoading}
        flyerBookError={flyerBookError}
      />

      <div ref={observerRef} style={{ height: 20, margin: "10px 0" }} />
      {isFetching && !isFetchingNextPage && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 16,
            transform: "translateX(-50%)",
            zIndex: 1050,
          }}
          aria-live="polite"
          aria-label="Loading"
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

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

