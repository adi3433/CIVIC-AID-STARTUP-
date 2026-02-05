/**
 * Dispatch API Service
 * 
 * Utility functions for interacting with the dispatch backend API.
 * Supports both Next.js API routes and Flask backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const FLASK_BACKEND_URL = process.env.FLASK_BACKEND_URL || 'http://localhost:5002';

/**
 * Call dispatch webhook to handle incoming call
 * @param {Object} callData - Call information
 * @param {string} callData.call_id - Unique call identifier
 * @param {string} callData.from - Caller phone number
 * @param {boolean} callData.primary_busy - Whether primary agent is busy
 * @param {Object} callData.metadata - Additional call metadata
 * @returns {Promise<Object>} Dispatch response
 */
export async function dispatchCall(callData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callData),
    });
    
    if (!response.ok) {
      throw new Error(`Dispatch failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Dispatch API error:', error);
    throw error;
  }
}

/**
 * Check health of dispatch service
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}

/**
 * Generate a unique call ID
 * @returns {string} Unique call identifier
 */
export function generateCallId() {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format phone number to standard format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  // Remove non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Emergency type mapping for classification
 */
export const EMERGENCY_TYPES = {
  POLICE: 'police',
  MEDICAL: 'medical',
  FIRE: 'fire',
  OTHER: 'other',
};

/**
 * Priority levels for calls
 */
export const PRIORITY_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/**
 * Emergency contact numbers (Indian emergency services)
 */
export const EMERGENCY_CONTACTS = {
  police: '100',
  medical: '102',
  fire: '101',
  all: '112', // Single emergency number
  women: '181',
  child: '1098',
};

/**
 * Create a call with default values
 * @param {Object} overrides - Values to override defaults
 * @returns {Object} Call object
 */
export function createCall(overrides = {}) {
  return {
    call_id: generateCallId(),
    from: '+91XXXXXXXXXX',
    primary_busy: true,
    metadata: {
      region: 'default',
      priority: PRIORITY_LEVELS.MEDIUM,
      emergency_type: EMERGENCY_TYPES.POLICE,
      timestamp: new Date().toISOString(),
    },
    ...overrides,
  };
}
