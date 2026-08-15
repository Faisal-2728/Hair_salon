import json
import urllib.request
import urllib.error
import urllib.parse

BASE_URL = 'http://127.0.0.1:5000'


def request(method, path, data=None, headers=None):
    url = BASE_URL + path
    hdrs = headers.copy() if headers else {}
    if data is not None and not isinstance(data, bytes):
        data = json.dumps(data).encode('utf-8')
        hdrs['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode('utf-8')
            print(f"{method} {path} -> {resp.status}")
            print(body)
            try:
                return resp.status, json.loads(body)
            except json.JSONDecodeError:
                return resp.status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"{method} {path} -> {e.code}")
        print(body)
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, body
    except Exception as e:
        print(f"{method} {path} ERROR: {e}")
        return None, str(e)


if __name__ == '__main__':
    print('Testing backend root...')
    request('GET', '/')
    print('\nTesting login...')
    status, login = request('POST', '/api/auth/login', {'identifier': 'admin', 'password': 'Admin123!'})
    token = None
    if status == 200 and isinstance(login, dict):
        token = login.get('access_token')
        print('TOKEN length', len(token) if token else 'None')
    else:
        print('Login failed; aborting admin tests.')
    if token:
        headers = {'Authorization': f'Bearer {token}'}
        print('\nTesting admin debug...')
        request('GET', '/api/admin/debug', headers=headers)
        print('\nTesting service create...')
        status, new_service = request('POST', '/api/services', {'name': 'Debug Service', 'category': 'Test', 'description': 'Auto debug', 'price': 49.99, 'duration_minutes': 30, 'active': True}, headers=headers)
        if status == 201 and isinstance(new_service, dict):
            service_id = new_service['service']['id']
            print(f'\nTesting service update for id {service_id}...')
            request('PUT', f'/api/services/{service_id}', {'name': 'Debug Service Updated', 'price': 59.99, 'duration_minutes': 40}, headers=headers)
        print('\nTesting inventory create...')
        status, new_item = request('POST', '/api/inventory', {'name': 'Debug Item', 'sku': 'DEBUG-001', 'description': 'Auto debug item', 'quantity': 5, 'threshold': 2, 'supplier': 'Debug Supplier', 'cost': 12.34}, headers=headers)
        if status == 201 and isinstance(new_item, dict):
            item_id = new_item['item']['id']
            print(f'\nTesting inventory update for id {item_id}...')
            request('PUT', f'/api/inventory/{item_id}', {'quantity': 10, 'cost': 14.99}, headers=headers)
