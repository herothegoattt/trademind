/**
 * API client for trade journal endpoints
 */

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1`;

export interface Trade {
  id?: string;
  symbol: string;
  type: 'long' | 'short';
  entry: number;
  exit?: number;
  account_size?: number;
  duration: string;
  notes: string;
  pnl?: number;
  pnl_percent?: number;
  created_at?: string;
  updated_at?: string;
}

export const tradeAPI = {
  /**
   * List all trades for current user
   */
  async listTrades(skip: number = 0, limit: number = 100): Promise<Trade[]> {
    try {
      const response = await fetch(`${API_BASE}/journals/trades?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include auth cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, return empty array
          return [];
        }
        throw new Error(`Failed to fetch trades: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trades:', error);
      return [];
    }
  },

  /**
   * Get a single trade by ID
   */
  async getTrade(tradeId: string): Promise<Trade | null> {
    try {
      const response = await fetch(`${API_BASE}/journals/trades/${tradeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trade: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trade:', error);
      return null;
    }
  },

  /**
   * Create a new trade
   */
  async createTrade(trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>): Promise<Trade | null> {
    try {
      const response = await fetch(`${API_BASE}/journals/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(trade),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create trade: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating trade:', error);
      return null;
    }
  },

  /**
   * Update an existing trade
   */
  async updateTrade(tradeId: string, updates: Partial<Trade>): Promise<Trade | null> {
    try {
      const response = await fetch(`${API_BASE}/journals/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update trade: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating trade:', error);
      return null;
    }
  },

  /**
   * Delete a trade
   */
  async deleteTrade(tradeId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/journals/trades/${tradeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete trade: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting trade:', error);
      return false;
    }
  },
};
