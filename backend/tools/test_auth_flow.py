import json
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:5000'


def post(path, data):
    url = BASE + path
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode('utf-8'))
        except Exception:
            return e.code, e.read().decode('utf-8')


if __name__ == '__main__':
    print('Registering test user...')
    status, body = post('/api/auth/register', {'email': 'testuser@example.com', 'password': 'Test1234!', 'full_name': 'Test User'})
    print(status, body)
    if status not in (200, 201):
        print('Register may have failed or user exists; proceeding to login')

    print('\nLogging in...')
    status, body = post('/api/auth/login', {'identifier': 'testuser@example.com', 'password': 'Test1234!'})
    print(status, body)
    if status != 200:
        print('Test user login failed; trying admin fallback')
        status, body = post('/api/auth/login', {'identifier': 'admin', 'password': 'Admin123!'})
        print(status, body)
        if status != 200:
            raise SystemExit('Login failed')
    access = body.get('access_token')
    refresh = body.get('refresh_token')
    print('Access length', len(access) if access else None, 'Refresh length', len(refresh) if refresh else None)

    print('\nRefreshing access token...')
    status, body = post('/api/auth/refresh', {})
    print(status, body)
    # refresh requires Authorization header with refresh token; use urllib to set header
    import urllib.request
    req = urllib.request.Request(BASE + '/api/auth/refresh', data=b'{}', headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {refresh}'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode('utf-8'))
            print('Refresh OK', body)
            new_access = body.get('access_token')
    except urllib.error.HTTPError as e:
        print('Refresh failed', e.code, e.read().decode('utf-8'))
        raise

    print('\nLogging out (revoke access token)...')
    req = urllib.request.Request(BASE + '/api/auth/logout', data=b'{}', headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {new_access}'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print('Logout', resp.status, resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print('Logout failed', e.code, e.read().decode('utf-8'))

    print('\nUsing revoked token to call /api/admin/debug (should be 401/403)...')
    req = urllib.request.Request(BASE + '/api/admin/debug', headers={'Authorization': f'Bearer {new_access}'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print('Unexpected success', resp.status, resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print('Expected failure', e.code, e.read().decode('utf-8'))
