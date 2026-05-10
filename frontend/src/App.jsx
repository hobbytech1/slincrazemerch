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
  const [designStyle, setDesignStyle] = useState("Dark");
  const [imageVariation, setImageVariation] = useState("Auto");
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

  async function publishToFacebookNow() {
    if (!selectedProduct) {
      alert("Velg et produkt først");
      return;
    }

    if (!caption) {
      alert("Lag en caption først");
      return;
    }

    try {
      setStatus("Poster til Facebook...");

      const response = await fetch(`${BACKEND_URL}/api/facebook/publish-now`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          caption,
          imageUrl: selectedProduct.imageUrl,
          productName: selectedProduct.name
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Facebook posting failed");
      }

      setStatus("Facebook-post publisert 🔥");
    } catch (error) {
      console.error(error);
      setStatus("Kunne ikke poste til Facebook");
      alert(error.message);
    }
  }

  function generateHook(product) {
    if (!product) return;

    const hooks = [
      "jatta jatta. ny drop.",
      "same streetwear 🔥",
      "bygdefæst energi.",
      "for dæ som skjønne viben.",
      "snap this fit 😭",
      "ny merch. samme kaos.",
      "denne e farlig clean.",
      `${product.name} ute nu 👀`
    ];

    setHook(hooks[Math.floor(Math.random() * hooks.length)]);
  }

  function pickRandomProduct() {
    if (products.length === 0) return null;
    return products[Math.floor(Math.random() * products.length)];
  }

  function pickRandomVariation() {
    const variations = ["Center", "Zoom", "Left", "Right", "Top", "Chaos"];
    return variations[Math.floor(Math.random() * variations.length)];
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
        hook: "jatta jatta. dagens første drop.",
        designStyle: "Dark",
        imageVariation: "Center"
      },
      {
        time: "12:00",
        type: "music",
        format: "Snapchat Story",
        platform: "Snapchat",
        hook: "snap this fit 😭🔥",
        designStyle: "Chaos",
        imageVariation: "Chaos"
      },
      {
        time: "16:00",
        type: "humor",
        format: "TikTok",
        platform: "TikTok",
        hook: "bygdefæst energi.",
        designStyle: "Cinematic",
        imageVariation: "Zoom"
      },
      {
        time: "20:00",
        type: "music",
        format: "Instagram Story",
        platform: "Instagram + Facebook",
        hook: "kveldens merch drop.",
        designStyle: "Magazine",
        imageVariation: "Top"
      }
    ];

    const newPlan = slots.map((slot, index) => {
      const product = pickRandomProduct();

      return {
        id: Date.now() + index,
        time: slot.time,
        platform: slot.platform,
        format: slot.format,
        designStyle: slot.designStyle,
        imageVariation: slot.imageVariation,
        productName: product?.name || "Ukjent produkt",
        productUrl: product?.url || "",
        imageUrl: product?.imageUrl || "",
        hook: slot.hook,
        caption: `${generateMerchCaption(slot.type)}\n\n${product?.name || ""}\n${product?.url || ""}`,
        status: "Klar"
      };
    });

    setDailyPlan(newPlan);
    localStorage.setItem("slincrazeDailyPlan", JSON.stringify(newPlan));
    setStatus("Dagsplan generert med 4 innlegg");
  }

  function usePlannedPost(post) {
    setCaption(post.caption);
    setHook(post.hook);
    setFormat(post.format);
    setDesignStyle(post.designStyle || "Dark");
    setImageVariation(post.imageVariation || "Auto");

    const productIndex = products.findIndex(
      (product) => product.name === post.productName
    );

    if (productIndex !== -1) {
      setSelectedIndex(productIndex);
    }

    setStatus(`Valgte innlegg kl ${post.time}`);
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
    if (
      format === "TikTok" ||
      format === "Instagram Story" ||
      format === "Snapchat Story"
    ) {
      return { width: 1080, height: 1920 };
    }

    if (format === "YouTube Thumbnail") {
      return { width: 1280, height: 720 };
    }

    return { width: 1080, height: 1080 };
  }

  function getWrappedLines(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    words.forEach((word) => {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line !== "") {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    });

    lines.push(line.trim());
    return lines;
  }

  function drawCenteredWrappedText(ctx, text, x, centerY, maxWidth, lineHeight) {
    const lines = getWrappedLines(ctx, text, maxWidth);
    const totalHeight = lines.length * lineHeight;
    let y = centerY - totalHeight / 2 + lineHeight * 0.8;

    lines.forEach((line) => {
      ctx.fillText(line, x, y);
      y += lineHeight;
    });
  }

  function getVariationSettings() {
    const actualVariation =
      imageVariation === "Auto" ? pickRandomVariation() : imageVariation;

    const settings = {
      variation: actualVariation,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      blurBackground: false,
      darken: 0.15,
      vignette: true
    };

    if (actualVariation === "Zoom") {
      settings.zoom = 1.22;
      settings.darken = 0.28;
    }

    if (actualVariation === "Left") {
      settings.zoom = 1.1;
      settings.offsetX = -0.18;
    }

    if (actualVariation === "Right") {
      settings.zoom = 1.1;
      settings.offsetX = 0.18;
    }

    if (actualVariation === "Top") {
      settings.zoom = 1.12;
      settings.offsetY = -0.16;
    }

    if (actualVariation === "Chaos") {
      settings.zoom = 1.18;
      settings.rotation = Math.random() > 0.5 ? 0.035 : -0.035;
      settings.blurBackground = true;
      settings.darken = 0.35;
    }

    return settings;
  }

  function drawImageCover(ctx, image, size, settings) {
    const imageRatio = image.width / image.height;
    const canvasRatio = size.width / size.height;

    let drawWidth = size.width;
    let drawHeight = size.height;

    if (imageRatio > canvasRatio) {
      drawHeight = size.height;
      drawWidth = size.height * imageRatio;
    } else {
      drawWidth = size.width;
      drawHeight = size.width / imageRatio;
    }

    drawWidth *= settings.zoom;
    drawHeight *= settings.zoom;

    const drawX =
      (size.width - drawWidth) / 2 + size.width * settings.offsetX;
    const drawY =
      (size.height - drawHeight) / 2 + size.height * settings.offsetY;

    if (settings.blurBackground) {
      ctx.save();
      ctx.filter = "blur(22px)";
      ctx.drawImage(image, -40, -40, size.width + 80, size.height + 80);
      ctx.restore();

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, size.width, size.height);
    }

    ctx.save();
    ctx.translate(size.width / 2, size.height / 2);
    ctx.rotate(settings.rotation);
    ctx.translate(-size.width / 2, -size.height / 2);
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    if (settings.darken > 0) {
      ctx.fillStyle = `rgba(0,0,0,${settings.darken})`;
      ctx.fillRect(0, 0, size.width, size.height);
    }

    if (settings.vignette) {
      const gradient = ctx.createRadialGradient(
        size.width / 2,
        size.height / 2,
        size.width * 0.2,
        size.width / 2,
        size.height / 2,
        size.width * 0.75
      );

      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size.width, size.height);
    }

    return settings.variation;
  }

  function drawStickers(ctx, size) {
    const stickers = ["NEW", "DROP", "😭🔥", "JATTA", "LIMITED", "FIT CHECK"];

    for (let i = 0; i < 3; i++) {
      const text = stickers[Math.floor(Math.random() * stickers.length)];
      const x = Math.random() * size.width * 0.7 + size.width * 0.12;
      const y = Math.random() * size.height * 0.45 + size.height * 0.12;
      const rotation = Math.random() * 0.35 - 0.17;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.strokeStyle = "black";
      ctx.lineWidth = Math.round(size.width * 0.006);
      ctx.font = `bold ${Math.round(size.width * 0.055)}px Arial`;
      ctx.textAlign = "center";

      const metrics = ctx.measureText(text);
      const padding = Math.round(size.width * 0.025);

      ctx.fillRect(
        -metrics.width / 2 - padding,
        -Math.round(size.width * 0.05),
        metrics.width + padding * 2,
        Math.round(size.width * 0.075)
      );

      ctx.strokeRect(
        -metrics.width / 2 - padding,
        -Math.round(size.width * 0.05),
        metrics.width + padding * 2,
        Math.round(size.width * 0.075)
      );

      ctx.fillStyle = "black";
      ctx.fillText(text, 0, 0);

      ctx.restore();
    }
  }

  function drawDarkStyle(ctx, size, isVertical) {
    const overlayHeight = isVertical
      ? Math.round(size.height * 0.2)
      : Math.round(size.height * 0.24);

    const overlayY = isVertical
      ? Math.round(size.height * 0.68)
      : size.height - overlayHeight;

    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, overlayY, size.width, overlayHeight);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    const fontSize = isVertical
      ? Math.round(size.width * 0.085)
      : Math.round(size.width * 0.06);

    ctx.font = `bold ${fontSize}px Arial`;

    drawCenteredWrappedText(
      ctx,
      hook,
      size.width / 2,
      overlayY + overlayHeight / 2 - 18,
      Math.round(size.width * 0.82),
      Math.round(fontSize * 1.18)
    );

    ctx.font = `${Math.round(size.width * 0.033)}px Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillText(
      "slincraze.myspreadshop.no",
      size.width / 2,
      overlayY + overlayHeight - 32
    );
  }

  function drawCinematicStyle(ctx, size, isVertical) {
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(0, 0, size.width, size.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "white";

    const fontSize = isVertical
      ? Math.round(size.width * 0.095)
      : Math.round(size.width * 0.07);

    ctx.font = `bold ${fontSize}px Arial`;

    drawCenteredWrappedText(
      ctx,
      hook.toUpperCase(),
      size.width / 2,
      size.height / 2,
      Math.round(size.width * 0.78),
      Math.round(fontSize * 1.15)
    );

    ctx.font = `${Math.round(size.width * 0.032)}px Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText(
      "SLINCRAZE MERCH",
      size.width / 2,
      size.height - Math.round(size.height * 0.08)
    );
  }

  function drawMinimalStyle(ctx, size) {
    const padding = Math.round(size.width * 0.055);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, size.width, size.height);

    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.font = `bold ${Math.round(size.width * 0.046)}px Arial`;

    const lines = getWrappedLines(ctx, hook, Math.round(size.width * 0.62));
    let y = padding + Math.round(size.width * 0.045);

    lines.forEach((line) => {
      ctx.fillText(line, padding, y);
      y += Math.round(size.width * 0.055);
    });

    ctx.font = `${Math.round(size.width * 0.028)}px Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("slincraze.myspreadshop.no", padding, size.height - padding);
  }

  function drawChaosStyle(ctx, size, isVertical) {
    drawStickers(ctx, size);

    const boxWidth = Math.round(size.width * 0.86);
    const boxHeight = isVertical
      ? Math.round(size.height * 0.22)
      : Math.round(size.height * 0.28);

    const boxX = Math.round((size.width - boxWidth) / 2);
    const boxY = isVertical
      ? Math.round(size.height * 0.62)
      : Math.round(size.height * 0.58);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.strokeStyle = "black";
    ctx.lineWidth = Math.round(size.width * 0.01);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.textAlign = "center";
    ctx.fillStyle = "black";

    const fontSize = isVertical
      ? Math.round(size.width * 0.09)
      : Math.round(size.width * 0.065);

    ctx.font = `bold ${fontSize}px Arial`;

    drawCenteredWrappedText(
      ctx,
      hook,
      size.width / 2,
      boxY + boxHeight / 2 - 10,
      Math.round(boxWidth * 0.84),
      Math.round(fontSize * 1.1)
    );

    ctx.font = `bold ${Math.round(size.width * 0.036)}px Arial`;
    ctx.fillText("😭🔥 JATTA JATTA", size.width / 2, boxY + boxHeight - 28);
  }

  function drawMagazineStyle(ctx, size, isVertical) {
    const border = Math.round(size.width * 0.045);

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, size.width, size.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = Math.round(size.width * 0.018);
    ctx.strokeRect(
      border,
      border,
      size.width - border * 2,
      size.height - border * 2
    );

    ctx.textAlign = "center";
    ctx.fillStyle = "white";

    ctx.font = `bold ${Math.round(size.width * 0.045)}px Arial`;
    ctx.fillText(
      "SLINCRAZE",
      size.width / 2,
      border + Math.round(size.width * 0.065)
    );

    const fontSize = isVertical
      ? Math.round(size.width * 0.075)
      : Math.round(size.width * 0.055);

    ctx.font = `bold ${fontSize}px Arial`;

    drawCenteredWrappedText(
      ctx,
      hook,
      size.width / 2,
      size.height - Math.round(size.height * 0.2),
      Math.round(size.width * 0.76),
      Math.round(fontSize * 1.15)
    );

    ctx.font = `${Math.round(size.width * 0.028)}px Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText(
      "MERCH DROP",
      size.width / 2,
      size.height - border - Math.round(size.width * 0.03)
    );
  }

  function generatePromoImage() {
    if (!selectedProduct) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const size = getCanvasSize();
    const settings = getVariationSettings();

    canvas.width = size.width;
    canvas.height = size.height;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, size.width, size.height);

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const usedVariation = drawImageCover(ctx, image, size, settings);

      const isVertical =
        format === "TikTok" ||
        format === "Instagram Story" ||
        format === "Snapchat Story";

      if (designStyle === "Dark") drawDarkStyle(ctx, size, isVertical);
      if (designStyle === "Cinematic") drawCinematicStyle(ctx, size, isVertical);
      if (designStyle === "Minimal") drawMinimalStyle(ctx, size);
      if (designStyle === "Chaos") drawChaosStyle(ctx, size, isVertical);
      if (designStyle === "Magazine") drawMagazineStyle(ctx, size, isVertical);

      ctx.textAlign = "left";
      setStatus(`Promo-bilde generert: ${designStyle} / ${usedVariation}`);
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
    link.download = `slincraze-${designStyle.toLowerCase()}-${imageVariation
      .toLowerCase()
      .replaceAll(" ", "-")}-${format.toLowerCase().replaceAll(" ", "-")}.png`;
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
      background:
        "radial-gradient(circle at top left, #2b2b2b, transparent 34%), linear-gradient(135deg, #050505, #141414)",
      color: "#f5f5f5",
      fontFamily: "Arial, sans-serif",
      padding: "34px"
    },
    shell: {
      maxWidth: "1280px",
      margin: "0 auto"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "20px",
      marginBottom: "28px"
    },
    badge: {
      display: "inline-block",
      padding: "7px 12px",
      background: "rgba(255,255,255,0.1)",
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: "999px",
      color: "#bbb",
      fontSize: "13px",
      marginBottom: "12px"
    },
    title: {
      margin: 0,
      fontSize: "44px",
      letterSpacing: "-1.5px",
      color: "#fff"
    },
    sub: {
      color: "#aaa",
      marginTop: "9px"
    },
    card: {
      background: "rgba(255,255,255,0.065)",
      border: "1px solid rgba(255,255,255,0.13)",
      borderRadius: "26px",
      padding: "24px",
      boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
      backdropFilter: "blur(10px)"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "390px 1fr",
      gap: "24px"
    },
    planGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(235px, 1fr))",
      gap: "14px",
      marginTop: "16px"
    },
    planCard: {
      background: "rgba(0,0,0,0.33)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "20px",
      padding: "17px"
    },
    label: {
      color: "#b5b5b5",
      fontSize: "14px",
      marginBottom: "8px",
      display: "block",
      fontWeight: "700"
    },
    select: {
      width: "100%",
      background: "#0f0f0f",
      color: "#fff",
      border: "1px solid #3a3a3a",
      borderRadius: "15px",
      padding: "14px",
      fontSize: "15px",
      marginBottom: "18px",
      outline: "none"
    },
    image: {
      width: "100%",
      borderRadius: "22px",
      background: "#222",
      marginBottom: "18px"
    },
    button: {
      background: "#fff",
      color: "#000",
      border: "none",
      borderRadius: "15px",
      padding: "12px 16px",
      cursor: "pointer",
      fontWeight: "800"
    },
    facebookButton: {
      background: "#1877F2",
      color: "#fff",
      border: "none",
      borderRadius: "15px",
      padding: "12px 16px",
      cursor: "pointer",
      fontWeight: "800"
    },
    darkButton: {
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: "15px",
      padding: "12px 16px",
      cursor: "pointer",
      fontWeight: "800"
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
      background: "#0d0d0d",
      color: "#fff",
      border: "1px solid #333",
      borderRadius: "18px",
      padding: "16px",
      fontSize: "16px",
      marginTop: "18px",
      boxSizing: "border-box",
      outline: "none"
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
      borderRadius: "22px",
      marginTop: "22px",
      border: "1px solid rgba(255,255,255,0.12)"
    },
    sectionTitle: {
      marginTop: 0,
      marginBottom: "8px",
      color: "#fff"
    },
    muted: {
      color: "#aaa"
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <span style={styles.badge}>Creator merch engine</span>
            <h1 style={styles.title}>SlinCraze Merch Promoter</h1>
            <p style={styles.sub}>{status}</p>
          </div>

          <button style={styles.darkButton} onClick={loadProducts}>
            Oppdater produkter
          </button>
        </header>

        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>Dagens innholdsplan</h2>
          <p style={styles.muted}>
            Generer 4 ferdige poster med produkt, hook, caption, format og designstil.
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
                  <p style={styles.muted}>{post.platform}</p>
                  <strong>{post.productName}</strong>
                  <p style={styles.muted}>{post.format}</p>
                  <p>Design: {post.designStyle || "Dark"}</p>
                  <p>Variation: {post.imageVariation || "Auto"}</p>
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
            <h2 style={styles.sectionTitle}>Produkt</h2>

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

                <p style={styles.muted}>{selectedProduct.vibe}</p>

                <a
                  href={selectedProduct.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#fff", fontWeight: "700" }}
                >
                  Åpne produkt
                </a>
              </>
            )}
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Lag promo</h2>

            <label style={styles.label}>Format</label>

            <div style={styles.formatRow}>
              {[
                "Instagram Post",
                "Instagram Story",
                "Snapchat Story",
                "TikTok",
                "YouTube Thumbnail"
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => setFormat(item)}
                  style={format === item ? styles.button : styles.darkButton}
                >
                  {item}
                </button>
              ))}
            </div>

            <label style={styles.label}>Designstil</label>

            <div style={styles.formatRow}>
              {["Dark", "Cinematic", "Minimal", "Chaos", "Magazine"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setDesignStyle(item)}
                    style={
                      designStyle === item ? styles.button : styles.darkButton
                    }
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <label style={styles.label}>Bildevariasjon</label>

            <div style={styles.formatRow}>
              {["Auto", "Center", "Zoom", "Left", "Right", "Top", "Chaos"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setImageVariation(item)}
                    style={
                      imageVariation === item ? styles.button : styles.darkButton
                    }
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

              <button style={styles.facebookButton} onClick={publishToFacebookNow}>
                Publiser til Facebook nå
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