-- Market 2 Home Database Schema
-- Run this in PostgreSQL to set up the database

-- Create database
-- CREATE DATABASE market2home;

-- Users table (all roles: customer, vendor, rider, admin)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'vendor', 'rider', 'admin')),
    pincode VARCHAR(10) NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor/Shop details
CREATE TABLE vendors (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    shop_name VARCHAR(200) NOT NULL,
    shop_address TEXT,
    shop_photo VARCHAR(500),
    gst_number VARCHAR(20),
    category VARCHAR(50), -- groceries, medicine, bakery, hardware, food, etc.
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    admin_notes TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(50) REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500),
    category VARCHAR(50),
    stock_status VARCHAR(20) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Riders
CREATE TABLE riders (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    aadhaar_front VARCHAR(500),
    aadhaar_back VARCHAR(500),
    selfie VARCHAR(500),
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    kyc_notes TEXT,
    is_online BOOLEAN DEFAULT false,
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    total_deliveries INTEGER DEFAULT 0,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pincodes (service areas)
CREATE TABLE pincodes (
    id VARCHAR(50) PRIMARY KEY,
    pincode VARCHAR(10) UNIQUE NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id VARCHAR(50) REFERENCES users(id),
    vendor_id VARCHAR(50) REFERENCES vendors(id),
    rider_id VARCHAR(50) REFERENCES riders(id),
    status VARCHAR(30) DEFAULT 'placed' CHECK (status IN (
        'placed', 'accepted', 'rejected', 'ready_for_pickup',
        'rider_assigned', 'picked_up', 'out_for_delivery',
        'delivered', 'cancelled', 'waiting_rider'
    )),
    items JSONB NOT NULL, -- [{product_id, name, price, quantity}]
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 40,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cod' CHECK (payment_method IN ('cod', 'upi')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    pickup_address TEXT,
    drop_address TEXT NOT NULL,
    drop_lat DECIMAL(10, 8),
    drop_lng DECIMAL(11, 8),
    pickup_lat DECIMAL(10, 8),
    pickup_lng DECIMAL(11, 8),
    rejection_reason TEXT,
    estimated_time INTEGER, -- minutes
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    rider_assigned_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rider Earnings
CREATE TABLE rider_earnings (
    id VARCHAR(50) PRIMARY KEY,
    rider_id VARCHAR(50) REFERENCES riders(id),
    order_id VARCHAR(50) REFERENCES orders(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    payout_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payouts
CREATE TABLE payouts (
    id VARCHAR(50) PRIMARY KEY,
    rider_id VARCHAR(50) REFERENCES riders(id),
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(20) DEFAULT 'upi',
    transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform Settings
CREATE TABLE platform_settings (
    id VARCHAR(50) PRIMARY KEY,
    key_name VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO platform_settings (id, key_name, value) VALUES
    ('setting_1', 'delivery_fee', '40'),
    ('setting_2', 'rider_pay_per_delivery', '30'),
    ('setting_3', 'platform_commission', '10'),
    ('setting_4', 'order_timeout_minutes', '15'),
    ('setting_5', 'vendor_order_timeout_minutes', '10');

-- Indexes for performance
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_rider ON orders(rider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_pincode ON users(pincode);

-- Admin user (default)
INSERT INTO users (id, mobile, name, role, pincode, is_active)
VALUES ('admin_001', '9999999999', 'Admin', 'admin', '110001', true);
