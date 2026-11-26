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

// Helper: Giải mã an toàn trường product_context từ JSON chuỗi hoặc Object
const parseMessageContext = (rawContext) => {
  if (!rawContext) return null;
  try {
    return typeof rawContext === 'string' ? JSON.parse(rawContext) : rawContext;
  } catch (error) {
    return null;
  }
};

// Helper: Phân loại danh sách tin nhắn trong 1 phòng thành 2 luồng 'ai' và 'staff' (hỗ trợ cả dữ liệu cũ)
const classifyRoomMessages = (roomMessages = []) => {
  const staffMessages = [];
  const aiMessages = [];

  for (let i = 0; i < roomMessages.length; i++) {
    const msg = roomMessages[i];
    const ctx = parseMessageContext(msg.product_context);

    // 1. Nếu tin nhắn mới đã gắn nhãn channel rõ ràng hoặc là phản hồi từ AI Bot
    if (ctx?.channel === 'ai' || ctx?.is_ai === true || ctx?.is_ai_query === true) {
      aiMessages.push(msg);
      continue;
    }

    if (ctx?.channel === 'staff') {
      staffMessages.push(msg);
      continue;
    }

    // 2. Xử lý tương thích ngược cho tin nhắn cũ chưa có trường channel:
    // Nếu người gửi là Staff/Admin thì chắc chắn thuộc luồng hỗ trợ trực tiếp ('staff')
    const isStaffSender =
      msg.sender_is_admin === true ||
      msg.sender_role === 'Admin' ||
      msg.sender_role === 'Staff' ||
      ctx?.sender_role === 'Admin' ||
      ctx?.sender_role === 'Staff';

    if (isStaffSender) {
      staffMessages.push(msg);
      continue;
    }

    // Nếu là tin nhắn cũ của khách hàng và ngay sau đó có câu trả lời của AI Bot -> xếp vào AI Log
    let followedByAi = false;
    for (let j = i + 1; j < roomMessages.length; j++) {
      const nextMsg = roomMessages[j];
      const nextCtx = parseMessageContext(nextMsg.product_context);
      if (nextCtx?.is_ai === true) {
        followedByAi = true;
        break;
      }
      const nextIsStaff =
        nextMsg.sender_is_admin === true ||
        nextMsg.sender_role === 'Admin' ||
        nextMsg.sender_role === 'Staff' ||
        nextCtx?.sender_role === 'Admin' ||
        nextCtx?.sender_role === 'Staff';
      if (nextIsStaff || nextCtx?.channel === 'staff') {
        break;
      }
    }

    if (followedByAi) {
      aiMessages.push(msg);
    } else {
      staffMessages.push(msg);
    }
  }

  return { staffMessages, aiMessages };
};

// 4. Admin / Staff lấy danh sách tất cả các phòng chat (Ưu tiên khách chờ nhân viên, không để AI làm nhiễu)
const getAllChatRooms = async (req, res) => {
  try {
    const viewerId = req.query.viewerId ? Number(req.query.viewerId) : null;

    const rawRooms = await sequelize.query(
      `SELECT cr.*, 
              u.name as user_name, 
              u.email as user_email,
              u.role as user_role,
              u."isAdmin" as user_is_admin
       FROM chat_rooms cr
       JOIN "Users" u ON cr.user_id = u.id
       ORDER BY cr.created_at DESC`,
      { type: QueryTypes.SELECT }
    );

    // Lấy toàn bộ tin nhắn để tách chính xác luồng Live Support và AI Log cho từng phòng
    const allMessages = await sequelize.query(
      `SELECT cm.id,
              cm.room_id,
              cm.sender_id,
              cm.message_text,
              cm.product_context,
              cm.created_at,
              u.role as sender_role,
              u."isAdmin" as sender_is_admin
       FROM chat_messages cm
       LEFT JOIN "Users" u ON cm.sender_id = u.id
       ORDER BY cm.created_at ASC`,
      { type: QueryTypes.SELECT }
    );

    const messagesByRoomId = new Map();
    for (const msg of allMessages) {
      const rId = Number(msg.room_id);
      if (!messagesByRoomId.has(rId)) {
        messagesByRoomId.set(rId, []);
      }
      messagesByRoomId.get(rId).push(msg);
    }

    // Gắn thống kê tin nhắn Live Support & AI Log vào từng phòng
    const enrichRoomStats = (room, isInternalRoom = false) => {
      const roomMsgs = messagesByRoomId.get(Number(room.id)) || [];
      const { staffMessages, aiMessages } = classifyRoomMessages(roomMsgs);

      const lastStaffMsg = staffMessages.length > 0 ? staffMessages[staffMessages.length - 1] : null;
      const lastAiMsg = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : null;

      // Chỉ bật cờ waiting_for_staff khi khách hàng nhắn ở kênh Live Support và chưa được Staff/Admin phản hồi
      let waitingForStaff = false;
      if (!isInternalRoom && lastStaffMsg) {
        const lastCtx = parseMessageContext(lastStaffMsg.product_context);
        const sentByStaff =
          lastStaffMsg.sender_is_admin === true ||
          lastStaffMsg.sender_role === 'Admin' ||
          lastStaffMsg.sender_role === 'Staff' ||
          lastCtx?.sender_role === 'Admin' ||
          lastCtx?.sender_role === 'Staff';

        waitingForStaff = !sentByStaff && Number(lastStaffMsg.sender_id) === Number(room.user_id);
      }

      return {
        ...room,
        staff_message_count: staffMessages.length,
        ai_message_count: aiMessages.length,
        last_staff_message: lastStaffMsg ? lastStaffMsg.message_text : null,
        last_staff_message_at: lastStaffMsg ? lastStaffMsg.created_at : null,
        last_ai_message: lastAiMsg ? lastAiMsg.message_text : null,
        last_ai_message_at: lastAiMsg ? lastAiMsg.created_at : null,
        last_message: lastStaffMsg
          ? lastStaffMsg.message_text
          : (lastAiMsg ? lastAiMsg.message_text : null),
        last_message_at: lastStaffMsg
          ? lastStaffMsg.created_at
          : (lastAiMsg ? lastAiMsg.created_at : room.created_at),
        waiting_for_staff: waitingForStaff
      };
    };

    if (!viewerId) {
      return res.status(200).json(rawRooms.map((r) => enrichRoomStats(r, false)));
    }

    const isStaffOrAdminUser = (r) =>
      r.user_is_admin === true || r.user_role === 'Admin' || r.user_role === 'Staff';

    // 1. Các phòng của Khách hàng (Customer) - loại bỏ nếu trùng viewerId
    const customerRooms = rawRooms
      .filter((r) => !isStaffOrAdminUser(r) && Number(r.user_id) !== viewerId)
      .map((r) =>
        enrichRoomStats(
          {
            ...r,
            user_role: 'Customer',
            is_internal: false
          },
          false
        )
      );

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

      internalRooms.push(
        enrichRoomStats(
          {
            ...canonicalRoom,
            id: canonicalRoom.id,
            user_id: colleagueId, // Đối phương đang chat cùng
            user_name: colleague.user_name,
            user_email: colleague.user_email,
            user_role: colleague.user_is_admin ? 'Admin' : (colleague.user_role || 'Staff'),
            user_is_admin: colleague.user_is_admin,
            is_internal: true
          },
          true
        )
      );
    }

    // Sắp xếp ưu tiên:
    // 1) Khách đang chờ nhân viên trả lời (waiting_for_staff = true) lên đầu tiên
    // 2) Các phòng có tin nhắn trao đổi với người thật (theo last_staff_message_at mới nhất)
    // 3) Các phòng chỉ mới hỏi AI hoặc chưa nhắn gì xếp dưới cùng để không làm nhiễu hàng đợi
    const finalRooms = [...customerRooms, ...internalRooms].sort((a, b) => {
      if (Boolean(a.waiting_for_staff) !== Boolean(b.waiting_for_staff)) {
        return a.waiting_for_staff ? -1 : 1;
      }

      const aHasHumanChat = a.staff_message_count > 0;
      const bHasHumanChat = b.staff_message_count > 0;
      if (aHasHumanChat !== bHasHumanChat) {
        return aHasHumanChat ? -1 : 1;
      }

      const timeA = new Date(
        (aHasHumanChat ? a.last_staff_message_at : a.created_at) || 0
      ).getTime();
      const timeB = new Date(
        (bHasHumanChat ? b.last_staff_message_at : b.created_at) || 0
      ).getTime();
      return timeB - timeA;
    });

    res.status(200).json(finalRooms);
  } catch (error) {
    console.error('Error while fetching chat rooms:', error.message);
    res.status(500).json({ message: 'Error fetching chat rooms: ' + error.message });
  }
};

// 5. Thuật toán AI Chatbot nâng cấp (Join đúng bảng Categories & Rarities trên Neon + Nhận diện đa ngữ cảnh)
const handleAIChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ reply: 'Please enter your question!' });
    }

    const rawMsg = message.trim();
    const lowerMsg = rawMsg.toLowerCase();

    // 1. Nhận diện ngôn ngữ người dùng (Tiếng Việt hay Tiếng Anh)
    const isVietnamese =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(rawMsg) ||
      /\b(tìm|thẻ|bài|giá|bao nhiêu|mua|bán|có|hộp|gói|bọc|không|ko|ạ|ơi|cho mình|hỏi|xem|cần|rẻ|đắt|dưới|trên|chào|xin chào|thanh toán|giao hàng)\b/i.test(lowerMsg);

    // Helper: Định dạng danh sách sản phẩm gọn đẹp kèm Category thật, Rarity thật & trạng thái tồn kho
    const formatProductLines = (items) =>
      items
        .map((p) => {
          const categoryLabel = p.cat_name || p.category || 'TCG';
          const rarityLabel = p.rar_name ? ` | ${p.rar_name}` : '';
          const priceStr = `${Number(p.price || 0).toLocaleString('en-US')}đ`;
          const stockNum = Number(p.countInStock || 0);
          const stockStr =
            stockNum > 0
              ? isVietnamese
                ? `Còn ${stockNum}`
                : `In stock: ${stockNum}`
              : isVietnamese
              ? 'Hết hàng'
              : 'Out of stock';
          return `• [${categoryLabel}${rarityLabel}] ${p.name}\n  → ${priceStr} (${stockStr})`;
        })
        .join('\n');

    // Câu truy vấn SELECT chuẩn luôn JOIN đúng Categories và Rarities trên Neon
    const baseProductSelect = `
      SELECT p.id, p.name, p.price, p."countInStock", p."gameType",
             COALESCE(c.name, CAST(p.category AS TEXT)) AS cat_name,
             r.name AS rar_name
      FROM "Products" p
      LEFT JOIN "Categories" c ON p."categoryId" = c.id
      LEFT JOIN "Rarities" r ON p."rarityId" = r.id
    `;

    // 2. INTENT: Giao hàng / Vận chuyển (Shipping & Delivery)
    const isShipping =
      /\b(ship|shipping|delivery|giao hàng|giao hang|vận chuyển|van chuyen|phi ship|phí ship|bao lâu|bao lau)\b/i.test(
        lowerMsg
      );
    if (isShipping) {
      const reply = isVietnamese
        ? `TCG Shop hỗ trợ giao hàng toàn quốc (miễn phí vận chuyển trên đơn đặt tại web). Thời gian giao dự kiến 1–2 ngày đối với nội thành và 2–4 ngày đối với các tỉnh thành khác!`
        : `TCG Shop offers nationwide delivery (free shipping on website orders). Estimated delivery time is 1–2 business days for major cities and 2–4 days for other regions!`;
      return res.status(200).json({ reply });
    }

    // 3. INTENT: Thanh toán (Payment Methods - đồng bộ với Checkout.jsx)
    const isPayment =
      /\b(payment|pay|momo|cod|bank|transfer|qr|vietqr|thanh toán|thanh toan|chuyển khoản|chuyen khoan|trả tiền|tra tien)\b/i.test(
        lowerMsg
      );
    if (isPayment) {
      const reply = isVietnamese
        ? `TCG Shop hỗ trợ 3 phương thức thanh toán:\n• Thanh toán khi nhận hàng (COD)\n• Ví điện tử Momo (quét mã QR)\n• Chuyển khoản ngân hàng (VietQR)\n\nBạn có thể chọn phương thức mong muốn ngay tại trang Checkout nhé!`
        : `TCG Shop supports 3 payment methods:\n• Cash on Delivery (COD)\n• Momo E-Wallet (QR Code)\n• Bank Transfer (VietQR)\n\nYou can select your preferred method directly at Checkout!`;
      return res.status(200).json({ reply });
    }

    // 4. INTENT: Cam kết chính hãng (Authenticity)
    const isAuthenticity =
      /\b(authentic|auth|genuine|original|real|fake|reseal|chính hãng|chinh hang|thật|that|giả|gia|uy tín|uy tin)\b/i.test(
        lowerMsg
      );
    if (isAuthenticity) {
      const reply = isVietnamese
        ? `100% thẻ bài và hộp sản phẩm tại TCG Shop đều là hàng chính hãng (Authentic), nguyên seal nhà sản xuất — nói không với hàng reseal/hàng giả. Shop cam kết hoàn tiền 200% nếu phát hiện hàng giả!`
        : `100% of cards and sealed products at TCG Shop are Authentic with original factory seals — strictly no resealed or fake items. We guarantee a 200% refund if any counterfeit is found!`;
      return res.status(200).json({ reply });
    }

    // 5. INTENT: Liên hệ / Gặp nhân viên / Hotline
    const isContact =
      /\b(hotline|contact|phone|address|email|địa chỉ|dia chi|số điện thoại|so dien thoai|liên hệ|lien he|nhân viên|nhan vien|support|staff|human)\b/i.test(
        lowerMsg
      );
    if (isContact) {
      const reply = isVietnamese
        ? `Bạn có thể liên hệ đội ngũ TCG Shop qua:\n• Nút "Live Staff Support" (màu đỏ ở góc dưới bên phải) để chat trực tiếp với nhân viên\n• Hotline: 0703192208\n• Email: mquantcv@gmail.com`
        : `You can reach our team directly via:\n• Click "Switch to Live Staff" below (or the red STAFF button) to chat with a real staff member\n• Hotline: 0703192208\n• Email: mquantcv@gmail.com`;
      return res.status(200).json({ reply });
    }

    // 6. INTENT: Chào hỏi đơn thuần (Pure Greeting)
    const cleanedGreeting = lowerMsg
      .replace(/[’']/g, '')
      .replace(/[^\w\s\u00C0-\u1EF9]/g, '')
      .trim();
    const isPureGreeting =
      /^(hi|hello|hey|yo|sup|greetings|good morning|good afternoon|good evening|chào|xin chào|chao|chào shop|hello shop|hi shop|alo|alo shop|shop ơi|shop oi)$/i.test(
        cleanedGreeting
      );
    if (isPureGreeting) {
      const reply = isVietnamese
        ? `Xin chào! Mình là Trợ lý AI của TCG Shop. Mình có thể giúp bạn:\n• Tra cứu giá & tồn kho theo tên thẻ / bộ bài (VD: "Mega Greninja", "Dawn", "ME04")\n• Lọc theo loại sản phẩm (Single Cards, Booster Box, ETB, Sleeves) hoặc độ hiếm (SR, SAR)\n• Tìm theo tầm giá (VD: "thẻ dưới 500k", "thẻ rẻ nhất")\n• Giải đáp chính sách giao hàng & thanh toán.\n\nBạn đang muốn tìm sản phẩm nào ạ?`
        : `Hello! I'm the TCG Shop AI Assistant. I can help you:\n• Look up prices & real-time stock by card or set name (e.g., "Mega Greninja", "Dawn", "ME04")\n• Browse by category (Single Cards, Booster Box, ETB, Sleeves) or rarity (SR, SAR)\n• Filter by budget (e.g., "under 500k", "cheapest card")\n• Answer shipping, payment & authenticity questions.\n\nWhat are you looking for today?`;
      return res.status(200).json({ reply });
    }

    // 7. INTENT: Hỏi tổng quan danh mục / Shop bán những gì
    const isCatalogOverview =
      /\b(categories|category|catalog|what do you sell|all products|danh mục|danh muc|bán gì|ban gi|có những gì|co nhung gi|sản phẩm nào|san pham nao)\b/i.test(
        lowerMsg
      );
    if (isCatalogOverview) {
      const catSummary = await sequelize.query(
        `SELECT c.name,
                COUNT(p.id) AS total_items,
                COUNT(CASE WHEN p."countInStock" > 0 THEN 1 END) AS in_stock_items
         FROM "Categories" c
         LEFT JOIN "Products" p ON p."categoryId" = c.id
         GROUP BY c.id, c.name
         ORDER BY c.id ASC`,
        { type: QueryTypes.SELECT }
      );
      const summaryStr = catSummary
        .filter((c) => Number(c.total_items) > 0)
        .map(
          (c) =>
            `• ${c.name}: ${c.total_items} ${isVietnamese ? 'sản phẩm' : 'items'} (${
              isVietnamese ? 'còn hàng' : 'in stock'
            }: ${c.in_stock_items})`
        )
        .join('\n');

      const reply = isVietnamese
        ? `Hiện tại TCG Shop đang kinh doanh các danh mục sau:\n${summaryStr}\n\nBạn muốn mình liệt kê sản phẩm ở danh mục nào hoặc tìm theo tên thẻ/độ hiếm (SR, SAR) nào?`
        : `Here are the product categories currently available at TCG Shop:\n${summaryStr}\n\nWhich category, card name, or rarity (SR, SAR) would you like me to check?`;
      return res.status(200).json({ reply });
    }

    // 8. INTENT: Sản phẩm bán chạy (Best Sellers - lấy từ OrderItems + Orders Delivered)
    const isBestSeller =
      /\b(best sellers?|bestsellers?|best selling|top selling|popular|hot|bán chạy|ban chay|nổi bật|noi bat|mua nhiều|mua nhieu)\b/i.test(
        lowerMsg
      );
    if (isBestSeller) {
      const topSold = await sequelize.query(
        `SELECT p.id, p.name, p.price, p."countInStock",
                COALESCE(c.name, CAST(p.category AS TEXT)) AS cat_name,
                r.name AS rar_name,
                SUM(oi.qty) AS total_sold
         FROM "OrderItems" oi
         JOIN "Orders" o ON oi."orderId" = o.id AND o.status = 'Delivered'
         JOIN "Products" p ON oi."productId" = p.id
         LEFT JOIN "Categories" c ON p."categoryId" = c.id
         LEFT JOIN "Rarities" r ON p."rarityId" = r.id
         GROUP BY p.id, c.name, r.name
         ORDER BY total_sold DESC
         LIMIT 4`,
        { type: QueryTypes.SELECT }
      );

      if (topSold.length > 0) {
        const reply = isVietnamese
          ? `Top sản phẩm bán chạy nhất tại TCG Shop hiện tại:\n${formatProductLines(topSold)}\n\nBạn có thể gõ tên sản phẩm lên thanh tìm kiếm để xem chi tiết và đặt mua ngay!`
          : `Here are the current best-selling items at TCG Shop:\n${formatProductLines(topSold)}\n\nType any product name in the search bar above to view details!`;
        return res.status(200).json({ reply });
      }
    }

    // 9. INTENT: Rẻ nhất / Đắt nhất / Lọc theo tầm giá (VD: "under 500k", "dưới 1 triệu", "cheapest")
    const isCheapest = /\b(cheapest|lowest price|budget|rẻ nhất|re nhat|giá rẻ|gia re)\b/i.test(lowerMsg);
    const isMostExpensive = /\b(most expensive|highest price|priciest|đắt nhất|dat nhat|mắc nhất|mac nhat|cao nhất|cao nhat)\b/i.test(lowerMsg);

    // Bắt hạn mức giá: VD "under 500k", "dưới 1tr", "dưới 200000", "below 1.5m"
    let maxPrice = null;
    const priceMatch = lowerMsg.match(
      /(?:under|below|less than|<=|max|dưới|duoi|tầm|tam|khoảng|khoang)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|nghin|tr|triệu|trieu|m|đ|d|vnd)?/i
    );
    if (priceMatch) {
      let amount = parseFloat(priceMatch[1].replace(',', '.'));
      const unit = (priceMatch[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'nghìn' || unit === 'nghin') {
        amount *= 1000;
      } else if (unit === 'tr' || unit === 'triệu' || unit === 'trieu' || unit === 'm') {
        amount *= 1000000;
      } else if (amount < 10000) {
        // Nếu khách gõ "under 500" -> tự hiểu là 500.000đ
        amount *= 1000;
      }
      if (!Number.isNaN(amount) && amount > 0) {
        maxPrice = Math.round(amount);
      }
    }

    // 10. NHẬN DIỆN DANH MỤC (Category) VÀ ĐỘ HIẾM (Rarity) CHÍNH XÁC THEO NEON
    let detectedCategoryId = null;
    let detectedCategoryName = null;
    if (lowerMsg.includes('elite trainer') || /\betb\b/i.test(lowerMsg)) {
      detectedCategoryId = 2;
      detectedCategoryName = 'Elite Trainer Box';
    } else if (lowerMsg.includes('booster box') || (lowerMsg.includes('booster') && lowerMsg.includes('box'))) {
      detectedCategoryId = 3;
      detectedCategoryName = 'Booster Box';
    } else if (lowerMsg.includes('single') || lowerMsg.includes('thẻ lẻ') || lowerMsg.includes('the le') || lowerMsg.includes('card lẻ')) {
      detectedCategoryId = 1;
      detectedCategoryName = 'Single Cards';
    } else if (lowerMsg.includes('sleeve') || lowerMsg.includes('bọc thẻ') || lowerMsg.includes('bọc bài') || lowerMsg.includes('boc the')) {
      detectedCategoryId = 4;
      detectedCategoryName = 'Sleeves Cards';
    } else if (/\b(pack|packs|gói|goi)\b/i.test(lowerMsg)) {
      detectedCategoryId = 5;
      detectedCategoryName = 'Pack';
    } else if (lowerMsg.includes('phụ kiện') || lowerMsg.includes('accessory') || lowerMsg.includes('accessories')) {
      detectedCategoryId = 6;
      detectedCategoryName = 'Other accessories';
    }

    // Nhận diện Rarity từ bảng Rarities (SAR, SR, R, U, C)
    let detectedRarity = null;
    if (/\bsar\b/i.test(lowerMsg)) {
      detectedRarity = 'SAR';
    } else if (/\bsr\b/i.test(lowerMsg)) {
      detectedRarity = 'SR';
    } else if (/\b(rarity r|rare card|thẻ r)\b/i.test(lowerMsg)) {
      detectedRarity = 'R';
    }

    // Xử lý truy vấn theo giá (cheapest / most expensive / maxPrice)
    if (isCheapest || isMostExpensive || maxPrice !== null) {
      const conditions = [];
      const replacements = {};

      if (detectedCategoryId) {
        conditions.push(`p."categoryId" = :catId`);
        replacements.catId = detectedCategoryId;
      }
      if (detectedRarity) {
        conditions.push(`UPPER(r.name) = :rarName`);
        replacements.rarName = detectedRarity;
      }
      if (maxPrice !== null) {
        conditions.push(`p.price <= :maxPrice`);
        replacements.maxPrice = maxPrice;
      }

      const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderSql = isMostExpensive
        ? `ORDER BY p.price DESC`
        : `ORDER BY (p."countInStock" > 0) DESC, p.price ASC`;

      const priceProducts = await sequelize.query(
        `${baseProductSelect} ${whereSql} ${orderSql} LIMIT 5`,
        { replacements, type: QueryTypes.SELECT }
      );

      if (priceProducts.length > 0) {
        const heading =
          maxPrice !== null
            ? isVietnamese
              ? `Các sản phẩm có giá dưới ${maxPrice.toLocaleString('en-US')}đ tại TCG Shop:`
              : `Products under ${maxPrice.toLocaleString('en-US')}đ at TCG Shop:`
            : isMostExpensive
            ? isVietnamese
              ? `Top sản phẩm giá trị cao nhất tại TCG Shop:`
              : `Most valuable / highest-priced items at TCG Shop:`
            : isVietnamese
            ? `Các sản phẩm giá mềm nhất đang có tại TCG Shop:`
            : `Most affordable items available at TCG Shop:`;

        return res.status(200).json({ reply: `${heading}\n${formatProductLines(priceProducts)}` });
      }
    }

    // 11. TÁCH TỪ KHÓA TÌM KIẾM SẢN PHẨM / THẺ BÀI / SET CODE
    const stopWords = new Set([
      // English
      'i', 'im', 'me', 'my', 'mine', 'we', 'us', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
      'want', 'wants', 'wanted', 'looking', 'look', 'looks', 'for', 'find', 'finds', 'finding',
      'search', 'searching', 'show', 'need', 'needs', 'get', 'getting', 'buy', 'buying', 'have', 'has', 'had',
      'a', 'an', 'the', 'any', 'some', 'is', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did',
      'can', 'could', 'would', 'will', 'please', 'help', 'price', 'prices', 'cost', 'how', 'much', 'what', 'where',
      'at', 'in', 'on', 'to', 'of', 'about', 'shop', 'store', 'card', 'cards', 'stock', 'available', 'left',
      'list', 'all', 'check', 'tell', 'give', 'with', 'rarity',
      // Các từ khóa category đã được nhận diện riêng
      'single', 'singles', 'booster', 'box', 'elite', 'trainer', 'etb', 'sleeve', 'sleeves', 'pack', 'packs', 'sar', 'sr',
      // Vietnamese
      'tôi', 'toi', 'em', 'mình', 'minh', 'bạn', 'ban', 'muon', 'muốn', 'tim', 'tìm', 'kiem', 'kiếm',
      'co', 'có', 'khong', 'không', 'ko', 'k', 'bán', 'mua', 'gia', 'giá', 'bao', 'nhieu', 'nhiêu',
      'tien', 'tiền', 'ad', 'admin', 'cho', 'hoi', 'hỏi', 'xem', 'can', 'cần', 'voi', 'với',
      'la', 'là', 'gi', 'gì', 'nao', 'nào', 'ạ', 'nhe', 'nhé', 'oi', 'ơi', 'the', 'thẻ', 'bai', 'bài',
      'san', 'pham', 'sản', 'phẩm', 'chút', 'được', 'lá', 'còn', 'con', 'hàng', 'hang', 'tồn', 'ton', 'kho',
      'lẻ', 'le', 'hộp', 'hop', 'bọc', 'boc', 'hiếm', 'hiem', 'độ', 'do'
    ]);

    const normalizedText = lowerMsg
      .replace(/[’']/g, '')
      .replace(/[^\w\s\u00C0-\u1EF9]/g, ' ');

    const keywords = normalizedText
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.has(w));

    let products = [];

    // 11.1. Nếu có Category hoặc Rarity -> lọc chuẩn theo categoryId & rarities.name trên Neon
    if (detectedCategoryId || detectedRarity) {
      const baseConds = [];
      const baseRepl = {};
      if (detectedCategoryId) {
        baseConds.push(`p."categoryId" = :catId`);
        baseRepl.catId = detectedCategoryId;
      }
      if (detectedRarity) {
        baseConds.push(`UPPER(r.name) = :rarName`);
        baseRepl.rarName = detectedRarity;
      }

      // Thử khớp thêm từ khóa tên thẻ nếu khách có gõ (VD: "SAR Mega Greninja")
      if (keywords.length > 0) {
        const kwConds = [];
        const kwRepl = { ...baseRepl };
        keywords.forEach((kw, idx) => {
          kwConds.push(`LOWER(p.name) LIKE LOWER(:kw${idx})`);
          kwRepl[`kw${idx}`] = `%${kw}%`;
        });

        products = await sequelize.query(
          `${baseProductSelect}
           WHERE ${baseConds.join(' AND ')} AND (${kwConds.join(' OR ')})
           ORDER BY (p."countInStock" > 0) DESC, p.price ASC
           LIMIT 5`,
          { replacements: kwRepl, type: QueryTypes.SELECT }
        );
      }

      // Nếu không có từ khóa tên thẻ (VD: "Booster Box stock", "Single Card prices", "SAR") -> lấy toàn bộ nhóm đó
      if (!products || products.length === 0) {
        products = await sequelize.query(
          `${baseProductSelect}
           WHERE ${baseConds.join(' AND ')}
           ORDER BY (p."countInStock" > 0) DESC, p.price ASC
           LIMIT 5`,
          { replacements: baseRepl, type: QueryTypes.SELECT }
        );
      }
    }

    // 11.2. Tìm kiếm linh hoạt theo từ khóa trên tên sản phẩm, danh mục thật & độ hiếm thật
    if ((!products || products.length === 0) && keywords.length > 0) {
      const whereClauses = [];
      const replacements = {};

      keywords.forEach((kw, idx) => {
        whereClauses.push(
          `(LOWER(p.name) LIKE LOWER(:kw${idx}) OR LOWER(COALESCE(c.name, '')) LIKE LOWER(:kw${idx}) OR LOWER(COALESCE(r.name, '')) LIKE LOWER(:kw${idx}))`
        );
        replacements[`kw${idx}`] = `%${kw}%`;
      });

      // Ưu tiên khớp TẤT CẢ từ khóa (AND)
      products = await sequelize.query(
        `${baseProductSelect}
         WHERE ${whereClauses.join(' AND ')}
         ORDER BY (p."countInStock" > 0) DESC, p.price ASC
         LIMIT 5`,
        { replacements, type: QueryTypes.SELECT }
      );

      // Nếu không khớp AND, nới lỏng sang OR
      if (!products || products.length === 0) {
        products = await sequelize.query(
          `${baseProductSelect}
           WHERE ${whereClauses.join(' OR ')}
           ORDER BY (p."countInStock" > 0) DESC, p.price ASC
           LIMIT 5`,
          { replacements, type: QueryTypes.SELECT }
        );
      }
    }

    // 11.3. Trả kết quả
    if (products && products.length > 0) {
      const filterLabel = [detectedCategoryName, detectedRarity ? `Rarity ${detectedRarity}` : null]
        .filter(Boolean)
        .join(' • ');

      const intro = filterLabel
        ? isVietnamese
          ? `Kết quả phù hợp (${filterLabel}) tại TCG Shop:`
          : `Matching items (${filterLabel}) at TCG Shop:`
        : isVietnamese
        ? `Dưới đây là các sản phẩm phù hợp tại TCG Shop:`
        : `Here are the matching products found at TCG Shop:`;

      const footer = isVietnamese
        ? `Bạn có thể gõ tên sản phẩm lên thanh tìm kiếm phía trên để xem ảnh chi tiết và thêm vào giỏ hàng nhé!`
        : `Type the product name in the search bar above to view details and add to cart!`;

      return res.status(200).json({
        reply: `${intro}\n${formatProductLines(products)}\n\n${footer}`
      });
    }

    // 11.4. Khi không tìm thấy -> Phân biệt rõ: danh mục đang trống hàng vs từ khóa không khớp
    const sampleProducts = await sequelize.query(
      `${baseProductSelect}
       WHERE p."countInStock" > 0
       ORDER BY RANDOM()
       LIMIT 3`,
      { type: QueryTypes.SELECT }
    );

    const searchedTerm =
      [
        detectedCategoryName,
        detectedRarity ? `Rarity ${detectedRarity}` : null,
        keywords.length > 0 ? keywords.join(' ') : null
      ]
        .filter(Boolean)
        .join(' - ') || rawMsg;

    // Nếu khách hỏi đúng một danh mục cụ thể (VD: Pack) nhưng danh mục đó hiện có 0 sản phẩm trong kho
    const isEmptyCategoryQuery = Boolean(detectedCategoryName) && keywords.length === 0 && !detectedRarity;

    if (sampleProducts && sampleProducts.length > 0) {
      const reply = isEmptyCategoryQuery
        ? isVietnamese
          ? `Hiện tại danh mục "${detectedCategoryName}" tạm thời chưa có sản phẩm nào trong kho. Bạn có thể tham khảo một số sản phẩm đang có sẵn tại TCG Shop nhé:\n${formatProductLines(
              sampleProducts
            )}\n\nHoặc bấm "Switch to Live Staff" bên dưới để nhân viên hỗ trợ đặt hàng giúp bạn!`
          : `Currently, there are no items available in the "${detectedCategoryName}" category. Here are some in-stock products you might like:\n${formatProductLines(
              sampleProducts
            )}\n\nYou can also click "Switch to Live Staff" below if you want our team to check upcoming restocks!`
        : isVietnamese
        ? `Hiện tại shop chưa tìm thấy sản phẩm khớp với "${searchedTerm}". Bạn có thể tham khảo một số sản phẩm đang có sẵn tại TCG Shop nhé:\n${formatProductLines(
            sampleProducts
          )}\n\nHoặc bấm "Switch to Live Staff" bên dưới để nhân viên kiểm tra hỗ trợ đặt hàng giúp bạn!`
        : `Sorry, we couldn't find any products matching "${searchedTerm}". Here are some in-stock items available right now:\n${formatProductLines(
            sampleProducts
          )}\n\nYou can also click "Switch to Live Staff" below if you want our team to check special requests!`;
      return res.status(200).json({ reply });
    }

    const fallbackReply = isVietnamese
      ? `Hiện tại sản phẩm này chưa có sẵn. Bạn hãy bấm "Switch to Live Staff" để nhân viên hỗ trợ trực tiếp nhé!`
      : `This item is currently unavailable. Please click "Switch to Live Staff" to chat directly with our team!`;
    return res.status(200).json({ reply: fallbackReply });
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