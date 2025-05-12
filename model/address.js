import db from '../config/db.js'

export const submitAddress = async (req, res) => {
  console.log("📩 submitAddress called");
  const {
    uid,
    firstName = null,
    lastName = null,
    houseDetails = null,
    areaDetails = null,
    landmark = null,
    city = null,
    state = null,
    pincode = null,
    phone = null,
    email = null,
  } = req.body;

  console.log("Incoming request body:", req.body);

  if (!uid || !firstName || !pincode) {
    return res.status(400).json({
      error: "Validation failed",
      details: "UID, First Name, and Pincode are required"
    });
  }

  try {
    const userResult = await db.query('SELECT id FROM users WHERE uid = ?', [uid]);
    const userRows = userResult[0] || userResult.rows || userResult;

    if (!userRows || (Array.isArray(userRows) && userRows.length === 0)) {
      return res.status(404).json({
        error: "User not found",
        details: "Please register this UID first"
      });
    }

    const addressData = {
      uid,
      firstName,
      lastName,
      houseDetails,
      areaDetails,
      landmark,
      city,
      state,
      pincode,
      phone,
      email
    };
    

    const addressResult = await db.query('SELECT id FROM addresses WHERE uid = ?', [uid]);
    const existingAddress = addressResult[0] || addressResult.rows || addressResult;

    const columns = Object.keys(addressData);
    const values = Object.values(addressData);

    if (existingAddress && (Array.isArray(existingAddress) ? existingAddress.length > 0 : existingAddress.id)) {
      const updateSQL = `UPDATE addresses SET ${columns.map(col => `${col} = ?`).join(', ')} WHERE uid = ?`;
      await db.query(updateSQL, [...values, uid]);

      return res.json({
        success: true,
        message: "Address updated successfully",
        action: "update"
      });
    } else {
      const insertSQL = `INSERT INTO addresses (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
      const result = await db.query(insertSQL, values);
      const insertId = result.insertId || result[0]?.insertId;

      return res.status(201).json({
        success: true,
        message: "Address created successfully",
        action: "create",
        addressId: insertId
      });
    }

  } catch (err) {
    console.error("Address submission error:", err);

    return res.status(500).json({
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
    });
  }
};
