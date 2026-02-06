import React, { useState, useRef, useEffect } from "react";
import { ArrowUpCircle, Search, Info, X, MessageSquare } from "react-feather";
import { useResponsive } from "../hooks/useResponsive";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import ReactMarkdown from 'react-markdown';
import ReactDOM from 'react-dom';
// Import CSS
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

  // Predefined responses for quick prompts to ensure proper rendering
  const predefinedResponses = {
    "How do you approach a deepfake fraud case?": `Deepfake fraud cases require a systematic approach to identify manipulated media, trace its origins, and build evidence for prosecution.

\`\`\`mermaid
%% Deepfake Investigation Process
flowchart LR
    A([Initial Report]) --> B([Evidence Collection])
    B --> C{Media Authentication}
    C -->|Authentic| D([Case Closure])
    C -->|Deepfake Detected| E([Technical Analysis])
    E --> F([Source Tracing])
    F --> G([Suspect Identification])
    G --> H{Evidence Sufficient?}
    H -->|No| I([Additional Investigation])
    I --> F
    H -->|Yes| J([Case Building])
    J --> K([Legal Action])
    
    style A fill:#c4b5fd,stroke:#8b5cf6,color:#1e1b4b
    style B fill:#c4b5fd,stroke:#8b5cf6,color:#1e1b4b
    style C fill:#fecdd3,stroke:#f43f5e,color:#881337
    style D fill:#86efac,stroke:#22c55e,color:#14532d
    style E fill:#c4b5fd,stroke:#8b5cf6,color:#1e1b4b
    style F fill:#c4b5fd,stroke:#8b5cf6,color:#1e1b4b
    style G fill:#c4b5fd,stroke:#8b5cf6,color:#1e1b4b
    style H fill:#fecdd3,stroke:#f43f5e,color:#881337
    style I fill:#c4b5fd,stroke:#8b5cf6,color:#1e1b4b
    style J fill:#c4b5fd,stroke:#8b5cf6,color:#1e1b4b
    style K fill:#86efac,stroke:#22c55e,color:#14532d
\`\`\`

## Key Findings
- Authentication First: Media authentication must precede all other investigative steps
- Technical Expertise Required: Specialized forensic tools and skills are essential for deepfake detection
- Chain of Evidence: Maintaining proper evidence handling is critical for successful prosecution
- Digital Footprints: Perpetrators often leave traceable technical signatures

## Evidence Analysis
- Metadata Inconsistencies: Missing or altered file metadata indicates potential manipulation (High Severity)
- Visual Artifacts: Unnatural blending, inconsistent lighting, or blurring around facial features (Medium Severity)
- Audio Discrepancies: Voice tone shifts, unnatural pauses, or background noise inconsistencies (Medium Severity)
- Distribution Patterns: Unusual posting times or distribution channels may indicate fraud (Low Severity)

## Next Steps
- Secure Original Evidence: Immediately preserve all digital evidence with proper chain of custody
- Apply Forensic Tools: Use specialized deepfake detection software to analyze media authenticity
- Interview Witnesses: Gather statements from individuals who can verify the authenticity of the content
- Trace Digital Path: Follow the distribution path to identify original source and potential suspects

## Recommendations
- High Priority: Establish dedicated deepfake investigation unit with specialized training
- Medium Priority: Implement automated deepfake detection tools in monitoring systems
- Medium Priority: Develop partnerships with platform providers for faster evidence collection
- Low Priority: Create public awareness campaigns about deepfake detection`
  };

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
        modelRef.current = new ChatGoogleGenerativeAI({
          modelName: "gemini-2.0-flash-lite",
          maxOutputTokens: 2048,
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
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

  // Special effect for handling predefined responses with mermaid diagrams
  useEffect(() => {
    // This effect is no longer needed as we're handling rendering in the MermaidDiagram component
    // The renderMessageContent function will create MermaidDiagram components that handle their own rendering
  }, [messages]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    // Arrow down
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (selectedSuggestion < suggestions.length - 1) {
        setSelectedSuggestion(prev => prev + 1);
      }
    }
    // Arrow up
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (selectedSuggestion > 0) {
        setSelectedSuggestion(prev => prev - 1);
      }
    }
    // Enter key
    else if (e.key === "Enter" && selectedSuggestion >= 0) {
      e.preventDefault();
      setInputText(suggestions[selectedSuggestion]);
      setSelectedSuggestion(-1);
    }
    // Escape key
    else if (e.key === "Escape") {
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
    // Prevent blur if clicking on a suggestion
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
    // Check if we have a predefined response for this prompt
    if (predefinedResponses[prompt]) {
      // Add user message
      const userMessage = { role: 'user', content: prompt };
      
      // Add predefined AI response
      const aiMessage = { 
        role: 'assistant', 
        content: predefinedResponses[prompt]
      };
      
      setMessages(prev => [...prev, userMessage, aiMessage]);
      setShowQuickPrompts(false);
      
      // Clear input if there was any
      setInputText("");
      
      // Scroll to bottom after a short delay to ensure rendering
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      // Use the normal API call for other prompts
      setInputText(prompt);
      handleSubmit(new Event('submit'));
    }
  };

  // Custom renderer for Mermaid diagrams and other structured content
  const renderMessageContent = (content) => {
    if (!content) return <p>No content to display</p>;
    
    // Regular expression to find mermaid code blocks
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    
    // Check if content contains a mermaid diagram
    const hasMermaidDiagram = content.includes('```mermaid');
    
    // Check for structured content sections
    const hasNextSteps = /## Next Steps|### Next Steps/i.test(content);
    const hasKeyFindings = /## Key Findings|### Key Findings/i.test(content);
    const hasEvidence = /## Evidence|### Evidence Analysis/i.test(content);
    const hasRecommendations = /## Recommendations|### Recommendations/i.test(content);
    const hasTimeline = /## Timeline|### Timeline/i.test(content);
    
    // If we have structured content, use the structured container
    if (hasMermaidDiagram || hasNextSteps || hasKeyFindings || hasEvidence || hasRecommendations || hasTimeline) {
      // Extract mermaid diagram if present
      let mermaidContent = null;
      let mermaidTitle = "Workflow Diagram";
      
      if (hasMermaidDiagram) {
        // Safely extract the first mermaid diagram
        const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);
        if (mermaidMatch && mermaidMatch[1]) {
          mermaidContent = mermaidMatch[1].trim();
          
          // Look for a title in the diagram content or preceding text
          const firstLine = mermaidContent.split('\n')[0];
          if (firstLine && firstLine.startsWith('%%')) {
            mermaidTitle = firstLine.replace(/^%%\s*/, '').trim();
          } else {
            // If no title in diagram, look in preceding text
            const precedingText = content.substring(0, content.indexOf('```mermaid'));
            const lines = precedingText.split('\n');
            
            // Check the last few lines for a heading that might be a title
            for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
              const line = lines[i].trim();
              if (line.startsWith('##') || line.startsWith('###')) {
                mermaidTitle = line.replace(/^#+\s+/, '');
                break;
              }
            }
          }
        }
      }
      
      // Create a clean version of content without the mermaid diagram
      const cleanContent = hasMermaidDiagram ? 
        content.replace(/```mermaid\n[\s\S]*?```/g, '') : 
        content;
      
      // Extract sections
      const extractSection = (sectionName, content) => {
        try {
          const regex = new RegExp(`## ${sectionName}|### ${sectionName}([\\s\\S]*?)(?=## |### |$)`, 'i');
          const match = content.match(regex);
          return match && match[1] ? match[1].trim() : null;
        } catch (err) {
          console.error(`Error extracting section ${sectionName}:`, err);
          return null;
        }
      };
      
      const nextStepsContent = extractSection('Next Steps', cleanContent);
      const keyFindingsContent = extractSection('Key Findings', cleanContent);
      const evidenceContent = extractSection('Evidence|Evidence Analysis', cleanContent);
      const recommendationsContent = extractSection('Recommendations', cleanContent);
      const timelineContent = extractSection('Timeline', cleanContent);
      
      return (
        <div className="structured-response-container">
          {/* Fixed Mermaid Diagram Container */}
          {hasMermaidDiagram && (
            <div className="mermaid-fixed-container">
              <div className="mermaid-header">
                <h3>{mermaidTitle}</h3>
                <div className="mermaid-header-actions">
                  <button 
                    className="mermaid-header-button"
                    onClick={() => {
                      // Find the MermaidDiagram component and call its toggleFullscreen method
                      const mermaidDiagram = document.querySelector('.mermaid-content .mermaid-wrapper');
                      if (mermaidDiagram) {
                        const fullscreenButton = mermaidDiagram.querySelector('.fullscreen-toggle');
                        if (fullscreenButton) {
                          fullscreenButton.click();
                        }
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                    <span>Fullscreen</span>
                  </button>
                </div>
              </div>
              <div className="mermaid-content">
                {mermaidContent ? (
                  <MermaidDiagram chart={mermaidContent} />
                ) : (
                  <div className="mermaid-loading-spinner">
                    <div className="spinner"></div>
                    <p>Preparing diagram...</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Main Content */}
          <div className="structured-section">
            <div className="structured-section-header">
              <h3 className="structured-section-title">
                <div className="structured-section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                Analysis
              </h3>
            </div>
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
          
          {/* Next Steps Section */}
          {nextStepsContent && (
            <div className="next-steps-container">
              <div className="next-steps-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <h3 className="next-steps-title">Next Steps</h3>
              </div>
              <div className="next-steps-list">
                {nextStepsContent.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).map((step, index) => {
                  const stepText = step.replace(/^[-*]\s+/, '').trim();
                  // Try to split into title and description if possible
                  const parts = stepText.split(':');
                  const title = parts.length > 1 ? parts[0].trim() : stepText;
                  const description = parts.length > 1 ? parts.slice(1).join(':').trim() : '';
                  
                  return (
                    <div key={index} className="next-step-item">
                      <div className="next-step-number">{index + 1}</div>
                      <div className="next-step-content">
                        <h4 className="next-step-title">{title}</h4>
                        {description && <p className="next-step-description">{description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Key Findings Section */}
          {keyFindingsContent && (
            <div className="key-findings-container">
              <div className="key-findings-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h3 className="key-findings-title">Key Findings</h3>
              </div>
              <div className="key-findings-list">
                {keyFindingsContent.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).map((finding, index) => {
                  const findingText = finding.replace(/^[-*]\s+/, '').trim();
                  // Try to split into title and description if possible
                  const parts = findingText.split(':');
                  const title = parts.length > 1 ? parts[0].trim() : findingText;
                  const description = parts.length > 1 ? parts.slice(1).join(':').trim() : '';
                  
                  return (
                    <div key={index} className="key-finding-item">
                      <div className="key-finding-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      </div>
                      <div className="key-finding-content">
                        <h4 className="key-finding-title">{title}</h4>
                        {description && <p className="key-finding-description">{description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Evidence Analysis Section */}
          {evidenceContent && (
            <div className="evidence-analysis-container">
              <div className="evidence-analysis-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <h3 className="evidence-analysis-title">Evidence Analysis</h3>
              </div>
              <div className="evidence-items">
                {evidenceContent.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).map((evidence, index) => {
                  const evidenceText = evidence.replace(/^[-*]\s+/, '').trim();
                  // Try to determine severity
                  let severity = "medium";
                  if (evidenceText.toLowerCase().includes("high") || evidenceText.toLowerCase().includes("critical")) {
                    severity = "high";
                  } else if (evidenceText.toLowerCase().includes("low") || evidenceText.toLowerCase().includes("minor")) {
                    severity = "low";
                  }
                  
                  return (
                    <div key={index} className="evidence-item">
                      <div className="evidence-item-header">
                        <div className="evidence-item-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                          </svg>
                        </div>
                        <h4 className="evidence-item-title">Evidence #{index + 1}</h4>
                      </div>
                      <p className="evidence-item-content">{evidenceText}</p>
                      <span className={`evidence-item-severity severity-${severity}`}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)} Severity
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Recommendations Section */}
          {recommendationsContent && (
            <div className="recommendations-container">
              <div className="recommendations-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
                <h3 className="recommendations-title">Recommendations</h3>
              </div>
              <div className="recommendations-list">
                {recommendationsContent.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).map((recommendation, index) => {
                  const recText = recommendation.replace(/^[-*]\s+/, '').trim();
                  // Try to determine priority
                  let priority = "medium";
                  if (recText.toLowerCase().includes("high") || recText.toLowerCase().includes("critical") || recText.toLowerCase().includes("urgent")) {
                    priority = "high";
                  } else if (recText.toLowerCase().includes("low") || recText.toLowerCase().includes("minor")) {
                    priority = "low";
                  }
                  
                  return (
                    <div key={index} className="recommendation-item">
                      <span className={`recommendation-priority priority-${priority}`}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                      </span>
                      <h4 className="recommendation-title">Recommendation #{index + 1}</h4>
                      <p className="recommendation-description">{recText}</p>
                      <div className="recommendation-actions">
                        <button className="recommendation-action">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                          <span>Implement</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Timeline Section */}
          {timelineContent && (
            <div className="timeline-container">
              <div className="timeline-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <h3 className="timeline-title">Timeline</h3>
              </div>
              <div className="timeline-events">
                {timelineContent.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).map((event, index) => {
                  const eventText = event.replace(/^[-*]\s+/, '').trim();
                  // Try to extract time if available
                  const timeMatch = eventText.match(/\[([^\]]+)\]/);
                  const time = timeMatch ? timeMatch[1] : `Event ${index + 1}`;
                  const description = timeMatch ? eventText.replace(/\[[^\]]+\]/, '').trim() : eventText;
                  
                  return (
                    <div key={index} className="timeline-event">
                      <div className="timeline-event-content">
                        <div className="timeline-event-time">{time}</div>
                        <h4 className="timeline-event-title">Event #{index + 1}</h4>
                        <p className="timeline-event-description">{description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // If no structured content detected, handle regular content with potential mermaid diagrams
    // Split content to find mermaid diagrams
    const parts = [];
    let lastIndex = 0;
    let mermaidMatches = [];
    
    // Safely extract all mermaid diagrams first
    let match;
    while ((match = mermaidRegex.exec(content)) !== null) {
      if (match && match.index !== undefined && match[0] && match[1]) {
        mermaidMatches.push({
          fullMatch: match[0],
          content: match[1].trim(),
          index: match.index,
          length: match[0].length
        });
      }
    }
    
    // If no mermaid diagrams were found, just return the whole content
    if (mermaidMatches.length === 0) {
      return (
        <div className="markdown-content">
          <ReactMarkdown 
            children={content}
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
      );
    }
    
    // Process each match and build parts array
    for (const match of mermaidMatches) {
      // Add text before the mermaid block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      
      // Look for a title in the diagram content or preceding text
      let title = "Workflow Diagram";
      
      // First check if the diagram has a title comment
      const firstLine = match.content.split('\n')[0];
      if (firstLine && firstLine.startsWith('%%')) {
        title = firstLine.replace(/^%%\s*/, '').trim();
      } else {
        // If no title in diagram, look in preceding text
        const precedingText = content.substring(0, match.index);
        const lines = precedingText.split('\n');
        
        // Check the last few lines for a heading that might be a title
        for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
          if (i < 0 || i >= lines.length) continue;
          const line = lines[i].trim();
          if (line.startsWith('##') || line.startsWith('###')) {
            title = line.replace(/^#+\s+/, '');
            break;
          }
        }
      }
      
      // Add the mermaid diagram with its title
      parts.push({
        type: 'mermaid',
        content: match.content,
        title: title
      });
      
      lastIndex = match.index + match.length;
    }
    
    // Add any remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }
    
    // Render the parts
    return (
      <div className="markdown-content">
        {parts.map((part, index) => {
          if (part.type === 'mermaid') {
            return <MermaidDiagram key={index} chart={part.content} />;
          } else {
            // Replace any remaining mermaid code blocks with empty strings
            // to avoid rendering them as code blocks
            const cleanContent = part.content.replace(/```mermaid\n[\s\S]*?```/g, '');
            return (
              <ReactMarkdown 
                key={index}
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
            );
          }
        })}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      try {
        // Add user message to chat
        const userMessage = { role: 'user', content: inputText };
        setMessages(prev => [...prev, userMessage]);
        
        // Clear input and show loading state
        setInputText("");
        setIsLoading(true);
        setIsStreaming(true);
        setStreamingMessage("");
        setShowQuickPrompts(false);
        
        if (!modelRef.current) {
          throw new Error("Model not initialized");
        }
        
        // Prepare system message for lead prediction context with structured output instructions
        const systemMessage = {
          role: "system",
          content: `You are J.Ethical Lead Predictor, an AI assistant specialized in analyzing text for potential criminal patterns, scams, threats, and generating investigative leads for law enforcement. 
          
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
          
          The UI will automatically format your response into a structured layout with the diagram at the top, followed by the analysis sections.`
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
        
        // Add AI response to chat
        const aiMessage = { 
          role: 'assistant', 
          content: fullResponse || response.content 
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error getting response:", error);
        // Add error message to chat
        const errorMessage = { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error processing your request. Please try again." 
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
            Lead Prediction
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
          {/* Main chat area */}
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
          
          {/* Side panel for suggestions (desktop only) */}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSuggestedInputClick(input);
                        }
                      }}
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
        
        {/* Fixed input form at the bottom */}
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
                  aria-autocomplete="list"
                  aria-controls="input-suggestions"
                  aria-expanded={isFocused && inputText ? "true" : "false"}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSuggestionClick(suggestion);
                      }
                    }}
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