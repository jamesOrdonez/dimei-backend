const httpStatus = require("http-status");
const { Op } = require("sequelize");
const { getColombiaHolidaysByYear } = require("colombia-holidays");

const TimeRecord = require("../models/TimeRecord");
const TimeMarkingLog = require("../models/TimeMarkingLog");
const RolSchedule = require("../models/RolSchedule");
const User = require("../models/user");
const Rol = require("../models/rol");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { base64ToFile } = require("../utils/fileUpload");

const ModuleName = "attendance";

// ─── Utilidades ────────────────────────────────────────────────────────────────

/**
 * Convierte una cadena TIME "HH:MM:SS" a minutos desde medianoche.
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}

/**
 * Retorna los minutos desde medianoche de un objeto Date (hora local).
 */
function dateToMinutesOfDay(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.getHours() * 60 + d.getMinutes();
}

/**
 * Retorna la fecha local como cadena YYYY-MM-DD sin depender de toLocaleDateString.
 * @param {Date} date
 */
function toLocalDateStr(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/**
 * Retorna una clave única que identifica la semana ISO (lunes-domingo) de una fecha.
 * Formato: "YYYY-Wnn"  (ej. "2026-W38")
 * @param {string} dateStr  YYYY-MM-DD
 * @returns {string}
 */
function getISOWeekKey(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Desplazar al jueves de la misma semana ISO para obtener el año y número de semana correctos
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Retorna la fecha YYYY-MM-DD del sábado correspondiente a la semana de una fecha dada.
 * En semana ISO (lunes a domingo), el sábado es el día 6 de la semana.
 * @param {string} dateStr YYYY-MM-DD
 * @returns {string}
 */
function getSaturdayDateOfWeek(dateStr) {
    const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const day = dateObj.getDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sáb
    const diffDays = day === 0 ? -1 : (6 - day);
    dateObj.setDate(dateObj.getDate() + diffDays);
    return toLocalDateStr(dateObj);
}

/**
 * Obtiene la información del festivo colombiano si la fecha corresponde a uno.
 * @param {Date|string} date
 * @returns {Object|null} Objeto con información del festivo o null si es día hábil
 */
function getColombianHolidayInfo(date) {
    const d = typeof date === "string" && date.length === 10 ? new Date(date + "T00:00:00") : new Date(date);
    const year = d.getFullYear();
    const holidays = getColombiaHolidaysByYear(year);
    const dateStr = toLocalDateStr(d);
    return holidays.find((h) => h.holiday === dateStr) || null;
}

/**
 * Verifica si una fecha es festivo colombiano.
 * @param {Date|string} date
 */
function isColombianHoliday(date) {
    return Boolean(getColombianHolidayInfo(date));
}

/**
 * Verifica si una fecha es domingo O festivo colombiano según el calendario oficial.
 */
function isSundayOrHoliday(date, isHolidayFlag) {
    if (isHolidayFlag) return true;
    const d = typeof date === "string" && date.length === 10 ? new Date(date + "T00:00:00") : new Date(date);
    return d.getDay() === 0 || isColombianHoliday(d);
}

/**
 * Calcula los minutos netos trabajados descontando almuerzo.
 */
function calcularMinutosNeto(record) {
    if (!record.entry_time || !record.exit_time) return 0;
    const entryMs = new Date(record.entry_time).getTime();
    const exitMs = new Date(record.exit_time).getTime();
    let brutoMin = (exitMs - entryMs) / 60000;
    if (brutoMin <= 0) return 0;
    let almuerzoDurMin = 0;
    const isLunchSkipped = Boolean(
        record.lunch_omitted ||
        (record.lunch_start && record.lunch_end && new Date(record.lunch_start).getTime() === new Date(record.lunch_end).getTime())
    );
    if (!isLunchSkipped) {
        if (record.lunch_start && record.lunch_end) {
            const lsMs = new Date(record.lunch_start).getTime();
            const leMs = new Date(record.lunch_end).getTime();
            almuerzoDurMin = Math.max(0, (leMs - lsMs) / 60000);
        } else if (brutoMin >= 300) {
            // Siempre se descuenta la hora de almuerzo (60 min) si la jornada es de 5 horas o más y no fue omitido
            almuerzoDurMin = 60;
        }
    }
    return Math.max(0, Math.round(brutoMin - almuerzoDurMin));
}

/**
 * Clasifica un timestamp exacto (ms o Date) según las normas laborales de Colombia:
 * - Nocturna: 19:00 a 06:00
 * - Diurna: 06:00 a 19:00
 * - DF (Dominical / Festivo): Domingos o Festivos colombianos oficiales
 *
 * @param {number|Date} dateOrMs
 * @returns {"nocturnaDF" | "diurnaDF" | "nocturna" | "diurna"}
 */
function classifyTimestamp(dateOrMs) {
    const d = new Date(dateOrMs);
    const isDF = isSundayOrHoliday(d);
    const minOfDay = d.getHours() * 60 + d.getMinutes();
    const isNight = minOfDay >= 19 * 60 || minOfDay < 6 * 60;

    if (isDF) {
        return isNight ? "nocturnaDF" : "diurnaDF";
    }
    return isNight ? "nocturna" : "diurna";
}

/**
 * Calcula horas extra a partir de los tiempos marcados y el horario del rol.
 *
 * Reglas:
 * - Se descuenta el tiempo de almuerzo.
 * - Gavela de 45 minutos: solo aplica para habilitar la primera hora extra (45 a 119 min = 1h).
 * - Posterior a la primera hora, se computa por hora cumplida (120-179m = 2h, 180-239m = 3h, etc.).
 * - Horas extra en la mañana: se computan si la llegada fue antes del horario estipulado de entrada.
 * - Horas extra en la tarde/noche: se computan si la salida fue posterior al horario estipulado de salida.
 * - Soporte de turnos entre 2 días (cruce de medianoche / noche a mañana).
 * - La jornada nocturna en Colombia inicia a las 19:00 (7PM) y termina a las 06:00 (6AM).
 * - Si el momento corresponde a domingo o festivo, se clasifica como dominical/festivo.
 *
 * @param {Object} record   - Registro de tiempo (TimeRecord)
 * @param {Object} schedule - Horario del rol (RolSchedule)
 * @returns {Object} { diurna, nocturna, diurnaDF, nocturnaDF, totalExtra, minutosNeto, extraEntrada, extraSalida, detalleEntrada, detalleSalida }
 */
function calcularHorasExtra(record, schedule) {
    const result = {
        diurna: 0,
        nocturna: 0,
        diurnaDF: 0,
        nocturnaDF: 0,
        totalExtra: 0,
        minutosNeto: 0,
        extraEntrada: 0,
        extraSalida: 0,
        detalleEntrada: { diurna: 0, nocturna: 0, diurnaDF: 0, nocturnaDF: 0, total: 0 },
        detalleSalida: { diurna: 0, nocturna: 0, diurnaDF: 0, nocturnaDF: 0, total: 0 },
    };

    if (!record.entry_time || !record.exit_time) return result;

    const netoMin = calcularMinutosNeto(record);
    result.minutosNeto = netoMin;

    const actualEntry = new Date(record.entry_time);
    const actualExit = new Date(record.exit_time);
    if (actualExit.getTime() <= actualEntry.getTime()) return result;

    const recordDateStr = typeof record.record_date === "string" ? record.record_date.slice(0, 10) : toLocalDateStr(record.record_date);
    const esDomFestivo = isSundayOrHoliday(recordDateStr, record.is_holiday === 1);

    // ─── CASO DOMINICAL / FESTIVO ──────────────────────────────────────────────
    // Si el día base es domingo o festivo colombiano, todo el tiempo laborado es dominical/festivo
    if (esDomFestivo) {
        if (netoMin < 45) return result;
        const horasExtra = Math.max(1, Math.floor(netoMin / 60));
        result.totalExtra = horasExtra;
        result.extraSalida = horasExtra;

        for (let k = 0; k < horasExtra; k++) {
            const blockStartMs = actualEntry.getTime() + k * 60 * 60000;
            const blockDurationMs = (k === 0 && horasExtra === 1 && netoMin < 60)
                ? netoMin * 60000
                : 60 * 60000;

            let nightMins = 0;
            const blockDurationMin = Math.round(blockDurationMs / 60000);
            for (let m = 0; m < blockDurationMin; m++) {
                const t = blockStartMs + m * 60000;
                const type = classifyTimestamp(t);
                if (type === "nocturnaDF" || type === "nocturna") nightMins++;
            }

            if (nightMins > blockDurationMin / 2) {
                result.nocturnaDF++;
                result.detalleSalida.nocturnaDF++;
            } else {
                result.diurnaDF++;
                result.detalleSalida.diurnaDF++;
            }
        }
        result.detalleSalida.total = horasExtra;
        return result;
    }

    if (!schedule) return result;

    const recordDateObj = new Date(recordDateStr + "T00:00:00");
    const isSaturday = recordDateObj.getDay() === 6;

    // Horarios esperados según el rol (reconociendo sábados si aplica)
    let schedEntryTimeStr = schedule.entry_time;
    let schedExitTimeStr = schedule.exit_time;
    if (isSaturday) {
        if (schedule.saturday_entry_time) schedEntryTimeStr = schedule.saturday_entry_time;
        if (schedule.saturday_exit_time) schedExitTimeStr = schedule.saturday_exit_time;
    }

    if (!schedEntryTimeStr || !schedExitTimeStr) return result;

    const schedEntryMin = timeToMinutes(schedEntryTimeStr);
    const schedExitMin = timeToMinutes(schedExitTimeStr);

    const schedEntryDate = new Date(`${recordDateStr}T${schedEntryTimeStr}`);
    let schedExitDate;
    if (schedExitMin > schedEntryMin) {
        schedExitDate = new Date(`${recordDateStr}T${schedExitTimeStr}`);
    } else {
        // Turno nocturno que cruza medianoche (ej. 22:00 a 06:00)
        const nextDay = new Date(recordDateObj);
        nextDay.setDate(nextDay.getDate() + 1);
        schedExitDate = new Date(`${toLocalDateStr(nextDay)}T${schedExitTimeStr}`);
    }

    // ─── 1. HORAS EXTRA EN LA MAÑANA (Ingreso antes del horario estipulado) ────
    if (actualEntry.getTime() < schedEntryDate.getTime()) {
        const earlyEndMs = Math.min(actualExit.getTime(), schedEntryDate.getTime());
        const earlyMinutes = Math.max(0, Math.round((earlyEndMs - actualEntry.getTime()) / 60000));

        if (earlyMinutes >= 45) {
            const horasEarly = Math.max(1, Math.floor(earlyMinutes / 60));
            result.extraEntrada = horasEarly;

            // Evaluamos bloques de 60 min hacia atrás desde schedEntryDate
            for (let k = 0; k < horasEarly; k++) {
                const blockEndMs = schedEntryDate.getTime() - k * 60 * 60000;
                const blockDurationMin = (k === 0 && horasEarly === 1 && earlyMinutes < 60)
                    ? earlyMinutes
                    : 60;
                const blockStartMs = blockEndMs - blockDurationMin * 60000;

                let counts = { diurna: 0, nocturna: 0, diurnaDF: 0, nocturnaDF: 0 };
                for (let m = 0; m < blockDurationMin; m++) {
                    const t = blockStartMs + m * 60000;
                    const cType = classifyTimestamp(t);
                    counts[cType] = (counts[cType] || 0) + 1;
                }

                const dominantType = Object.keys(counts).reduce((a, b) => counts[a] >= counts[b] ? a : b);
                result[dominantType] = (result[dominantType] || 0) + 1;
                result.detalleEntrada[dominantType] = (result.detalleEntrada[dominantType] || 0) + 1;
                result.detalleEntrada.total++;
            }
        }
    }

    // ─── 2. HORAS EXTRA EN LA TARDE / NOCHE (Salida después del horario) ──────
    if (actualExit.getTime() > schedExitDate.getTime()) {
        const lateStartMs = Math.max(actualEntry.getTime(), schedExitDate.getTime());
        const lateMinutes = Math.max(0, Math.round((actualExit.getTime() - lateStartMs) / 60000));

        if (lateMinutes >= 45) {
            const horasLate = Math.max(1, Math.floor(lateMinutes / 60));
            result.extraSalida = horasLate;

            // Evaluamos bloques de 60 min hacia adelante desde lateStartMs
            for (let k = 0; k < horasLate; k++) {
                const blockStartMs = lateStartMs + k * 60 * 60000;
                const blockDurationMin = (k === 0 && horasLate === 1 && lateMinutes < 60)
                    ? lateMinutes
                    : 60;

                let counts = { diurna: 0, nocturna: 0, diurnaDF: 0, nocturnaDF: 0 };
                for (let m = 0; m < blockDurationMin; m++) {
                    const t = blockStartMs + m * 60000;
                    const cType = classifyTimestamp(t);
                    counts[cType] = (counts[cType] || 0) + 1;
                }

                const dominantType = Object.keys(counts).reduce((a, b) => counts[a] >= counts[b] ? a : b);
                result[dominantType] = (result[dominantType] || 0) + 1;
                result.detalleSalida[dominantType] = (result.detalleSalida[dominantType] || 0) + 1;
                result.detalleSalida.total++;
            }
        }
    }

    result.totalExtra = (result.extraEntrada || 0) + (result.extraSalida || 0);
    return result;
}

// ─── Controladores ─────────────────────────────────────────────────────────────

/**
 * POST /markTime
 * Body: { type: "entry" | "lunch_start" | "lunch_end" | "skip_lunch" | "exit" }
 * Registra o actualiza la marcación del usuario autenticado para hoy.
 * No permite marcar si el rol es Administrador.
 */
async function markTime(req, res) {
    try {
        const { userId, rolId, company } = req.tokenData;
        const { type, photo, latitude, longitude, accuracy, justification } = req.body;

        const COLUMN_MAP = {
            entry: "entry_time",
            entry_time: "entry_time",
            lunch_start: "lunch_start",
            lunch_end: "lunch_end",
            skip_lunch: "lunch_omitted",
            exit: "exit_time",
            exit_time: "exit_time",
        };
        const targetColumn = COLUMN_MAP[type];

        if (!targetColumn) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Tipo de marcación inválido. Use: entry, lunch_start, lunch_end, skip_lunch, exit",
                module: ModuleName,
            });
        }

        // Bloquear Administradores
        const rol = await Rol.findByPk(rolId);
        if (rol && rol.name === "Administrador") {
            return res.status(httpStatus.FORBIDDEN).json({
                message: "Los administradores no registran marcaciones de tiempo.",
                module: ModuleName,
            });
        }

        await autoCloseUnclosedRecords();
        const now = new Date();
        // Fecha de hoy en formato YYYY-MM-DD (local, sin dependencia de locale)
        const todayStr = toLocalDateStr(now);

        // Si no es una entrada ("entry"), buscar primero si el usuario tiene un turno abierto activo
        // (por ejemplo si inició un viernes en la noche y está marcando salida o almuerzo el sábado en la mañana)
        let record = null;
        let created = false;
        if (type !== "entry") {
            record = await TimeRecord.findOne({
                where: {
                    user_id: userId,
                    exit_time: null,
                    entry_time: { [Op.ne]: null },
                },
                order: [["id", "DESC"]],
            });
        }

        // Si no hay turno abierto previo o es una nueva entrada ("entry"), buscar o crear el registro de hoy
        if (!record) {
            [record, created] = await TimeRecord.findOrCreate({
                where: { user_id: userId, record_date: todayStr },
                defaults: {
                    user_id: userId,
                    company,
                    record_date: todayStr,
                    is_holiday: isColombianHoliday(now) ? 1 : 0,
                },
            });
        }

        const isLunchSkipped = Boolean(
            record.lunch_omitted ||
            (record.lunch_start && record.lunch_end && new Date(record.lunch_start).getTime() === new Date(record.lunch_end).getTime())
        );

        // Verificar orden secuencial de marcaciones
        if ((type === "lunch_start" || type === "skip_lunch") && !record.entry_time) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Debe marcar la entrada primero.",
                module: ModuleName,
            });
        }
        if (type === "skip_lunch" && isLunchSkipped) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "El almuerzo ya fue omitido para el día de hoy.",
                module: ModuleName,
            });
        }
        if (type === "skip_lunch" && record.lunch_start && !isLunchSkipped) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Ya se marcó la salida a almuerzo, no se puede omitir.",
                module: ModuleName,
            });
        }
        if ((type === "lunch_start" || type === "lunch_end") && isLunchSkipped) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "El almuerzo fue omitido para el día de hoy.",
                module: ModuleName,
            });
        }
        if (type === "lunch_end" && !record.lunch_start) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Debe marcar la salida al almuerzo primero.",
                module: ModuleName,
            });
        }
        if (type === "exit" && !record.entry_time) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Debe marcar la entrada primero.",
                module: ModuleName,
            });
        }

        // Si es skip_lunch, la justificación es obligatoria
        if (type === "skip_lunch") {
            if (!justification || !justification.trim()) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    message: "Debes proporcionar una justificación para omitir el almuerzo.",
                    requiresJustification: true,
                    module: ModuleName,
                });
            }
        }

        // Si es salida, verificar si genera horas extra y exigir justificación
        if (type === "exit") {
            const schedule = await RolSchedule.findOne({ where: { rol_id: rolId, company } });
            const tempRecord = {
                ...(record.toJSON ? record.toJSON() : record),
                exit_time: now,
            };
            const calc = schedule ? calcularHorasExtra(tempRecord, schedule) : { totalExtra: 0 };
            if (calc.totalExtra > 0) {
                if (!justification || !justification.trim()) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: `Has generado ${calc.totalExtra} hora(s) extra por fuera de tu jornada laboral. Debes ingresar obligatoriamente una justificación del motivo.`,
                        requiresJustification: true,
                        totalExtra: calc.totalExtra,
                        module: ModuleName,
                    });
                }
            }
        }

        // Actualizar la columna correspondiente en la base de datos
        let updateFields;
        if (type === "skip_lunch") {
            // Omitir almuerzo: marcar como omitido con su justificación sin guardar fecha/hora en columnas de almuerzo
            updateFields = {
                lunch_omitted: 1,
                lunch_justification: justification.trim(),
                lunch_start: null,
                lunch_end: null,
            };
        } else {
            updateFields = { [targetColumn]: now };
        }
        if (type === "exit" && justification) {
            updateFields.overtime_justification = justification.trim();
        }
        await record.update(updateFields);
        await record.reload();

        // Procesar y guardar foto si viene en base64
        let savedPhotoPath = null;
        if (photo) {
            try {
                savedPhotoPath = base64ToFile(photo, "attendance");
            } catch (photoErr) {
                console.warn("Error guardando foto de marcación:", photoErr.message);
            }
        }

        // Registrar en TimeMarkingLog para trazabilidad, fotos y auditoría de ubicación
        try {
            await TimeMarkingLog.create({
                time_record_id: record.id,
                user_id: userId,
                company,
                marking_type: type,
                timestamp: now,
                photo_url: savedPhotoPath,
                latitude: latitude !== undefined && latitude !== null ? String(latitude) : null,
                longitude: longitude !== undefined && longitude !== null ? String(longitude) : null,
                accuracy: accuracy !== undefined && accuracy !== null ? Number(accuracy) : null,
                justification: justification ? justification.trim() : null,
            });
        } catch (logErr) {
            console.error("Error al registrar TimeMarkingLog:", logErr.message);
        }

        return res.status(httpStatus.OK).json({
            message: "Marcación registrada exitosamente.",
            data: record,
            module: ModuleName,
        });
    } catch (error) {
        console.error("Error en markTime:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno: " + error.message,
            module: ModuleName,
        });
    }
}

/**
 * Cierra automáticamente los registros de tiempos si un usuario olvidó marcar salida
 * y son las 11:59 p.m. (23:59) del día, o para cualquier día anterior a hoy que haya quedado abierto.
 * La salida queda fijada con la fecha del registro y la hora oficial de salida del horario del rol (ej. 17:00).
 * En la justificación se guarda:
 * "Tiempo cerrado automaticamente debido a que no se detecto cierre de tiempos antes de media noche"
 */
async function autoCloseUnclosedRecords() {
    try {
        const now = new Date();
        const coFormatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Bogota",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });

        const parts = coFormatter.formatToParts(now);
        const pMap = {};
        parts.forEach((p) => (pMap[p.type] = p.value));

        const todayStr = `${pMap.year}-${pMap.month}-${pMap.day}`;
        const currentHour = parseInt(pMap.hour, 10);
        const currentMinute = parseInt(pMap.minute, 10);
        const currentTotalMin = currentHour * 60 + currentMinute;

        // Son las 11:59 p.m. (23:59) o medianoche
        const isLateNight = currentTotalMin >= 23 * 60 + 59;

        const openCondition = {
            entry_time: { [Op.ne]: null },
            exit_time: null,
        };

        if (isLateNight) {
            openCondition.record_date = { [Op.lte]: todayStr };
        } else {
            openCondition.record_date = { [Op.lt]: todayStr };
        }

        const unclosedRecords = await TimeRecord.findAll({
            where: openCondition,
            include: [
                {
                    model: User,
                    as: "User",
                    attributes: ["id", "name", "rol", "company"],
                },
            ],
        });

        if (!unclosedRecords || unclosedRecords.length === 0) return;

        const AUTO_CLOSE_JUSTIFICATION =
            "Tiempo cerrado automaticamente debido a que no se detecto cierre de tiempos antes de media noche";

        for (const record of unclosedRecords) {
            try {
                const user = record.User;
                const companyId = record.company || user?.company;
                const rolId = user?.rol;

                let schedule = null;
                if (rolId && companyId) {
                    schedule = await RolSchedule.findOne({
                        where: { rol_id: rolId, company: companyId },
                    });
                }

                const recDateStr = typeof record.record_date === "string"
                    ? record.record_date.slice(0, 10)
                    : toLocalDateStr(record.record_date);

                const recDateObj = new Date(recDateStr + "T00:00:00");
                const isSaturday = recDateObj.getDay() === 6;

                let exitDateStr = recDateStr;
                let exitTimeStr = "17:00:00";
                if (isSaturday && schedule?.saturday_exit_time) {
                    exitTimeStr = schedule.saturday_exit_time;
                } else if (schedule?.exit_time) {
                    exitTimeStr = schedule.exit_time;
                }

                // Turnos nocturnos que cruzan medianoche
                const schedEntryStr = schedule?.entry_time || "08:00:00";
                if (timeToMinutes(exitTimeStr) < timeToMinutes(schedEntryStr)) {
                    const nextDateObj = new Date(recDateObj);
                    nextDateObj.setDate(nextDateObj.getDate() + 1);
                    exitDateStr = toLocalDateStr(nextDateObj);

                    if (recDateStr === todayStr) {
                        continue;
                    }
                }

                if (exitTimeStr.length === 5) {
                    exitTimeStr += ":00";
                }

                const exitDateTime = new Date(`${exitDateStr}T${exitTimeStr}`);

                await record.update({
                    exit_time: exitDateTime,
                    overtime_justification: AUTO_CLOSE_JUSTIFICATION,
                });

                await TimeMarkingLog.create({
                    time_record_id: record.id,
                    user_id: record.user_id,
                    company: companyId,
                    marking_type: "exit",
                    timestamp: exitDateTime,
                    photo_url: null,
                    latitude: null,
                    longitude: null,
                    accuracy: null,
                    justification: AUTO_CLOSE_JUSTIFICATION,
                });

                console.log(
                    `[AutoClose] Registro ID ${record.id} de ${user ? user.name : record.user_id} (${recDateStr}) cerrado automáticamente a las ${exitTimeStr}.`
                );
            } catch (errRecord) {
                console.error(`[AutoClose] Error al procesar registro ID ${record.id}:`, errRecord.message);
            }
        }
    } catch (err) {
        console.error("[AutoClose] Error en autoCloseUnclosedRecords:", err.message);
    }
}

// Iniciar temporizador que revisa cada minuto para auto-cierre a las 11:59 PM
const autoCloseInterval = setInterval(autoCloseUnclosedRecords, 60 * 1000);
if (autoCloseInterval.unref) autoCloseInterval.unref();

// Ejecución inicial al levantar el módulo
autoCloseUnclosedRecords().catch(console.error);

/**
 * GET /myRecord
 * Devuelve el registro de marcaciones del día actual del usuario autenticado.
 */
async function getMyRecord(req, res) {
    try {
        await autoCloseUnclosedRecords();
        const { userId } = req.tokenData;
        const now = new Date();
        const todayStr = toLocalDateStr(now);

        // 1. Si el usuario tiene un turno abierto activo (marcó entrada pero aún no salida), devolver ese registro
        let record = await TimeRecord.findOne({
            where: {
                user_id: userId,
                exit_time: null,
                entry_time: { [Op.ne]: null },
            },
            order: [["id", "DESC"]],
        });

        // 2. Si no tiene turno abierto, buscar por fecha exacta (DATEONLY) de hoy
        if (!record) {
            record = await TimeRecord.findOne({
                where: { user_id: userId, record_date: todayStr },
                order: [["id", "DESC"]],
            });
        }

        // Fallback: si no encontró por string exacto, buscar por rango del día
        if (!record) {
            const startOfDay = `${todayStr} 00:00:00`;
            const endOfDay = `${todayStr} 23:59:59`;
            record = await TimeRecord.findOne({
                where: {
                    user_id: userId,
                    record_date: { [Op.between]: [startOfDay, endOfDay] },
                },
                order: [['id', 'DESC']],
            });
        }

        return res.status(httpStatus.OK).json({
            data: record || null,
            module: ModuleName,
        });
    } catch (error) {
        console.error("Error en getMyRecord:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno: " + error.message,
            module: ModuleName,
        });
    }
}

/**
 * GET /scheduleByRol/:rolId/:company
 * Devuelve el horario configurado para un rol.
 */
async function getScheduleByRol(req, res) {
    try {
        const { rolId, company } = req.params;
        const schedule = await RolSchedule.findOne({
            where: { rol_id: rolId, company },
        });

        return res.status(httpStatus.OK).json({
            data: schedule || null,
            module: ModuleName,
        });
    } catch (error) {
        console.error("Error en getScheduleByRol:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno: " + error.message,
            module: ModuleName,
        });
    }
}

/**
 * GET /allSchedules/:company
 * Devuelve todos los horarios configurados para la empresa, con info del rol.
 */
async function getAllSchedules(req, res) {
    try {
        const { company } = req.params;
        const schedules = await RolSchedule.findAll({
            where: { company },
            include: [{ model: Rol, as: "Rol", attributes: ["id", "name"] }],
        });

        return res.status(httpStatus.OK).json({
            data: schedules,
            module: ModuleName,
        });
    } catch (error) {
        console.error("Error en getAllSchedules:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno: " + error.message,
            module: ModuleName,
        });
    }
}

/**
 * POST /saveSchedule
 * Body: { rolId, company, entry_time, exit_time }
 * Crea o actualiza el horario de un rol (solo entrada y salida, el almuerzo se descuenta según marcación).
 */
async function saveSchedule(req, res) {
    try {
        const { rolId, company, entry_time, exit_time, saturday_entry_time, saturday_exit_time } = req.body;

        if (!rolId || !company || !entry_time || !exit_time) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Hora de entrada y hora de salida de lunes a viernes son requeridas.",
                module: ModuleName,
            });
        }

        const scheduleData = {
            rol_id: rolId,
            company,
            entry_time,
            exit_time,
            saturday_entry_time: saturday_entry_time || null,
            saturday_exit_time: saturday_exit_time || null,
        };

        const [schedule, created] = await RolSchedule.findOrCreate({
            where: { rol_id: rolId, company },
            defaults: scheduleData,
        });

        if (!created) {
            await schedule.update(scheduleData);
        }

        return res.status(httpStatus.OK).json({
            message: created ? "Horario creado." : "Horario actualizado.",
            data: schedule,
            module: ModuleName,
        });
    } catch (error) {
        console.error("Error en saveSchedule:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno: " + error.message,
            module: ModuleName,
        });
    }
}

/**
 * GET /overtimeReport
 * Query params: company, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD),
 *               userId? (filtrar por usuario), rolId? (filtrar por rol)
 * Genera reporte de horas extra clasificadas.
 */
async function getOvertimeReport(req, res) {
    try {
        await autoCloseUnclosedRecords();
        const { company, startDate, endDate, userId, rolId } = req.query;

        if (!company || !startDate || !endDate) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "company, startDate y endDate son requeridos.",
                module: ModuleName,
            });
        }

        // Construir filtro de usuarios
        const userWhere = { company };
        if (userId) userWhere.id = userId;
        if (rolId) userWhere.rol = rolId;

        // Obtener usuarios con su rol
        const users = await User.findAll({
            where: userWhere,
            include: [{ model: Rol, attributes: ["id", "name"] }],
            attributes: ["id", "name", "rol"],
        });

        const userIds = users.map((u) => u.id);
        if (userIds.length === 0) {
            return res.status(httpStatus.OK).json({ data: [], module: ModuleName });
        }

        // Obtener registros de tiempo en el rango (INCLUYE todos los registros existentes)
        const records = await TimeRecord.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                record_date: { [Op.between]: [startDate, endDate] },
            },
            order: [["record_date", "ASC"], ["id", "ASC"]],
        });

        // Mapa de usuarios para lookup rápido
        const userMap = {};
        users.forEach((u) => {
            userMap[u.id] = u;
        });

        // Obtener horarios de roles involucrados
        const rolIds = [...new Set(users.map((u) => u.rol))];
        const schedules = await RolSchedule.findAll({
            where: { rol_id: { [Op.in]: rolIds }, company },
        });
        const scheduleMap = {};
        schedules.forEach((s) => {
            scheduleMap[s.rol_id] = s;
        });

        // Calcular horas extra por registro
        const reportRows = [];
        for (const record of records) {
            const user = userMap[record.user_id];
            if (!user) continue;

            const schedule = scheduleMap[user.rol];
            const hasSchedule = Boolean(schedule);
            const isPendingExit = !record.exit_time;

            const overtime = schedule ? calcularHorasExtra(record, schedule) : {
                diurna: 0,
                nocturna: 0,
                diurnaDF: 0,
                nocturnaDF: 0,
                totalExtra: 0,
                minutosNeto: calcularMinutosNeto(record),
            };

            const recordDateObj = new Date(record.record_date + "T00:00:00");
            const dayOfWeek = recordDateObj.getDay();
            const holidayInfo = getColombianHolidayInfo(record.record_date);
            const isHoliday = Boolean(holidayInfo);
            const esDominical = dayOfWeek === 0;
            const esSabado = dayOfWeek === 6;

            // Calcular retardo si existe horario y marcó entrada en día laboral
            // Calcular retardo a partir de 10 minutos (tolerancia para retrasos menores a 10 min)
            let minutosRetardo = 0;
            if (schedule && schedule.entry_time && record.entry_time && !isHoliday && !esDominical) {
                const scheduledEntryMin = timeToMinutes(schedule.entry_time);
                const actualEntryMin = dateToMinutesOfDay(record.entry_time);
                const diff = actualEntryMin - scheduledEntryMin;
                if (diff >= 10) {
                    minutosRetardo = diff;
                }
            }

            reportRows.push({
                id: record.id,
                userId: user.id,
                userName: user.name,
                rolId: user.rol,
                rolName: user.Rol ? user.Rol.name : "—",
                date: record.record_date,
                entryTime: record.entry_time,
                lunchStart: record.lunch_start,
                lunchEnd: record.lunch_end,
                lunchOmitted: Boolean(
                    record.lunch_omitted ||
                    (record.lunch_start && record.lunch_end && new Date(record.lunch_start).getTime() === new Date(record.lunch_end).getTime())
                ),
                lunchJustification: record.lunch_justification || null,
                exitTime: record.exit_time,
                minutosRetardo,
                scheduledEntryTime: schedule?.entry_time || null,
                minutosNeto: overtime.minutosNeto,
                diurna: overtime.diurna,
                nocturna: overtime.nocturna,
                diurnaDF: overtime.diurnaDF,
                nocturnaDF: overtime.nocturnaDF,
                totalExtra: overtime.totalExtra,
                extraEntrada: overtime.extraEntrada || 0,
                extraSalida: overtime.extraSalida || 0,
                detalleEntrada: overtime.detalleEntrada || null,
                detalleSalida: overtime.detalleSalida || null,
                isHoliday,
                holidayName: holidayInfo ? holidayInfo.name : null,
                esDominical,
                esSabado,
                saturdayExitTime: schedule?.saturday_exit_time || null,
                hasSchedule,
                isPendingExit,
                descuentoSabado: 0,
                noAsistioSabado: false,
                overtimeJustification: record.overtime_justification || null,
            });
        }

        // ── Descuento de Horas del Sábado no laboradas sobre H.E. Lunes a Viernes ──
        // Agrupar filas por usuario y semana ISO
        const userWeeks = {};
        const neededSatDates = new Set();
        for (const row of reportRows) {
            const weekKey = `${row.userId}_${getISOWeekKey(row.date)}`;
            if (!userWeeks[weekKey]) userWeeks[weekKey] = [];
            userWeeks[weekKey].push(row);

            const satDate = getSaturdayDateOfWeek(row.date);
            neededSatDates.add(satDate);
        }

        // Obtener registros de sábados que no hayan estado en el rango consultado
        const satRecordsInDb = [...records];
        const missingSatDates = [...neededSatDates].filter((d) => d < startDate || d > endDate);
        if (missingSatDates.length > 0) {
            const extraSatRecords = await TimeRecord.findAll({
                where: {
                    user_id: { [Op.in]: userIds },
                    record_date: { [Op.in]: missingSatDates },
                },
            });
            satRecordsInDb.push(...extraSatRecords);
        }

        const satRecordMap = {};
        for (const rec of satRecordsInDb) {
            const recDateStr = typeof rec.record_date === "string" ? rec.record_date.slice(0, 10) : toLocalDateStr(rec.record_date);
            satRecordMap[`${rec.user_id}_${recDateStr}`] = rec;
        }

        const todayStr = toLocalDateStr(new Date());
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (const [, weekRows] of Object.entries(userWeeks)) {
            const sampleRow = weekRows[0];
            const userId = sampleRow.userId;
            const user = userMap[userId];
            if (!user) continue;

            const schedule = scheduleMap[user.rol];
            // Si el rol no tiene horario o no contempla trabajo los sábados, no hay descuento
            if (!schedule || !schedule.saturday_exit_time) continue;

            const satDateStr = getSaturdayDateOfWeek(sampleRow.date);

            // 1. Si el sábado está en el futuro, aún no se evalúa
            if (satDateStr > todayStr) continue;

            // 2. Si hoy es sábado y aún no termina la jornada del sábado
            const satExitMin = timeToMinutes(schedule.saturday_exit_time);
            if (satDateStr === todayStr && currentMinutes < satExitMin) continue;

            // 3. Si el sábado fue un día festivo oficial en Colombia, no es día laborable obligatorio
            if (isColombianHoliday(satDateStr)) continue;

            // 4. Calcular horas requeridas del sábado
            const satEntryStr = schedule.saturday_entry_time || schedule.entry_time || "08:00:00";
            const satReqMinutes = Math.max(0, satExitMin - timeToMinutes(satEntryStr));
            const satReqHours = Math.round(satReqMinutes / 60);
            if (satReqHours <= 0) continue;

            // 5. Verificar asistencia del usuario ese sábado
            const satRecord = satRecordMap[`${userId}_${satDateStr}`];
            let satWorkedHours = 0;
            if (satRecord && satRecord.entry_time) {
                const netMin = calcularMinutosNeto(satRecord);
                satWorkedHours = Math.round(netMin / 60);
            }

            const missingSatHours = Math.max(0, satReqHours - satWorkedHours);
            if (missingSatHours <= 0) {
                // Asistió y completó las horas del sábado
                continue;
            }

            // 6. Descontar las horas faltantes de las horas extra de Lunes a Viernes
            const weekdayRows = weekRows.filter((r) => {
                const d = new Date(r.date + "T00:00:00").getDay();
                return d >= 1 && d <= 5;
            });

            const totalExtraLV = weekdayRows.reduce((sum, r) => sum + (r.totalExtra || 0), 0);
            let hoursToDeduct = Math.min(totalExtraLV, missingSatHours);
            const totalDeducted = hoursToDeduct;

            if (hoursToDeduct > 0) {
                // Ordenar de viernes hacia lunes (descendente) para descontar del día más reciente al sábado
                weekdayRows.sort((a, b) => b.date.localeCompare(a.date));

                for (const row of weekdayRows) {
                    if (hoursToDeduct <= 0) break;
                    if (!row.totalExtra || row.totalExtra <= 0) continue;

                    const deductFromRow = Math.min(hoursToDeduct, row.totalExtra);
                    let rem = deductFromRow;

                    if (row.diurna > 0 && rem > 0) {
                        const take = Math.min(row.diurna, rem);
                        row.diurna -= take;
                        rem -= take;
                    }
                    if (row.nocturna > 0 && rem > 0) {
                        const take = Math.min(row.nocturna, rem);
                        row.nocturna -= take;
                        rem -= take;
                    }
                    if (row.diurnaDF > 0 && rem > 0) {
                        const take = Math.min(row.diurnaDF, rem);
                        row.diurnaDF -= take;
                        rem -= take;
                    }
                    if (row.nocturnaDF > 0 && rem > 0) {
                        const take = Math.min(row.nocturnaDF, rem);
                        row.nocturnaDF -= take;
                        rem -= take;
                    }

                    row.totalExtra = (row.diurna || 0) + (row.nocturna || 0) + (row.diurnaDF || 0) + (row.nocturnaDF || 0);
                    row.descuentoSabado = (row.descuentoSabado || 0) + deductFromRow;

                    const note = `[-${deductFromRow}h por no laborar sábado (${satDateStr})]`;
                    row.overtimeJustification = row.overtimeJustification
                        ? `${note} ${row.overtimeJustification}`
                        : note;

                    hoursToDeduct -= deductFromRow;
                }
            }

            // 7. Reflejar en el sábado (si está en el rango de búsqueda o existe en el reporte)
            const existingSatRow = reportRows.find((r) => r.userId === userId && r.date === satDateStr);
            if (existingSatRow) {
                const incompleteNote = `[Sábado incompleto: ${satWorkedHours}h/${satReqHours}h req. - desc. ${totalDeducted}h de extras L-V]`;
                existingSatRow.overtimeJustification = existingSatRow.overtimeJustification
                    ? `${incompleteNote} ${existingSatRow.overtimeJustification}`
                    : incompleteNote;
                existingSatRow.descuentoSabado = totalDeducted;
            } else if (satDateStr >= startDate && satDateStr <= endDate) {
                // Insertar fila del sábado no laborado para visibilidad y transparencia
                reportRows.push({
                    id: `sat-absent-${userId}-${satDateStr}`,
                    userId: user.id,
                    userName: user.name,
                    rolId: user.rol,
                    rolName: user.Rol ? user.Rol.name : "—",
                    date: satDateStr,
                    entryTime: null,
                    lunchStart: null,
                    lunchEnd: null,
                    lunchOmitted: false,
                    lunchJustification: null,
                    exitTime: null,
                    minutosRetardo: 0,
                    scheduledEntryTime: satEntryStr,
                    minutosNeto: 0,
                    diurna: 0,
                    nocturna: 0,
                    diurnaDF: 0,
                    nocturnaDF: 0,
                    totalExtra: 0,
                    extraEntrada: 0,
                    extraSalida: 0,
                    detalleEntrada: null,
                    detalleSalida: null,
                    isHoliday: false,
                    holidayName: null,
                    esDominical: false,
                    esSabado: true,
                    saturdayExitTime: schedule.saturday_exit_time,
                    hasSchedule: true,
                    isPendingExit: false,
                    noAsistioSabado: true,
                    descuentoSabado: totalDeducted,
                    overtimeJustification: `No laboró sábado (${satReqHours}h requeridas descontadas de extras L-V: -${totalDeducted}h aplicadas)`,
                });
            }
        }

        // Ordenar filas por fecha ascendente y nombre de usuario
        reportRows.sort((a, b) => a.date.localeCompare(b.date) || a.userName.localeCompare(b.userName));

        // ── Calcular total de H.E. por usuario × semana ISO (post-descuentos) ──
        const WEEKLY_OVERTIME_LIMIT = 42; // horas
        const weeklyMap = {}; // clave: "userId-YYYY-Wnn" → suma de totalExtra
        for (const row of reportRows) {
            const key = `${row.userId}-${getISOWeekKey(row.date)}`;
            weeklyMap[key] = (weeklyMap[key] || 0) + (row.totalExtra || 0);
        }
        for (const row of reportRows) {
            const key = `${row.userId}-${getISOWeekKey(row.date)}`;
            row.weeklyTotalExtra = weeklyMap[key] || 0;
            row.weeklyOvertimeExceeds = row.weeklyTotalExtra > WEEKLY_OVERTIME_LIMIT;
            row.isoWeekKey = getISOWeekKey(row.date);
        }

        // ── Filtros opcionales solicitados por query ────────────────────────
        let finalRows = reportRows;
        if (req.query.onlyOvertime === "true") {
            finalRows = finalRows.filter((r) => (r.totalExtra || 0) > 0 || (r.descuentoSabado && r.descuentoSabado > 0));
        }
        if (req.query.onlyTardiness === "true") {
            finalRows = finalRows.filter((r) => (r.minutosRetardo || 0) >= 10);
        }

        return res.status(httpStatus.OK).json({
            data: finalRows,
            module: ModuleName,
        });
    } catch (error) {
        console.error("Error en getOvertimeReport:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno: " + error.message,
            module: ModuleName,
        });
    }
}

/**
 * Marca o desmarca un día como festivo en todos los registros de esa fecha.
 */
async function markHoliday(req, res) {
    try {
        const { recordDate, company, isHoliday } = req.body;

        if (!recordDate || !company) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "recordDate y company son requeridos.",
                module: ModuleName,
            });
        }

        const [affectedRows] = await TimeRecord.update(
            { is_holiday: isHoliday ? 1 : 0 },
            { where: { record_date: recordDate, company } }
        );

        return res.status(httpStatus.OK).json({
            message: `Día ${isHoliday ? "marcado" : "desmarcado"} como festivo. Registros afectados: ${affectedRows}`,
            module: ModuleName,
        });
    } catch (error) {
        console.error("Error en markHoliday:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno: " + error.message,
            module: ModuleName,
        });
    }
}

/**
 * GET /myRecordHistory/:userId
 * Devuelve los últimos N registros del usuario (por defecto 7 días).
 */
async function getMyRecordHistory(req, res) {
    try {
        await autoCloseUnclosedRecords();
        const { userId } = req.tokenData;
        const limit = parseInt(req.query.limit) || 7;

        const records = await TimeRecord.findAll({
            where: { user_id: userId },
            order: [["record_date", "DESC"]],
            limit,
        });

        return res.status(httpStatus.OK).json({
            data: records,
            module: ModuleName,
        });
    } catch (error) {
        console.error("Error en getMyRecordHistory:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno: " + error.message,
            module: ModuleName,
        });
    }
}

/**
 * GET /locationReport
 * Query params: company, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD),
 *               userId? (filtrar por usuario), rolId? (filtrar por rol), markingType?
 * Genera el reporte de auditoría de marcaciones con foto y ubicación geográfica.
 */
async function getLocationReport(req, res) {
    try {
        const company = req.query.company || req.tokenData?.company;
        const { startDate, endDate, userId, rolId, markingType } = req.query;

        const logWhere = {};
        if (company) {
            logWhere.company = company;
        }

        // Filtro por rango de fechas flexible
        if (startDate && endDate) {
            const startFull = `${startDate} 00:00:00`;
            const endFull = `${endDate} 23:59:59`;
            logWhere.timestamp = { [Op.between]: [startFull, endFull] };
        } else if (startDate) {
            logWhere.timestamp = { [Op.gte]: `${startDate} 00:00:00` };
        } else if (endDate) {
            logWhere.timestamp = { [Op.lte]: `${endDate} 23:59:59` };
        }

        if (userId && userId !== "all") {
            logWhere.user_id = userId;
        }
        if (markingType && markingType !== "all") {
            logWhere.marking_type = markingType;
        }

        const userInclude = {
            model: User,
            as: "User",
            attributes: ["id", "name", "rol"],
            required: false,
            include: [{ model: Rol, attributes: ["id", "name"], required: false }],
        };

        if (rolId && rolId !== "all") {
            userInclude.where = { rol: rolId };
            userInclude.required = true;
        }

        const logs = await TimeMarkingLog.findAll({
            where: logWhere,
            include: [
                userInclude,
                {
                    model: TimeRecord,
                    as: "TimeRecord",
                    attributes: ["id", "record_date", "is_holiday"],
                    required: false,
                },
            ],
            order: [["timestamp", "DESC"]],
        });

        const data = logs.map((log) => {
            const justification = log.justification || null;
            const hasOvertime = Boolean(
                (log.marking_type === "exit" && justification) ||
                (log.justification)
            );
            return {
                id: log.id,
                timeRecordId: log.time_record_id,
                userId: log.user_id,
                userName: log.User ? log.User.name : "—",
                rolId: log.User ? log.User.rol : null,
                rolName: log.User && log.User.Rol ? log.User.Rol.name : "—",
                markingType: log.marking_type,
                timestamp: log.timestamp,
                photoUrl: log.photo_url,
                latitude: log.latitude,
                longitude: log.longitude,
                accuracy: log.accuracy,
                justification,
                hasOvertime,
            };
        });

        return res.status(httpStatus.OK).json({
            data,
            module: ModuleName,
        });
    } catch (error) {
        console.error("Error en getLocationReport:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno: " + error.message,
            module: ModuleName,
        });
    }
}

/**
 * GET /locationReport/excel
 * Exporta el reporte de auditoría de marcaciones en formato Excel (.xlsx)
 * con la foto incrustada directamente en la celda y el enlace a Google Maps como vínculo directo.
 * Sin columnas de Latitud ni Longitud.
 */
async function exportLocationReportExcel(req, res) {
    try {
        const company = req.query.company || req.tokenData?.company;
        const { startDate, endDate, userId, rolId, markingType, jornada } = req.query;

        const logWhere = {};
        if (company) {
            logWhere.company = company;
        }

        if (startDate && endDate) {
            const startFull = `${startDate} 00:00:00`;
            const endFull = `${endDate} 23:59:59`;
            logWhere.timestamp = { [Op.between]: [startFull, endFull] };
        } else if (startDate) {
            logWhere.timestamp = { [Op.gte]: `${startDate} 00:00:00` };
        } else if (endDate) {
            logWhere.timestamp = { [Op.lte]: `${endDate} 23:59:59` };
        }

        if (userId && userId !== "all") {
            logWhere.user_id = userId;
        }
        if (markingType && markingType !== "all") {
            logWhere.marking_type = markingType;
        }

        const userInclude = {
            model: User,
            as: "User",
            attributes: ["id", "name", "rol"],
            required: false,
            include: [{ model: Rol, attributes: ["id", "name"], required: false }],
        };

        if (rolId && rolId !== "all") {
            userInclude.where = { rol: rolId };
            userInclude.required = true;
        }

        const logs = await TimeMarkingLog.findAll({
            where: logWhere,
            include: [
                userInclude,
                {
                    model: TimeRecord,
                    as: "TimeRecord",
                    attributes: ["id", "record_date", "is_holiday"],
                    required: false,
                },
            ],
            order: [["timestamp", "DESC"]],
        });

        // Filtrar por jornada si aplica
        let filteredLogs = logs;
        if (jornada === "extra") {
            filteredLogs = logs.filter(
                (l) => Boolean((l.marking_type === "exit" && l.justification) || l.justification)
            );
        } else if (jornada === "regular") {
            filteredLogs = logs.filter(
                (l) => !Boolean((l.marking_type === "exit" && l.justification) || l.justification)
            );
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "DIMEI S.A.S.";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Auditoría Marcaciones", {
            views: [{ showGridLines: true }],
        });

        // Columnas del reporte: sin Foto, sin Latitud y sin Longitud
        worksheet.columns = [
            { header: "ID", key: "id", width: 8 },
            { header: "Empleado", key: "empleado", width: 26 },
            { header: "Rol", key: "rol", width: 18 },
            { header: "Tipo de Marcación", key: "tipo", width: 20 },
            { header: "Jornada", key: "jornada", width: 18 },
            { header: "Fecha", key: "fecha", width: 16 },
            { header: "Hora", key: "hora", width: 14 },
            { header: "Precisión (m)", key: "precision", width: 15 },
            { header: "Link Google Maps", key: "maps", width: 24 },
            { header: "Justificación", key: "justificacion", width: 32 },
        ];

        // Estilo visual del encabezado
        const headerRow = worksheet.getRow(1);
        headerRow.height = 28;
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF1E293B" },
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
        });

        const MARKING_LABELS = {
            entry: "Entrada",
            lunch_start: "Salida Almuerzo",
            lunch_end: "Regreso Almuerzo",
            exit: "Salida",
        };

        for (let i = 0; i < filteredLogs.length; i++) {
            const log = filteredLogs[i];
            const rowIndex = i + 2;
            const row = worksheet.getRow(rowIndex);
            row.height = 24;

            const hasOvertime = Boolean(
                (log.marking_type === "exit" && log.justification) || log.justification
            );

            const ts = log.timestamp ? new Date(log.timestamp) : null;
            const fechaStr = ts
                ? ts.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                : "—";
            const horaStr = ts
                ? ts.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : "—";

            row.getCell("id").value = log.id;
            row.getCell("empleado").value = log.User ? log.User.name : "—";
            row.getCell("rol").value = log.User && log.User.Rol ? log.User.Rol.name : "—";
            row.getCell("tipo").value = MARKING_LABELS[log.marking_type] || log.marking_type;
            row.getCell("jornada").value = hasOvertime ? "Horas Extra" : "Jornada Ordinaria";
            row.getCell("fecha").value = fechaStr;
            row.getCell("hora").value = horaStr;
            row.getCell("precision").value = log.accuracy ? `${Math.round(log.accuracy)} m` : "—";
            row.getCell("justificacion").value = log.justification || "—";

            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
            });
            row.getCell("empleado").alignment = { vertical: "middle", horizontal: "left" };
            row.getCell("justificacion").alignment = { vertical: "middle", horizontal: "left", wrapText: true };

            if (hasOvertime) {
                row.getCell("jornada").font = { color: { argb: "FFB45309" }, bold: true };
            }

            // Google Maps como VÍNCULO DIRECTO
            if (log.latitude && log.longitude) {
                const mapsUrl = `https://www.google.com/maps?q=${log.latitude},${log.longitude}`;
                const mapsCell = row.getCell("maps");
                mapsCell.value = {
                    text: "Ver en Google Maps",
                    hyperlink: mapsUrl,
                    tooltip: "Abrir ubicación exacta en Google Maps",
                };
                mapsCell.font = { color: { argb: "FF2563EB" }, underline: true };
            } else {
                row.getCell("maps").value = "Sin GPS";
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();

        const filename = `reporte_ubicacion_marcaciones_${startDate || "inicio"}_al_${endDate || "fin"}.xlsx`;
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.send(buffer);
    } catch (error) {
        console.error("Error en exportLocationReportExcel:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error generando Excel: " + error.message,
            module: ModuleName,
        });
    }
}

module.exports = {
    markTime,
    getMyRecord,
    getScheduleByRol,
    getAllSchedules,
    saveSchedule,
    getOvertimeReport,
    markHoliday,
    getMyRecordHistory,
    getLocationReport,
    exportLocationReportExcel,
    calcularHorasExtra,
};
