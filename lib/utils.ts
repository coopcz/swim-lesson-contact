import { parsePhoneNumber } from 'libphonenumber-js'

/**
 * Normalize phone number to E.164 format
 * @param phone - Phone number in any format
 * @param defaultCountry - Default country code (default: 'US')
 * @returns Normalized phone number or null if invalid
 */
export function normalizePhone(phone: string, defaultCountry: string = 'US'): string | null {
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry as any)
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format('E.164')
    }
    return null
  } catch {
    return null
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Replace template variables in a message
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, value || '')
  })
  return result
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

/**
 * Check if current time is within quiet hours
 */
export function isQuietHours(
  quietStart: string = '21:00',
  quietEnd: string = '07:00'
): boolean {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

  const [startHour, startMinute] = quietStart.split(':').map(Number)
  const [endHour, endMinute] = quietEnd.split(':').map(Number)
  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute

  // Handle overnight quiet hours (e.g., 9 PM to 7 AM)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime
  }
  return currentTime >= startTime && currentTime < endTime
}

/**
 * Count SMS segments (160 chars per segment)
 */
export function countSmsSegments(message: string): number {
  const length = message.length
  if (length === 0) return 0
  if (length <= 160) return 1
  return Math.ceil(length / 153) // 153 chars for multi-part messages
}

/**
 * Get weekday name from number (0 = Sunday)
 */
export function getWeekdayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[day] || ''
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

