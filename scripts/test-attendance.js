/**
 * Script de prueba para verificar que el endpoint /markTime funciona.
 * Ejecutar: node scripts/test-attendance.js
 */
require("dotenv").config();
const http = require("http");

// Lee el token de los args o usa uno de prueba
const token = process.argv[2];
if (!token) {
    console.error("❌ Uso: node scripts/test-attendance.js <TOKEN_JWT>");
    console.error("   El token se obtiene haciendo login desde el frontend.");
    process.exit(1);
}

const body = JSON.stringify({ type: "entry" });

const options = {
    hostname: "localhost",
    port: 8080,
    path: "/api/v1/markTime",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "Authorization": `Bearer ${token}`,
    },
};

console.log("🔄 Enviando POST /api/v1/markTime con type=entry...");

const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
        console.log(`\n📡 Status: ${res.statusCode}`);
        try {
            const json = JSON.parse(data);
            console.log("📦 Response:", JSON.stringify(json, null, 2));
        } catch {
            console.log("📦 Response (raw):", data);
        }
    });
});

req.on("error", (err) => {
    console.error("❌ Error de conexión:", err.message);
});

req.write(body);
req.end();
