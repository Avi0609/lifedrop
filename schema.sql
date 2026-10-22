-- ===================================================================
-- LIFE DROP - BLOOD DONATION & SEARCH MANAGEMENT SYSTEM DATABASE SCHEMA
-- Compatible with MySQL (8.0+), PostgreSQL, and SQLite
-- ===================================================================

-- 1. Table: Donors
-- Stores registered voluntary blood donors
CREATE TABLE IF NOT EXISTS donors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(120),
    blood_group VARCHAR(10) NOT NULL, -- e.g. 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(20),
    address TEXT,
    age INTEGER,
    gender VARCHAR(20),
    is_available BOOLEAN DEFAULT 1,
    last_donation_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: Blood Centers / Blood Banks
-- Stores licensed blood bank institutions and hospitals
CREATE TABLE IF NOT EXISTS blood_centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(20),
    address TEXT NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(120),
    operating_hours VARCHAR(100) DEFAULT '24/7 Emergency Service',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: Blood Inventory
-- Tracks units of specific components and blood groups available at each center
CREATE TABLE IF NOT EXISTS blood_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    center_id INTEGER NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    component VARCHAR(50) NOT NULL, -- 'Red cells', 'Platelets', 'Plasma', 'Whole blood'
    units_available INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES blood_centers(id) ON DELETE CASCADE,
    UNIQUE(center_id, blood_group, component)
);

-- 4. Table: Blood Requests
-- Tracks emergency blood requests submitted by patients or hospitals
CREATE TABLE IF NOT EXISTS blood_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name VARCHAR(100) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    component VARCHAR(50) NOT NULL,
    units_needed INTEGER DEFAULT 1,
    hospital_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    urgency VARCHAR(20) DEFAULT 'Normal', -- 'Critical', 'High', 'Normal'
    status VARCHAR(20) DEFAULT 'Open',    -- 'Open', 'Fulfilled', 'Cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast searching by blood group and location
CREATE INDEX IF NOT EXISTS idx_donors_blood_city ON donors(blood_group, city);
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON blood_inventory(blood_group, component);
CREATE INDEX IF NOT EXISTS idx_centers_city ON blood_centers(city);
CREATE INDEX IF NOT EXISTS idx_requests_city_blood ON blood_requests(city, blood_group, status);

-- ===================================================================
-- SAMPLE SEED DATA
-- ===================================================================

-- Sample Blood Centers across major cities & regions
INSERT INTO blood_centers (id, name, city, state, pincode, address, phone, email, operating_hours) VALUES
(1, 'City General Blood Centre', 'Hyderabad', 'Telangana', '500034', 'Road No. 12, Banjara Hills, Hyderabad', '+91 40 2345 6789', 'contact@citybloodhyd.org', '24/7 Emergency Service'),
(2, 'Red Cross Blood Bank', 'Hyderabad', 'Telangana', '500003', 'Near Gandhi Hospital, Secunderabad, Hyderabad', '+91 40 2750 1122', 'hyd@redcrossblood.org', '24/7 Emergency Service'),
(3, 'Regional Blood Centre', 'Pune', 'Maharashtra', '411004', 'F.C. Road, Shivajinagar, Pune', '+91 20 2567 8901', 'info@punebloodcentre.org', '8:00 AM - 9:00 PM'),
(4, 'Sassoon General Hospital Blood Bank', 'Pune', 'Maharashtra', '411001', 'Station Road, Pune', '+91 20 2612 8000', 'sassoon.blood@mahablood.gov.in', '24/7 Emergency Service'),
(5, 'Community Blood Bank', 'Mumbai', 'Maharashtra', '400018', 'Dr. E. Moses Road, Worli, Mumbai', '+91 22 2493 4567', 'worli@communityblood.org', '24/7 Emergency Service'),
(6, 'KEM Hospital Blood Centre', 'Mumbai', 'Maharashtra', '400012', 'Acharya Donde Marg, Parel, Mumbai', '+91 22 2410 7000', 'bloodbank@kem.edu', '24/7 Emergency Service'),
(7, 'Apex Trauma Blood Bank', 'Delhi', 'Delhi', '110029', 'Ring Road, Ansari Nagar, New Delhi', '+91 11 2658 8500', 'bloodbank@aiims.edu', '24/7 Emergency Service'),
(8, 'Rotary Bangalore Blood Center', 'Bengaluru', 'Karnataka', '560008', 'HAL 2nd Stage, Indiranagar, Bengaluru', '+91 80 2528 5555', 'care@rotarybloodblr.org', '24/7 Emergency Service'),
(9, 'Lions Blood Bank', 'Chennai', 'Tamil Nadu', '600008', 'Marshalls Road, Egmore, Chennai', '+91 44 2841 4949', 'contact@lionsbloodchennai.org', '24/7 Emergency Service'),
(10, 'Central Blood Bank', 'Kolkata', 'West Bengal', '700073', 'Maniktala Main Road, Kolkata', '+91 33 2355 7890', 'central@wbhealthblood.gov.in', '24/7 Emergency Service');

-- Sample Inventory for Centers
-- 1. Hyderabad - City General Blood Centre (ID 1)
INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES
(1, 'A+', 'Red cells', 14),
(1, 'A+', 'Platelets', 6),
(1, 'A+', 'Plasma', 8),
(1, 'A+', 'Whole blood', 12),
(1, 'B+', 'Red cells', 18),
(1, 'B+', 'Platelets', 10),
(1, 'B+', 'Plasma', 15),
(1, 'B+', 'Whole blood', 20),
(1, 'O+', 'Red cells', 25),
(1, 'O+', 'Platelets', 14),
(1, 'O+', 'Plasma', 22),
(1, 'O+', 'Whole blood', 30),
(1, 'O-', 'Red cells', 5),
(1, 'O-', 'Plasma', 4),
(1, 'AB+', 'Red cells', 9),
(1, 'AB+', 'Platelets', 7);

-- 2. Hyderabad - Red Cross (ID 2)
INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES
(2, 'A-', 'Red cells', 8),
(2, 'B-', 'Red cells', 6),
(2, 'O-', 'Whole blood', 7),
(2, 'AB-', 'Platelets', 4),
(2, 'O+', 'Red cells', 22),
(2, 'A+', 'Red cells', 15);

-- 3. Pune - Regional Blood Centre (ID 3)
INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES
(3, 'A-', 'Red cells', 9),
(3, 'AB+', 'Red cells', 12),
(3, 'AB+', 'Platelets', 8),
(3, 'AB+', 'Plasma', 10),
(3, 'O-', 'Red cells', 4),
(3, 'O-', 'Plasma', 5),
(3, 'O+', 'Red cells', 20),
(3, 'O+', 'Platelets', 11),
(3, 'O+', 'Plasma', 16);

-- 4. Pune - Sassoon General Hospital (ID 4)
INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES
(4, 'A+', 'Red cells', 16),
(4, 'A+', 'Whole blood', 10),
(4, 'B+', 'Red cells', 22),
(4, 'B+', 'Platelets', 12),
(4, 'B+', 'Plasma', 18),
(4, 'O+', 'Red cells', 30),
(4, 'O+', 'Whole blood', 25),
(4, 'O-', 'Red cells', 6),
(4, 'AB+', 'Red cells', 11),
(4, 'AB-', 'Red cells', 5);

-- 5. Mumbai - Community Blood Bank (ID 5)
INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES
(5, 'A+', 'Red cells', 19),
(5, 'A+', 'Platelets', 9),
(5, 'A+', 'Whole blood', 14),
(5, 'AB-', 'Red cells', 4),
(5, 'AB-', 'Plasma', 6),
(5, 'B-', 'Red cells', 8),
(5, 'B-', 'Whole blood', 6),
(5, 'O+', 'Red cells', 28),
(5, 'O+', 'Platelets', 15),
(5, 'O+', 'Plasma', 20);

-- 6. Mumbai - KEM Hospital (ID 6)
INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES
(6, 'A-', 'Red cells', 7),
(6, 'B+', 'Red cells', 25),
(6, 'B+', 'Platelets', 14),
(6, 'B+', 'Plasma', 16),
(6, 'O+', 'Red cells', 32),
(6, 'O+', 'Whole blood', 20),
(6, 'O-', 'Red cells', 8),
(6, 'O-', 'Whole blood', 6),
(6, 'AB+', 'Red cells', 15),
(6, 'AB+', 'Platelets', 9);

-- 7. Delhi - Apex Trauma Blood Bank (ID 7)
INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES
(7, 'A+', 'Red cells', 24),
(7, 'A+', 'Platelets', 12),
(7, 'A+', 'Plasma', 15),
(7, 'A+', 'Whole blood', 18),
(7, 'A-', 'Red cells', 10),
(7, 'B+', 'Red cells', 28),
(7, 'B+', 'Platelets', 16),
(7, 'B+', 'Plasma', 20),
(7, 'B+', 'Whole blood', 22),
(7, 'B-', 'Red cells', 7),
(7, 'O+', 'Red cells', 35),
(7, 'O+', 'Platelets', 20),
(7, 'O+', 'Plasma', 25),
(7, 'O+', 'Whole blood', 30),
(7, 'O-', 'Red cells', 9),
(7, 'O-', 'Plasma', 8),
(7, 'AB+', 'Red cells', 14),
(7, 'AB+', 'Platelets', 10),
(7, 'AB-', 'Red cells', 6);

-- 8. Bengaluru - Rotary Bangalore Blood Center (ID 8)
INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES
(8, 'A+', 'Red cells', 20),
(8, 'A+', 'Platelets', 11),
(8, 'A+', 'Plasma', 14),
(8, 'A+', 'Whole blood', 16),
(8, 'A-', 'Red cells', 8),
(8, 'B+', 'Red cells', 26),
(8, 'B+', 'Platelets', 15),
(8, 'B+', 'Plasma', 18),
(8, 'B+', 'Whole blood', 20),
(8, 'B-', 'Red cells', 6),
(8, 'O+', 'Red cells', 32),
(8, 'O+', 'Platelets', 18),
(8, 'O+', 'Plasma', 22),
(8, 'O+', 'Whole blood', 28),
(8, 'O-', 'Red cells', 8),
(8, 'O-', 'Plasma', 7),
(8, 'AB+', 'Red cells', 12),
(8, 'AB+', 'Platelets', 8),
(8, 'AB-', 'Red cells', 5);

-- 9. Chennai - Lions Blood Bank (ID 9)
INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES
(9, 'A+', 'Red cells', 18),
(9, 'B+', 'Red cells', 21),
(9, 'B+', 'Platelets', 10),
(9, 'O+', 'Red cells', 25),
(9, 'O+', 'Whole blood', 19),
(9, 'O-', 'Red cells', 7),
(9, 'AB+', 'Red cells', 10);

-- 10. Kolkata - Central Blood Bank (ID 10)
INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES
(10, 'A+', 'Red cells', 17),
(10, 'A+', 'Whole blood', 12),
(10, 'B+', 'Red cells', 24),
(10, 'B+', 'Platelets', 13),
(10, 'O+', 'Red cells', 29),
(10, 'O+', 'Platelets', 14),
(10, 'O-', 'Red cells', 6),
(10, 'AB+', 'Red cells', 11);

-- Sample Donors
INSERT INTO donors (name, phone, email, blood_group, city, state, pincode, address, age, gender, is_available) VALUES
('Rahul Sharma', '+91 98765 43210', 'rahul.s@example.com', 'A+', 'Hyderabad', 'Telangana', '500034', 'Jubilee Hills', 28, 'Male', 1),
('Priya Patel', '+91 98234 56789', 'priya.p@example.com', 'O+', 'Hyderabad', 'Telangana', '500081', 'Madhapur', 25, 'Female', 1),
('Ananya Deshmukh', '+91 98111 22334', 'ananya.d@example.com', 'B+', 'Pune', 'Maharashtra', '411038', 'Kothrud', 29, 'Female', 1),
('Vikram Mehta', '+91 97654 32109', 'vikram.m@example.com', 'O-', 'Pune', 'Maharashtra', '411007', 'Aundh', 34, 'Male', 1),
('Amitabh Sen', '+91 98300 12345', 'amitabh.s@example.com', 'AB+', 'Mumbai', 'Maharashtra', '400053', 'Andheri West', 31, 'Male', 1),
('Sneha Kulkarni', '+91 99201 54321', 'sneha.k@example.com', 'A-', 'Mumbai', 'Maharashtra', '400028', 'Dadar', 26, 'Female', 1),
('Kavita Rao', '+91 98450 67890', 'kavita.r@example.com', 'B-', 'Bengaluru', 'Karnataka', '560034', 'Koramangala', 27, 'Female', 1),
('Siddharth Hegde', '+91 98801 23456', 'siddharth.h@example.com', 'O+', 'Bengaluru', 'Karnataka', '560041', 'Jayanagar', 32, 'Male', 1),
('Arjun Nair', '+91 98470 11223', 'arjun.n@example.com', 'O+', 'Delhi', 'Delhi', '110017', 'Saket', 30, 'Male', 1),
('Pooja Malhotra', '+91 98102 34567', 'pooja.m@example.com', 'A+', 'Delhi', 'Delhi', '110024', 'Lajpat Nagar', 27, 'Female', 1),
('Rohan Mehra', '+91 98200 87654', 'rohan.m@example.com', 'B+', 'Delhi', 'Delhi', '122002', 'Gurgaon / Gurugram', 31, 'Male', 1),
('Suresh Natarajan', '+91 98401 56789', 'suresh.n@example.com', 'O+', 'Chennai', 'Tamil Nadu', '600020', 'Adyar', 35, 'Male', 1),
('Rupa Banerjee', '+91 98311 67890', 'rupa.b@example.com', 'A+', 'Kolkata', 'West Bengal', '700019', 'Ballygunge', 29, 'Female', 1);

-- Sample Blood Requests
INSERT INTO blood_requests (patient_name, blood_group, component, units_needed, hospital_name, city, state, contact_name, contact_phone, urgency, status) VALUES
('Suresh Kumar', 'O-', 'Red cells', 2, 'Apollo Hospital', 'Hyderabad', 'Telangana', 'Ramesh Kumar', '+91 98980 12345', 'Critical', 'Open'),
('Deepa Verma', 'B+', 'Platelets', 4, 'Ruby Hall Clinic', 'Pune', 'Maharashtra', 'Sunil Verma', '+91 98970 54321', 'High', 'Open'),
('Rajesh Joshi', 'A+', 'Whole blood', 1, 'Lilavati Hospital', 'Mumbai', 'Maharashtra', 'Anita Joshi', '+91 98960 98765', 'Normal', 'Open'),
('Sunita Sharma', 'AB-', 'Red cells', 2, 'Manipal Hospital', 'Bengaluru', 'Karnataka', 'Vivek Sharma', '+91 98860 12345', 'High', 'Open'),
('Harpreet Singh', 'O-', 'Whole blood', 3, 'AIIMS', 'Delhi', 'Delhi', 'Gurpreet Singh', '+91 98110 54321', 'Critical', 'Open');
