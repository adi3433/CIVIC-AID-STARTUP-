'use client';

import { useRef, forwardRef } from 'react';

/**
 * Text input component for typing messages
 */
const TextInput = forwardRef(({ 
  textInput, 
  setTextInput, 
  handleTextSubmit, 
  isProcessingText,
  onFocus,
  onBlur
}, ref) => {
  const localRef = useRef(null);
  const inputRef = ref || localRef;
  
  return (
    <div className="p-3 bg-gray-900 border-t border-gray-700">
      <form onSubmit={handleTextSubmit} className="flex gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 py-2 px-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-100 placeholder-gray-500"
          disabled={isProcessingText}
          ref={inputRef}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <button
          type="submit"
          disabled={isProcessingText || !textInput.trim()}
          className="py-2 px-4 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {isProcessingText ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              <span>Send</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
});

TextInput.displayName = 'TextInput';

export default TextInput; 