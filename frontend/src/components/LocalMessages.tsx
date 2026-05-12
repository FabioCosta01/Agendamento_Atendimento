import { useState, useEffect } from 'react';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface LocalMessage {
  id: string;
  type: MessageType;
  message: string;
  autoHide?: boolean;
  duration?: number;
}

export function useLocalMessages() {
  const [messages, setMessages] = useState<LocalMessage[]>([]);

  const addMessage = (
    type: MessageType,
    message: string,
    autoHide: boolean = true,
    duration: number = 5000
  ) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: LocalMessage = {
      id,
      type,
      message,
      autoHide,
      duration,
    };

    setMessages((prev) => [...prev, newMessage]);

    if (autoHide) {
      setTimeout(() => {
        removeMessage(id);
      }, duration);
    }

    return id;
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    addMessage,
    removeMessage,
    clearMessages,
  };
}

export function LocalMessage({ message, onRemove }: { message: LocalMessage; onRemove: (id: string) => void }) {
  useEffect(() => {
    if (message.autoHide) {
      const timer = setTimeout(() => {
        onRemove(message.id);
      }, message.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [message, onRemove]);

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  const getClassName = () => {
    switch (message.type) {
      case 'success':
        return 'local-message success';
      case 'error':
        return 'local-message error';
      case 'warning':
        return 'local-message warning';
      case 'info':
        return 'local-message info';
      default:
        return 'local-message';
    }
  };

  return (
    <div className={getClassName()}>
      <span className="local-message-icon">{getIcon()}</span>
      <span className="local-message-text">{message.message}</span>
      <button
        type="button"
        className="local-message-close"
        onClick={() => onRemove(message.id)}
        aria-label="Fechar mensagem"
      >
        ×
      </button>
    </div>
  );
}

export function LocalMessagesContainer({ messages, onRemove }: { messages: LocalMessage[]; onRemove: (id: string) => void }) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="local-messages-container">
      {messages.map((message) => (
        <LocalMessage key={message.id} message={message} onRemove={onRemove} />
      ))}
    </div>
  );
}