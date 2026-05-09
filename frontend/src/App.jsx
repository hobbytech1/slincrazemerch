import { useEffect, useRef, useState } from "react";
import { generateCaption as generateMerchCaption } from "./utils/captionGenerator";

const BACKEND_URL = "https://slincrazemerch.onrender.com";

function App() {
  const [products, setProducts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState("Laster produkter...");
  const [caption, setCaption] = useState("");
  const [hook, setHook] = useState("jatta jatta. ny drop.");
  const [format, setFormat] = useState("Instagram Post");
  const [dailyPlan, setDailyPlan] = useState([]);
  const canvasRef = useRef(null);

  const selectedProduct = products[selectedIndex];

  async function loadProducts() {
    try {
      setStatus("Henter produkter...");
      const response = await fetch(`${BACKEND_URL}/api/products`);
      const data = await response.json();
      setProducts(data);
      setSelectedIndex(0);
      setStatus(`Fant ${data.length} produkter`);
    } catch {
      setStatus("Kunne ikke hente produkter");
    }
  }

  function generateHook(product) {
    if (!product) return;

    const hooks = [
      "jatta jatta. ny drop.",
      "same streetwear 🔥",
      "bygdefæst energi.",
      "for dæ som skjønne viben.",
      `${product.name} ute nu 👀`
    ];

    setHook(hooks[Math.floor(Math.random() * hooks.length)]);
  }

  function pickRandomProduct() {
    if (products.length === 0) return null;
    return products[Math.floor(Math.random() * products.length)];
  }

  function generateDailyPlan() {
    if (products.length === 0) {
      alert("Ingen produkter lastet inn ennå");
      return;
    }

    const slots = [
      {
        time: "09:00",
        type: "humor",
        format: "Instagram Post",
        platform: "Instagram + Facebook",
        hook: "jatta jatta. dagens første drop."
      },
      {
        time: "12:00",
        type: "music",
        format: "Instagram Story",
        platform: "Instagram + Facebook",
        hook: "music merch for dæ som skjønne viben."
      },
      {
        time: "16:00",
        type: "humor",
        format: "TikTok",
        platform: "Instagram + Facebook",
        hook: "bygdefæst energi."
      },
      {
        time: "20:00",
        type: "music",
        format: "Instagram Post",
        platform: "Instagram + Facebook",
        hook: "kveldens merch drop."
      }
    ];

    const newPlan = slots.map((slot, index) => {
      const product = pickRandomProduct();

      return {
        id: Date.now() + index,
        time: slot.time,
        platform: slot.platform,
        format: slot.format,
        productName: product?.name || "Ukjent produkt",
        productUrl: product?.url || "",
        imageUrl: product?.imageUrl || "",
        hook: slot.hook,
        caption: `${generateMerchCaption(slot.type)}\n\n${product?.name || ""}\n${product?.url || ""}`,
        status: "Planlagt"
      };
    });

    setDailyPlan(newPlan);
    localStorage.setItem("slincrazeDailyPlan", JSON.stringify(newPlan));
    setStatus("Dagsplan generert med 4 innlegg");
  }

  function usePlannedPost(post) {
    setCaption(post.caption);
    setHook(post.hook);

    const productIndex = products.findIndex(
      (product) => product.name === post.productName
    );

    if (productIndex !== -1) {
      setSelectedIndex(productIndex);
    }

    setFormat(post.format);
    setStatus(`Valgte planlagt innlegg kl ${post.time}`);
  }

  function markAsPosted(postId) {
    const updatedPlan = dailyPlan.map((post) =>
      post.id === postId ? { ...post, status: "Postet" } : post
    );

    setDailyPlan(updatedPlan);
    localStorage.setItem("slincrazeDailyPlan", JSON.stringify(updatedPlan));
  }

  function clearDailyPlan() {
    setDailyPlan([]);
    localStorage.removeItem("slincrazeDailyPlan");
    setStatus("Dagsplan slettet");
  }

  function getCanvasSize() {
    if (format === "TikTok" || format === "Instagram Story") {
      return { width: 1080, height: 1920 };
    }

    if (format === "YouTube Thumbnail") {
      return { width: 1280, height: 720 };
    }

    return { width: 1080, height: 1080 };
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    words.forEach((word) => {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line !== "") {
        ctx.fillText(line, x, currentY);
        line = word + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    });

    ctx.fillText(line, x, currentY);
  }

  function generatePromoImage() {
    if (!selectedProduct) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const size = getCanvasSize();

    canvas.width = size.width;
    canvas.height = size.height;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, size.width, size.height);

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const imageRatio = image.width / image.height;
      const canvasRatio = size.width / size.height;

      let drawWidth = size.width;
      let drawHeight = size.height;
      let drawX = 0;
      let drawY = 0;

      if (imageRatio > canvasRatio) {
        drawHeight = size.height;
        drawWidth = size.height * imageRatio;
        drawX = (size.width - drawWidth) / 2;
      } else {
        drawWidth = size.width;
        drawHeight = size.width / imageRatio;
        drawY = (size.height - drawHeight) / 2;
      }

      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

      const overlayHeight = Math.round(size.height * 0.22);

      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(0, size.height - overlayHeight, size.width, overlayHeight);

      ctx.fillStyle = "white";
      ctx.font = `bold ${Math.round(size.width * 0.065)}px Arial`;

      wrapText(
        ctx,
        hook,
        Math.round(size.width * 0.06),
        size.height - overlayHeight + 45,
        Math.round(size.width * 0.88),
        Math.round(size.width * 0.08)
      );

      ctx.font = `${Math.round(size.width * 0.032)}px Arial`;
      ctx.fillText(
        "slincraze.myspreadshop.no",
        Math.round(size.width * 0.06),
        size.height - 55
      );

      setStatus("Promo-bilde generert");
    };

    image.onerror = () => {
      setStatus("Kunne ikke laste bilde");
    };

    image.src =
      `${BACKEND_URL}/api/image-proxy?url=` +
      encodeURIComponent(selectedProduct.imageUrl);
  }

  function downloadPromoImage() {
    const canvas = canvasRef.current;

    if (!canvas || canvas.width === 0) {
      alert("Generer promo-bilde først");
      return;
    }

    const link = document.createElement("a");
    link.download = "slincraze-promo.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(caption);
    alert("Caption kopiert");
  }

  useEffect(() => {
    loadProducts();

    const savedPlan = localStorage.getItem("slincrazeDailyPlan");
    if (savedPlan) {
      setDailyPlan(JSON.parse(savedPlan));
    }
  }, []);

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #070707, #181818)",
      color: "#f5f5f5",
      fontFamily: "Arial, sans-serif",
      padding: "32px"
    },
    shell: {
      maxWidth: "1200px",
      margin: "0 auto"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "20px",
      marginBottom: "28px"
    },
    title: {
      margin: 0,
      fontSize: "42px",
      letterSpacing: "-1px",
      color: "#fff"
    },
    sub: {
      color: "#aaa",
      marginTop: "8px"
    },
    card: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "24px",
      padding: "22px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "380px 1fr",
      gap: "24px"
    },
    planGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "14px",
      marginTop: "16px"
    },
    planCard: {
      background: "#111",
      border: "1px solid #333",
      borderRadius: "18px",
      padding: "16px"
    },
    label: {
      color: "#aaa",
      fontSize: "14px",
      marginBottom: "8px",
      display: "block"
    },
    select: {
      width: "100%",
      background: "#111",
      color: "#fff",
      border: "1px solid #444",
      borderRadius: "14px",
      padding: "14px",
      fontSize: "15px",
      marginBottom: "18px"
    },
    image: {
      width: "100%",
      borderRadius: "20px",
      background: "#222",
      marginBottom: "18px"
    },
    button: {
      background: "#fff",
      color: "#000",
      border: "none",
      borderRadius: "14px",
      padding: "12px 16px",
      cursor: "pointer",
      fontWeight: "700"
    },
    darkButton: {
      background: "#222",
      color: "#fff",
      border: "1px solid #444",
      borderRadius: "14px",
      padding: "12px 16px",
      cursor: "pointer",
      fontWeight: "700"
    },
    buttons: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginTop: "16px"
    },
    textarea: {
      width: "100%",
      minHeight: "190px",
      background: "#0f0f0f",
      color: "#fff",
      border: "1px solid #333",
      borderRadius: "16px",
      padding: "16px",
      fontSize: "16px",
      marginTop: "18px",
      boxSizing: "border-box"
    },
    formatRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "20px"
    },
    canvas: {
      width: "100%",
      maxWidth: "520px",
      background: "#222",
      borderRadius: "20px",
      marginTop: "22px"
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>SlinCraze Merch Promoter</h1>
            <p style={styles.sub}>{status}</p>
          </div>

          <button style={styles.darkButton} onClick={loadProducts}>
            Oppdater produkter
          </button>
        </header>

        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={{ marginTop: 0 }}>Dagens publiseringsplan</h2>
          <p style={{ color: "#aaa" }}>
            Lager 4 innlegg for Instagram og Facebook: 09:00, 12:00, 16:00 og 20:00.
          </p>

          <div style={styles.buttons}>
            <button style={styles.button} onClick={generateDailyPlan}>
              Generer dagsplan
            </button>

            <button style={styles.darkButton} onClick={clearDailyPlan}>
              Slett dagsplan
            </button>
          </div>

          {dailyPlan.length > 0 && (
            <div style={styles.planGrid}>
              {dailyPlan.map((post) => (
                <div key={post.id} style={styles.planCard}>
                  <h3 style={{ margin: "0 0 8px" }}>{post.time}</h3>
                  <p style={{ color: "#aaa", margin: "0 0 8px" }}>
                    {post.platform}
                  </p>
                  <strong>{post.productName}</strong>
                  <p style={{ color: "#aaa" }}>{post.format}</p>
                  <p>Status: {post.status}</p>

                  <div style={styles.buttons}>
                    <button
                      style={styles.button}
                      onClick={() => usePlannedPost(post)}
                    >
                      Bruk
                    </button>

                    <button
                      style={styles.darkButton}
                      onClick={() => markAsPosted(post.id)}
                    >
                      Marker postet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <main style={styles.grid}>
          <section style={styles.card}>
            <label style={styles.label}>Produktvalg</label>

            <select
              style={styles.select}
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
            >
              {products.map((product, index) => (
                <option key={index} value={index}>
                  {product.name}
                </option>
              ))}
            </select>

            {selectedProduct && (
              <>
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  style={styles.image}
                />

                <h2 style={{ color: "#fff", marginBottom: "8px" }}>
                  {selectedProduct.name}
                </h2>

                <p style={{ color: "#aaa" }}>{selectedProduct.vibe}</p>

                <a
                  href={selectedProduct.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#fff" }}
                >
                  Åpne produkt
                </a>
              </>
            )}
          </section>

          <section style={styles.card}>
            <label style={styles.label}>Format</label>

            <div style={styles.formatRow}>
              {["Instagram Post", "Instagram Story", "TikTok", "YouTube Thumbnail"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setFormat(item)}
                    style={format === item ? styles.button : styles.darkButton}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <label style={styles.label}>Hook</label>

            <input
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              style={{
                ...styles.select,
                marginBottom: "0"
              }}
            />

            <div style={styles.buttons}>
              <button
                style={styles.button}
                onClick={() => setCaption(generateMerchCaption("humor"))}
              >
                Generer caption
              </button>

              <button
                style={styles.darkButton}
                onClick={() => generateHook(selectedProduct)}
              >
                Generer hook
              </button>

              <button style={styles.darkButton} onClick={copyCaption}>
                Kopier caption
              </button>

              <button style={styles.button} onClick={generatePromoImage}>
                Generer promo-bilde
              </button>

              <button style={styles.darkButton} onClick={downloadPromoImage}>
                Last ned bilde
              </button>
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption vises her..."
              style={styles.textarea}
            />

            <canvas ref={canvasRef} style={styles.canvas} />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;