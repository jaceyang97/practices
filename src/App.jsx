import { useState } from 'react'
import ArtworkRenderer from './ArtworkRenderer'

function App() {
  const [currentScript, setCurrentScript] = useState('p36.js')
  const [activeButton, setActiveButton] = useState(36)

  // Generate list of available scripts (p0.js through p36.js)
  const availableScripts = Array.from({ length: 37 }, (_, i) => `p${i}.js`)

  // Handle button click
  const handleScriptClick = (index) => {
    setActiveButton(index)
    setCurrentScript(`p${index}.js`)
  }

  // Handle save canvas - this will need to be implemented differently
  const handleSave = () => {
    // For now, we'll implement a simple download of the iframe content
    const iframe = document.querySelector('iframe')
    if (iframe) {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      const canvas = iframeDoc.querySelector('canvas')
      if (canvas) {
        const link = document.createElement('a')
        link.download = `${currentScript.replace('.js', '')}.png`
        link.href = canvas.toDataURL()
        link.click()
      }
    }
  }

  return (
    <div className="app">
      <div className="info-panel">
        <span className="artwork-name">{currentScript.replace('.js', '')}</span>
        <button className="save-btn" onClick={handleSave}>
          💾 Save Image
        </button>
      </div>

      <div className="script-grid">
        <div className="script-buttons">
          {availableScripts.map((script, index) => (
            <button
              key={script}
              className={`script-btn ${activeButton === index ? 'active' : ''}`}
              onClick={() => handleScriptClick(index)}
              title={script}
            >
              {index}
              {index === 34 && <span className="slow-indicator">!</span>}
            </button>
          ))}
        </div>
      </div>

      <ArtworkRenderer scriptName={currentScript} />
    </div>
  )
}

export default App


