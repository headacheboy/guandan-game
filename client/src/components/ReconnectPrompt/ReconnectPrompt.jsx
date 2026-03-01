import React, { useState, useEffect } from 'react';
import { useOnlineStore } from '../../stores/onlineStore';
import styles from './ReconnectPrompt.module.css';

export function ReconnectPrompt() {
  const { reconnectInfo, attemptReconnect, cancelReconnect } = useOnlineStore();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (reconnectInfo) {
      setTimeLeft(Math.ceil(reconnectInfo.timeRemaining / 1000));

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            cancelReconnect();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [reconnectInfo, cancelReconnect]);

  if (!reconnectInfo) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>检测到断线</h2>
        <p className={styles.message}>
          您在房间 <strong>{reconnectInfo.roomId}</strong> 的游戏中断开了连接。
        </p>
        <p className={styles.timer}>
          重连倒计时: <strong>{timeLeft}秒</strong>
        </p>
        <div className={styles.buttons}>
          <button
            className={styles.reconnectBtn}
            onClick={attemptReconnect}
          >
            重新连接
          </button>
          <button
            className={styles.cancelBtn}
            onClick={cancelReconnect}
          >
            放弃重连
          </button>
        </div>
      </div>
    </div>
  );
}
