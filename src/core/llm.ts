
import { Player } from '../types/index.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  enabled?: boolean;
  provider?: 'bailian' | 'openai' | 'xiaozhi';
  baseUrl?: string;
  apiKey: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxHistory?: number;
}

const BAILIAN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  updateConfig(config: LLMConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const provider = this.config.provider || 'bailian';
    
    if (provider === 'bailian') {
      return this.chatBailian(messages);
    } else if (provider === 'openai') {
      return this.chatOpenAI(messages);
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async chatBailian(messages: ChatMessage[]): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('API Key is missing');
    }

    const systemPrompt = this.config.systemPrompt || '你是桌面宠物小Q，性格活泼可爱。';
    
    // Limit history if maxHistory is set (and > 0)
    // We always keep system prompt (which is inserted later)
    // So we filter the input messages
    let processedMessages = messages;
    if (this.config.maxHistory && this.config.maxHistory > 0) {
        // Keep only the last N messages
        if (processedMessages.length > this.config.maxHistory) {
            processedMessages = processedMessages.slice(-this.config.maxHistory);
        }
    }

    // Ensure system prompt is the first message
    const finalMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...processedMessages.filter(m => m.role !== 'system')
    ];

    try {
      const response = await fetch(BAILIAN_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'qwen-turbo',
          input: {
            messages: finalMessages
          },
          parameters: {
            result_format: 'message',
            temperature: this.config.temperature !== undefined ? Number(this.config.temperature) : 0.7
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bailian API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.output && data.output.choices && data.output.choices.length > 0) {
        return data.output.choices[0].message.content;
      } else {
        throw new Error('Invalid response format from Bailian API');
      }

    } catch (error) {
      console.error('LLM Chat Error (Bailian):', error);
      throw error;
    }
  }

  private async chatOpenAI(messages: ChatMessage[]): Promise<string> {
    // For local providers (Ollama), API Key might be empty, which is fine.
    // If it's a real OpenAI-compatible cloud service, they need a key.
    
    const baseUrl = this.config.baseUrl || 'http://localhost:11434/v1'; // Default to Ollama
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
    
    const systemPrompt = this.config.systemPrompt || '你是桌面宠物小Q，性格活泼可爱。';
     
    // Limit history if maxHistory is set
    let processedMessages = messages;
    if (this.config.maxHistory && this.config.maxHistory > 0) {
        if (processedMessages.length > this.config.maxHistory) {
            processedMessages = processedMessages.slice(-this.config.maxHistory);
        }
    }

    // OpenAI format expects system prompt in messages
    const finalMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...processedMessages.filter(m => m.role !== 'system')
    ];

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey || 'sk-dummy'}`, // Some local servers need a dummy key
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'qwen2:0.5b', // Default to a common small model
          messages: finalMessages,
          stream: false,
          temperature: this.config.temperature !== undefined ? Number(this.config.temperature) : 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI/Local API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Invalid response format from OpenAI/Local API');
      }

    } catch (error) {
      console.error('LLM Chat Error (OpenAI/Local):', error);
      throw error;
    }
  }
}
