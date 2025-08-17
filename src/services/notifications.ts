/**
 * services/notifications.ts
 * Minimal local notifications service using localStorage.
 * Provides read/write helpers and an unread counter. Broadcasts 'notifications:update' on changes.
 */

export interface NotificationItem {
  /** Unique id */
  id: string
  /** Title text */
  title: string
  /** Optional body/description */
  body?: string
  /** Creation time ISO */
  createdAt: string
  /** Read flag */
  read: boolean
}

const STORAGE_KEY = 'notifications'

/**
 * genId
 * Create a simple unique id.
 */
function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * readList
 * Load notifications from localStorage; seed if not present.
 */
function readList(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = seedInitial()
      return seeded
    }
    const arr = JSON.parse(raw) as NotificationItem[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/**
 * saveList
 * Persist list and broadcast an update event.
 */
function saveList(list: NotificationItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent('notifications:update'))
}

/**
 * seedInitial
 * Seed with a few unread notifications on first run to demonstrate badge.
 */
function seedInitial(): NotificationItem[] {
  const now = Date.now()
  const list: NotificationItem[] = [
    { id: genId(), title: 'Welcome!', body: 'Thanks for joining us.', createdAt: new Date(now - 3600_000).toISOString(), read: false },
    { id: genId(), title: 'Earnings update', body: 'Your daily earnings are in.', createdAt: new Date(now - 7200_000).toISOString(), read: false },
    { id: genId(), title: 'Security tip', body: 'Enable Google Authenticator for extra safety.', createdAt: new Date(now - 10800_000).toISOString(), read: false },
  ]
  saveList(list)
  return list
}

/**
 * getNotifications
 * Return all notifications (latest first).
 */
export function getNotifications(): NotificationItem[] {
  return readList()
}

/**
 * getUnreadCount
 * Count unread notifications.
 */
export function getUnreadCount(): number {
  return readList().filter((n) => !n.read).length
}

/**
 * markAllRead
 * Mark all notifications as read.
 */
export function markAllRead(): void {
  const list = readList().map((n) => ({ ...n, read: true }))
  saveList(list)
}

/**
 * addNotification
 * Append a new unread notification to the top.
 */
export function addNotification(input: { title: string; body?: string }): NotificationItem {
  const list = readList()
  const item: NotificationItem = {
    id: genId(),
    title: input.title,
    body: input.body,
    createdAt: new Date().toISOString(),
    read: false,
  }
  list.unshift(item)
  saveList(list)
  return item
}

/**
 * onNotificationsUpdate
 * Lightweight subscription helper.
 */
export function onNotificationsUpdate(handler: () => void): () => void {
  const fn = () => handler()
  window.addEventListener('notifications:update' as any, fn as any)
  return () => window.removeEventListener('notifications:update' as any, fn as any)
}
