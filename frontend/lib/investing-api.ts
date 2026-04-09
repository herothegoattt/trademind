import * as mock from './mock';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.statusText}`);
  }
  return response.json();
}

export interface PortfolioMetrics {
  total_value: number;
  total_invested: number;
  total_return: number;
  return_percentage: number;
  yearly_return: number;
  diversification_score: number;
  currency: string;
}

export interface PerformanceData {
  month: string;
  value: number;
}

export interface Asset {
  name: string;
  value: number;
  percentage: number;
}

export interface MarketIndicator {
  name: string;
  value: string;
  change: number;
  status: string;
}

export interface NewsItem {
  id: string;
  title: string;
  impact: string;
  category: string;
  date: string;
  ai_insight: string;
}

export interface Opportunity {
  name: string;
  category: string;
  confidence: number;
  trend: string;
  timeframe: string;
  potential_return: string;
}

export interface RiskMetric {
  name: string;
  value: string;
  threshold: string;
  status: string;
}

export interface Correlation {
  asset1: string;
  asset2: string;
  correlation: number;
}

export interface InvestmentCoachResponse {
  success: boolean;
  response: string;
  timestamp: string;
}

/**
 * Portfolio Overview endpoints
 */
export const investingApi = {
  portfolio: {
    /**
     * Get portfolio overview metrics based on user's actual portfolio
     */
    getOverview: async (): Promise<PortfolioMetrics> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/investing/portfolio/overview`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        return await handleApiResponse(response);
      } catch (error) {
        console.warn('Failed to fetch portfolio overview, using fallback:', error);
        // Fallback: return demo data
        return {
          total_value: 487500,
          total_invested: 385000,
          total_return: 102500,
          return_percentage: 26.6,
          yearly_return: 18.2,
          diversification_score: 82,
          currency: 'USD',
        };
      }
    },

    /**
     * Get portfolio performance data for chart
     */
    getPerformance: async (months: number = 12): Promise<PerformanceData[]> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/investing/portfolio/performance?months=${months}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );
        return await handleApiResponse(response);
      } catch (error) {
        console.warn('Failed to fetch portfolio performance, using fallback:', error);
        // Generate demo performance data
        const performance = [];
        const baseValue = 420000;
        const months_list = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 0; i < Math.min(months, 12); i++) {
          performance.push({
            month: months_list[i],
            value: baseValue + i * 5000 + Math.random() * 5000,
          });
        }
        return performance;
      }
    },

    /**
     * Get asset allocation breakdown based on portfolio
     */
    getAllocation: async (): Promise<{ assets: Asset[] }> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/investing/portfolio/allocation`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        return await handleApiResponse(response);
      } catch (error) {
        console.warn('Failed to fetch asset allocation, using fallback:', error);
        return {
          assets: [
            { name: 'US Equities', value: 195000, percentage: 40 },
            { name: 'International', value: 117000, percentage: 24 },
            { name: 'Bonds', value: 97500, percentage: 20 },
            { name: 'Real Estate', value: 58500, percentage: 12 },
            { name: 'Alternatives', value: 19500, percentage: 4 },
          ],
        };
      }
    },

    /**
     * Rebalance portfolio
     */
    rebalance: async (): Promise<any> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/investing/portfolio/rebalance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        return await handleApiResponse(response);
      } catch (error) {
        console.error('Failed to rebalance portfolio:', error);
        throw error;
      }
    },
  },

  market: {
    /**
     * Get macroeconomic indicators (static/fixed data)
     */
    getIndicators: async (): Promise<{ indicators: MarketIndicator[] }> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/investing/market/indicators`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        return await handleApiResponse(response);
      } catch (error) {
        console.warn('Failed to fetch market indicators, using fallback:', error);
        return {
          indicators: [
            {
              name: 'Federal Funds Rate',
              value: '5.33%',
              change: 0,
              status: 'neutral',
            },
            { name: 'Inflation (YoY)', value: '3.2%', change: -0.4, status: 'positive' },
            { name: 'Unemployment Rate', value: '3.8%', change: 0.1, status: 'neutral' },
            { name: 'GDP Growth (YoY)', value: '2.4%', change: 0.3, status: 'positive' },
          ],
        };
      }
    },

    /**
     * Get market news and AI analysis (static/fixed data)
     */
    getNews: async (limit: number = 10): Promise<{ news: NewsItem[] }> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/investing/market/news?limit=${limit}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );
        return await handleApiResponse(response);
      } catch (error) {
        console.warn('Failed to fetch market news, using fallback:', error);
        return {
          news: [
            {
              id: '1',
              title: 'Tech Sector Leads Market Higher on AI Optimism',
              impact: 'high',
              category: 'Technology',
              date: '2 hours ago',
              ai_insight: 'AI-driven productivity gains could support tech valuations long-term.',
            },
            {
              id: '2',
              title: 'Fed Signals Pause on Rate Cuts Through Mid-2024',
              impact: 'high',
              category: 'Monetary Policy',
              date: '5 hours ago',
              ai_insight: 'Stable rates benefit bonds and dividend-paying stocks.',
            },
          ],
        };
      }
    },
  },

  opportunities: {
    /**
     * Get long-term investment opportunities based on portfolio
     */
    getList: async (): Promise<{ opportunities: Opportunity[] }> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/investing/opportunities`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        return await handleApiResponse(response);
      } catch (error) {
        console.warn('Failed to fetch opportunities, using fallback:', error);
        return {
          opportunities: [
            {
              name: 'Artificial Intelligence & Machine Learning',
              category: 'Technology',
              confidence: 95,
              trend: 'up',
              timeframe: '5+ years',
              potential_return: '12-18% annually',
            },
            {
              name: 'Renewable Energy & Clean Tech',
              category: 'Energy',
              confidence: 78,
              trend: 'up',
              timeframe: '10+ years',
              potential_return: '10-15% annually',
            },
          ],
        };
      }
    },
  },

  risk: {
    /**
     * Get portfolio risk assessment based on user's portfolio
     */
    getAssessment: async (): Promise<{ metrics: RiskMetric[] }> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/investing/risk/assessment`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        return await handleApiResponse(response);
      } catch (error) {
        console.warn('Failed to fetch risk assessment, using fallback:', error);
        return {
          metrics: [
            {
              name: 'Portfolio Volatility (Beta)',
              value: '0.92',
              threshold: '< 1.2',
              status: 'good',
            },
            {
              name: 'Maximum Drawdown',
              value: '-18.3%',
              threshold: '< -25%',
              status: 'good',
            },
          ],
        };
      }
    },

    /**
     * Get asset correlations based on portfolio
     */
    getCorrelations: async (): Promise<{ correlations: Correlation[] }> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/investing/risk/correlations`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        return await handleApiResponse(response);
      } catch (error) {
        console.warn('Failed to fetch correlations, using fallback:', error);
        return {
          correlations: [
            { asset1: 'Tech', asset2: 'Healthcare', correlation: 0.68 },
            { asset1: 'Tech', asset2: 'Bonds', correlation: -0.24 },
          ],
        };
      }
    },
  },

  coach: {
    /**
     * Chat with AI Investment Coach
     */
    chat: async (message: string): Promise<InvestmentCoachResponse> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/investment-coach/chat?message=${encodeURIComponent(message)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );
        return await handleApiResponse(response);
      } catch (error) {
        console.error('Failed to chat with coach:', error);
        throw error;
      }
    },
  },
};
