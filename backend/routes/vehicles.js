const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

// Helper function to run SQL queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (sql.trim().toLowerCase().startsWith('select')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    }
  });
};

// Get all vehicles for the authenticated user
router.get('/', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const vehicles = await runQuery(
      'SELECT * FROM vehicles WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
});

// Get a specific vehicle
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const vehicle = await runQuery(
      'SELECT * FROM vehicles WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!vehicle || vehicle.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({ vehicle: vehicle[0] });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ message: 'Error fetching vehicle' });
  }
});

// Add a new vehicle
router.post('/', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const { make, model, year, license_plate, vin } = req.body;

    // Validate required fields
    if (!make || !model || !year || !license_plate || !vin) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if VIN already exists
    const existingVehicle = await runQuery(
      'SELECT * FROM vehicles WHERE vin = ?',
      [vin]
    );
    if (existingVehicle && existingVehicle.length > 0) {
      return res.status(400).json({ message: 'Vehicle with this VIN already exists' });
    }

    // Insert new vehicle
    const vehicleId = await runQuery(
      'INSERT INTO vehicles (user_id, make, model, year, license_plate, vin) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, make, model, year, license_plate, vin]
    );

    const newVehicle = await runQuery(
      'SELECT * FROM vehicles WHERE id = ?',
      [vehicleId]
    );

    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle: newVehicle[0]
    });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({ message: 'Error adding vehicle' });
  }
});

// Update a vehicle
router.put('/:id', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const { make, model, year, license_plate, vin } = req.body;
    const vehicleId = req.params.id;

    // Check if vehicle exists and belongs to user
    const existingVehicle = await runQuery(
      'SELECT * FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, req.user.id]
    );

    if (!existingVehicle || existingVehicle.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check if new VIN is already in use by another vehicle
    if (vin && vin !== existingVehicle[0].vin) {
      const vinCheck = await runQuery(
        'SELECT * FROM vehicles WHERE vin = ? AND id != ?',
        [vin, vehicleId]
      );
      if (vinCheck && vinCheck.length > 0) {
        return res.status(400).json({ message: 'Vehicle with this VIN already exists' });
      }
    }

    // Update vehicle
    const updates = [];
    const params = [];

    if (make) {
      updates.push('make = ?');
      params.push(make);
    }
    if (model) {
      updates.push('model = ?');
      params.push(model);
    }
    if (year) {
      updates.push('year = ?');
      params.push(year);
    }
    if (license_plate) {
      updates.push('license_plate = ?');
      params.push(license_plate);
    }
    if (vin) {
      updates.push('vin = ?');
      params.push(vin);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    params.push(vehicleId);
    await runQuery(
      `UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedVehicle = await runQuery(
      'SELECT * FROM vehicles WHERE id = ?',
      [vehicleId]
    );

    res.json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle[0]
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ message: 'Error updating vehicle' });
  }
});

// Delete a vehicle
router.delete('/:id', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const vehicleId = req.params.id;

    // Check if vehicle exists and belongs to user
    const existingVehicle = await runQuery(
      'SELECT * FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, req.user.id]
    );

    if (!existingVehicle || existingVehicle.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check if vehicle has any associated service requests
    const serviceRequests = await runQuery(
      'SELECT * FROM service_requests WHERE vehicle_id = ?',
      [vehicleId]
    );

    if (serviceRequests && serviceRequests.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete vehicle with associated service requests'
      });
    }

    // Delete vehicle
    await runQuery('DELETE FROM vehicles WHERE id = ?', [vehicleId]);

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Error deleting vehicle' });
  }
});

module.exports = router; 