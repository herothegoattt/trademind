from types import SimpleNamespace
from app.services.analysis import AnalysisService

d = SimpleNamespace(id=None, mode='trading', title='Test trade', description='Long EUR/USD', outcome='Stopped out', is_loss=True, trade_data=None, investment_data=None, business_data=None, personal_data=None)
insight = AnalysisService.analyze_decision(d)
print(insight)
