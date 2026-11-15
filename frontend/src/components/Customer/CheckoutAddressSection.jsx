import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Modal } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

const CheckoutAddressSection = ({ onAddressSelect }) => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDetails, setNewDetails] = useState('');

  useEffect(() => {
    const fetchInitialAddresses = async () => {
      try {
        const { data } = await axiosClient.get('/addresses');
        setAddresses(data);

        if (data.length > 0) {
          const defaultAddr = data.find(a => a.isDefault) || data[0];
          setSelectedAddressId(defaultAddr.id);
          onAddressSelect(defaultAddr);
        }
      } catch (error) {
        console.error("Error retrieving address list from Neon:", error);
        toast.error(error.response?.data?.message || "Cannot load address book!");
      }
    };

    fetchInitialAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (addr) => {
    setSelectedAddressId(addr.id);
    onAddressSelect(addr);
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newDetails.trim()) {
      return toast.warn("Please fill in all required fields!");
    }

    const addressData = {
      receiverName: newName,
      phone: newPhone,
      details: newDetails,
      isDefault: addresses.length === 0 ? true : false
    };

    try {
      const { data } = await axiosClient.post('/addresses', addressData);

      setAddresses(prev => [...prev, data]);
      setSelectedAddressId(data.id);
      onAddressSelect(data);

      setNewName('');
      setNewPhone('');
      setNewDetails('');
      setShowModal(false);
      toast.success("Address saved successfully!");
    } catch (error) {
      console.error("Error saving address to Neon:", error);
      toast.error(error.response?.data?.message || "Server error, cannot save address.");
    }
  };

  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation();
    try {
      await axiosClient.delete(`/addresses/${id}`);
      
      const updated = addresses.filter(a => a.id !== id);
      setAddresses(updated);
      toast.info("Address deleted successfully!");

      if (selectedAddressId === id && updated.length > 0) {
        setSelectedAddressId(updated[0].id);
        onAddressSelect(updated[0]);
      }
    } catch (error) {
      console.error("Error deleting address from Neon:", error);
      toast.error(error.response?.data?.message || "Cannot delete this address.");
    }
  };

  return (
    <Card className="border-0 shadow-sm mb-4 rounded-3 bg-white">
      <Card.Body p={4}>
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2" style={{fontSize: '1.1rem'}}>
            <FaMapMarkerAlt className="text-danger" /> SHIPPING ADDRESS BOOK
          </h5>
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="fw-bold d-flex align-items-center gap-1 border-1 px-3"
            onClick={() => setShowModal(true)}
            style={{ borderRadius: '6px', fontSize: '0.8rem' }}
          >
            <FaPlus /> ADD NEW ADDRESS
          </Button>
        </div>

        <Form>
          {addresses.length === 0 ? (
            <p className="text-muted small text-center my-3">You have no shipping addresses yet. Please add a new one!</p>
          ) : (
            addresses.map((addr) => (
              <div 
                key={addr.id}
                onClick={() => handleSelect(addr)}
                className={`p-3 mb-2 rounded border position-relative custom-address-box ${
                  selectedAddressId === addr.id 
                    ? 'border-danger bg-danger bg-opacity-10' 
                    : 'border-secondary border-opacity-25 bg-white'
                }`}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                <div className="d-flex align-items-start gap-3">
                  <Form.Check 
                    type="radio"
                    name="checkoutAddress"
                    checked={selectedAddressId === addr.id}
                    onChange={() => handleSelect(addr)}
                    className="mt-1 custom-radio-red"
                  />
                  <div className="w-100">
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span className="fw-bold text-dark">{addr.receiverName}</span>
                      <span className="text-muted small">|</span>
                      <span className="text-secondary fw-bold small">{addr.phone}</span>
                      {addr.isDefault && (
                        <span className="badge bg-danger ms-1 text-uppercase fw-bold" style={{fontSize: '0.6rem', padding: '3px 6px'}}>
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-muted small m-0 pe-5 style-address-text">{addr.details}</p>
                  </div>
                </div>
                
                {!addr.isDefault && (
                  <button 
                    type="button" 
                    className="position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent text-muted hover-danger-text"
                    onClick={(e) => handleDeleteAddress(addr.id, e)}
                    style={{ transition: 'color 0.2s' }}
                  >
                    <FaTrash size={14}/>
                  </button>
                )}
              </div>
            ))
          )}
        </Form>
      </Card.Body>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton><Modal.Title className="fw-bold fs-5 text-dark">Add a New Delivery Address</Modal.Title></Modal.Header>
        <Form onSubmit={handleAddAddress}>
          <Modal.Body>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold text-secondary">Recipient's name</Form.Label>
                <Form.Control type="text" placeholder="E.g.: Nguyen Minh Quan" value={newName} onChange={e => setNewName(e.target.value)} required className="tcg-input"/>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold text-secondary">Phone number for delivery</Form.Label>
                <Form.Control type="text" placeholder="E.g.: 0703xxxxxx" value={newPhone} onChange={e => setNewPhone(e.target.value)} required className="tcg-input"/>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-secondary">Detailed delivery address</Form.Label>
              <Form.Control as="textarea" rows={2} placeholder="House number, street name, ward/district, city/province..." value={newDetails} onChange={e => setNewDetails(e.target.value)} required className="tcg-input"/>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" className="fw-bold border" onClick={() => setShowModal(false)}>CANCEL</Button>
            <Button type="submit" variant="danger" size="sm" className="tcg-btn fw-bold px-3">SAVE ADDRESS</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Card>
  );
};

export default CheckoutAddressSection;