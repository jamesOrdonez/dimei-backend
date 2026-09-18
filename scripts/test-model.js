require("dotenv").config();

// Simular tokenData como lo hace verifyToken
const fakeTokenData = { userId: 1, rolId: 1, company: 1 };

async function testMarkTime() {
    try {
        const TimeRecord = require("../src/models/TimeRecord");
        const Rol = require("../src/models/rol");
        const sequelize = require("../src/db/conection");

        await sequelize.authenticate();
        console.log("✅ BD conectada");

        // Simular la función toLocalDateStr
        function toLocalDateStr(date) {
            const d = new Date(date);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        }

        const now = new Date();
        const todayStr = toLocalDateStr(now);
        console.log("📅 Fecha hoy:", todayStr);

        // Verificar rol
        const rol = await Rol.findByPk(fakeTokenData.rolId);
        console.log("👤 Rol encontrado:", rol ? rol.name : "NO ENCONTRADO");

        // Intentar findOrCreate
        console.log("🔄 Intentando findOrCreate...");
        const [record, created] = await TimeRecord.findOrCreate({
            where: { user_id: fakeTokenData.userId, record_date: todayStr },
            defaults: {
                user_id: fakeTokenData.userId,
                company: fakeTokenData.company,
                record_date: todayStr,
                is_holiday: 0,
            },
        });

        console.log("✅ findOrCreate OK. Creado:", created);
        console.log("📦 Registro:", JSON.stringify(record.toJSON(), null, 2));

        // Intentar update
        console.log("🔄 Intentando update entry_time...");
        await record.update({ entry_time: now });
        console.log("✅ Update OK");

        process.exit(0);
    } catch (error) {
        console.error("❌ ERROR:", error.message);
        console.error("Stack:", error.stack);
        process.exit(1);
    }
}

testMarkTime();
