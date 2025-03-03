// Remove hardcoded API_TOKEN
// const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFpZ2MiLCJpYXQiOjE3Mzg4MTg3OTl9.vxiuRQEjZHb6gjSUV1deTMpjLBmPdafkMJp1HeVG9r8';
const API_BASE_URL = 'https://api.misato.ai/aigc';
const IMAGE_GEN_TOKEN_STORAGE = 'image_gen_token';

export class ImageGenerationService {
  constructor(onStatusUpdate) {
    this.onStatusUpdate = onStatusUpdate;
    this.API_URL = "http://47.80.4.197:30409/api/v1";
    this.API_KEY = "sk-rIZ898CT2ycOOWsgLWcEUfxXHxCdaVG761bfDsyZ9cY";
    this.POLL_INTERVAL = 10000; // 10 seconds
    this.MAX_ATTEMPTS = 60; // 10 minutes timeout
    this.isPolling = false; // Polling status flag
    this.pollTimer = null;
    this.pollAttempts = 0;
  }

  getToken() {
    // Try to get token from localStorage
    const token = localStorage.getItem(IMAGE_GEN_TOKEN_STORAGE);
    if (!token) {
      console.warn('[Image Service] No image generation token found in localStorage.');
    }
    return token;
  }

  cleanup() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.pollAttempts = 0;
    this.isPolling = false;
  }

  async generateImage(imgGenData) {
    try {
      const token = this.getToken();
      if (!token) {
        console.log('[Generate] No token available, returning placeholder indicator');
        return { noToken: true, message: 'No image generation token provided' };
      }

      const requestBody = {
        model: 'worldimage2',
        add: imgGenData
      };

      const response = await this.makeRequest('/raw', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, token);

      console.log('[Generate] Response:', response);

      if (response.message === 'success' && response.data.request_id) {
        return response.data.request_id;
      } else {
        throw new Error(response.message || 'Failed to generate image');
      }
    } catch (error) {
      throw error;
    }
  }

  async checkStatus(requestId) {
    try {
      // If requestId is an object with noToken property, return it directly
      if (requestId && typeof requestId === 'object' && requestId.noToken) {
        return { status: 'no-token', message: requestId.message };
      }

      const token = this.getToken();
      if (!token) {
        return { status: 'no-token', message: 'No image generation token provided' };
      }

      const response = await this.makeRequest(`/state?request_id=${requestId}`, {}, token);
      console.log('[Poll] Status response:', response);
      return {
        status: response.data.status,
        upscaled_urls: response.data.upscaled_urls
      };
    } catch (error) {
      throw error;
    }
  }

  async startPolling(requestId) {
    // If requestId is an object with noToken property, return placeholder immediately
    if (requestId && typeof requestId === 'object' && requestId.noToken) {
      console.log('[Image Service] No token available, returning placeholder indicator');
      return { noToken: true, message: requestId.message };
    }

    if (this.isPolling) {
      console.log('[Image Service] Already polling, skipping...');
      return;
    }

    this.isPolling = true;
    this.cleanup();
    
    const poll = async (retryCount = 0) => {
      if (this.pollAttempts >= this.MAX_ATTEMPTS) {
        this.cleanup();
        throw new Error('Image generation timed out');
      }

      this.pollAttempts++;

      try {
        const result = await this.checkStatus(requestId);
        
        console.log('[Poll] Status response:', result);

        if (result.status === 'no-token') {
          this.cleanup();
          return { noToken: true, message: result.message };
        }

        if (result.status === 'completed' && Array.isArray(result.upscaled_urls) && result.upscaled_urls[0]) {
          this.cleanup();
          return result.upscaled_urls[0];
        }
        
        if (result.status === 'failed') {
          if (retryCount < 3) {
            console.log(`[Image Service] Generation failed, retrying (${retryCount + 1}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return poll(retryCount + 1);
          }
          this.cleanup();
          throw new Error('Image generation failed after retries');
        }

        if (result.status === 'pending' || result.status === 'in-progress') {
          return new Promise((resolve, reject) => {
            this.pollTimer = setTimeout(() => {
              poll(retryCount).then(resolve).catch(reject);
            }, 10000);
          });
        }

        this.cleanup();
        throw new Error(`Unknown status: ${result.status}`);
      } catch (error) {
        if (retryCount < 3 && error.message.includes('timeout')) {
          console.log(`[Image Service] Request timeout, retrying (${retryCount + 1}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          return poll(retryCount + 1);
        }
        this.cleanup();
        throw error;
      }
    };

    return poll();
  }

  async generateAvatar(portraitData) {
    try {
      const token = this.getToken();
      if (!token) {
        console.log('[Generate Avatar] No token available, returning placeholder indicator');
        return { noToken: true, message: 'No image generation token provided' };
      }

      const requestBody = {
        model: 'teammembery',
        add: portraitData
      };

      const response = await this.makeRequest('/raw', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, token);

      console.log('[Generate Avatar] Response:', response);

      if (response.message === 'success' && response.data.request_id) {
        return response.data.request_id;
      } else {
        throw new Error(response.message || 'Failed to generate avatar');
      }
    } catch (error) {
      throw error;
    }
  }

  async generateEnemyAvatar(enemyData) {
    try {
      const token = this.getToken();
      if (!token) {
        console.log('[Generate Enemy Avatar] No token available, returning placeholder indicator');
        return { noToken: true, message: 'No image generation token provided' };
      }

      console.log('[Image Service] Generating enemy avatar with data:', enemyData);

      // Build more complete prompt
      const prompt = `${enemyData.race || 'monster'} named ${enemyData.name}, ${enemyData.portrait || 'evil looking'}`;

      const requestBody = {
        model: 'enemy2',
        add: prompt,
        options: {
          type: 'enemy_portrait',
          style: 'fantasy_game_character',
          format: 'portrait'
        }
      };

      console.log('[Image Service] Enemy avatar request:', requestBody);

      const response = await this.makeRequest('/raw', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, token);

      console.log('[Image Service] Enemy avatar generation response:', response);

      if (response.message === 'success' && response.data.request_id) {
        return response.data.request_id;
      } else {
        throw new Error(response.message || 'Failed to generate enemy avatar');
      }
    } catch (error) {
      console.error('[Image Service] Enemy avatar generation error:', error);
      throw error;
    }
  }

  async makeRequest(endpoint, options = {}, token) {
    if (!token) {
      token = this.getToken();
      if (!token) {
        throw new Error('Image generation token not found. Please set it in Admin Terminal Settings.');
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }
}

// Create and export service instance
export const createImageService = (onStatusUpdate) => {
  return new ImageGenerationService(onStatusUpdate);
}; 