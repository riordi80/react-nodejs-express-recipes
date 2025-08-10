// routes/restaurant-info.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// GET /restaurant-info - Obtener información del restaurante
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await req.tenantDb.query(`
      SELECT * FROM RESTAURANT_INFO 
      WHERE restaurant_id = 1 
      LIMIT 1
    `);
    
    if (rows.length === 0) {
      // Si no existe, devolver valores por defecto
      const defaultInfo = {
        restaurant_id: 1,
        name: '',
        business_name: '',
        description: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'España',
        tax_number: '',
        vat_rate: 21.00,
        cuisine_type: '',
        seating_capacity: 0,
        opening_hours: null,
        manager_name: '',
        manager_phone: '',
        emergency_contact: '',
        emergency_phone: '',
        default_currency: 'EUR',
        default_language: 'es',
        timezone: 'Europe/Madrid',
        target_food_cost_percentage: 30.00,
        labor_cost_per_hour: 0,
        rent_monthly: 0,
        instagram_handle: '',
        facebook_page: '',
        google_business_url: '',
        logo_url: '',
        primary_color: '#f97316',
        secondary_color: '#ea580c'
      };
      
      return res.json({
        success: true,
        data: defaultInfo
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error al obtener información del restaurante:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

// PUT /restaurant-info - Actualizar información del restaurante
router.put('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const restaurantData = req.body;
    
    // Verificar si ya existe un registro
    const [existing] = await req.tenantDb.query(`
      SELECT restaurant_id FROM RESTAURANT_INFO 
      WHERE restaurant_id = 1 
      LIMIT 1
    `);
    
    if (existing.length === 0) {
      // Crear nuevo registro
      const [result] = await req.tenantDb.query(`
        INSERT INTO RESTAURANT_INFO (
          restaurant_id, name, business_name, description, phone, email, website,
          address, city, postal_code, country, tax_number, vat_rate, cuisine_type,
          seating_capacity, opening_hours, manager_name, manager_phone, 
          emergency_contact, emergency_phone, default_currency, default_language,
          timezone, target_food_cost_percentage, labor_cost_per_hour, rent_monthly,
          instagram_handle, facebook_page, google_business_url, logo_url,
          primary_color, secondary_color
        ) VALUES (
          1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `, [
        restaurantData.name || '',
        restaurantData.business_name || '',
        restaurantData.description || '',
        restaurantData.phone || '',
        restaurantData.email || '',
        restaurantData.website || '',
        restaurantData.address || '',
        restaurantData.city || '',
        restaurantData.postal_code || '',
        restaurantData.country || 'España',
        restaurantData.tax_number || '',
        restaurantData.vat_rate || 21.00,
        restaurantData.cuisine_type || '',
        restaurantData.seating_capacity || 0,
        restaurantData.opening_hours ? JSON.stringify(restaurantData.opening_hours) : null,
        restaurantData.manager_name || '',
        restaurantData.manager_phone || '',
        restaurantData.emergency_contact || '',
        restaurantData.emergency_phone || '',
        restaurantData.default_currency || 'EUR',
        restaurantData.default_language || 'es',
        restaurantData.timezone || 'Europe/Madrid',
        restaurantData.target_food_cost_percentage || 30.00,
        restaurantData.labor_cost_per_hour || 0,
        restaurantData.rent_monthly || 0,
        restaurantData.instagram_handle || '',
        restaurantData.facebook_page || '',
        restaurantData.google_business_url || '',
        restaurantData.logo_url || '',
        restaurantData.primary_color || '#f97316',
        restaurantData.secondary_color || '#ea580c'
      ]);
      
      await logAudit(req.tenantDb, req.user.user_id, 'create', 'RESTAURANT_INFO', 1, 'Información del restaurante creada');
    } else {
      // Actualizar registro existente
      await req.tenantDb.query(`
        UPDATE RESTAURANT_INFO SET 
          name = ?, business_name = ?, description = ?, phone = ?, email = ?, website = ?,
          address = ?, city = ?, postal_code = ?, country = ?, tax_number = ?, vat_rate = ?,
          cuisine_type = ?, seating_capacity = ?, opening_hours = ?, manager_name = ?,
          manager_phone = ?, emergency_contact = ?, emergency_phone = ?, default_currency = ?,
          default_language = ?, timezone = ?, target_food_cost_percentage = ?, 
          labor_cost_per_hour = ?, rent_monthly = ?, instagram_handle = ?, facebook_page = ?,
          google_business_url = ?, logo_url = ?, primary_color = ?, secondary_color = ?
        WHERE restaurant_id = 1
      `, [
        restaurantData.name || '',
        restaurantData.business_name || '',
        restaurantData.description || '',
        restaurantData.phone || '',
        restaurantData.email || '',
        restaurantData.website || '',
        restaurantData.address || '',
        restaurantData.city || '',
        restaurantData.postal_code || '',
        restaurantData.country || 'España',
        restaurantData.tax_number || '',
        restaurantData.vat_rate || 21.00,
        restaurantData.cuisine_type || '',
        restaurantData.seating_capacity || 0,
        restaurantData.opening_hours ? JSON.stringify(restaurantData.opening_hours) : null,
        restaurantData.manager_name || '',
        restaurantData.manager_phone || '',
        restaurantData.emergency_contact || '',
        restaurantData.emergency_phone || '',
        restaurantData.default_currency || 'EUR',
        restaurantData.default_language || 'es',
        restaurantData.timezone || 'Europe/Madrid',
        restaurantData.target_food_cost_percentage || 30.00,
        restaurantData.labor_cost_per_hour || 0,
        restaurantData.rent_monthly || 0,
        restaurantData.instagram_handle || '',
        restaurantData.facebook_page || '',
        restaurantData.google_business_url || '',
        restaurantData.logo_url || '',
        restaurantData.primary_color || '#f97316',
        restaurantData.secondary_color || '#ea580c'
      ]);
      
      await logAudit(req.tenantDb, req.user.user_id, 'update', 'RESTAURANT_INFO', 1, 'Información del restaurante actualizada');
    }
    
    res.json({
      success: true,
      message: 'Información del restaurante guardada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar información del restaurante:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

module.exports = router;