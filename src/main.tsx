import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './AdminApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{window.location.pathname.startsWith('/admin') ? <AdminApp /> : <App />}</React.StrictMode>,
)
