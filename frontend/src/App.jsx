import { useEffect, useRef, useState } from "react";

const BACKEND_URL = "https://slincrazemerch.onrender.com";

function App() {
  const [products, setProducts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState("Laster produkter...");
  const [caption, setCaption] = useState("");
  const [hook, setHook] = useState("jatta jatta. ny drop.");
  const [format, setFormat] = useState("Instagram Post");
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

  function generateCaption(product) {
    if (!product) return;

    const captions = [
      `Jatta jatta 😏\n\n${product.name} e ute nu 🔥\n\n👉 ${product.url}\n\n#slincraze #merch`,
      `Ny merch ute 👀\n\n${product.name}\n\n🛒 ${product.url}`,
      `${product.name}\n\nFor dæ som skjønne viben 😮‍💨\n\n${product.url}`
    ];

    setCaption(captions[Math.floor(Math.random() * captions.length)]);
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
                onClick={() => setCaption(generateCaption("humor"))}
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