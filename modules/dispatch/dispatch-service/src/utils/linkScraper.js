// Import only browser-compatible dependencies
const axios = require('axios');

/**
 * Extract URLs from a text message
 * @param {string} message - The message to extract URLs from
 * @returns {Array} - Array of URLs found in the message
 */
function extractUrls(message) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return message.match(urlRegex) || [];
}

/**
 * Analyze links in a message by calling the server-side API
 * @param {string} message - The message containing URLs to analyze
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeLinkContent(message) {
  const urls = extractUrls(message);
  
  if (urls.length === 0) {
    return {
      foundLinks: false,
      message: 'No links found in the message'
    };
  }
  
  try {
    // Call the server-side API to analyze links
    const response = await axios.post('/api/analyze-links', { message });
    
    // If the API call was successful, return the data
    if (response.data) {
      return response.data;
    }
    
    // Fallback if API response is empty
    return {
      foundLinks: true,
      processedLinks: urls.map(url => ({
        url,
        title: 'Could not retrieve title',
        metaDescription: 'Could not retrieve description',
        error: 'Empty API response'
      })),
      allLinks: urls,
      additionalInfo: 'API returned empty response'
    };
  } catch (error) {
    console.error('Error calling link analysis API:', error);
    
    // Fallback if API call fails
    return {
      foundLinks: true,
      processedLinks: urls.map(url => ({
        url,
        error: 'Failed to analyze link via API',
        errorDetails: error.message || 'Unknown error'
      })),
      allLinks: urls,
      additionalInfo: 'Link analysis API failed'
    };
  }
}

// Export browser-compatible functions
module.exports = {
  extractUrls,
  analyzeLinkContent
}; 