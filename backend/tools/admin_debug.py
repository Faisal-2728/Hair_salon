import json
import urllib.request
import urllib.error

LOGIN_URL = 'http://localhost:5000/api/auth/login'
DEBUG_URL = 'http://localhost:5000/api/admin/debug'

payload = {"identifier": "admin", "password": "Admin123!"}
req = urllib.request.Request(LOGIN_URL, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as resp:
        login = json.load(resp)
        print('LOGIN_RESPONSE:')
        print(json.dumps(login, indent=2))
        token = login.get('access_token') or login.get('access_token')
        if not token:
            print('NO_TOKEN_IN_LOGIN')
        else:
            req2 = urllib.request.Request(DEBUG_URL, headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req2) as r2:
                debug = json.load(r2)
                print('DEBUG_RESPONSE:')
                print(json.dumps(debug, indent=2))
except urllib.error.HTTPError as e:
    try:
        body = e.read().decode('utf-8')
        print('HTTP_ERROR:', e.code)
        print(body)
    except Exception:
        print('HTTP_ERROR_NO_BODY', e)
except Exception as e:
    print('ERROR:', str(e))
