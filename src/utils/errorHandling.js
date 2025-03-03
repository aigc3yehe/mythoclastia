/**
 * Formats an error object or string into a user-friendly error message
 * @param {Error|string} error - The error to format
 * @returns {string} A formatted error message
 */
export const formatError = (error) => {
  if (!error) {
    return 'An unknown error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || error.toString();
  }

  if (typeof error === 'object') {
    // Handle case where error is an object but not an Error instance
    if (error.message) {
      return error.message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'An error occurred';
    }
  }

  return String(error);
};

/**
 * Safely parses battle response data and handles potential errors
 * @param {Object} responseData - The response data to parse
 * @returns {Object} The parsed battle data
 * @throws {Error} If the response data is invalid
 */
export const parseBattleResponseSafely = (responseData) => {
  if (!responseData) {
    throw new Error('No response data received');
  }

  if (!responseData.outputs?.[0]?.outputs?.[0]?.artifacts?.message) {
    throw new Error('Invalid battle response format');
  }

  const message = responseData.outputs[0].outputs[0].artifacts.message;
  if (typeof message !== 'string') {
    throw new Error('Invalid message format in battle response');
  }

  return message;
};
