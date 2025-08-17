import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import "./App.css";

const socket = io("https://chat-app-backend-4-c9lw.onrender.com", {
  transports: ["websocket"],
});

function App() {
  const [username, setUsername] = useState(localStorage.getItem("chatUsername") || "");
  const [avatar, setAvatar] = useState(localStorage.getItem("chatAvatar") || "");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("chatUsername"));
  const [showEmoji, setShowEmoji] = useState(false);
  const [typingUser, setTypingUser] = useState("");

  const chatEndRef = useRef(null);

  // Lắng nghe socket events
  useEffect(() => {
    socket.on("chatHistory", (history) => setMessages(history));
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));

    socket.on("userTyping", (data) => {
      if (data.username !== username) {
        setTypingUser(data.username);
        setTimeout(() => setTypingUser(""), 1500);
      }
    });

    return () => {
      socket.off("chatHistory");
      socket.off("receiveMessage");
      socket.off("userTyping");
    };
  }, [username]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoggedIn]);

  // Gửi tin nhắn
  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", {
        username,
        avatar,
        text: message,
        time: new Date().toLocaleTimeString(),
      });
      setMessage("");
    }
  };

  // Đăng nhập
  const handleLogin = () => {
    if (username.trim()) {
      localStorage.setItem("chatUsername", username);
      localStorage.setItem("chatAvatar", avatar);
      setIsLoggedIn(true);

      // chỉ gửi username + avatar
      socket.emit("userJoined", { username, avatar });
    }
  };

  // Chọn emoji
  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  // Khi gõ tin nhắn
  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { username });
  };

  // Upload ảnh avatar
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  // Màn hình login
  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <div className="login-box">
          <h2>💬 Chat App</h2>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên của bạn"
          />
          <input type="file" accept="image/*" onChange={handleAvatarUpload} />
          {avatar && (
            <div style={{ margin: "10px 0" }}>
              <img
                src={avatar}
                alt="avatar preview"
                style={{ width: 50, height: 50, borderRadius: "50%" }}
              />
            </div>
          )}
          <button onClick={handleLogin}>Vào chat</button>
        </div>
      </div>
    );
  }

  // Màn hình chat
  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <h3>💬 Chat Room</h3>
        <span>{username}</span>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, index) => {
          const isMine = msg.username === username;
          const showAvatar =
            index === messages.length - 1 || messages[index + 1].username !== msg.username;
          const showUsername =
            index === 0 || messages[index - 1].username !== msg.username;

          const bubbleColor = !isMine ? "#555" : "#0084ff";

          return (
            <div
              key={index}
              className={`message-row ${isMine ? "mine" : "other"} animate-message`}
            >
              {!isMine && (
                <div className="avatar-container">
                  {showAvatar ? (
                    msg.avatar ? (
                      <img src={msg.avatar} alt="avatar" className="avatar" />
                    ) : (
                      <div className="avatar">
                        {msg.username.charAt(0).toUpperCase()}
                      </div>
                    )
                  ) : (
                    <div className="avatar-spacer"></div>
                  )}
                </div>
              )}
              <div className="message-content">
                {showUsername && !isMine && (
                  <p className="username">{msg.username}</p>
                )}
                <div
                  className={`bubble ${isMine ? "bubble-mine" : "bubble-other"}`}
                  style={{ background: bubbleColor }}
                >
                  {msg.text}
                </div>
                <p className={`time ${isMine ? "time-right" : "time-left"}`}>
                  {msg.time || ""}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUser && (
          <p className="typing-indicator">{typingUser} đang nhập...</p>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          value={message}
          onChange={handleTyping}
          placeholder="Nhập tin nhắn..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="emoji-btn"
          onClick={() => setShowEmoji((prev) => !prev)}
        >
          😀
        </button>
        {showEmoji && (
          <div className="emoji-picker">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
        <button className="send-btn" onClick={sendMessage}>
          <img
            src="/send-icon.png"
            alt="Send"
            style={{ width: "20px", height: "20px" }}
          />
        </button>
      </div>
    </div>
  );
}

export default App;
