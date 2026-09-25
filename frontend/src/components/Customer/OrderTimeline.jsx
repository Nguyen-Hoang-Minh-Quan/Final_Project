import React from 'react';
import { FaClipboardList, FaBoxOpen, FaTruck, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import '../../styles/TCGStyles.css';

const OrderTimeline = ({ order }) => {
  if (!order) return null;

  // 🌟 SỬA ĐOẠN NÀY: Linh hoạt chuyển đổi cả chữ lẫn số về chuẩn ID số quy ước
  let statusId = 0;
  const rawStatus = order.status;

  if (rawStatus === 'Đang giao' || Number(rawStatus) === 1) {
    statusId = 1;
  } else if (rawStatus === 'Đã giao' || Number(rawStatus) === 2) {
    statusId = 2;
  } else if (rawStatus === 'Đã hủy' || Number(rawStatus) === 3) {
    statusId = 3;
  } else {
    statusId = 0; // Chờ xử lý / Đã đặt đơn
  }

  // Khai báo các bước (Giữ nguyên logic hiển thị dựa trên statusId)
  const steps = [
    { id: 1, title: "Đã đặt đơn", icon: <FaClipboardList />, active: true, time: order.createdAt },
    { id: 2, title: "Đã xác nhận", icon: <FaBoxOpen />, active: statusId === 1 || statusId === 2, time: order.paidAt || order.createdAt },
    { id: 3, title: "Đang giao hàng", icon: <FaTruck />, active: statusId === 1 || statusId === 2, time: order.deliveredAt },
    { id: 4, title: "Hoàn thành", icon: <FaCheckCircle />, active: statusId === 2, time: order.updatedAt || order.deliveredAt }
  ];

  if (statusId === 3) {
    return (
      <div className="d-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger p-3 rounded-3 mb-4 fw-bold border border-danger border-opacity-25 gap-2" style={{borderRadius: '12px'}}>
        <FaTimesCircle size={20}/> ĐƠN HÀNG NÀY ĐÃ BỊ HỦY BỞI NGƯỜI DÙNG HOẶC HỆ THỐNG QUẢN TRỊ
      </div>
    );
  }

  let progressWidth = '0%';
  if (statusId === 1) progressWidth = '66%'; 
  if (statusId === 2) progressWidth = '100%'; 

  return (
    <div className="bg-white p-4 rounded-3 shadow-sm mb-4 border border-light" style={{ borderRadius: '12px' }}>
      <div className="timeline-container d-flex justify-content-between position-relative mx-auto" style={{ maxWidth: '800px', padding: '10px 0' }}>
        <div className="position-absolute top-50 start-0 translate-middle-y w-100 bg-secondary bg-opacity-25" style={{ height: '4px', zIndex: 0, left: 0, right: 0 }}></div>
        <div className="position-absolute top-50 start-0 translate-middle-y bg-success" style={{ height: '4px', zIndex: 1, transition: 'width 0.5s ease-in-out', width: progressWidth }}></div>

        {steps.map((step) => (
          <div key={step.id} className="text-center position-relative z-2 d-flex flex-column align-items-center" style={{ width: '100px' }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm text-white fs-5" style={{ width: '45px', height: '45px', backgroundColor: step.active ? '#198754' : '#6c757d', transition: 'background-color 0.4s ease', border: '3px solid #ffffff' }}>
              {step.icon}
            </div>
            <span className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.7rem', color: step.active ? '#198754' : '#6c757d' }}>
              {step.title}
            </span>
            {step.active && step.time && (
              <span className="text-secondary fw-medium" style={{ fontSize: '0.6rem', marginTop: '2px' }}>
                {new Date(step.time).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTimeline;