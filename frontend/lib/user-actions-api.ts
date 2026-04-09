// lib/user-actions-api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UserAction {
  id: number;
  user_id: number;
  action_type: string;
  resource_type?: string;
  resource_id?: number;
  description?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: string;
  error_message?: string;
  created_at: string;
}

interface UserActionStats {
  total_actions: number;
  actions_today: number;
  actions_this_week: number;
  recent_actions: UserAction[];
  action_breakdown: Record<string, number>;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export const userActionsAPI = {
  // Get user's action history
  async getActions(skip: number = 0, limit: number = 100, actionType?: string) {
    try {
      let url = `${API_BASE_URL}/api/v1/user/actions?skip=${skip}&limit=${limit}`;
      if (actionType) {
        url += `&action_type=${actionType}`;
      }

      const response = await fetch(url, {
        headers: await getAuthHeader(),
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to fetch actions");
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching actions:", error);
      return [];
    }
  },

  // Get user action statistics
  async getStats(): Promise<UserActionStats | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/user/actions/stats`, {
        headers: await getAuthHeader(),
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to fetch action stats");
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching action stats:", error);
      return null;
    }
  },

  // Get actions within a date range
  async getActionsByDateRange(startDate: string, endDate: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/user/actions/date-range?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: await getAuthHeader(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch actions by date");
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching actions by date:", error);
      return [];
    }
  },

  // Clear old actions
  async clearOldActions(days: number = 30) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/user/actions/clear`, {
        method: "POST",
        headers: await getAuthHeader(),
        body: JSON.stringify({ days }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to clear actions");
      }

      return await response.json();
    } catch (error) {
      console.error("Error clearing actions:", error);
      throw error;
    }
  },
};
