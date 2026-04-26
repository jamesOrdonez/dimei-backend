/**
 * Seed: Roles y Permisos Base
 * 
 * Crea los roles Almacenista, Diseñador y Administrador para la empresa 1
 * si aún no existen, y sincroniza sus permisos literales de negocio.
 * 
 * Uso: node scripts/seed-roles.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Ajustar path según estructura del proyecto
const sequelize = require("../src/db/conection");
const Rol = require("../src/models/rol");
const Permission = require("../src/models/permission");

const COMPANY_ID = 1;

const ROLES_CONFIG = [
    {
        name: "Almacenista",
        permissions: [
            "Acceso a ingresar material",
            "Hacer remisiones de proyectos",
            "Crear ítems",
            "Consultar listas de compras",
        ],
    },
    {
        name: "Diseñador",
        permissions: [
            "Crear productos",
            "Crear proyectos",
            "Consultar listas de compras",
            "Anexar actas de entrega",
            "Pedir material adicional",
        ],
    },
    {
        name: "Administrador",
        permissions: [
            "Acceso a ingresar material",
            "Hacer remisiones de proyectos",
            "Crear ítems",
            "Crear productos",
            "Crear proyectos",
            "Consultar listas de compras",
            "Anexar actas de entrega",
            "Pedir material adicional",
        ],
    },
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log("✅ Conexión a la base de datos establecida.");

        for (const rolConfig of ROLES_CONFIG) {
            // Buscar o crear el rol
            let [rol, created] = await Rol.findOrCreate({
                where: { name: rolConfig.name, company: COMPANY_ID },
                defaults: { name: rolConfig.name, company: COMPANY_ID, state: true },
            });

            if (created) {
                console.log(`✅ Rol creado: ${rolConfig.name} (ID: ${rol.id})`);
            } else {
                console.log(`ℹ️  Rol existente: ${rolConfig.name} (ID: ${rol.id})`);
            }

            // Limpiar permisos anteriores del rol
            const deleted = await Permission.destroy({
                where: { rol: rol.id, company: COMPANY_ID },
            });
            if (deleted > 0) {
                console.log(`   🗑️  Eliminados ${deleted} permisos anteriores`);
            }

            // Crear los nuevos permisos literales
            if (rolConfig.permissions.length > 0) {
                const records = rolConfig.permissions.map(p => ({
                    rol: rol.id,
                    company: COMPANY_ID,
                    permiss: p,
                }));
                await Permission.bulkCreate(records);
                console.log(`   ✅ Permisos asignados: ${rolConfig.permissions.join(", ")}`);
            }
        }

        console.log("\n🎉 Seed completado exitosamente.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error en el seed:", error);
        process.exit(1);
    }
}

seed();
