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

// 2. Lấy toàn bộ lịch sử tin nhắn cũ của một phòng chat (Kèm tên & vai trò người gửi)
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await sequelize.query(
      `SELECT cm.*, 
              u.name as sender_name, 
              u.email as sender_email, 
              u.role as sender_role, 
              u."isAdmin" as sender_is_admin
       FROM chat_messages cm
       LEFT JOIN "Users" u ON cm.sender_id = u.id
       WHERE cm.room_id = :roomId 
       ORDER BY cm.created_at ASC`,
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

// 3. API lưu tin nhắn xuống Database Neon (Trả về kèm thông tin người gửi)
const saveMessage = async (req, res) => {
  try {
    const { room_id, sender_id, message_text, product_context } = req.body;

    if (!room_id || !sender_id || !message_text) {
      return res.status(400).json({ message: 'Please fill in all message information!' });
    }

    const serializedContext = product_context
      ? (typeof product_context === 'string' ? product_context : JSON.stringify(product_context))
      : null;

    const [newMessage] = await sequelize.query(
      `INSERT INTO chat_messages (room_id, sender_id, message_text, product_context, is_read, created_at) 
       VALUES (:room_id, :sender_id, :message_text, :product_context, false, NOW()) RETURNING *`,
      {
        replacements: {
          room_id,
          sender_id,
          message_text,
          product_context: serializedContext
        },
        type: QueryTypes.INSERT
      }
    );

    const saved = newMessage[0];

    const senderInfo = await sequelize.query(
      `SELECT name as sender_name, email as sender_email, role as sender_role, "isAdmin" as sender_is_admin 
       FROM "Users" WHERE id = :sender_id LIMIT 1`,
      {
        replacements: { sender_id },
        type: QueryTypes.SELECT
      }
    );

    res.status(201).json({
      ...saved,
      ...(senderInfo[0] || {})
    });
  } catch (error) {
    console.error('Error while saving message:', error.message);
    res.status(500).json({ message: 'Error saving message: ' + error.message });
  }
};

// 4. Admin / Staff lấy danh sách tất cả các phòng chat đang hoạt động (Không bao giờ hiện phòng của chính mình)
const getAllChatRooms = async (req, res) => {
  try {
    const viewerId = req.query.viewerId ? Number(req.query.viewerId) : null;

    const rawRooms = await sequelize.query(
      `SELECT cr.*, 
              u.name as user_name, 
              u.email as user_email,
              u.role as user_role,
              u."isAdmin" as user_is_admin,
              (SELECT cm.message_text FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as last_message,
              (SELECT cm.created_at FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as last_message_at
       FROM chat_rooms cr
       JOIN "Users" u ON cr.user_id = u.id
       ORDER BY cr.created_at DESC`,
      { type: QueryTypes.SELECT }
    );

    if (!viewerId) {
      return res.status(200).json(rawRooms);
    }

    const isStaffOrAdminUser = (r) =>
      r.user_is_admin === true || r.user_role === 'Admin' || r.user_role === 'Staff';

    // 1. Các phòng của Khách hàng (Customer) - loại bỏ nếu trùng viewerId
    const customerRooms = rawRooms
      .filter((r) => !isStaffOrAdminUser(r) && Number(r.user_id) !== viewerId)
      .map((r) => ({
        ...r,
        user_role: 'Customer',
        is_internal: false
      }));

    // 2. Các phòng trao đổi nội bộ với Admin/Staff khác (loại bỏ chính bản thân viewerId)
    // Dùng phòng chung canonical theo MAX(viewerId, colleague.user_id) để 2 bên luôn vào chung 1 phòng
    const staffMembers = rawRooms.filter((r) => isStaffOrAdminUser(r));
    const roomByUserId = new Map(rawRooms.map((r) => [Number(r.user_id), r]));

    const internalRooms = [];
    for (const colleague of staffMembers) {
      const colleagueId = Number(colleague.user_id);
      if (colleagueId === viewerId) continue; // Tuyệt đối không hiện bản thân

      const canonicalOwnerId = Math.max(viewerId, colleagueId);
      const canonicalRoom = roomByUserId.get(canonicalOwnerId) || colleague;

      internalRooms.push({
        ...canonicalRoom,
        id: canonicalRoom.id,
        user_id: colleagueId, // Đối phương đang chat cùng
        user_name: colleague.user_name,
        user_email: colleague.user_email,
        user_role: colleague.user_is_admin ? 'Admin' : (colleague.user_role || 'Staff'),
        user_is_admin: colleague.user_is_admin,
        is_internal: true
      });
    }

    const finalRooms = [...customerRooms, ...internalRooms].sort((a, b) => {
      const timeA = new Date(a.last_message_at || a.created_at || 0).getTime();
      const timeB = new Date(b.last_message_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });

    res.status(200).json(finalRooms);
  } catch (error) {
    console.error('Error while fetching chat rooms:', error.message);
    res.status(500).json({ message: 'Error fetching chat rooms: ' + error.message });
  }
};

// 5. Thuật toán AI Chatbot (Tokenization + Stop-word Removal + Smart Multi-Field & Category Matching)
const handleAIChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ reply: 'Please enter your question / Vui lòng nhập câu hỏi của bạn!' });
    }

    const lowerMsg = message.toLowerCase().trim();

    // 1. Nhận diện ngôn ngữ người dùng (Tiếng Việt hay Tiếng Anh)
    const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(message) ||
      /\b(tìm|thẻ|bài|giá|bao nhiêu|mua|bán|có|hộp|gói|bọc|không|ko|ạ|ơi|cho mình|hỏi|xem|cần)\b/i.test(lowerMsg);

    // 2. INTENT: Shipping / Delivery
    const isShipping = /\b(ship|shipping|delivery|giao hàng|vận chuyển|van chuyen|phi ship|phí ship|bao lâu)\b/i.test(lowerMsg);
    if (isShipping) {
      const reply = isVietnamese
        ? `TCG Shop hỗ trợ giao hàng toàn quốc qua J&T Express. Thời gian giao từ 1-2 ngày đối với nội thành và 2-4 ngày đối với các tỉnh thành khác!`
        : `TCG Shop supports nationwide shipping via Express delivery. It takes 1-2 business days for inner cities and 2-4 days for other regions!`;
      return res.status(200).json({ reply });
    }

    // 3. INTENT: Authenticity / Genuine
    const isAuthenticity = /\b(authentic|auth|genuine|original|real|fake|chính hãng|chinh hang|thật|that|uy tín|uy tin)\b/i.test(lowerMsg);
    if (isAuthenticity) {
      const reply = isVietnamese
        ? `Toàn bộ thẻ bài và sản phẩm tại TCG Shop cam kết 100% chính hãng (Authentic). Shop đền bù 200% nếu phát hiện hàng giả, hàng nhái!`
        : `All cards and products at TCG Shop are 100% Authentic/Original with factory seals intact. We offer a 200% refund if any fake card is detected!`;
      return res.status(200).json({ reply });
    }

    // 4. INTENT: Pure Greeting (Chỉ chào hỏi đơn thuần, không kèm tên thẻ bài)
    const cleanedGreeting = lowerMsg.replace(/[’']/g, '').replace(/[^\w\s\u00C0-\u1EF9]/g, '').trim();
    const isPureGreeting = /^(hi|hello|hey|yo|sup|greetings|good morning|good afternoon|good evening|chào|xin chào|chao|chào shop|hello shop|hi shop|alo|alo shop|shop ơi|shop oi)$/i.test(cleanedGreeting);
    if (isPureGreeting) {
      const reply = isVietnamese
        ? `Xin chào! Tôi là Trợ lý AI của TCG Shop. Tôi có thể hỗ trợ bạn tra cứu giá thẻ bài, kiểm tra tồn kho (Single Card, Booster Box, Sleeves, Pack...), hoặc giải đáp chính sách giao hàng. Bạn đang quan tâm đến sản phẩm nào ạ?`
        : `Hello! I'm the TCG Shop AI Assistant. I can help you look up card prices, check stock, or view store policies. What card, set, or product are you looking for?`;
      return res.status(200).json({ reply });
    }

    // 5. INTENT: TẤT CẢ CÁC CÂU HỎI CÒN LẠI ĐỀU ĐƯỢC XỬ LÝ LÀ TÌM KIẾM SẢN PHẨM / THẺ BÀI
    // (Bao gồm "I'm looking for a Dawn", "looking for Charizard", "Dawn", "thẻ pikachu", "giá pack 151"...)

    // Stopwords tiếng Anh & tiếng Việt loại bỏ đại từ và từ phụ (giữ lại từ chỉ category: box, sleeves, pack, booster, single)
    const stopWords = new Set([
      // English
      'i', 'im', 'me', 'my', 'mine', 'we', 'us', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
      'want', 'wants', 'wanted', 'looking', 'look', 'looks', 'for', 'find', 'finds', 'finding',
      'search', 'searching', 'show', 'need', 'needs', 'get', 'getting', 'buy', 'buying', 'have', 'has', 'had',
      'a', 'an', 'the', 'any', 'some', 'is', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did',
      'can', 'could', 'would', 'will', 'please', 'help', 'price', 'cost', 'how', 'much', 'what', 'where',
      'at', 'in', 'on', 'to', 'of', 'about', 'shop', 'store', 'card', 'cards',
      // Vietnamese
      'tôi', 'toi', 'em', 'mình', 'minh', 'bạn', 'ban', 'muon', 'muốn', 'tim', 'tìm', 'kiem', 'kiếm', 
      'co', 'có', 'khong', 'không', 'ko', 'k', 'ban', 'bán', 'mua', 'gia', 'giá', 'bao', 'nhieu', 'nhiêu', 
      'tien', 'tiền', 'shop', 'ad', 'admin', 'cho', 'hoi', 'hỏi', 'xem', 'can', 'cần', 'voi', 'với', 
      'la', 'là', 'gi', 'gì', 'nao', 'nào', 'ạ', 'nhe', 'nhé', 'oi', 'ơi', 'the', 'thẻ', 'bai', 'bài', 
      'san', 'pham', 'sản', 'phẩm', 'chút', 'được', 'lá', 'la'
    ]);

    // Nhận diện category cụ thể nếu câu hỏi có nhắc tới
    let detectedCategory = null;
    if (lowerMsg.includes('elite trainer') || lowerMsg.includes('etb')) {
      detectedCategory = 'Elite Trainer Box';
    } else if (lowerMsg.includes('booster box') || (lowerMsg.includes('booster') && lowerMsg.includes('box'))) {
      detectedCategory = 'Booster Box';
    } else if (lowerMsg.includes('single') || lowerMsg.includes('thẻ lẻ') || lowerMsg.includes('the le') || lowerMsg.includes('card lẻ')) {
      detectedCategory = 'Single Card';
    } else if (lowerMsg.includes('pack') || lowerMsg.includes('gói')) {
      detectedCategory = 'Pack';
    } else if (lowerMsg.includes('sleeve') || lowerMsg.includes('sleeves') || lowerMsg.includes('bọc thẻ') || lowerMsg.includes('bọc bài')) {
      detectedCategory = 'Sleeves';
    } else if (lowerMsg.includes('phụ kiện') || lowerMsg.includes('accessory') || lowerMsg.includes('accessories')) {
      detectedCategory = 'Other accessories';
    }

    // Tách từ khóa sau khi chuẩn hóa dấu nháy (I’m -> im)
    const normalizedText = lowerMsg
      .replace(/[’']/g, '')
      .replace(/[^\w\s\u00C0-\u1EF9]/g, ' ');

    const keywords = normalizedText
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w));

    let products = [];

    // 5.1. Nếu có nhận diện category cụ thể (vd: Single Card, Booster Box...)
    if (detectedCategory) {
      if (keywords.length > 0) {
        let whereKw = [];
        let replacements = { cat: `%${detectedCategory}%` };
        keywords.forEach((kw, index) => {
          whereKw.push(`LOWER(name) LIKE LOWER(:kw${index})`);
          replacements[`kw${index}`] = `%${kw}%`;
        });

        products = await sequelize.query(
          `SELECT name, price, "countInStock", category FROM "Products" 
           WHERE LOWER(CAST(category AS TEXT)) LIKE LOWER(:cat) AND (${whereKw.join(' OR ')}) 
           LIMIT 4`,
          { replacements, type: QueryTypes.SELECT }
        );
      }

      if (!products || products.length === 0) {
        products = await sequelize.query(
          `SELECT name, price, "countInStock", category FROM "Products" 
           WHERE LOWER(CAST(category AS TEXT)) LIKE LOWER(:cat) 
           LIMIT 4`,
          { replacements: { cat: `%${detectedCategory}%` }, type: QueryTypes.SELECT }
        );
      }
    }

    // 5.2. Tìm kiếm theo từ khóa linh hoạt trên cả name và category
    if ((!products || products.length === 0) && keywords.length > 0) {
      let whereClauses = [];
      let replacements = {};

      keywords.forEach((kw, index) => {
        whereClauses.push(`(LOWER(name) LIKE LOWER(:kw${index}) OR LOWER(CAST(category AS TEXT)) LIKE LOWER(:kw${index}))`);
        replacements[`kw${index}`] = `%${kw}%`;
      });

      // Thử tìm khớp tất cả từ khóa (AND)
      products = await sequelize.query(
        `SELECT name, price, "countInStock", category FROM "Products" WHERE ` + whereClauses.join(' AND ') + ` LIMIT 4`,
        { replacements, type: QueryTypes.SELECT }
      );

      // Nếu AND không có, thử tìm khớp từng từ khóa (OR)
      if (!products || products.length === 0) {
        products = await sequelize.query(
          `SELECT name, price, "countInStock", category FROM "Products" WHERE ` + whereClauses.join(' OR ') + ` LIMIT 4`,
          { replacements, type: QueryTypes.SELECT }
        );
      }
    }

    // 5.3. Trả về kết quả
    if (products && products.length > 0) {
      const productListStr = products.map(p => 
        `• [${p.category || 'TCG'}] ${p.name}: ${Number(p.price).toLocaleString('en-US')}đ (${isVietnamese ? 'Còn' : 'Stock'}: ${p.countInStock})`
      ).join('\n');

      const reply = isVietnamese
        ? `Dưới đây là các sản phẩm phù hợp tại TCG Shop:\n${productListStr}\n\nBạn có thể gõ tên sản phẩm lên thanh tìm kiếm của shop để xem chi tiết nhé!`
        : `Here are the matching products found at TCG Shop:\n${productListStr}\n\nYou can type the product name in the search bar above for more details!`;

      return res.status(200).json({ reply });
    } else {
      // Khi không tìm thấy sản phẩm trùng khớp: Lấy ngẫu nhiên các sản phẩm nổi bật
      const sampleProducts = await sequelize.query(
        `SELECT name, price, "countInStock", category FROM "Products" ORDER BY RANDOM() LIMIT 3`,
        { type: QueryTypes.SELECT }
      );

      const searchedTerm = keywords.length > 0 ? keywords.join(' ') : message;

      if (sampleProducts && sampleProducts.length > 0) {
        const sampleStr = sampleProducts.map(p => 
          `• [${p.category || 'TCG'}] ${p.name}: ${Number(p.price).toLocaleString('en-US')}đ (${isVietnamese ? 'Còn' : 'Stock'}: ${p.countInStock})`
        ).join('\n');

        const reply = isVietnamese
          ? `Dạ hiện tại shop chưa tìm thấy sản phẩm "${searchedTerm}" trong kho. Bạn hãy tham khảo thử một số sản phẩm nổi bật đang có sẵn tại shop nhé:\n${sampleStr}`
          : `Sorry, we currently couldn't find any products matching "${searchedTerm}" in stock. Here are some featured items available at TCG Shop:\n${sampleStr}`;

        return res.status(200).json({ reply });
      } else {
        const reply = isVietnamese
          ? `Dạ hiện tại sản phẩm này tạm hết hàng. Bạn có thể để lại tin nhắn để nhân viên hỗ trợ bạn sớm nhất nhé!`
          : `Sorry, this item is currently out of stock. Please leave a message and our staff will assist you shortly!`;

        return res.status(200).json({ reply });
      }
    }

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