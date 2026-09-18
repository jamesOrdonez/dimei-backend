const { calcularHorasExtra } = require("../src/controllers/attendance.controller");

console.log("🧪 Iniciando pruebas de cálculo de horas extra...\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

// ─── 1. CASO PRINCIPAL DE SALIDA (17:00 a 21:45) ──────────────────────────────
// Horario 08:00 a 17:00, salida 21:45 -> 4 horas extra (2 diurnas, 2 nocturnas)
{
    const schedule = { entry_time: "08:00:00", exit_time: "17:00:00" };
    const record = {
        record_date: "2026-09-15", // Martes hábil
        entry_time: "2026-09-15T08:00:00",
        exit_time: "2026-09-15T21:45:00",
    };
    const res = calcularHorasExtra(record, schedule);
    console.log("Caso salida tarde (17:00 a 21:45):", res);
    assert(res.totalExtra === 4, "Total horas extra debe ser 4");
    assert(res.diurna === 2, "Horas diurnas deben ser 2");
    assert(res.nocturna === 2, "Horas nocturnas deben ser 2");
    assert(res.extraSalida === 4, "Extra salida debe ser 4");
    assert(res.extraEntrada === 0, "Extra entrada debe ser 0");
}

// ─── 2. CASO ENTRADA TEMPRANO EN LA MAÑANA (05:00 a 08:00) ────────────────────
// Usuario: "si el horario era a las 8 e inicio a las 5, ahi son 3 horas extra"
// 05:00 a 06:00 es nocturna (1h), 06:00 a 08:00 es diurna (2h) -> Total 3
{
    const schedule = { entry_time: "08:00:00", exit_time: "17:00:00" };
    const record = {
        record_date: "2026-09-15",
        entry_time: "2026-09-15T05:00:00",
        exit_time: "2026-09-15T17:00:00",
    };
    const res = calcularHorasExtra(record, schedule);
    console.log("Caso entrada temprana (05:00 a 08:00):", res);
    assert(res.totalExtra === 3, "Total horas extra debe ser 3");
    assert(res.extraEntrada === 3, "Extra entrada debe ser 3");
    assert(res.extraSalida === 0, "Extra salida debe ser 0");
    assert(res.diurna === 2, "Diurnas deben ser 2 (06:00 a 08:00)");
    assert(res.nocturna === 1, "Nocturnas deben ser 1 (05:00 a 06:00)");
    assert(res.detalleEntrada.diurna === 2, "Detalle entrada diurna debe ser 2");
    assert(res.detalleEntrada.nocturna === 1, "Detalle entrada nocturna debe ser 1");
}

// ─── 3. ENTRADA TEMPRANO CON GAVELA (07:15 a 08:00 = 45 min) ──────────────────
{
    const schedule = { entry_time: "08:00:00", exit_time: "17:00:00" };
    const record = {
        record_date: "2026-09-15",
        entry_time: "2026-09-15T07:15:00",
        exit_time: "2026-09-15T17:00:00",
    };
    const res = calcularHorasExtra(record, schedule);
    assert(res.totalExtra === 1, "45 min antes debe otorgar 1 hora extra");
    assert(res.extraEntrada === 1, "Extra entrada debe ser 1");
    assert(res.diurna === 1, "07:15 a 08:00 debe ser diurna");
}

// ─── 4. ENTRADA TEMPRANO Y SALIDA TARDE SIMULTÁNEAS ────────────────────────────
// Entrada 05:00 (3h extra: 1 noct, 2 diur) y Salida 21:45 (4h extra: 2 diur, 2 noct)
{
    const schedule = { entry_time: "08:00:00", exit_time: "17:00:00" };
    const record = {
        record_date: "2026-09-15",
        entry_time: "2026-09-15T05:00:00",
        exit_time: "2026-09-15T21:45:00",
    };
    const res = calcularHorasExtra(record, schedule);
    console.log("Caso entrada temprana y salida tarde:", res);
    assert(res.totalExtra === 7, "Total extra debe ser 3 + 4 = 7");
    assert(res.extraEntrada === 3, "Extra entrada debe ser 3");
    assert(res.extraSalida === 4, "Extra salida debe ser 4");
    assert(res.diurna === 4, "Total diurnas debe ser 4 (2 entrada + 2 salida)");
    assert(res.nocturna === 3, "Total nocturnas debe ser 3 (1 entrada + 2 salida)");
}

// ─── 5. TURNO ENTRE DOS DÍAS (Viernes noche a Sábado mañana) ───────────────────
// Empleado que labora viernes 20:00 a sábado 06:00 (10 horas nocturnas)
{
    const schedule = { entry_time: "08:00:00", exit_time: "17:00:00" };
    const record = {
        record_date: "2026-09-18", // Viernes
        entry_time: "2026-09-18T20:00:00",
        exit_time: "2026-09-19T06:00:00", // Sábado mañana
    };
    const res = calcularHorasExtra(record, schedule);
    console.log("Caso viernes noche a sábado mañana (20:00 a 06:00):", res);
    assert(res.totalExtra === 10, "Total horas extra debe ser 10");
    assert(res.nocturna === 10, "Todas las 10 horas son nocturnas (20:00 a 06:00)");
    assert(res.diurna === 0, "0 diurnas");
}

// ─── 6. TURNO ENTRE DOS DÍAS CRUCE A DOMINGO ──────────────────────────────────
// Sábado 22:00 a Domingo 06:00:
// 22:00 a 24:00 (2h) sábado noche -> nocturna ordinaria
// 00:00 a 06:00 (6h) domingo madrugada -> nocturnaDF
{
    const schedule = { entry_time: "08:00:00", exit_time: "12:00:00" };
    const record = {
        record_date: "2026-09-19", // Sábado
        entry_time: "2026-09-19T22:00:00",
        exit_time: "2026-09-20T06:00:00", // Domingo
    };
    const res = calcularHorasExtra(record, schedule);
    console.log("Caso sábado noche a domingo mañana:", res);
    assert(res.totalExtra === 8, "Total horas extra debe ser 8");
    assert(res.nocturna === 2, "2 horas nocturnas ordinarias sábado");
    assert(res.nocturnaDF === 6, "6 horas nocturnas dominicales domingo");
}

// ─── 7. DOMINICAL / FESTIVO PURA ──────────────────────────────────────────────
{
    const schedule = { entry_time: "08:00:00", exit_time: "17:00:00" };
    const record = {
        record_date: "2026-09-13", // Domingo
        entry_time: "2026-09-13T08:00:00",
        exit_time: "2026-09-13T12:45:00", // 285 min
    };
    const res = calcularHorasExtra(record, schedule);
    assert(res.totalExtra === 4, "285 min dominical debe ser 4 horas extra");
    assert(res.diurnaDF === 4, "08:00 a 12:00 son 4 diurnas DF");
}

console.log(`\n📋 Resumen: ${passed} pruebas superadas, ${failed} fallidas.`);
if (failed > 0) {
    process.exit(1);
} else {
    console.log("🎉 Todas las pruebas pasaron satisfactoriamente.");
}
