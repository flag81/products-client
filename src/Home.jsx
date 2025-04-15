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

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="container">
      {isLoggedIn ? (
        <p>Miresevini! {email}</p>
      ) : (
        <Container>
          <Row className="mb-3 justify-content-center align-items-center">
            <Col xs={12}>
              <InputGroup>
                <Button
                  className="responsive-button"
                  onClick={() => (window.location.href = `${node_url}/auth/google`)}
                >
                  Login Google
                </Button>
                <Button className="responsive-button" onClick={signInWithApple}>
                  Login Apple
                </Button>
                <Button className="responsive-button" onClick={signInWithApple}>
                  Regjistohu
                </Button>
              </InputGroup>
            </Col>
          </Row>
        </Container>
      )}

      <Container>
        {/* Search */}
        <Row className="mb-3">
          <Col xs={12} md={6}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Kerko produkte..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(e.target.value);
                }}
              />
              <Button
                className="responsive-button"
                onClick={(e) => handleSearch(e.target.previousSibling.value)}
              >
                Kerko
              </Button>
            </InputGroup>
          </Col>
        </Row>

        {/* Store Filter */}
        <Row className="mb-3">
          <Col xs={12} md={6}>
            <Form.Select onChange={(e) => setSelectedStore(e.target.value)}>
              <option value="">Te gjitha dyqanet</option>
              {stores.map((store) => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-3">
          <Col xs={12}>
            <div className="d-flex gap-2" style={{ width: "50%" }}>
              <div
                role="button"
                className="d-flex flex-column align-items-center"
                onClick={() => setIsFavorite((prev) => !prev)}
              >
                <img
                  src={isFavorite ? "/star-fill.jpg" : "/star-empty.jpg"}
                  alt="Favoritet"
                  style={{ width: 32, height: 32, cursor: "pointer" }}
                />
                <span style={{ fontSize: 10 }}>Favoritet</span>
              </div>
              <div
                role="button"
                className="d-flex flex-column align-items-center"
                onClick={() => setOnSale((prev) => !prev)}
              >
                <img
                  src={onSale ? "/sale-fill.jpg" : "/sale-empty.jpg"}
                  alt="Ne Zbritje"
                  style={{ width: 32, height: 32, cursor: "pointer" }}
                />
                <span style={{ fontSize: 10 }}>Ne Zbritje</span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Products */}
      <Row xs={2} md={2} lg={4} className="g-4">
        {data?.pages.map((page, pi) =>
          page.products.map((product, idx) => (
            <Col key={`${pi}-${idx}`}>
              <Card className="h-100 p-1">
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
                <Card.Body>
                  <Card.Text className="product-description">
                    {product.product_description}
                  </Card.Text>
                  <Card.Text className="product-description">
                    {product.old_price}eu - {product.new_price}eu
                  </Card.Text>

                  {/* Favorite toggle */}
                  <img
                    src={product.isFavorite ? "star-fill.jpg" : "star-empty.jpg"}
                    alt={product.isFavorite ? "Unfavorite" : "Favorite"}
                    style={{
                      cursor: "pointer",
                      width: 24,
                      height: 24,
                      marginRight: 20,
                    }}
                    onClick={() =>
                      toggleFavMutation.mutate({
                        productId: product.productId,
                        isFav: product.isFavorite,
                      })
                    }
                  />

                  {/* Sale icon */}
                  <img
                    src={product.onSale ? "sale-full.jpg" : "sale-empty.jpg"}
                    alt={product.onSale ? "On sale" : "Not on sale"}
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
                padding: 10,
                borderRadius: "50%",
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
