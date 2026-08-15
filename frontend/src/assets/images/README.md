# Salon Background Images

This folder contains background images used throughout the application.

## Images to Add

### 1. hero-salon.jpg
- **Size**: 1920x1080px (or larger for 4K)
- **Used in**: Landing.jsx (Hero section background)
- **Format**: JPG
- **Description**: Full-screen hero image of a luxurious salon interior with modern aesthetic

### 2. login-bg.jpg
- **Size**: 1920x1080px (or larger for 4K)
- **Used in**: Login.jsx (Background behind glassmorphism card)
- **Format**: JPG
- **Description**: Premium luxury background (salon, spa, or elegant interior)

### 3. register-bg.jpg
- **Size**: 1920x1080px (or larger for 4K)
- **Used in**: Register.jsx (Background behind glassmorphism card)
- **Format**: JPG
- **Description**: Elegant registration page background (complementary to login)

## Image Import Pattern

All images are imported at the top of their respective components:

```javascript
import heroImage from '../assets/images/hero-salon.jpg'
import loginBgImage from '../assets/images/login-bg.jpg'
import registerBgImage from '../assets/images/register-bg.jpg'
```

## Usage in CSS/JSX

Images are used as CSS background images or inline `<img>` tags:

```jsx
<div
  style={{
    backgroundImage: `url(${heroImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
```

## Important Notes

- All images should be optimized for web (compressed)
- Recommended image optimization tools: TinyPNG, ImageOptim
- For best performance, use WebP format alongside JPG with fallbacks
- Ensure images are responsive and work well on all devices
- Consider adding a dark overlay over images for better text readability

## Current Status

Currently using CSS gradients and Tailwind classes as fallbacks until images are added.
Replace the gradient backgrounds with actual images once they are available.
