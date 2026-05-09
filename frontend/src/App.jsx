import { useEffect, useRef, useState } from "react";

const BACKEND_URL = "https://slincrazemerch.onrender.com";

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [status, setStatus] = useState("Laster produkter...");
  const [caption, setCaption] = useState("");
  const [hook, setHook] = useState("jatta jatta. ny drop.");
  const [format, setFormat] = useState("Instagram Post");

  const canvasRef = useRef(null);

  async function loadProducts() {
    try {
      setStatus("Henter produkter fra backend...");

      const response = await fetch(`${BACKEND_URL}/api/products`);
      const data = await response.json();

      setProducts(data);

      if (data.length > 0) {
        setSelectedProduct(data[0]);
      }

      setStatus(`Fant ${data.length} produkter`);
    } catch (error) {
      setStatus("Kunne ikke hente produkter fra backend");
    }
  }

  function generateCaption(product) {
    if (!product) return;

    const captions = [
      `Jatta jatta 😏

${product.name} e ute nu 🔥

👉 ${product.url}

#slincraze #merch`,

      `Ny merch ute 👀

${product.name}

🛒 ${product.url}`,

      `${product.name}

For dæ som skjønne viben 😮‍💨

${product.url}`
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

    const proxiedImageUrl =
      `${BACKEND_URL}/api/image-proxy?url=` +
      encodeURIComponent(selectedProduct.imageUrl);

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

      ctx.fillStyle = "rgba(0,0,0,0.72)";
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
      setStatus("Kunne ikke laste bilde via backend image-proxy");
      alert("Kunne ikke laste bilde via backend image-proxy");
    };

    image.src = proxiedImageUrl;
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
    try {
      await navigator.clipboard.writeText(caption);
      alert("Caption kopiert");
    } catch (error) {
      alert("Kunne ikke kopiere");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div
      style={{
        background: "#111",
        color: "white",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial"
      }}
    >
      <h1>SlinCraze Merch App</h1>
      <p>{status}</p>

      <button onClick={loadProducts}>Hent produkter på nytt</button>

      {selectedProduct && (
        <div
          style={{
            marginTop: "30px",
            marginBottom: "40px",
            background: "#1b1b1b",
            padding: "20px",
            borderRadius: "20px",
            border: "2px solid white"
          }}
        >
          <h2>Valgt produkt</h2>

          <img
            src={selectedProduct.imageUrl}
            alt={selectedProduct.name}
            style={{
              width: "300px",
              borderRadius: "18px"
            }}
          />

          <h3>{selectedProduct.name}</h3>

          <h3>Velg format</h3>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {["Instagram Post", "Instagram Story", "TikTok", "YouTube Thumbnail"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setFormat(item)}
                  style={{
                    background: format === item ? "white" : "#222",
                    color: format === item ? "black" : "white",
                    border: "1px solid #444",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    cursor: "pointer"
                  }}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "20px"
            }}
          >
            <button onClick={() => generateCaption(selectedProduct)}>
              Generer caption
            </button>

            <button onClick={() => generateHook(selectedProduct)}>
              Generer hook
            </button>

            <button onClick={copyCaption}>Kopier caption</button>

            <button onClick={generatePromoImage}>Generer promo-bilde</button>

            <button onClick={downloadPromoImage}>Last ned bilde</button>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{
              width: "100%",
              minHeight: "180px",
              marginTop: "20px",
              background: "#222",
              color: "white",
              border: "1px solid #444",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "16px"
            }}
          />

          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              maxWidth: "500px",
              marginTop: "30px",
              borderRadius: "18px",
              background: "#222"
            }}
          />

          <a
            href={selectedProduct.url}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "white",
              display: "block",
              marginTop: "20px"
            }}
          >
            Åpne produkt
          </a>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px"
        }}
      >
        {products.map((product, index) => (
          <div
            key={`${product.name}-${index}`}
            onClick={() => setSelectedProduct(product)}
            style={{
              background:
                selectedProduct?.imageUrl === product.imageUrl
                  ? "#2b2b2b"
                  : "#1c1c1c",
              border:
                selectedProduct?.imageUrl === product.imageUrl
                  ? "2px solid white"
                  : "1px solid #333",
              borderRadius: "18px",
              padding: "16px",
              cursor: "pointer"
            }}
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                borderRadius: "14px",
                background: "#333"
              }}
            />

            <h2 style={{ fontSize: "18px" }}>{product.name}</h2>

            <p style={{ color: "#aaa" }}>{product.vibe}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;