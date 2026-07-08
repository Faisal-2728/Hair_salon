import json
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:5000'


def req(method, path, data=None, headers=None):
    url = BASE + path
    hdrs = headers.copy() if headers else {}
    if data is not None and not isinstance(data, bytes):
        body = json.dumps(data).encode('utf-8')
        hdrs['Content-Type'] = 'application/json'
    else:
        body = data
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            b = resp.read().decode('utf-8')
            try:
                return resp.status, json.loads(b)
            except Exception:
                return resp.status, b
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body
    except Exception as e:
        return None, str(e)


if __name__ == '__main__':
    print('Login as admin...')
    status, body = req('POST', '/api/auth/login', {'identifier': 'admin', 'password': 'Admin123!'})
    print(status, body)
    if status != 200:
        raise SystemExit('Auth failed')
    access = body.get('access_token')
    refresh = body.get('refresh_token')
    headers = {'Authorization': f'Bearer {access}'}

    print('\nAdmin debug...')
    print(req('GET', '/api/admin/debug', headers=headers))

    print('\nCreate service...')
    svc = {'name': 'E2E Service', 'category': 'E2E', 'description': 'E2E test', 'price': 10, 'duration_minutes': 15, 'active': True}
    print(req('POST', '/api/services', svc, headers=headers))

    print('\nCreate inventory item...')
    item = {'name': 'E2E Item', 'sku': 'E2E-ITEM-1', 'description': 'E2E', 'quantity': 3, 'threshold': 1, 'supplier': 'E2E', 'cost': 2.5}
    print(req('POST', '/api/inventory', item, headers=headers))

    print('\nList appointments...')
    print(req('GET', '/api/admin/appointments', headers=headers))

    print('\nExport reports (appointments CSV)...')
    status, rpt = req('GET', '/api/admin/reports/export?type=appointments', headers=headers)
    print(status, isinstance(rpt, str))

    print('\nEnd-to-end smoke tests completed')
