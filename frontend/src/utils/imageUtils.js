// Image utility for managing service and content images
// Use data URIs for placeholders until real images are added

export const PLACEHOLDER_IMAGES = {
  hero: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 600%22%3E%3Crect fill=%22%236366f1%22 width=%221200%22 height=%22600%22/%3E%3Ctext x=%22600%22 y=%22300%22 font-size=%2248%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EPremium Salon Experience%3C/text%3E%3C/svg%3E',
  service1: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%23ec4899%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%22200%22 y=%22200%22 font-size=%2232%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EHair Styling%3C/text%3E%3C/svg%3E',
  service2: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%2310b981%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%22200%22 y=%22200%22 font-size=%2232%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EMakeup%3C/text%3E%3C/svg%3E',
  service3: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%23f59e0b%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%22200%22 y=%22200%22 font-size=%2232%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ESpa Treatment%3C/text%3E%3C/svg%3E',
  service4: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%228b5cf6%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%22200%22 y=%22200%22 font-size=%2232%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENail Care%3C/text%3E%3C/svg%3E',
  about: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 600 400%22%3E%3Crect fill=%226366f1%22 width=%22600%22 height=%22400%22/%3E%3Ctext x=%22300%22 y=%22200%22 font-size=%2240%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EAbout Our Salon%3C/text%3E%3C/svg%3E',
  team: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%238b5cf6%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%22200%22 y=%22200%22 font-size=%2232%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EExpert Team%3C/text%3E%3C/svg%3E',
  testimonial: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%2310b981%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%22200%22 y=%22200%22 font-size=%2232%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EClient Review%3C/text%3E%3C/svg%3E',
  loginBg: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad1%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%236366f1;stop-opacity:1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%23a855f7;stop-opacity:1%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=%22url(%23grad1)%22 width=%22800%22 height=%22600%22/%3E%3C/svg%3E',
}

const normalizeImagePath = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('data:')) return imagePath
  if (imagePath.startsWith('/')) return imagePath

  try {
    const parsed = new URL(imagePath)
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) {
      return parsed.pathname || '/'
    }
    return imagePath
  } catch {
    return imagePath
  }
}

export const getImageUrl = (imagePath, fallbackKey = 'service1') => {
  const normalizedUrl = normalizeImagePath(imagePath)

  if (normalizedUrl) {
    return normalizedUrl
  }

  return PLACEHOLDER_IMAGES[fallbackKey] || PLACEHOLDER_IMAGES.service1
}

export const isValidImageUrl = (url) => {
  try {
    if (!url) return false
    if (url.startsWith('data:')) return true
    if (url.startsWith('/')) return true
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url)
      return true
    }
    return false
  } catch {
    return false
  }
}

export const createServiceImageUrl = (service) => {
  if (service?.image_url && isValidImageUrl(service.image_url)) {
    return normalizeImagePath(service.image_url)
  }
  
  // Generate placeholder based on service category
  const categoryMap = {
    styling: PLACEHOLDER_IMAGES.service1,
    makeup: PLACEHOLDER_IMAGES.service2,
    spa: PLACEHOLDER_IMAGES.service3,
    nails: PLACEHOLDER_IMAGES.service4,
  }
  
  return categoryMap[service?.category?.toLowerCase()] || PLACEHOLDER_IMAGES.service1
}

export const downloadImage = async (url, filename) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('Failed to download image:', error)
  }
}
