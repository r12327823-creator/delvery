const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const { generateId } = require('../utils/otp');

// Apply admin auth to all routes
router.use(auth, adminOnly);

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toDateString();

    const stats = {
      orders_today: await pool.query(
        `SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE`
      ),
      orders_week: await pool.query(
        `SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
      ),
      orders_month: await pool.query(
        `SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`
      ),
      active_vendors: await pool.query(
        `SELECT COUNT(*) FROM vendors WHERE status = 'approved'`
      ),
      active_riders: await pool.query(
        `SELECT COUNT(*) FROM riders WHERE kyc_status = 'approved'`
      ),
      riders_online: await pool.query(
        `SELECT COUNT(*) FROM riders WHERE is_online = true AND kyc_status = 'approved'`
      ),
      total_customers: await pool.query(
        `SELECT COUNT(*) FROM users WHERE role = 'customer'`
      ),
      pending_vendors: await pool.query(
        `SELECT COUNT(*) FROM vendors WHERE status = 'pending'`
      ),
      pending_kyc: await pool.query(
        `SELECT COUNT(*) FROM riders WHERE kyc_status = 'pending'`
      ),
      revenue_today: await pool.query(
        `SELECT COALESCE(SUM(delivery_fee * 0.25), 0) as revenue FROM orders
         WHERE DATE(created_at) = CURRENT_DATE AND status = 'delivered'`
      ),
      completed_orders: await pool.query(
        `SELECT COUNT(*) FROM orders WHERE status = 'delivered'`
      ),
      pending_orders: await pool.query(
        `SELECT COUNT(*) FROM orders WHERE status NOT IN ('delivered', 'cancelled', 'rejected')`
      )
    };

    res.json({
      orders_today: parseInt(stats.orders_today.rows[0].count),
      orders_week: parseInt(stats.orders_week.rows[0].count),
      orders_month: parseInt(stats.orders_month.rows[0].count),
      active_vendors: parseInt(stats.active_vendors.rows[0].count),
      active_riders: parseInt(stats.active_riders.rows[0].count),
      riders_online: parseInt(stats.riders_online.rows[0].count),
      total_customers: parseInt(stats.total_customers.rows[0].count),
      pending_vendors: parseInt(stats.pending_vendors.rows[0].count),
      pending_kyc: parseInt(stats.pending_kyc.rows[0].count),
      revenue_today: parseFloat(stats.revenue_today.rows[0].revenue),
      completed_orders: parseInt(stats.completed_orders.rows[0].count),
      pending_orders: parseInt(stats.pending_orders.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Dashboard error' });
  }
});

// === Pincodes ===
router.get('/pincodes', async (req, res) => {
  try {
    const { is_active } = req.query;
    let query = 'SELECT * FROM pincodes ORDER BY pincode';
    const params = [];

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query = 'SELECT * FROM pincodes WHERE is_active = $1 ORDER BY pincode';
    }

    const result = await pool.query(query, params);
    res.json({ pincodes: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/pincodes', async (req, res) => {
  try {
    const { pincode, city, state } = req.body;
    if (!pincode) return res.status(400).json({ error: 'Pincode is required' });

    const id = generateId('pc');
    await pool.query(
      `INSERT INTO pincodes (id, pincode, city, state) VALUES ($1, $2, $3, $4)
       ON CONFLICT (pincode) DO UPDATE SET city = $3, state = $4, is_active = true`,
      [id, pincode, city || '', state || '']
    );

    res.status(201).json({ message: 'Pincode added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add pincode' });
  }
});

router.patch('/pincodes/:id', async (req, res) => {
  try {
    const { is_active } = req.body;
    await pool.query('UPDATE pincodes SET is_active = $1 WHERE id = $2', [is_active, req.params.id]);
    res.json({ message: 'Pincode updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pincode' });
  }
});

// === Vendors ===
router.get('/vendors', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT v.*, u.name, u.mobile, u.pincode, u.created_at
      FROM vendors v JOIN users u ON v.user_id = u.id
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE v.status = $${params.length}`;
    }

    query += ' ORDER BY v.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ vendors: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/vendors/:id', async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const updateFields = [];
    const params = [];

    if (status) {
      params.push(status);
      updateFields.push(`status = $${params.length}`);
      if (status === 'approved') updateFields.push('approved_at = CURRENT_TIMESTAMP');
    }

    if (admin_notes !== undefined) {
      params.push(admin_notes);
      updateFields.push(`admin_notes = $${params.length}`);
    }

    if (updateFields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await pool.query(
      `UPDATE vendors SET ${updateFields.join(', ')} WHERE id = $${params.length}`,
      params
    );

    res.json({ message: 'Vendor updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// === Riders ===
router.get('/riders', async (req, res) => {
  try {
    const { kyc_status } = req.query;
    let query = `
      SELECT r.*, u.name, u.mobile, u.pincode, u.is_active
      FROM riders r JOIN users u ON r.user_id = u.id
    `;
    const params = [];

    if (kyc_status) {
      params.push(kyc_status);
      query += ` WHERE r.kyc_status = $${params.length}`;
    }

    query += ' ORDER BY r.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ riders: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/riders/:id', async (req, res) => {
  try {
    const { kyc_status, kyc_notes, is_active } = req.body;
    const updateFields = [];
    const params = [];

    if (kyc_status) {
      params.push(kyc_status);
      updateFields.push(`kyc_status = $${params.length}`);
      if (kyc_status === 'approved') updateFields.push('approved_at = CURRENT_TIMESTAMP');
    }

    if (kyc_notes !== undefined) {
      params.push(kyc_notes);
      updateFields.push(`kyc_notes = $${params.length}`);
    }

    if (is_active !== undefined) {
      params.push(is_active);
      updateFields.push(`is_active = $${params.length}`);
    }

    if (updateFields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await pool.query(
      `UPDATE riders SET ${updateFields.join(', ')} WHERE id = $${params.length}`,
      params
    );

    res.json({ message: 'Rider updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update rider' });
  }
});

// === Orders ===
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT o.*, v.shop_name,
        cu.name as customer_name, cu.mobile as customer_mobile,
        ru.name as rider_name
      FROM orders o
      JOIN vendors v ON o.vendor_id = v.id
      JOIN users cu ON o.customer_id = cu.id
      LEFT JOIN riders r ON o.rider_id = r.id
      LEFT JOIN users ru ON r.user_id = ru.id
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE o.status = $${params.length}`;
    }

    query += ' ORDER BY o.created_at DESC LIMIT 100';
    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Manual rider assignment
router.post('/orders/:id/assign-rider', async (req, res) => {
  try {
    const { rider_id } = req.body;
    await pool.query(
      `UPDATE orders SET rider_id = $1, status = 'rider_assigned',
       rider_assigned_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [rider_id, req.params.id]
    );
    res.json({ message: 'Rider assigned manually' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign rider' });
  }
});

// === Platform Settings ===
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM platform_settings ORDER BY key_name');
    res.json({ settings: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/settings/:key', async (req, res) => {
  try {
    const { value } = req.body;
    await pool.query(
      `UPDATE platform_settings SET value = $1, updated_at = CURRENT_TIMESTAMP
       WHERE key_name = $2`,
      [value, req.params.key]
    );
    res.json({ message: 'Setting updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// === Payouts ===
router.get('/payouts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name, u.mobile
       FROM payouts p JOIN riders r ON p.rider_id = r.id
       JOIN users u ON r.user_id = u.id
       ORDER BY p.created_at DESC LIMIT 50`
    );
    res.json({ payouts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/payouts', async (req, res) => {
  try {
    const { rider_id, amount, method = 'upi', transaction_id } = req.body;
    const id = generateId('payout');

    await pool.query(
      `INSERT INTO payouts (id, rider_id, amount, method, transaction_id, status, processed_at)
       VALUES ($1, $2, $3, $4, $5, 'completed', CURRENT_TIMESTAMP)`,
      [id, rider_id, amount, method, transaction_id]
    );

    // Update earnings status
    await pool.query(
      `UPDATE rider_earnings SET status = 'paid', payout_id = $1
       WHERE rider_id = $2 AND status IN ('pending', 'approved')`,
      [id, rider_id]
    );

    res.status(201).json({ message: 'Payout processed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

module.exports = router;
