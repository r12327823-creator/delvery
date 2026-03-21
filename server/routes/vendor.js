const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

// Get vendor profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, u.name, u.mobile, u.email, u.pincode, u.address
       FROM vendors v JOIN users u ON v.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    res.json({ vendor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update vendor profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { shop_name, shop_address, shop_photo, gst_number, category } = req.body;

    await pool.query(
      `UPDATE vendors SET shop_name = COALESCE($1, shop_name),
       shop_address = COALESCE($2, shop_address),
       shop_photo = COALESCE($3, shop_photo),
       gst_number = COALESCE($4, gst_number),
       category = COALESCE($5, category)
       WHERE user_id = $6`,
      [shop_name, shop_address, shop_photo, gst_number, category, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get products
router.get('/products', auth, async (req, res) => {
  try {
    const vendor = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    const products = await pool.query(
      'SELECT * FROM products WHERE vendor_id = $1 ORDER BY name',
      [vendor.rows[0].id]
    );

    res.json({ products: products.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add product
router.post('/products', auth, async (req, res) => {
  try {
    const { name, description, price, image, category, stock_status = 'in_stock' } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const vendor = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    const { generateId } = require('../utils/otp');
    const productId = generateId('prod');

    await pool.query(
      `INSERT INTO products (id, vendor_id, name, description, price, image, category, stock_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [productId, vendor.rows[0].id, name, description, price, image, category, stock_status]
    );

    res.status(201).json({ message: 'Product added successfully', id: productId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update product
router.put('/products/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, category, stock_status } = req.body;

    const vendor = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    await pool.query(
      `UPDATE products SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       price = COALESCE($3, price),
       image = COALESCE($4, image),
       category = COALESCE($5, category),
       stock_status = COALESCE($6, stock_status),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND vendor_id = $8`,
      [name, description, price, image, category, stock_status, id, vendor.rows[0].id]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    await pool.query(
      'UPDATE products SET is_active = false WHERE id = $1 AND vendor_id = $2',
      [id, vendor.rows[0].id]
    );

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get incoming orders
router.get('/orders', auth, async (req, res) => {
  try {
    const vendor = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    const { status } = req.query;
    let query = `
      SELECT o.*, u.name as customer_name, u.mobile as customer_mobile
      FROM orders o JOIN users u ON o.customer_id = u.id
      WHERE o.vendor_id = $1
    `;
    const params = [vendor.rows[0].id];

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ' ORDER BY o.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept order
router.post('/orders/:id/accept', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    await pool.query(
      `UPDATE orders SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND vendor_id = $2 AND status = 'placed'`,
      [id, vendor.rows[0].id]
    );

    res.json({ message: 'Order accepted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// Reject order
router.post('/orders/:id/reject', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const vendor = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    await pool.query(
      `UPDATE orders SET status = 'rejected', rejection_reason = $1
       WHERE id = $2 AND vendor_id = $3 AND status = 'placed'`,
      [reason || 'No reason provided', id, vendor.rows[0].id]
    );

    // TODO: Trigger SMS to customer about rejection and refund
    res.json({ message: 'Order rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject order' });
  }
});

// Mark order ready for pickup
router.post('/orders/:id/ready', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    await pool.query(
      `UPDATE orders SET status = 'ready_for_pickup'
       WHERE id = $1 AND vendor_id = $2 AND status = 'accepted'`,
      [id, vendor.rows[0].id]
    );

    res.json({ message: 'Order marked as ready for pickup' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Get earnings
router.get('/earnings', auth, async (req, res) => {
  try {
    const vendor = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    const orders = await pool.query(
      `SELECT SUM(total_amount) as total_sales, COUNT(*) as total_orders,
       SUM(delivery_fee) as total_delivery_fees
       FROM orders WHERE vendor_id = $1 AND status = 'delivered'`,
      [vendor.rows[0].id]
    );

    const commission = await pool.query(
      "SELECT value FROM platform_settings WHERE key_name = 'platform_commission'"
    );
    const commissionRate = parseFloat(commission.rows[0]?.value || 10);

    res.json({
      total_sales: orders.rows[0].total_sales || 0,
      total_orders: orders.rows[0].total_orders || 0,
      platform_commission_percent: commissionRate,
      earnings_after_commission: (orders.rows[0].total_sales || 0) * (1 - commissionRate / 100)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
