# 🩸 LifeDrop — Blood Donation & Blood Search Backend

A complete, production-ready backend API and SQL database system for blood donation registration, blood availability search, emergency blood requests, and inventory tracking.

---

## 🌟 Features

- **Blood Availability Search (`/api/search`)**:
  - Search by blood group, component (Red cells, Platelets, Plasma, Whole blood), and city.
  - Automatically factors in **blood compatibility** (e.g. searching for $A^+$ will also find compatible $A^-$, $O^+$, and $O^-$ donor units).
  - Returns **both** verified hospital/blood bank centers with stock count **and** eligible voluntary donors in the area with click-to-call details.
- **Donor Management (`/api/donors`)**:
  - Voluntary donor signup with input validation.
  - Filter donors by blood group, city, and availability status.
  - Toggle donor active status.
- **Blood Bank & Inventory Tracking (`/api/centers`)**:
  - Stores licensed blood centers with address, contact phone, operating hours, and email.
  - Real-time stock counts by blood group and component.
- **Live Emergency Requests (`/api/requests`)**:
  - Urgent blood requirements posted by hospitals and patient families.
  - Priority sorting by urgency (`Critical`, `High`, `Normal`).
- **Dashboard & Statistics (`/api/stats`)**:
  - Live counters for active donors, partner blood banks, total verified units, and open requests.
- **Dual SQL Support**:
  - **SQLite (Default)**: Runs immediately with zero installation using Node 22/24's built-in SQLite engine.
  - **MySQL**: Ready to plug into MySQL / MariaDB / XAMPP with environment variables in `.env`.

---

## 📁 Project Structure

```text
Blood donation/
├── db.js                 # Database connection adapter (SQLite + MySQL)
├── server.js             # Express server entry point & static file serving
├── schema.sql            # Standard SQL DDL schema & initial seed data
├── package.json          # Node dependencies & run scripts
├── .env                  # Active environment configuration
├── .env.example          # Template environment configuration
├── routes/
│   ├── donors.js         # Donor registration & search endpoints
│   ├── search.js         # Blood availability search endpoint
│   ├── centers.js        # Blood bank centers & inventory endpoints
│   ├── requests.js       # Emergency blood requests endpoints
│   └── stats.js          # Platform statistics endpoint
├── index.html            # Frontend UI connected to backend APIs
└── blood_donation.db     # SQLite database file (auto-generated)
```

---

## 🗄️ SQL Database Schema

The database uses 4 relational tables defined in [`schema.sql`](file:///c:/Users/avina/OneDrive/Desktop/Blood%20donation/schema.sql):

### 1. `donors`
Stores registered voluntary blood donors.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY` | Auto-increment ID |
| `name` | `VARCHAR(100)` | Donor full name |
| `phone` | `VARCHAR(20)` | Contact phone number |
| `email` | `VARCHAR(120)` | Optional email |
| `blood_group` | `VARCHAR(10)` | Blood group ($A^+$, $O^-$, etc.) |
| `city` | `VARCHAR(100)` | City of residence |
| `address` | `TEXT` | Street / area address |
| `age` | `INTEGER` | Donor age |
| `gender` | `VARCHAR(20)` | Donor gender |
| `is_available` | `BOOLEAN` | `1` = Available, `0` = Inactive |
| `created_at` | `TIMESTAMP` | Registration date |

### 2. `blood_centers`
Stores licensed blood banks, hospitals, and centers.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY` | Center ID |
| `name` | `VARCHAR(150)` | Blood bank / Hospital name |
| `city` | `VARCHAR(100)` | City |
| `address` | `TEXT` | Full physical address |
| `phone` | `VARCHAR(30)` | Emergency helpline / Phone |
| `email` | `VARCHAR(120)` | Official email |
| `operating_hours`| `VARCHAR(100)` | E.g., '24/7 Emergency Service' |

### 3. `blood_inventory`
Tracks component units available at each center.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY` | Inventory ID |
| `center_id` | `INTEGER` | Foreign key referencing `blood_centers(id)` |
| `blood_group` | `VARCHAR(10)` | Blood group |
| `component` | `VARCHAR(50)` | 'Red cells', 'Platelets', 'Plasma', 'Whole blood' |
| `units_available`| `INTEGER` | Quantity in stock |
| `last_updated` | `TIMESTAMP` | Last updated timestamp |

### 4. `blood_requests`
Urgent blood requests submitted by patients or hospitals.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY` | Request ID |
| `patient_name` | `VARCHAR(100)` | Patient's name |
| `blood_group` | `VARCHAR(10)` | Required blood group |
| `component` | `VARCHAR(50)` | Component requested |
| `units_needed` | `INTEGER` | Number of units needed |
| `hospital_name`| `VARCHAR(150)` | Hospital address / name |
| `city` | `VARCHAR(100)` | City |
| `contact_name` | `VARCHAR(100)` | Relative / Attendant name |
| `contact_phone`| `VARCHAR(30)` | Phone number |
| `urgency` | `VARCHAR(20)` | `Critical`, `High`, `Normal` |
| `status` | `VARCHAR(20)` | `Open`, `Fulfilled`, `Cancelled` |

---

## 🚀 How to Run

### Step 1: Start the Server (SQLite by default)

From this folder, run:

```bash
npm start
```
*(or `node server.js`)*

On first launch, it automatically creates the SQL tables and populates realistic seed data for blood banks across Hyderabad, Mumbai, Pune, Delhi, Bengaluru, etc.

Open your browser at:
👉 **`http://localhost:5000`**

---

### Step 2: (Optional) Switching to MySQL

If you prefer to use **MySQL** (e.g. XAMPP, phpMyAdmin, or MySQL Workbench):

1. Create a database in MySQL:
   ```sql
   CREATE DATABASE blood_donation;
   ```
2. Import the schema and seed data by running [`schema.sql`](file:///c:/Users/avina/OneDrive/Desktop/Blood%20donation/schema.sql) in your MySQL tool.
3. Edit your [`.env`](file:///c:/Users/avina/OneDrive/Desktop/Blood%20donation/.env) file:
   ```env
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=blood_donation
   DB_PORT=3306
   ```
4. Restart the server with `npm start`.

---

## 🔌 REST API Documentation

### 1. Blood Availability Search
**`GET /api/search`**

**Query Parameters:**
- `bloodGroup` (Required): e.g. `A+`, `O-`, `B+`, etc.
- `component` (Required): e.g. `Red cells`, `Platelets`, `Plasma`, `Whole blood`
- `city` (Required): e.g. `Hyderabad`, `Mumbai`, `Pune`
- `includeCompatible` (Optional): `true` to include universal/compatible donor groups

**Example Request:**
```http
GET /api/search?bloodGroup=A%2B&component=Red%20cells&city=Hyderabad&includeCompatible=true
```

**Example Response:**
```json
{
  "success": true,
  "query": {
    "bloodGroup": "A+",
    "component": "Red cells",
    "city": "Hyderabad",
    "compatibleGroupsSearched": ["A+", "A-", "O+", "O-"]
  },
  "resultsCount": 6,
  "donorsCount": 2,
  "centers": [
    {
      "center_id": 1,
      "center_name": "City General Blood Centre",
      "city": "Hyderabad",
      "address": "Road No. 12, Banjara Hills, Hyderabad",
      "phone": "+91 40 2345 6789",
      "blood_group": "A+",
      "component": "Red cells",
      "units_available": 14
    }
  ],
  "donors": [
    {
      "id": 1,
      "name": "Rahul Sharma",
      "phone": "+91 98765 43210",
      "blood_group": "A+",
      "city": "Hyderabad"
    }
  ]
}
```

---

### 2. Register Voluntary Donor
**`POST /api/donors`**

**Request Body:**
```json
{
  "name": "Karan Mehra",
  "phone": "+91 99887 76655",
  "email": "karan@example.com",
  "bloodGroup": "B+",
  "city": "Hyderabad",
  "address": "Gachibowli",
  "age": 28,
  "gender": "Male"
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Thank you! You have been successfully registered as a donor.",
  "donorId": 9
}
```

---

### 3. List & Filter Donors
**`GET /api/donors`**

**Query Parameters (optional):**
- `bloodGroup`: Filter by blood group
- `city`: Filter by city (case-insensitive substring)
- `available`: `true` or `false`

---

### 4. Live Emergency Blood Requests
- **`GET /api/requests`**: Returns active open blood requests ordered by urgency.
- **`POST /api/requests`**: Submit emergency blood requirement:
  ```json
  {
    "patientName": "Sunita Rao",
    "bloodGroup": "O-",
    "component": "Red cells",
    "unitsNeeded": 2,
    "hospitalName": "Care Hospital",
    "city": "Hyderabad",
    "contactName": "Venkatesh Rao",
    "contactPhone": "+91 98765 11223",
    "urgency": "Critical"
  }
  ```

---

### 5. Statistics Overview
**`GET /api/stats`**

**Response:**
```json
{
  "success": true,
  "stats": {
    "activeDonors": 9,
    "bloodCenters": 8,
    "totalUnitsAvailable": 504,
    "openEmergencyRequests": 3,
    "inventoryByGroup": [
      { "blood_group": "A+", "units": 54 },
      { "blood_group": "O+", "units": 105 }
    ]
  }
}
```

