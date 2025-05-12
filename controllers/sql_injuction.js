const mysql = require('mysql2/promise');
const pool = mysql.createPool(process.env.DATABASE_URL);

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getUserById(id) {
  const [user] = await query('SELECT * FROM users WHERE id = ?', [id]);
  return user;
}

async function createUser(id, phone) {
  await query('INSERT INTO users (id, phone) VALUES (?, ?)', [id, phone]);
}

async function createOrderRecord(orderData) {
  const sql = `
    INSERT INTO orders 
    (id, user_id, amount, currency, receipt, status, razorpay_order_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    orderData.id,
    orderData.user_id,
    orderData.amount,
    orderData.currency || 'INR',
    orderData.receipt,
    'created',
    orderData.razorpay_order_id
  ];
  
  await query(sql, params);
}

async function updateOrderPayment(orderId, paymentData) {
  const sql = `
    UPDATE orders 
    SET status = ?,
        razorpay_payment_id = ?,
        razorpay_signature = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const params = [
    paymentData.status || 'paid',
    paymentData.paymentId,
    paymentData.signature,
    orderId
  ];
  
  await query(sql, params);
}

export default {
  query,
  getUserById,
  createUser,
  createOrderRecord,
  updateOrderPayment
};