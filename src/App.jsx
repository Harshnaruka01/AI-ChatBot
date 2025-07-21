import React, { useState, useRef, useEffect } from 'react';
import './App.css'; 

const SendIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
      fill="currentColor"
    />
  </svg>
);

// Main App Component
export default function App() {
  const [question, setQuestion] = useState('');
  // State now holds an array of chat messages
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  // Automatically scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Function to generate an answer from the Gemini API
  async function generateAnswer() {
    const userQuestion = question.trim();
    if (!userQuestion) {
      setError('Please enter a question.');
      return;
    }

    // Add user's question to chat history
    setChatHistory(prev => [...prev, { text: userQuestion, type: 'user' }]);
    setQuestion(''); // Clear the input field
    setIsLoading(true);
    setError('');

    try {
      const model = 'gemini-2.0-flash';
      const apiKey = ''; // The environment will provide the API key
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: userQuestion }],
          },
        ],
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'An unknown error occurred');
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // Add bot's answer to chat history
      setChatHistory(prev => [...prev, { text: generatedText || 'No response from the model.', type: 'bot' }]);

    } catch (err) {
      console.error('API Error:', err);
      // Add error message to chat history
      setChatHistory(prev => [...prev, { text: `❌ Error: ${err.message}`, type: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Enter key press to submit the question
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateAnswer();
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <h1 className="title">AI Chatbot</h1>
        {/* This area will now display the entire chat history */}
        <div className="chat-history">
          {chatHistory.map((message, index) => (
            <div key={index} className={`chat-message ${message.type}`}>
              <p>{message.text}</p>
            </div>
          ))}
          {/* Show loading indicator */}
          {isLoading && (
            <div className="chat-message bot">
              <p className="loading-text">...</p>
            </div>
          )}
          {/* Invisible element to scroll to */}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="input-section">
        <div className="input-wrapper">
          <textarea
            className="question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            rows="1"
          />
          <button
            onClick={generateAnswer}
            disabled={isLoading}
            className="send-button"
            aria-label="Generate Answer"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
