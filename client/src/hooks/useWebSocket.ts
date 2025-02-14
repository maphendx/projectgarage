import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  message: string;
  sender: string;
  sender_name?: string;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = ({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
}: UseWebSocketOptions) => {
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      onOpen?.();
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      onClose?.();
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };
  }, [url, onMessage, onOpen, onClose, onError]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    wsRef,
    sendMessage,
    connect,
  };
};
