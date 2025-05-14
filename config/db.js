import { Sequelize, DataTypes } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  namedPlaceholders: true,
});

export async function query(sql, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params); // ✅ only return rows
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database operation failed');
  } finally {
    if (connection) connection.release();
  }
}

export default {
  query, // 👈 important: export the query function
};


// Initialize Sequelize
// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
//   host: process.env.DB_HOST,
//   dialect: 'mysql', // Change to 'postgres', 'sqlite', etc., if needed
//   logging: process.env.NODE_ENV === 'production' ? console.log : false,
// });
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT || 3306,
  dialectOptions: {
    connectTimeout: 60000, // 60 seconds timeout
  },
  retry: {
    max: 5, // Maximum retry attempts
    match: [
      /ETIMEDOUT/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /SequelizeConnectionError/
    ],
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
// Test database connection
// (async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('✅ Database connected successfully');
//   } catch (error) {
//     console.error('❌ Unable to connect to the database:', error);
//   }
// })();
try {
  await sequelize.authenticate();
  console.log('Database connection established');
  await sequelize.sync();
  console.log('Database synchronized');
} catch (error) {
  console.error('Database connection failed:', error);
  process.exit(1); // Exit if DB connection fails
}

//Define Order model
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  razorpay_order_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'INR',
  },
  receipt: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Pending',
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  address: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  
  razorpay_payment_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  razorpay_signature: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'orders',
  timestamps: true,
});

// Sync models with the database
(async () => {
  try {
    await sequelize.sync({ alter: true }); // Use `force: true` to drop and recreate tables
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
  }
})();

// Create Order Record
export async function createOrderRecord(orderData, transaction) {
  try {
    const order = await Order.create(orderData, { transaction });
    return order;
  } catch (error) {
    console.error('❌ Error creating order record:', error);
    throw error;
  }
}

// Update Order Payment
export async function updateOrderPayment(orderId, paymentData, transaction) {
  try {
    const order = await Order.findByPk(orderId, { transaction });
    if (!order) {
      throw new Error('Order not found');
    }
    await order.update(paymentData, { transaction });
    return order;
  } catch (error) {
    console.error('❌ Error updating order payment:', error);
    throw error;
  }
}

// Get Order by Razorpay ID
export async function getOrderByRazorpayId(razorpayOrderId, transaction) {
  try {
    const order = await Order.findOne({ where: { razorpay_order_id: razorpayOrderId }, transaction });
    return order;
  } catch (error) {
    console.error('❌ Error fetching order by Razorpay ID:', error);
    throw error;
  }
}

export { sequelize, Order };