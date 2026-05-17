import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import axios from 'axios';
import '../styles/TCGStyles.css';

const Chatbot = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const askAI = async () => {
        setLoading(true);
        try {
            const { data } = await axios.post('http://localhost:5000/api/ai/chat', { prompt });
            setResponse(data.text);
        } catch (err) { setResponse("Lỗi kết nối AI!"); }
        setLoading(false);
    };

    return (
        <div className="chat-window m-4">
            <h4 className="fw-bold mb-3">💬 AI POKÉMON ASSISTANT</h4>
            <div className="d-flex gap-2">
                <Form.Control 
                    className="tcg-input" 
                    placeholder="Hỏi về rarity, giá thẻ..." 
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <Button className="tcg-btn" variant="danger" onClick={askAI}>
                    {loading ? "..." : "GỬI"}
                </Button>
            </div>
            {response && <div className="chat-msg"><b>AI:</b> {response}</div>}
        </div>
    );
};
export default Chatbot;