const { sequelize } = require('../config/db');
const { QueryTypes } = require('sequelize');

// 1. User hoặc Admin mở phòng chat (Nếu chưa có phòng thì tạo mới, có rồi thì trả về)
const accessChatRoom = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Customer userId information is missing!' });
    }

    // Kiểm tra xem phòng chat giữa User này và hệ thống đã tồn tại chưa
    const roomCheck = await sequelize.query(
      'SELECT * FROM chat_rooms WHERE user_id = :userId LIMIT 1',
      {
        replacements: { userId },
        type: QueryTypes.SELECT
      }
    );

    if (roomCheck.length > 0) {
      return res.status(200).json(roomCheck[0]);
    }

    // Nếu chưa có, tiến hành tạo mới một phòng chat
    const [newRoom] = await sequelize.query(
      'INSERT INTO chat_rooms (user_id, created_at) VALUES (:userId, NOW()) RETURNING *',
      {
        replacements: { userId },
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json(newRoom[0]);
  } catch (error) {
    console.error('Error while accessing the chat room:', error.message);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
};

// 2. Lấy toàn bộ lịch sử tin nhắn cũ của một phòng chat
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await sequelize.query(
      'SELECT * FROM chat_messages WHERE room_id = :roomId ORDER BY created_at ASC',
      {
        replacements: { roomId },
        type: QueryTypes.SELECT
      }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error while fetching chat history:', error.message);
    res.status(500).json({ message: 'Error fetching chat history: ' + error.message });
  }
};

// 3. API lưu tin nhắn xuống Database Neon
const saveMessage = async (req, res) => {
  try {
    const { room_id, sender_id, message_text, product_context } = req.body;

    if (!room_id || !sender_id || !message_text) {
      return res.status(400).json({ message: 'Please fill in all message information!' });
    }

    const [newMessage] = await sequelize.query(
      `INSERT INTO chat_messages (room_id, sender_id, message_text, product_context, is_read, created_at) 
       VALUES (:room_id, :sender_id, :message_text, :product_context, false, NOW()) RETURNING *`,
      {
        replacements: {
          room_id,
          sender_id,
          message_text,
          product_context: product_context ? JSON.stringify(product_context) : null
        },
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Error while saving message:', error.message);
    res.status(500).json({ message: 'Error saving message: ' + error.message });
  }
};

// 4. Admin lấy danh sách tất cả các phòng chat đang hoạt động
const getAllChatRooms = async (req, res) => {
  try {
    const rooms = await sequelize.query(
      `SELECT cr.*, u.name as user_name, u.email as user_email 
       FROM chat_rooms cr
       JOIN "Users" u ON cr.user_id = u.id
       ORDER BY cr.created_at DESC`,
      { type: QueryTypes.SELECT }
    );

    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error while fetching chat rooms:', error.message);
    res.status(500).json({ message: 'Error fetching chat rooms: ' + error.message });
  }
};

// 5. Thuật toán AI Chatbot (Tokenization + Stop-word Removal + Multi-keyword Matching)
const handleAIChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ reply: 'Please enter your question!' });
    }

    const lowerMsg = message.toLowerCase();
    let reply = "";

    // INTENT 1: Product search or price lookup
    if (lowerMsg.includes('find') || lowerMsg.includes('price') || lowerMsg.includes('card') || lowerMsg.includes('buy') || lowerMsg.includes('search') || lowerMsg.includes('box') || lowerMsg.includes('sleeves') || lowerMsg.includes('want') || lowerMsg.includes('have')) {
      
      // English Stopwords to filter out
      const stopWords = ['i', 'want', 'to', 'find', 'card', 'cards', 'box', 'sleeves', 'please', 'help', 'me', 'show', 'is', 'are', 'the', 'a', 'an', 'price', 'buy', 'shop', 'for', 'do', 'you', 'have', 'any', 'looking', 'at'];

      // Tokenization: Split sentence into words and remove stop-words
      const keywords = lowerMsg
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !stopWords.includes(w));

      let products = [];
      if (keywords.length > 0) {
        // Build dynamic SQL query for multi-keyword AND matching
        let whereClauses = [];
        let replacements = {};

        keywords.forEach((kw, index) => {
          whereClauses.push(`LOWER(name) LIKE LOWER(:kw${index})`);
          replacements[`kw${index}`] = `%${kw}%`;
        });

        const dynamicQuery = `SELECT name, price, "countInStock" FROM "Products" WHERE ` + whereClauses.join(' AND ') + ` LIMIT 3`;

        products = await sequelize.query(dynamicQuery, {
          replacements,
          type: QueryTypes.SELECT
        });
      }

      // Fallback: If multi-keyword returns nothing, try the longest core keyword
      if ((!products || products.length === 0) && keywords.length > 0) {
        const mainKeyword = keywords.reduce((a, b) => a.length > b.length ? a : b);
        products = await sequelize.query(
          `SELECT name, price, "countInStock" FROM "Products" WHERE LOWER(name) LIKE LOWER(:keyword) LIMIT 3`,
          {
            replacements: { keyword: `%${mainKeyword}%` },
            type: QueryTypes.SELECT
          }
        );
      }

      if (products && products.length > 0) {
        const productListStr = products.map(p => 
          `• ${p.name}: ${Number(p.price).toLocaleString('en-US')}đ (Stock: ${p.countInStock})`
        ).join('\n');

        reply = `Here are the matching products found in TCG Shop:\n${productListStr}\n\nYou can type the full name in the search bar above for more details!`;
      } else {
        // Fallback to sample products if nothing matches
        const sampleProducts = await sequelize.query(
          `SELECT name, price, "countInStock" FROM "Products" LIMIT 3`,
          { type: QueryTypes.SELECT }
        );

        if (sampleProducts && sampleProducts.length > 0) {
          const sampleStr = sampleProducts.map(p => `• ${p.name}: ${Number(p.price).toLocaleString('en-US')}đ (Stock: ${p.countInStock})`).join('\n');
          reply = `Sorry, we couldn't find the exact card. Please check out some featured items available in stock:\n${sampleStr}`;
        } else {
          reply = `Sorry, we currently don't have this item in stock. Feel free to leave a message for our support team!`;
        }
      }
    } 
    // INTENT 2: Shipping / Delivery
    else if (lowerMsg.includes('ship') || lowerMsg.includes('delivery') || lowerMsg.includes('long') || lowerMsg.includes('shipping')) {
      reply = `TCG Shop supports nationwide shipping via J&T Express. Delivery takes 1-2 business days for inner city and 2-4 days for other provinces!`;
    }
    // INTENT 3: Authenticity / Trust
    else if (lowerMsg.includes('real') || lowerMsg.includes('auth') || lowerMsg.includes('original') || lowerMsg.includes('genuine')) {
      reply = `All cards at TCG Shop are 100% Authentic/Original. We offer a 200% refund if any fake card is detected!`;
    }
    // DEFAULT INTENT (Greeting / Fallback)
    else {
      reply = `Hello! I'm the TCG Shop AI Assistant. I can help you look up card prices, check stock, or view shipping policies. What card are you looking for?`;
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Detailed error in handleAIChat:', error);
    return res.status(500).json({ reply: 'AI system is currently busy, please try again later!' });
  }
};

module.exports = {
  accessChatRoom,
  getRoomMessages,
  saveMessage,
  getAllChatRooms,
  handleAIChat
};