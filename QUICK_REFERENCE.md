# Hair Salon App - Quick Reference & FAQ

## ⚡ Quick Start

### 1. Recover Admin Account (MUST DO FIRST)
```bash
cd backend/scripts
python create_admin.py
```

### 2. Test Login
- URL: `http://localhost:5000/frontend` (or wherever frontend is hosted)
- Username: `admin`
- Password: `Admin123!`

### 3. Change Admin Password
- Login first
- Go to Profile → Change Password
- Or use API endpoint (see below)

### 4. Test Security Fix
- Login
- Open Browser DevTools (F12)
- Network tab → Clear
- Login → Check response
- Verify: NO `password_hash` field in response ✓

---

## 🔧 Useful Commands

### Admin Account Management

**Create Admin (Interactive)**
```bash
python backend/scripts/create_admin.py
```

**Create Admin (Silent - custom password)**
```bash
python backend/scripts/create_admin.py \
  --username admin \
  --email admin@salon.local \
  --password YourNewPassword123! \
  --name Administrator
```

**Print SQL Query Only**
```bash
python backend/scripts/create_admin.py --print-hash --password YourPassword123!
```

### Database Operations

**Check if Admin Exists**
```sql
SELECT * FROM users WHERE role='admin' AND username='admin';
```

**Reset Admin Password**
```bash
python backend/scripts/create_admin.py
# Then follow prompts to update password
```

**View All Users**
```sql
SELECT id, username, email, full_name, role, verified, is_active FROM users;
```

**Delete Test Users**
```sql
DELETE FROM users WHERE role='customer' AND email LIKE 'test%';
```

---

## 🧪 Testing Endpoints

### Authentication Tests

**1. Register New User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "full_name": "Test User"
  }'
```

**2. Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin",
    "password": "Admin123!"
  }'
```

**3. Get Current User**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**4. Change Password**
```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "Admin123!",
    "new_password": "NewPassword123!"
  }'
```

**5. Request Password Reset**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@salon.local"}'
# Token will be sent to email (if configured)
```

**6. Verify Email with OTP**
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

---

## 🔐 Security Checklist

### Before Deploying to Production

- [ ] Admin password changed from default
- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] Database backups configured
- [ ] Email service tested and working
- [ ] Security headers added (see SECURITY_AUDIT.md)
- [ ] CORS configured for your domain
- [ ] Rate limiting verified
- [ ] Logging configured
- [ ] Error tracking set up (Sentry, etc.)

### Daily/Weekly Monitoring

- [ ] Check error logs
- [ ] Monitor failed login attempts
- [ ] Verify backups are running
- [ ] Check database performance
- [ ] Review API response times
- [ ] Monitor server resources (CPU, RAM, disk)

---

## ❌ Common Issues & Solutions

### Issue: "Admin login fails"

**Solution:**
```bash
# Check if admin exists
mysql> SELECT * FROM users WHERE username='admin';

# If not found, create it
python backend/scripts/create_admin.py

# If password wrong, reset it
python backend/scripts/create_admin.py
# Follow prompts
```

### Issue: "Invalid credentials on login"

**Check:**
- [ ] Username/email correct (case-sensitive)
- [ ] Account verified (check `verified` column)
- [ ] Account active (check `is_active` column)
- [ ] Password correct

**Fix:**
```sql
-- Mark account as verified
UPDATE users SET verified=TRUE WHERE username='username_here';

-- Activate account
UPDATE users SET is_active=TRUE WHERE username='username_here';
```

### Issue: "Email verification OTP not working"

**Check:**
- [ ] Email service configured
- [ ] SMTP credentials correct
- [ ] OTP is 6 digits
- [ ] OTP not expired (15 min timeout)

**Test email sending:**
```python
from utils.email import send_email
send_email('test@example.com', 'Test', '<p>Test</p>', 'Test')
```

### Issue: "Password reset token in Network response"

**Should NOT happen** ✓ Already fixed!

Verify:
- [ ] Using updated auth.py
- [ ] Token sent via email instead
- [ ] No `reset_token` in API response

### Issue: "Passwords visible in Network tab"

**Should NOT happen** ✓ Already fixed!

Verify:
- [ ] Using updated auth.py
- [ ] No `password_hash` in responses
- [ ] Using `user.to_dict()` method

---

## 📚 Documentation Map

| Document | Purpose | Read If... |
|----------|---------|-----------|
| **FIXES_SUMMARY.md** | Overview of all fixes | You want quick summary |
| **SECURITY_AUDIT.md** | Detailed security info | You need security details |
| **DEPLOYMENT_GUIDE.md** | How to deploy | You're deploying to prod |
| **PROJECT_REVIEW.md** | Full project analysis | You want to improve code |
| **README.md** | Project setup | You're first time here |

---

## 🔄 API Response Format Reference

### Successful Response (Login)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@salon.local",
    "full_name": "Administrator",
    "role": "admin",
    "verified": true,
    "is_active": true,
    "phone": null,
    "profile_picture_url": null,
    "loyalty_points": 0,
    "created_at": "2024-01-15T10:30:00"
  }
}
```

### Error Response
```json
{
  "error": "Invalid username or email"
}
```

### List Response (with pagination)
```json
{
  "customers": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "customer",
      "verified": true,
      "is_active": true
    }
  ]
}
```

---

## 👥 Default Test Accounts

### Admin (Created by Script)
- Username: `admin`
- Email: `admin@salon.local`
- Password: `Admin123!`
- Role: admin

### Staff (From Seed)
- Username: `staff`
- Email: `staff@salon.local`
- Password: `Staff123!`
- Role: staff

### Customer (From Seed)
- Username: `customer`
- Email: `customer@salon.local`
- Password: `Customer123!`
- Role: customer

---

## 🚨 Emergency Procedures

### Emergency: Need to Recover Access

**If you forgot admin password:**
```bash
# Create new admin account
python backend/scripts/create_admin.py --username admin_backup

# Login with new account
# Then delete old one or change its password
```

**If database is corrupted:**
```bash
# Restore from backup
mysql salon_app < backup.sql

# Then create admin account
python backend/scripts/create_admin.py
```

**If authentication is broken:**
```bash
# Check database structure
mysql> SHOW COLUMNS FROM users;

# Ensure all required columns exist
# Run migration if needed
python backend/app.py  # Will run auto-migration
```

---

## 📞 Support Resources

### Getting Help
1. Check **FIXES_SUMMARY.md** for overview
2. Check **SECURITY_AUDIT.md** for security details
3. Check **DEPLOYMENT_GUIDE.md** for deployment
4. Check **PROJECT_REVIEW.md** for improvements
5. Check this file for quick answers

### Reporting Issues
Include:
- [ ] Error message (exact text)
- [ ] Steps to reproduce
- [ ] What you expected to happen
- [ ] Database error logs (if applicable)
- [ ] Browser console errors (if applicable)

---

## ✅ Verification Checklist

**After applying fixes, verify:**

- [ ] Admin account created successfully
- [ ] Can login with admin credentials
- [ ] No password_hash in Network responses
- [ ] No reset_token in forgot-password response
- [ ] Email validation working
- [ ] Password validation working
- [ ] OTP verification working
- [ ] Protected endpoints require JWT
- [ ] Role-based access working
- [ ] Error messages are safe

---

## 🎓 Learning Resources

### Security:
- OWASP Top 10: https://owasp.org/Top10/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- Password Hashing: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

### Flask:
- Flask Security: https://flask.palletsprojects.com/security/
- SQLAlchemy: https://www.sqlalchemy.org/
- JWT-Extended: https://flask-jwt-extended.readthedocs.io/

### Database:
- MySQL Best Practices: https://dev.mysql.com/doc/
- Indexes: https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html
- Transactions: https://dev.mysql.com/doc/refman/8.0/en/commit.html

---

## 📋 Quick Password Requirements

- **Minimum 8 characters**
- **Maximum 255 characters**
- Recommended: Mix of uppercase, lowercase, numbers, special chars
- Cannot reuse current password (when changing)

---

## 🔗 Endpoint Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login user |
| POST | /api/auth/verify-otp | No | Verify email with OTP |
| POST | /api/auth/resend-otp | No | Resend OTP |
| POST | /api/auth/forgot-password | No | Request password reset |
| POST | /api/auth/reset-password | No | Reset password with token |
| POST | /api/auth/change-password | Yes | Change own password |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/auth/refresh | Yes | Refresh access token |
| POST | /api/auth/logout | Yes | Logout user |

---

## 🎯 Next Steps

1. **Immediate** (Do now):
   - Run `python backend/scripts/create_admin.py`
   - Test login in browser
   - Verify no password exposure

2. **Before Production** (Do soon):
   - Review DEPLOYMENT_GUIDE.md
   - Complete production checklist
   - Set up environment variables
   - Enable HTTPS

3. **Continuous** (Ongoing):
   - Monitor logs
   - Check security alerts
   - Update dependencies
   - Review PROJECT_REVIEW.md recommendations

---

**Questions?** See the documentation files or check the FAQ above.

**Ready to deploy?** Follow DEPLOYMENT_GUIDE.md

**Good luck! 🚀**
