'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { speakText, stopSpeaking } from '../../../utils/speechUtils';

/**
 * Custom hook for AI processing functionality
 * @returns {Object} AI processing state and controls
 */
export function useAIProcessing() {
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  
  // Refs to manage streaming and intervals
  const streamIntervalRef = useRef(null);
  const currentResponseRef = useRef('');
  const isStreamingRef = useRef(false);
  
  // Initialize Gemini API
  const genAI = useRef(null);
  const model = useRef(null);
  
  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Initialize Gemini API if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (apiKey) {
      genAI.current = new GoogleGenerativeAI(apiKey);
      model.current = genAI.current.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    }
  }, []);
  
  const uploadAudio = async (fileToUpload = null, transcriptText = '', voiceParams = {}) => {
    const fileToProcess = fileToUpload;
    
    if (!fileToProcess) {
      setError('Please select or record an audio file first.');
      return;
    }
    
    if (!model.current) {
      setError('Gemini API is not initialized. Please check your API key.');
      return;
    }
    
    try {
      setIsUploading(true);
      setTranscription('Processing audio...');
      setError(''); // Clear any previous errors
      
      // Show processing message in conversation
      const processingMessage = { 
        role: 'system', 
        content: 'Processing audio...', 
        isProcessing: true 
      };
      setConversationHistory(prev => [...prev, processingMessage]);
      
      // Read the audio file as base64
      const reader = new FileReader();
      
      // Create a promise to handle the FileReader
      const audioDataPromise = new Promise((resolve, reject) => {
        reader.onload = () => {
          const base64Data = reader.result.toString().split(',')[1]; // Remove the data URL prefix
          resolve(base64Data);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read audio file'));
        };
      });
      
      // Read the file as data URL
      reader.readAsDataURL(fileToProcess);
      
      // Wait for the file to be read
      const base64Data = await audioDataPromise;
      
      // Format conversation history for context
      const formattedHistory = conversationHistory
        .filter(msg => !msg.isProcessing)
        .map(msg => `${msg.role === 'user' ? 'Caller' : 'Dispatch'}: ${msg.content}`)
        .join('\n');
      
      // Create system prompt
      const systemPrompt = `You are an emergency dispatch AI assistant. Your job is to:
1. Remain calm and professional at all times
2. Gather essential information about the emergency
3. Provide clear instructions to the caller
4. Reassure the caller that help is on the way
5. Keep responses concise and focused on the emergency at hand
6. Ask for location, nature of emergency, and any immediate dangers
7. Provide first aid instructions if needed

${formattedHistory ? `Previous conversation:\n${formattedHistory}\n\n` : ''}
The caller has sent an audio message. ${transcriptText ? `The transcript is: "${transcriptText}"` : ''}
Please respond as if you are speaking to the caller directly. Keep your response brief, focused, and helpful. Do not include any prefixes like "Dispatch:" in your response.`;
      
      // Create a part for the audio file
      const audioData = {
        inlineData: {
          data: base64Data,
          mimeType: fileToProcess.type || "audio/mp3"
        }
      };
      
      // Process with Gemini
      const result = await model.current.generateContent([
        systemPrompt,
        audioData
      ]);
      
      // Remove the processing message
      setConversationHistory(prev => prev.filter(msg => !msg.isProcessing));
      
      // Handle the response based on the Gemini API version
      let responseText;
      if (result && result.response) {
        if (typeof result.response.text === 'function') {
          responseText = result.response.text();
        } else if (result.response.text !== undefined) {
          responseText = result.response.text;
        } else if (result.response.candidates && result.response.candidates.length > 0) {
          responseText = result.response.candidates[0].content.parts[0].text;
        } else {
          responseText = "I'm sorry, I couldn't process your audio.";
          console.error("Unexpected response format:", result);
        }
      } else {
        responseText = "I'm sorry, I couldn't process your audio.";
        console.error("Invalid response:", result);
      }
      
      const audioTranscription = "[Audio processed directly by Gemini]";
      
      setTranscription(audioTranscription);
      
      // Add user message with transcription for audio
      const userMessage = { 
        role: 'user', 
        content: audioTranscription, 
        isAudio: true 
      };
      
      // Add AI response to conversation history with streaming flag
      const aiMessage = { role: 'assistant', content: responseText, isStreaming: true };
      setConversationHistory(prev => [...prev, userMessage, aiMessage]);
      
      setAiResponse(responseText);
      
      // Stream the response text character by character
      streamTextWithVoice(responseText, voiceParams);
      
      return responseText;
    } catch (err) {
      setError('Error processing your audio: ' + err.message);
      console.error('Error:', err);
      
      // Remove the processing message
      setConversationHistory(prev => prev.filter(msg => !msg.isProcessing));
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  const processTranscript = async (transcript, voiceParams = {}) => {
    try {
      setIsProcessing(true);
      
      if (!model.current) {
        setError('Gemini API is not initialized. Please check your API key.');
        return null;
      }
      
      // Format conversation history for context
      const formattedHistory = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'Caller' : 'Dispatch'}: ${msg.content}`)
        .join('\n');
      
      // Create system prompt
      const systemPrompt = `You are an emergency dispatch AI assistant. Your job is to:
1. Remain calm and professional at all times
2. Gather essential information about the emergency
3. Provide clear instructions to the caller
4. Reassure the caller that help is on the way
5. Keep responses concise and focused on the emergency at hand
6. Ask for location, nature of emergency, and any immediate dangers
7. Provide first aid instructions if needed

${formattedHistory ? `Previous conversation:\n${formattedHistory}\n\n` : ''}
Caller's latest message: ${transcript}

Respond as if you are speaking to the caller directly. Keep your response brief, focused, and helpful. Do not include any prefixes like "Dispatch:" in your response.`;

      // Process with Gemini
      const result = await model.current.generateContent(systemPrompt);
      
      // Handle the response based on the Gemini API version
      let responseText;
      if (result && result.response) {
        if (typeof result.response.text === 'function') {
          responseText = result.response.text();
        } else if (result.response.text !== undefined) {
          responseText = result.response.text;
        } else if (result.response.candidates && result.response.candidates.length > 0) {
          responseText = result.response.candidates[0].content.parts[0].text;
        } else {
          responseText = "I'm sorry, I couldn't process your request.";
          console.error("Unexpected response format:", result);
        }
      } else {
        responseText = "I'm sorry, I couldn't process your request.";
        console.error("Invalid response:", result);
      }
      
      // Add user message to conversation history
      const userMessage = { role: 'user', content: transcript };
      
      // Add AI response to conversation history with streaming flag
      const aiMessage = { role: 'assistant', content: responseText, isStreaming: true };
      setConversationHistory(prev => [...prev, userMessage, aiMessage]);
      
      setAiResponse(responseText);
      
      // Stream the response text character by character
      streamTextWithVoice(responseText, voiceParams);
      
      return responseText;
    } catch (err) {
      setError('Error getting response from Gemini: ' + err.message);
      console.error('Error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const processTextInput = async (textInput, voiceParams = {}) => {
    try {
      setIsProcessingText(true);
      setError('');
      
      if (!model.current) {
        setError('Gemini API is not initialized. Please check your API key.');
        return null;
      }
      
      // Add user message to conversation history
      const userMessage = { role: 'user', content: textInput };
      setConversationHistory(prev => [...prev, userMessage]);
      
      // Format conversation history for context
      const formattedHistory = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'Caller' : 'Dispatch'}: ${msg.content}`)
        .join('\n');
      
      // Create system prompt
      const systemPrompt = `You are an emergency dispatch AI assistant. Your job is to:
1. Remain calm and professional at all times
2. Gather essential information about the emergency
3. Provide clear instructions to the caller
4. Reassure the caller that help is on the way
5. Keep responses concise and focused on the emergency at hand
6. Ask for location, nature of emergency, and any immediate dangers
7. Provide first aid instructions if needed

${formattedHistory ? `Previous conversation:\n${formattedHistory}\n\n` : ''}
Caller's latest message: ${textInput}

Respond as if you are speaking to the caller directly. Keep your response brief, focused, and helpful. Do not include any prefixes like "Dispatch:" in your response.`;

      // Process with Gemini
      const result = await model.current.generateContent(systemPrompt);
      
      // Handle the response based on the Gemini API version
      let responseText;
      if (result && result.response) {
        if (typeof result.response.text === 'function') {
          responseText = result.response.text();
        } else if (result.response.text !== undefined) {
          responseText = result.response.text;
        } else if (result.response.candidates && result.response.candidates.length > 0) {
          responseText = result.response.candidates[0].content.parts[0].text;
        } else {
          responseText = "I'm sorry, I couldn't process your request.";
          console.error("Unexpected response format:", result);
        }
      } else {
        responseText = "I'm sorry, I couldn't process your request.";
        console.error("Invalid response:", result);
      }
      
      // Add AI response to conversation history with streaming flag
      const aiMessage = { role: 'assistant', content: responseText, isStreaming: true };
      setConversationHistory(prev => [...prev, aiMessage]);
      
      setAiResponse(responseText);
      
      // Stream the response text character by character
      streamTextWithVoice(responseText, voiceParams);
      
      return responseText;
    } catch (err) {
      setError('Error getting response from Gemini: ' + err.message);
      console.error('Error:', err);
      return null;
    } finally {
      setIsProcessingText(false);
    }
  };
  
  // Function to stream text with voice
  const streamTextWithVoice = (text, voiceParams) => {
    // Clear any existing streaming
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    // Reset streaming state
    setStreamingResponse('');
    currentResponseRef.current = '';
    isStreamingRef.current = true;
    setIsSpeaking(true);
    
    // Start speaking the text with voice parameters
    speakText(text, 
      () => {
        // On speech end
        setIsSpeaking(false);
        isStreamingRef.current = false;
        
        // Make sure the full text is displayed
        setStreamingResponse(text);
        
        // Update the conversation history to remove streaming flag
        setConversationHistory(prev => 
          prev.map(msg => 
            msg.isStreaming ? { ...msg, isStreaming: false } : msg
          )
        );
        
        // Clear interval if it's still running
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
      },
      () => {
        // On speech start
        setIsSpeaking(true);
      },
      voiceParams
    );
    
    // Stream the text character by character
    let index = 0;
    const streamSpeed = 30; // Adjust speed as needed (lower = faster)
    
    streamIntervalRef.current = setInterval(() => {
      if (index < text.length && isStreamingRef.current) {
        currentResponseRef.current += text[index];
        setStreamingResponse(currentResponseRef.current);
        index++;
      } else {
        // If we've reached the end of the text or streaming was stopped
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
    }, streamSpeed);
  };
  
  return {
    aiResponse,
    isProcessing,
    isUploading,
    error,
    conversationHistory,
    isSpeaking,
    transcription,
    isProcessingText,
    streamingResponse,
    uploadAudio,
    processTranscript,
    processTextInput,
    setError,
    setConversationHistory,
    setIsSpeaking
  };
} 