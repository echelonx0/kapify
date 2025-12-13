// zoho-token-exchange.js
const fetch = require("node-fetch");

const code =
  "1000.8c0a4c3a96b6b59c364291b0c3315d75.8165a09c1358cfe15547eec3f478052d";

fetch("https://accounts.zoho.com/oauth/v2/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    client_id: "1000.RHBWETD3YIVHLEG8ESWQSWFYWR2SPE",
    client_secret: "5c47abd082e2191d850e7f000b0b66155ca7d91a51",
    redirect_uri: "http://kapify.africa/invoice",
    code: code,
  }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ Response:", JSON.stringify(data, null, 2));
    if (data.refresh_token) {
      console.log("\n🎯 REFRESH TOKEN:");
      console.log(data.refresh_token);
    }
  })
  .catch((err) => console.error("❌ Error:", err));
