const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests from your React app
app.use(express.json());

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/Heroku connections usually
  }
});

// Email Transporter (Configure with your email provider)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or 'sendgrid', 'ses', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // App Password if using Gmail
  }
});

// Health Check
app.get('/', (req, res) => {
  res.send('Bakery Order Service is Running!');
});

// CREATE ORDER API
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      user_id, 
      customer_details, 
      cart_items, 
      subtotal, 
      delivery_fee, 
      total 
    } = req.body;

    // Start Transaction
    await client.query('BEGIN');

    // 1. Insert Order
    const orderQuery = `
      INSERT INTO orders 
      (user_id, customer_name, customer_email, customer_phone, delivery_address, order_notes, subtotal, delivery_fee, total_amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const orderValues = [
      user_id || 'dummy',
      customer_details.name,
      customer_details.email,
      customer_details.phone,
      customer_details.addressLine,
      customer_details.notes,
      subtotal,
      delivery_fee,
      total
    ];

    const orderResult = await client.query(orderQuery, orderValues);
    const orderId = orderResult.rows[0].id;

    // 2. Insert Order Items
    const itemQuery = `
      INSERT INTO order_items (order_id, product_id, product_name, quantity, price_per_unit, total_price)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const item of cart_items) {
      const price = item.isDeal ? item.discountPrice : item.price;
      await client.query(itemQuery, [
        orderId,
        item.id,
        item.name,
        item.quantity,
        price,
        (price * item.quantity).toFixed(2)
      ]);
    }

    // Commit Transaction
    await client.query('COMMIT');

    // 3. Send Email Notification (Async - don't block response)
    const emailHtml = `
      <h2>New Order Received! (#${orderId})</h2>
      <p><strong>Customer:</strong> ${customer_details.name} (${customer_details.phone})</p>
      <p><strong>Address:</strong> ${customer_details.addressLine}</p>
      <p><strong>Notes:</strong> ${customer_details.notes || 'N/A'}</p>
      <hr/>
      <h3>Items:</h3>
      <ul>
        ${cart_items.map(item => `<li>${item.name} x ${item.quantity} - ₹${((item.isDeal ? item.discountPrice : item.price) * item.quantity).toFixed(2)}</li>`).join('')}
      </ul>
      <p><strong>Subtotal:</strong> ₹${subtotal}</p>
      <p><strong>Delivery:</strong> ₹${delivery_fee}</p>
      <h3><strong>Total:</strong> ₹${total}</h3>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.OWNER_EMAIL,
      subject: `New Order #${orderId} from ${customer_details.name}`,
      html: emailHtml
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.status(201).json({ success: true, orderId: orderId, message: "Order created successfully" });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, error: "Failed to create order" });
  } finally {
    client.release();
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;