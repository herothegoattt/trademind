from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)
r = c.post('/api/v1/analyze', json={'mode':'trading','title':'Test trade','description':'Long EUR/USD','is_loss':True,'outcome':'Stopped out'})
print('STATUS', r.status_code)
print('BODY', r.text)
