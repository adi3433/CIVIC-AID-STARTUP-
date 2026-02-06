"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactDOM from 'react-dom';
import { ArrowUpCircle, Search, Info, X, MessageSquare } from "react-feather";
import { useResponsive } from "../../hooks/useResponsive";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import ReactMarkdown from 'react-markdown';
import './LeadPrediction.css';

// Dedicated component for Mermaid diagrams
const MermaidDiagram = ({ chart }) => {
  const [svgContent, setSvgContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [title, setTitle] = useState("Workflow Diagram");
  const fullscreenContainerRef = useRef(null);
  
  // Check if we're in a browser environment
  const isClient = typeof window !== 'undefined';
  
  // Extract title from chart if available
  useEffect(() => {
    if (!chart) return;
    
    try {
      const titleMatch = chart.match(/^%%\s*(.*?)\s*%%/m);
      if (titleMatch && titleMatch[1]) {
        setTitle(titleMatch[1]);
      }
    } catch (err) {
      console.error("Error extracting title:", err);
    }
  }, [chart]);
  
  // Handle fullscreen mode
  useEffect(() => {
    if (!isClient) return;
    
    const handleKeyPress = (e) => {
      if (!isFullscreen) return;
      
      // Handle Escape key to exit fullscreen
      if (e.key === 'Escape') {
        setIsFullscreen(false);
        return;
      }
      
      // Handle zoom with + and - keys
      if (e.key === '+' || e.key === '=') {
        setZoomLevel(prev => Math.min(prev + 0.2, 3)); // Max zoom 3x
        e.preventDefault();
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel(prev => Math.max(prev - 0.2, 0.5)); // Min zoom 0.5x
        e.preventDefault();
      }
    };
    
    // Lock body scroll when in fullscreen
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyPress);
    } else {
      document.body.style.overflow = '';
      // Reset zoom level when exiting fullscreen
      setZoomLevel(1);
    }
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen, isClient]);
  
  // Render the diagram
  useEffect(() => {
    if (!isClient) {
      setError("Client-side rendering required");
      setIsLoading(false);
      return;
    }
    
    if (!chart || typeof chart !== 'string') {
      setError("Invalid diagram data");
      setIsLoading(false);
      return;
    }
    
    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Ensure mermaid is loaded
        if (typeof window.mermaid === 'undefined') {
          try {
            const mermaidModule = await import('mermaid');
            window.mermaid = mermaidModule.default;
          } catch (err) {
            throw new Error("Failed to load Mermaid library");
          }
        }
        
        // Initialize mermaid
        try {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            flowchart: {
              curve: 'basis',
              useMaxWidth: false,
              htmlLabels: true,
            }
          });
        } catch (err) {
          throw new Error("Failed to initialize Mermaid");
        }
        
        // Validate chart content
        if (!chart || chart.trim() === '') {
          throw new Error("Empty diagram content");
        }
        
        // Generate a unique ID for this diagram
        const diagramId = `mermaid-svg-${Math.random().toString(36).substring(2, 11)}`;
        
        // Render the diagram
        try {
          const { svg } = await window.mermaid.render(diagramId, chart.trim());
          setSvgContent(svg);
        } catch (err) {
          console.error("Mermaid rendering error:", err);
          throw new Error(`Failed to render diagram: ${err.message}`);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Mermaid diagram error:", err);
        setError(err.message || "Failed to render diagram");
        setIsLoading(false);
      }
    };
    
    renderDiagram();
    
    // Cleanup
    return () => {
      setIsFullscreen(false);
    };
  }, [chart, isClient]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Render fullscreen diagram using portal
  const renderFullscreenDiagram = () => {
    if (!isFullscreen || !isClient) return null;
    
    // Handle mouse wheel zoom
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setZoomLevel(prev => {
          const newZoom = prev + delta;
          return Math.min(Math.max(newZoom, 0.5), 3); // Clamp between 0.5 and 3
        });
      }
    };
    
    // Create portal to render at document body level
    return ReactDOM.createPortal(
      <div className="global-fullscreen-overlay">
        <div className="global-fullscreen-container" ref={fullscreenContainerRef}>
          <div className="global-fullscreen-header">
            <h3 className="global-fullscreen-title">{title}</h3>
            <div className="global-fullscreen-controls">
              <div className="keyboard-shortcuts">
                <span className="shortcut-hint">Use <kbd>+</kbd>/<kbd>-</kbd> or <kbd>Ctrl</kbd>+wheel to zoom, <kbd>Esc</kbd> to exit</span>
              </div>
              <button 
                className="zoom-control" 
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button 
                className="zoom-control" 
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))}
                aria-label="Zoom in"
              >
                +
              </button>
              <button 
                className="global-fullscreen-close" 
                onClick={toggleFullscreen}
                aria-label="Close fullscreen"
              >
                ✕
              </button>
            </div>
          </div>
          <div 
            className="global-fullscreen-content"
            onWheel={handleWheel}
          >
            {svgContent ? (
              <div 
                dangerouslySetInnerHTML={{ __html: svgContent }} 
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              />
            ) : (
              <div className="mermaid-loading-spinner">
                <div className="spinner"></div>
                <p>Rendering diagram...</p>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };
  
  if (!isClient) {
    return <div className="mermaid-loading-spinner">
      <div className="spinner"></div>
      <p>Loading diagram...</p>
    </div>;
  }
  
  if (error) {
    return (
      <div className="mermaid-error">
        <strong>Failed to render diagram</strong>
        <pre>{error}</pre>
        <div className="mermaid-error-content">
          <code>{chart ? chart.substring(0, 100) + (chart.length > 100 ? '...' : '') : 'No diagram content'}</code>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className={`mermaid-wrapper ${isLoading ? 'loading' : 'loaded'}`}>
        {title && !isLoading && <div className="mermaid-title">{title}</div>}
        <div className="mermaid-controls">
          <button 
            className="fullscreen-toggle" 
            onClick={toggleFullscreen}
            aria-label="View fullscreen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
        <div className="mermaid-container">
          {isLoading ? (
            <div className="mermaid-loading-spinner">
              <div className="spinner"></div>
              <p>Rendering diagram...</p>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: svgContent }} />
          )}
        </div>
      </div>
      {renderFullscreenDiagram()}
    </>
  );
};

const LeadPrediction = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputText, setInputText] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputContainerRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useResponsive();
  
  // Chatbot state
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // Initialize model ref to avoid re-creation on each render
  const modelRef = useRef(null);

  // Quick prompts for structured responses
  const quickPrompts = [
    {
      title: "Deepfake Fraud Investigation",
      prompt: "How do you approach a deepfake fraud case?",
      description: "Get a workflow diagram for investigating deepfake fraud"
    },
    {
      title: "Phishing Analysis",
      prompt: "What's the process for analyzing a phishing campaign?",
      description: "View structured analysis steps for phishing"
    },
    {
      title: "Cryptocurrency Scam",
      prompt: "How to investigate a cryptocurrency scam?",
      description: "See investigation workflow for crypto scams"
    }
  ];

  const suggestedInputs = [
    "Analyze this suspicious text message for potential scam indicators",
    "Check if this email contains phishing attempts",
    "Identify potential criminal patterns in this conversation",
    "Analyze this social media post for threats",
    "Evaluate this message for potential fraud indicators",
  ];

  // Generate suggestions based on input
  const getSuggestions = () => {
    if (!inputText) return [];
    
    return [
      `Analyze ${inputText} for criminal patterns`,
      `Check if ${inputText} is related to known scams`,
      `Identify potential leads from ${inputText}`
    ];
  };
  
  const suggestions = getSuggestions();

  // Initialize the model only on client-side
  useEffect(() => {
    if (typeof window !== 'undefined' && !modelRef.current) {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        if (!apiKey) {
          console.error("NEXT_PUBLIC_GOOGLE_API_KEY is not set");
          return;
        }
        
        modelRef.current = new ChatGoogleGenerativeAI({
          model: "gemini-2.5-flash",
          maxOutputTokens: 2048,
          apiKey: apiKey,
          streaming: true,
        });
      } catch (error) {
        console.error("Error initializing model:", error);
      }
    }
  }, []);

  // Handle mouse movement for dynamic glow effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (inputContainerRef.current) {
        const rect = inputContainerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (selectedSuggestion < suggestions.length - 1) {
        setSelectedSuggestion(prev => prev + 1);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (selectedSuggestion > 0) {
        setSelectedSuggestion(prev => prev - 1);
      }
    } else if (e.key === "Enter" && selectedSuggestion >= 0) {
      e.preventDefault();
      setInputText(suggestions[selectedSuggestion]);
      setSelectedSuggestion(-1);
    } else if (e.key === "Escape") {
      inputRef.current.blur();
      setIsFocused(false);
      setSelectedSuggestion(-1);
    }
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedSuggestion >= 0 && suggestionsRef.current) {
      const suggestionElements = suggestionsRef.current.querySelectorAll('.suggestion-item');
      if (suggestionElements[selectedSuggestion]) {
        suggestionElements[selectedSuggestion].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedSuggestion]);

  const handleFocus = () => {
    setIsFocused(true);
    setSelectedSuggestion(-1);
  };

  const handleBlur = (e) => {
    if (suggestionsRef.current && suggestionsRef.current.contains(e.relatedTarget)) {
      return;
    }
    
    if (!inputText) {
      setIsFocused(false);
    }
    setSelectedSuggestion(-1);
  };

  const handleSuggestedInputClick = (input) => {
    setInputText(input);
    setIsFocused(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleQuickPromptClick = (prompt) => {
    setInputText(prompt);
    setTimeout(() => handleSubmit(new Event('submit')), 100);
  };

  // Custom renderer for Mermaid diagrams and other structured content
  const renderMessageContent = (content) => {
    if (!content) return <p>No content to display</p>;
    
    // Regular expression to find mermaid code blocks
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    
    // Check if content contains a mermaid diagram
    const hasMermaidDiagram = content.includes('```mermaid');
    
    // If we have a mermaid diagram, extract and render it
    if (hasMermaidDiagram) {
      // Extract mermaid diagram
      let mermaidContent = null;
      const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);
      if (mermaidMatch && mermaidMatch[1]) {
        mermaidContent = mermaidMatch[1].trim();
      }
      
      // Create a clean version of content without the mermaid diagram
      const cleanContent = content.replace(/```mermaid\n[\s\S]*?```/g, '');
      
      return (
        <div className="structured-response-container">
          {/* Mermaid Diagram */}
          {mermaidContent && (
            <div className="mermaid-fixed-container">
              <div className="mermaid-content">
                <MermaidDiagram chart={mermaidContent} />
              </div>
            </div>
          )}
          
          {/* Main Content */}
          <div className="markdown-content">
            <ReactMarkdown 
              children={cleanContent}
              components={{
                table: ({ node, ...props }) => (
                  <div className="table-container">
                    <table className="structured-table" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => <th className="table-header" {...props} />,
                td: ({ node, ...props }) => <td className="table-cell" {...props} />,
              }}
            />
          </div>
        </div>
      );
    }
    
    // If no mermaid diagram, just render markdown
    return (
      <div className="markdown-content">
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      try {
        const userMessage = { role: 'user', content: inputText };
        setMessages(prev => [...prev, userMessage]);
        
        setInputText("");
        setIsLoading(true);
        setIsStreaming(true);
        setStreamingMessage("");
        setShowQuickPrompts(false);
        
        if (!modelRef.current) {
          throw new Error("Model not initialized. Please check your NEXT_PUBLIC_GOOGLE_API_KEY environment variable.");
        }
        
        // Prepare system message for lead prediction context with Mermaid diagram support
        const systemMessage = {
          role: "system",
          content: `You are an AI assistant specialized in analyzing text for potential criminal patterns, scams, threats, and generating investigative leads for law enforcement.

Provide detailed analysis and actionable next steps for investigators.

When responding, ALWAYS use the following structured format:

1. Start with a brief summary of your analysis

2. If appropriate for the query, include a Mermaid diagram showing the workflow or process using this exact syntax:
\`\`\`mermaid
%% Title of the diagram
flowchart LR
  A([Start]) --> B{Decision}
  B -->|Yes| C([Action])
  B -->|No| D([Other Action])
  
  style A fill:#c4b5fd,stroke:#8b5cf6,color:#1e1b4b
  style B fill:#fecdd3,stroke:#f43f5e,color:#881337
  style C fill:#86efac,stroke:#22c55e,color:#14532d
  style D fill:#c4b5fd,stroke:#8b5cf6,color:#1e1b4b
\`\`\`

3. Include these specific sections with headings:

## Key Findings
- Finding 1: Description
- Finding 2: Description

## Evidence Analysis
- Evidence item with severity indication
- Another evidence item

## Next Steps
- First recommended action
- Second recommended action

## Recommendations
- High priority recommendation
- Medium priority recommendation

For investigation workflows, ALWAYS include a Mermaid diagram to visualize the process. Use flowchart LR (left to right) direction for better readability and rounded nodes with ([text]) syntax for a more appealing look.

The UI will automatically render your mermaid diagrams with fullscreen support and zoom capabilities. Just wrap the diagram syntax in markdown code blocks as shown above.`
        };
        
        // Stream response
        let fullResponse = "";
        
        const response = await modelRef.current.invoke(
          [systemMessage, ...messages.slice(-10), userMessage],
          {
            callbacks: [{
              handleLLMNewToken(token) {
                fullResponse += token;
                setStreamingMessage(fullResponse);
              }
            }]
          }
        );
        
        const aiMessage = { 
          role: 'assistant', 
          content: fullResponse || response.content 
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error getting response:", error);
        const errorMessage = { 
          role: 'assistant', 
          content: `⚠️ Error: ${error.message}\n\nPlease ensure your NEXT_PUBLIC_GOOGLE_API_KEY is properly configured in the .env file.` 
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingMessage("");
      }
    }
  };

  return (
    <div className="lead-prediction-page">
      <div className={`lead-prediction-container ${isDesktop || isLargeDesktop ? 'desktop-layout' : ''}`}>
        <header className="lead-prediction-header">
          <h2 className="lead-prediction-title">
            <Search size={24} style={{ marginRight: '8px' }} />
            Lead Prediction AI
          </h2>
          <button 
            className="info-button"
            onClick={() => setShowQuickPrompts(!showQuickPrompts)}
            aria-label={showQuickPrompts ? "Hide quick prompts" : "Show quick prompts"}
          >
            {showQuickPrompts ? <X size={20} /> : <Info size={20} />}
          </button>
        </header>
        
        <div className="content-container">
          <div className="chat-container">
            {messages.length === 0 ? (
              <div className="welcome-container"> 
                {showQuickPrompts && (
                  <div className="quick-prompts">
                    <h3>Try Structured Analysis</h3>
                    <div className="quick-prompts-grid">
                      {quickPrompts.map((item, index) => (
                        <div 
                          key={index} 
                          className="quick-prompt-card"
                          onClick={() => handleQuickPromptClick(item.prompt)}
                        >
                          <h4>{item.title}</h4>
                          <p>{item.description}</p>
                          <div className="prompt-icon">
                            <MessageSquare size={16} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="lead-prediction-messages">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
                  >
                    <div className="message-avatar">
                      {message.role === 'user' ? '👮' : '🔍'}
                    </div>
                    <div className="message-content">
                      {renderMessageContent(message.content)}
                    </div>
                  </div>
                ))}
                {isStreaming && streamingMessage && (
                  <div className="message ai-message">
                    <div className="message-avatar">🔍</div>
                    <div className="message-content">
                      {renderMessageContent(streamingMessage)}
                    </div>
                  </div>
                )}
                {isLoading && !streamingMessage && (
                  <div className="message ai-message">
                    <div className="message-avatar">🔍</div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {(isDesktop || isLargeDesktop) && showQuickPrompts && (
            <div className="side-panel">
              {messages.length > 0 ? (
                <div className="suggested-inputs">
                  <h3 className="suggested-inputs-title">Suggested Inputs</h3>
                  {suggestedInputs.map((input, index) => (
                    <div 
                      key={index} 
                      className="input-item"
                      onClick={() => handleSuggestedInputClick(input)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Use input: ${input}`}
                    >
                      <div className="input-item-icon">
                        <Search size={16} />
                      </div>
                      <span className="input-item-text">{input}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="quick-tips">
                  <h3>Quick Tips</h3>
                  <div className="tips-list">
                    <div className="tip-item">
                      <div className="tip-icon">💡</div>
                      <p>Click on diagrams to view them in fullscreen mode</p>
                    </div>
                    <div className="tip-item">
                      <div className="tip-icon">💡</div>
                      <p>Try asking for specific investigation workflows</p>
                    </div>
                    <div className="tip-item">
                      <div className="tip-icon">💡</div>
                      <p>Paste suspicious messages for detailed analysis</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="fixed-input-container">
          <form onSubmit={handleSubmit} className="input-form" id="input-form">
            <div
              className={`input-wrapper ${isFocused ? "active" : ""}`}
              ref={inputContainerRef}
              style={{
                "--mouse-x": `${mousePosition.x}px`,
                "--mouse-y": `${mousePosition.y}px`,
              }}
            >
              <div className="liquid-glow"></div>
              <div className="input-bar">
                <div className="input-icon">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder={isMobile ? "Enter text to analyze..." : "Paste suspicious text, messages, or content for analysis"}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="lead-input"
                  ref={inputRef}
                  aria-label="Lead analysis input"
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  className="analyze-button"
                  aria-label="Analyze text"
                  disabled={isLoading || !inputText.trim()}
                >
                  <ArrowUpCircle />
                </button>
              </div>
            </div>
          </form>

          {isFocused && inputText && (
            <div 
              className="input-suggestions" 
              ref={suggestionsRef}
              id="input-suggestions"
              role="listbox"
            >
              <h3 className="suggestions-title">Suggested Analysis</h3>
              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className={`suggestion-item ${selectedSuggestion === index ? 'selected' : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedSuggestion(index)}
                    tabIndex={0}
                    role="option"
                    aria-selected={selectedSuggestion === index}
                  >
                    <div className="suggestion-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="suggestion-text">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadPrediction;
