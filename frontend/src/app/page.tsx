export default function Home() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: "600px", padding: "20px" }}>
        <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "#1f2937", marginBottom: "20px" }}>
          Memory Care
        </h1>
        <p style={{ fontSize: "20px", color: "#4b5563", marginBottom: "40px" }}>
          A compassionate platform helping Alzheimer's patients and their doctors.
        </p>
        
        <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
          <button
            style={{
              padding: "12px 32px",
              backgroundColor: "#3b82f6",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            Login
          </button>
          <button
            style={{
              padding: "12px 32px",
              backgroundColor: "#ec4899",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
