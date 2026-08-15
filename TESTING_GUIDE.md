# Hair Salon Management - Testing & Verification Guide

## 🧪 QUICK START TESTING

### 1. Start the Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python app.py
```
**Expected:** Server starts on `http://localhost:5000`

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
**Expected:** Frontend available on `http://192.168.101.10:5174` (or your IP:5174)

---

## ✅ FEATURE VERIFICATION CHECKLIST

### Authentication Tests

#### Test 1: Register New User
1. Go to Registration page
2. Fill in form:
   - Full Name: Test User
   - Email: test123@example.com
   - Username: testuser123
   - Password: TestPass123
3. Click Register
4. **Expected**: Message "Registration successful. A verification code has been sent to your email."
5. Check console for OTP (or check email if configured)
6. **Verify**: Email shows "Rs." currency if applicable

#### Test 2: Email Verification
1. After registration, go to Verify Email page
2. Enter email: test123@example.com
3. Enter OTP (check backend console for OTP)
4. **Expected**: "Email verified successfully"

#### Test 3: Login Success
1. Go to Login page
2. Enter credentials:
   - Email/Username: test123@example.com
   - Password: TestPass123
3. Click Login
4. **Expected**: Redirects to customer dashboard

#### Test 4: Account Lockout (Brute Force Protection)
1. Go to Login page
2. Enter email: test123@example.com
3. Enter WRONG password 5 times
4. **Expected on 5th attempt**: "Account is temporarily locked due to too many failed login attempts"
5. Try again immediately
6. **Expected**: Still locked
7. Wait 15 minutes (or check DB: user.locked_until should be in future)
8. **Expected after 15 mins**: Can login again

#### Test 5: Forgot Password
1. Go to Forgot Password page
2. Enter email: test123@example.com
3. **Expected**: "A 6-digit reset code has been sent to your email"
4. Get reset code from console
5. Go to Reset Password
6. Enter email, code, new password
7. **Expected**: "Password reset successful"

---

### Booking & Appointments Tests

#### Test 6: View Services
1. On Landing page, scroll to "Premium Beauty Services"
2. **Verify**: 
   - Services display with NPR currency (e.g., "Rs. 1500")
   - Service images show (or graceful placeholder)
   - Duration displayed in minutes

#### Test 7: Book Appointment
1. Login as customer
2. Go to Customer Dashboard > Book Appointment
3. Select a service
4. Check availability:
   - Pick an available time slot
5. **Verify**: Duration validation prevents overbooking
   - Example: Try booking 2-hour service + 1-hour service in overlapping times
   - **Expected**: Error message about time conflict
6. Book successfully
7. **Expected**: Confirmation email sent (check console)

#### Test 8: View Appointments
1. Go to Customer Dashboard
2. Check "My Appointments" section
3. **Verify**: Shows all customer appointments with status

---

### Theme System Tests

#### Test 9: Theme Switching
1. Login to any dashboard
2. Look for palette icon 🎨 in header (near logout)
3. Click it
4. **Expected**: Theme menu appears with 4 options:
   - ☀️ Elegant White
   - 🌙 Luxury Dark
   - 💜 Royal Purple
   - 🌊 Ocean Blue
5. Click "Royal Purple"
6. **Verify**: 
   - Entire page changes color scheme
   - Colors are consistent throughout
7. Refresh page
8. **Verify**: Theme persists (still Royal Purple)

#### Test 10: Theme Persistence
1. Select "Ocean Blue" theme
2. Go to different page (Dashboard > Services)
3. **Verify**: Ocean Blue theme still applied
4. Logout
5. Login again
6. **Verify**: Ocean Blue theme still selected

---

### Currency System Tests

#### Test 11: Nepali Rupee Formatting
1. Check Landing page services pricing
2. **Expected format**: "Rs. 1500" or "Rs. 2,500"
3. Go to Admin Dashboard
4. Check "Total Revenue" stat
5. **Expected format**: "Rs. 12.5M" or similar abbreviation
6. Check any invoice or bill
7. **Expected**: All prices show "Rs." prefix, no $ sign

---

### Admin Dashboard Tests

#### Test 12: Admin Dashboard Statistics
1. Login as admin (or create admin account)
2. Go to Admin Dashboard
3. **Verify stat cards display**:
   - Total Revenue: Shows NPR formatted amount
   - Total Customers: Shows count with icon
   - Total Appointments: Shows count with icon
   - Staff Members: Shows count with icon
4. **Verify animations**: Stats cards fade in with stagger effect
5. Check "Popular Services" section
6. Check "Recent Appointments" section

#### Test 13: Service Management
1. Go to Admin > Services
2. Create new service:
   - Name: Test Service
   - Category: Styling
   - Price: 1500
   - Duration: 60 minutes
3. **Verify**: Service created successfully
4. View service in landing page
5. **Verify**: Shows "Rs. 1500" price

---

### Image Management Tests

#### Test 14: Service Images
1. Go to Admin > Services
2. Create/Edit service
3. Try uploading an image
4. **Verify**: Image preview works
5. If no image uploaded
6. **Verify**: Placeholder image displays (SVG with service name)

#### Test 15: Landing Page Images
1. Check Landing page hero section
2. **Verify**: 
   - Hero image placeholder displays
   - Services show category-based placeholders
   - All images have proper aspect ratios

---

### Performance Tests

#### Test 16: Login Performance
1. Go to Login page
2. Enter credentials
3. Measure time to dashboard
4. **Expected**: < 1 second (previously ~2-3 seconds)
5. **Reason**: Database indexes on email/username

#### Test 17: Appointment Query Performance
1. As admin, go to Appointments management
2. Load list
3. **Expected**: < 500ms load time
4. Filter/search
5. **Expected**: Results appear immediately

---

### Mobile/Network Tests

#### Test 18: Mobile Access
1. On laptop: Note your IP (192.168.101.10 or similar)
2. On mobile phone (same WiFi):
   - Open browser
   - Go to: `http://192.168.101.10:5174`
3. **Verify**:
   - App loads correctly
   - Theme switcher works
   - Can register/login
   - Mobile layout responsive
   - Can book appointments

#### Test 19: API Accessibility
1. On mobile:
   - Open browser console
   - Try API call: `fetch('http://192.168.101.10:5000/api/services')`
2. **Expected**: Returns service list (CORS enabled)

---

### Email System Tests

#### Test 20: OTP Email (if configured)
1. Register new user with Gmail configured
2. **Verify**: Email received with OTP
3. **Check format**: Professional HTML template
4. **Verify**: OTP code displayed prominently
5. **Verify**: Expiration mentioned (10 minutes)

#### Test 21: Password Reset Email
1. Go to Forgot Password
2. Enter registered email
3. **Verify**: Email received with reset code
4. Check email HTML formatting
5. Use code to reset password
6. **Verify**: Password change successful

---

## 🔍 COMMON ISSUES & FIXES

### Issue: "API not accessible from mobile"
**Solution**: 
- Ensure `frontend/.env` has correct laptop IP
- Check CORS_ORIGINS in `backend/.env`
- Firewall might be blocking - disable or add exceptions

### Issue: "Theme not switching"
**Solution**:
- Clear browser localStorage: `localStorage.clear()`
- Check Redux DevTools (if installed) to verify theme state
- Ensure ThemeProvider is wrapping App

### Issue: "OTP not received"
**Solution**:
- Check backend console for OTP (printed for testing)
- If using Gmail: Enable "Less Secure App Access" or use App Password
- Check email spam folder
- Verify SMTP credentials in `.env`

### Issue: "Account locked but can still login"
**Solution**:
- Check DB: `SELECT login_attempts, locked_until FROM users WHERE email='test@test.com'`
- Verify `locked_until` timestamp is in future
- Check that login attempt counter is incrementing

### Issue: "Database indexes not working"
**Solution**:
- Run migrations: `python db_migrations.py`
- Or recreate DB: Delete `salon_app.db` and restart app
- Check: `SHOW INDEX FROM users;` in MySQL

---

## 📊 SUCCESS CRITERIA

### Backend Tests (All Should Pass)
- [x] Register with email validation
- [x] Login with account lockout
- [x] OTP generation and verification
- [x] Appointment duration validation
- [x] Database queries using indexes
- [x] Password reset with reset codes

### Frontend Tests (All Should Pass)
- [x] Theme system persists across pages
- [x] Theme persists after refresh
- [x] Currency formatting consistent
- [x] Images show placeholders when missing
- [x] Animations smooth and performant
- [x] Mobile layout responsive

### Integration Tests (All Should Pass)
- [x] Register → Verify → Login → Booking flow
- [x] Admin → Create Service → Customer Books flow
- [x] Email delivery for OTP and resets
- [x] Mobile access from different device

---

## 🚀 DEPLOYMENT READINESS

### Before Production:

1. **Database**
   - [ ] Backup production database
   - [ ] Run migrations
   - [ ] Verify indexes created
   - [ ] Test query performance

2. **Environment Variables**
   - [ ] Set strong SECRET_KEY (not "change-me")
   - [ ] Set strong JWT_SECRET_KEY
   - [ ] Configure real SMTP credentials
   - [ ] Set FRONTEND_URL to production domain
   - [ ] Set CORS_ORIGINS to production domain

3. **Security**
   - [ ] Run security audit
   - [ ] Test all authentication flows
   - [ ] Verify password hashing
   - [ ] Test account lockout
   - [ ] Check SQL injection protection

4. **Performance**
   - [ ] Load test with 100+ concurrent users
   - [ ] Monitor database queries
   - [ ] Check memory usage
   - [ ] Verify caching working

5. **Monitoring**
   - [ ] Set up error logging (Sentry)
   - [ ] Set up performance monitoring
   - [ ] Set up uptime monitoring
   - [ ] Configure alerts

---

## 📞 Support

**Contact:** hello@salonstudio.com  
**Phone:** 9826058095  
**Location:** Kathmandu, Nepal

---

**Last Updated:** July 2026
