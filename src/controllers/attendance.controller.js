const httpStatus = require("http-status");
const { Op } = require("sequelize");
const { getColombiaHolidaysByYear } = require("colombia-holidays");

const TimeRecord = require("../models/TimeRecord");
const TimeMarkingLog = require("../models/TimeMarkingLog");
const RolSchedule = require("../models/RolSchedule");
const User = require("../models/user");
const Rol = require("../models/rol");
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
function isSundayOrHoliday(date) {
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
    if (record.lunch_start && record.lunch_end) {
        const lsMs = new Date(record.lunch_start).getTime();
        const leMs = new Date(record.lunch_end).getTime();
        almuerzoDurMin = Math.max(0, (leMs - lsMs) / 60000);
    }
    return Math.max(0, Math.round(brutoMin - almuerzoDurMin));
}

/**
 * Calcula horas extra a partir de los tiempos marcados y el horario del rol.
 *
 * Reglas:
 * - Se descuenta el tiempo de almuerzo.
 * - Si el exceso es >= 45 min, se paga en bloques enteros de 60 min.
 * - La hora extra nocturna es la trabajada entre las 19:00 (7PM) y las 06:00 (6AM).
 * - Si el día es domingo o festivo, las horas son dominicales/festivas.
 *
 * @param {Object} record   - Registro de tiempo (TimeRecord)
 * @param {Object} schedule - Horario del rol (RolSchedule)
 * @returns {Object} { diurna, nocturna, diurnaDF, nocturnaDF, totalExtra, minutosNeto }
 */
function calcularHorasExtra(record, schedule) {
    const result = {
        diurna: 0,
        nocturna: 0,
        diurnaDF: 0,
        nocturnaDF: 0,
        totalExtra: 0,
        minutosNeto: 0,
    };

    if (!record.entry_time || !record.exit_time) return result;

    const netoMin = calcularMinutosNeto(record);
    result.minutosNeto = netoMin;

    const recordDate = record.record_date;
    const esDomFestivo = isSundayOrHoliday(recordDate, record.is_holiday === 1);

    // Si es domingo o festivo colombiano, todo el tiempo laborado es dominical/festivo
    if (esDomFestivo) {
        if (netoMin < 45) return result;
        const horasExtra = Math.floor((netoMin + 15) / 60);
        result.totalExtra = horasExtra;

        const exitMinOfDay = dateToMinutesOfDay(record.exit_time);
        const NOCTURNA_START = 19 * 60; // 19:00 (7 PM)
        const NOCTURNA_END = 6 * 60;    // 06:00 (6 AM)

        if (exitMinOfDay > NOCTURNA_START) {
            const minEnNoche = exitMinOfDay - NOCTURNA_START;
            const horasNoche = Math.min(horasExtra, Math.floor((minEnNoche + 15) / 60));
            const horasDia = Math.max(0, horasExtra - horasNoche);
            result.nocturnaDF = horasNoche;
            result.diurnaDF = horasDia;
        } else if (exitMinOfDay < NOCTURNA_END) {
            result.nocturnaDF = horasExtra;
        } else {
            result.diurnaDF = horasExtra;
        }
        return result;
    }

    if (!schedule) return result;

    const recordDateObj = typeof record.record_date === "string" && record.record_date.length === 10
        ? new Date(record.record_date + "T00:00:00")
        : new Date(record.record_date);
    const isSaturday = recordDateObj.getDay() === 6;

    // Horario esperado del rol: si es sábado y tiene horario de salida de sábado, se toma ese
    let scheduledExitTime = schedule.exit_time;
    if (isSaturday && schedule.saturday_exit_time) {
        scheduledExitTime = schedule.saturday_exit_time;
    }

    const scheduledExitMin = timeToMinutes(scheduledExitTime);
    const exitMinOfDay = dateToMinutesOfDay(record.exit_time);

    // Las horas extra se computan a partir del exceso sobre la hora de salida establecida
    const excesoSalidaMin = Math.max(0, exitMinOfDay - scheduledExitMin);

    // Umbral: a partir de 45 minutos (ej. salida 12:00 y salida 12:45 = 1 hora extra)
    if (excesoSalidaMin < 45) return result;

    const horasExtra = Math.floor((excesoSalidaMin + 15) / 60);
    if (horasExtra <= 0) return result;

    result.totalExtra = horasExtra;

    // Clasificación diurna/nocturna (La jornada nocturna en Colombia inicia a las 19:00 y termina a las 06:00)
    const NOCTURNA_START = 19 * 60; // 19:00
    const NOCTURNA_END = 6 * 60;    // 06:00

    if (exitMinOfDay > NOCTURNA_START) {
        // Minutos de horas extra que ocurrieron a partir de las 19:00
        const inicioNocturno = Math.max(NOCTURNA_START, scheduledExitMin);
        const minEnNoche = Math.max(0, exitMinOfDay - inicioNocturno);
        const horasNoche = Math.min(horasExtra, Math.floor((minEnNoche + 15) / 60));
        const horasDia = Math.max(0, horasExtra - horasNoche);
        result.nocturna = horasNoche;
        result.diurna = horasDia;
    } else if (exitMinOfDay < NOCTURNA_END) {
        result.nocturna = horasExtra;
    } else {
        result.diurna = horasExtra;
    }

    return result;
}

// ─── Controladores ─────────────────────────────────────────────────────────────

/**
 * POST /markTime
 * Body: { type: "entry" | "lunch_start" | "lunch_end" | "exit" }
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
            exit: "exit_time",
            exit_time: "exit_time",
        };
        const targetColumn = COLUMN_MAP[type];

        if (!targetColumn) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Tipo de marcación inválido. Use: entry, lunch_start, lunch_end, exit",
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

        const now = new Date();
        // Fecha de hoy en formato YYYY-MM-DD (local, sin dependencia de locale)
        const todayStr = toLocalDateStr(now);

        // Buscar o crear el registro del día
        let [record, created] = await TimeRecord.findOrCreate({
            where: { user_id: userId, record_date: todayStr },
            defaults: {
                user_id: userId,
                company,
                record_date: todayStr,
                is_holiday: isColombianHoliday(now) ? 1 : 0,
            },
        });

        // Verificar orden secuencial de marcaciones
        if (type === "lunch_start" && !record.entry_time) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Debe marcar la entrada primero.",
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
        const updateFields = { [targetColumn]: now };
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
 * GET /myRecord
 * Devuelve el registro de marcaciones del día actual del usuario autenticado.
 */
async function getMyRecord(req, res) {
    try {
        const { userId } = req.tokenData;
        const now = new Date();
        const todayStr = toLocalDateStr(now);

        // Buscar por fecha exacta (DATEONLY). Si no se encuentra,
        // intentar con el registro más reciente del día por si hay desfase de formato.
        let record = await TimeRecord.findOne({
            where: { user_id: userId, record_date: todayStr },
        });

        // Fallback: si no encontró por string exacto, buscar el último registro del usuario hoy
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

            // Si se solicita expresamente filtrar solo los que tienen horas extra
            if (req.query.onlyOvertime === "true" && overtime.totalExtra === 0) {
                continue;
            }

            // Si se solicita expresamente filtrar solo los que tienen retardos (>= 10 minutos)
            if (req.query.onlyTardiness === "true" && minutosRetardo < 10) {
                continue;
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
                exitTime: record.exit_time,
                minutosRetardo,
                scheduledEntryTime: schedule?.entry_time || null,
                minutosNeto: overtime.minutosNeto,
                diurna: overtime.diurna,
                nocturna: overtime.nocturna,
                diurnaDF: overtime.diurnaDF,
                nocturnaDF: overtime.nocturnaDF,
                totalExtra: overtime.totalExtra,
                isHoliday,
                holidayName: holidayInfo ? holidayInfo.name : null,
                esDominical,
                esSabado,
                saturdayExitTime: schedule?.saturday_exit_time || null,
                hasSchedule,
                isPendingExit,
                overtimeJustification: record.overtime_justification || null,
            });
        }

        return res.status(httpStatus.OK).json({
            data: reportRows,
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
 * POST /markHoliday
 * Body: { recordDate: "YYYY-MM-DD", company, isHoliday: true|false }
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
};
