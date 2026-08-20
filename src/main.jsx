import React from 'react'
import { createRoot } from 'react-dom/client'
import './data/catalogueBootstrap.js'
import App from './App.jsx'
import './styles.css'
import './sprint01.css'
import './catalogue-status.css'
import './myboat.css'
import './order-simulation.css'
import './supplier-email.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
