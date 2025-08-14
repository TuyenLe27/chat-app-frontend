import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Kết nối Socket.IO với backend và ép dùng websocket
const socket = io("https://chat-app-backend-4-c9lw.onrender.com", {
  transports: ["websocket"]
});

function App() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    socket.on("chatHistory", (history) => {
      setMessages(history);
    });

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      socket.off("chatHistory");
      socket.off("receiveMessage");
      socket.off("connect_error");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", { username, text: message });
      setMessage("");
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Nhập tên để bắt đầu chat</h2>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Tên của bạn"
        />
        <button onClick={() => username && setIsLoggedIn(true)}>Vào chat</button>
      </div>
    );
  }

  return (
    <div style={{ width: "400px", margin: "20px auto", border: "1px solid #ccc", padding: "10px" }}>
      <h2>💬 Chat App</h2>
      <div style={{ height: "300px", overflowY: "scroll", border: "1px solid #ddd", padding: "5px" }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "8px" }}>
            <strong>{msg.username}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "10px" }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          style={{ width: "70%" }}
        />
        <button onClick={sendMessage} style={{ width: "28%" }}>
          Gửi
        </button>
      </div>
    </div>
  );
}

export default App;
