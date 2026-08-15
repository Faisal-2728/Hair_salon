import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

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
    print('=== Testing Customer Endpoints ===\n')
    
    # Login as customer
    print('1. Login as customer...')
    status, body = req('POST', '/api/auth/login', {'identifier': 'customer', 'password': 'Customer123!'})
    print(f'Status: {status}')
    if status != 200:
        print(f'Login failed: {body}')
        exit(1)
    
    access = body.get('access_token')
    headers = {'Authorization': f'Bearer {access}'}
    print(f'Login successful, token obtained.\n')

    # Get profile
    print('2. Get customer profile...')
    status, body = req('GET', '/api/customer/profile', headers=headers)
    print(f'Status: {status}')
    if status == 200:
        print(f'Profile: {body.get("full_name")} ({body.get("email")})\n')
    else:
        print(f'Error: {body}\n')

    # Book an appointment
    print('3. Book appointment...')
    future_time = (datetime.utcnow() + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0).isoformat()
    appt_data = {'service_id': 1, 'appointment_time': future_time}
    status, body = req('POST', '/api/customer/appointments/book', appt_data, headers=headers)
    print(f'Status: {status}')
    if status == 201:
        appt_id = body.get('appointment', {}).get('id')
        print(f'Booked appointment {appt_id}\n')
    else:
        print(f'Error: {body}\n')
        exit(1)

    # Reschedule appointment
    print('4. Reschedule appointment...')
    reschedule_time = (datetime.utcnow() + timedelta(days=2)).replace(hour=14, minute=0, second=0, microsecond=0).isoformat()
    reschedule_data = {'appointment_id': appt_id, 'appointment_time': reschedule_time}
    status, body = req('PUT', '/api/customer/appointments/reschedule', reschedule_data, headers=headers)
    print(f'Status: {status}')
    if status == 200:
        print(f'Rescheduled to {body.get("appointment", {}).get("appointment_time")}\n')
    else:
        print(f'Error: {body}\n')

    # Cancel appointment
    print('5. Cancel appointment...')
    cancel_data = {'appointment_id': appt_id}
    status, body = req('PUT', '/api/customer/appointments/cancel', cancel_data, headers=headers)
    print(f'Status: {status}')
    if status == 200:
        print(f'Cancelled: {body.get("message")}\n')
    else:
        print(f'Error: {body}\n')

    # Get appointment history
    print('6. Get appointment history...')
    status, body = req('GET', '/api/customer/appointments', headers=headers)
    print(f'Status: {status}')
    if status == 200:
        appts = body.get('appointments', [])
        print(f'Total appointments: {len(appts)}\n')
    else:
        print(f'Error: {body}\n')

    # Get loyalty points
    print('7. Get loyalty points...')
    status, body = req('GET', '/api/customer/loyalty', headers=headers)
    print(f'Status: {status}')
    if status == 200:
        print(f'Loyalty points: {body.get("loyalty_points")}\n')
    else:
        print(f'Error: {body}\n')

    print('=== All customer tests completed ===')
