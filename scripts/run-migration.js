/**
 * Script para ejecutar la migración de la tabla permission directamente.
 * Uso: node scripts/run-migration.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = require('../src/db/conection');
const { DataTypes } = require('sequelize');
const { QueryTypes } = require('sequelize');

async function runMigration() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión establecida.');

        const queryInterface = sequelize.getQueryInterface();
        const tableDesc = await queryInterface.describeTable('permission');
        console.log('📋 Estructura actual de permission:', Object.keys(tableDesc));

        // 1. Agregar columna 'company' si no existe
        if (!tableDesc.company) {
            console.log('➕ Agregando columna company...');
            await queryInterface.addColumn('permission', 'company', {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 1,
            });
            await sequelize.query("UPDATE permission SET company = 1 WHERE company IS NULL");
            await queryInterface.changeColumn('permission', 'company', {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            });
            console.log('✅ Columna company agregada.');
        } else {
            console.log('ℹ️  Columna company ya existe.');
        }

        // 2. Eliminar columna 'module' si existe
        if (tableDesc.module) {
            console.log('🗑️  Eliminando columna module...');
            await queryInterface.removeColumn('permission', 'module');
            console.log('✅ Columna module eliminada.');
        } else {
            console.log('ℹ️  Columna module no existe (ya fue removida).');
        }

        // 3. Limpiar permisos HTTP antiguos
        await sequelize.query(
            "DELETE FROM permission WHERE permiss IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')"
        );
        console.log(`🗑️  Permisos HTTP antiguos eliminados.`);


        console.log('\n🎉 Migración completada exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
        process.exit(1);
    }
}

runMigration();
