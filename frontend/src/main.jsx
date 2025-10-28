import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SocketProvider } from './context/SocketContext.jsx'

// Get user from localStorage
const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider user={getUser()}>
      <App />
    </SocketProvider>
  </StrictMode>,
)
