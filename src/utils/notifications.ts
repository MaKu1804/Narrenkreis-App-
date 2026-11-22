import { useState, useEffect, useMemo, useCallback } from 'react';
import { ForumPost, Excursion, MeetingProtocol, SentEmail } from './clubLogic';
import { TabType } from '../components/Navbar';

export interface NotificationItem {
  id: string;
  type: 'forum' | 'calendar' | 'protokolle' | 'email';
  title: string;
  subtitle: string;
  timestamp: string;
  timeMs: number;
  tab: TabType;
  isUnread: boolean;
}

const READ_IDS_STORAGE_KEY = 'nk_viewed_notification_ids_v3';
const ALL_READ_TIMESTAMP_KEY = 'nk_notifications_all_read_time_v3';

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_IDS_STORAGE_KEY);
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch {}
  return new Set();
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function getAllReadTimestamp(): number {
  try {
    const raw = localStorage.getItem(ALL_READ_TIMESTAMP_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {}
  return 0;
}

function saveAllReadTimestamp(ts: number) {
  try {
    localStorage.setItem(ALL_READ_TIMESTAMP_KEY, String(ts));
  } catch {}
}

function parseTimestamp(val?: string): number {
  if (!val) return 0;
  // Handle German date format "DD.MM.YYYY"
  const germanMatch = val.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (germanMatch) {
    const day = parseInt(germanMatch[1], 10);
    const month = parseInt(germanMatch[2], 10) - 1;
    const year = parseInt(germanMatch[3], 10);
    return new Date(year, month, day).getTime();
  }
  const parsed = Date.parse(val);
  return isNaN(parsed) ? 0 : parsed;
}

export function useAppNotifications({
  forumPosts = [],
  excursions = [],
  protocols = [],
  userInboxEmails = [],
  activeTab
}: {
  forumPosts: ForumPost[];
  excursions: Excursion[];
  protocols: MeetingProtocol[];
  userInboxEmails: SentEmail[];
  activeTab: TabType;
}) {
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());
  const [allReadTimestamp, setAllReadTimestamp] = useState<number>(() => getAllReadTimestamp());

  // Generate complete list of notification items from all collections
  const rawItems = useMemo(() => {
    const items: Omit<NotificationItem, 'isUnread'>[] = [];

    // 1. Forum
    forumPosts.forEach(post => {
      items.push({
        id: `forum-${post.id}`,
        type: 'forum',
        title: `Forumsbeitrag: ${post.title}`,
        subtitle: `von ${post.authorName} (${post.category})`,
        timestamp: post.createdAt,
        timeMs: parseTimestamp(post.createdAt),
        tab: 'forum',
      });
    });

    // 2. Kalender (nur heutige und zukünftige Termine)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    excursions.forEach(exc => {
      if (exc.date && exc.date < todayStr) return; // Vergangene Termine nicht als neue Benachrichtigung anzeigen
      items.push({
        id: `calendar-${exc.id}`,
        type: 'calendar',
        title: `Termin: ${exc.title}`,
        subtitle: `${exc.date} um ${exc.time} Uhr · ${exc.locationName}`,
        timestamp: exc.date,
        timeMs: parseTimestamp(exc.date),
        tab: 'calendar',
      });
    });

    // 3. Protokolle
    protocols.forEach(proto => {
      items.push({
        id: `proto-${proto.id}`,
        type: 'protokolle',
        title: `Protokoll: ${proto.title}`,
        subtitle: `${proto.meetingType} · ${proto.date}`,
        timestamp: proto.uploadedAt || proto.date,
        timeMs: parseTimestamp(proto.uploadedAt || proto.date),
        tab: 'protokolle',
      });
    });

    // 4. Inbox E-Mails in Profil
    userInboxEmails.forEach(email => {
      items.push({
        id: `email-${email.id}`,
        type: 'email',
        title: `Rundmail: ${email.subject}`,
        subtitle: `von ${email.fromName}`,
        timestamp: email.sentAt,
        timeMs: parseTimestamp(email.sentAt),
        tab: 'profile',
      });
    });

    // Sort newest first
    items.sort((a, b) => b.timeMs - a.timeMs);
    return items;
  }, [forumPosts, excursions, protocols, userInboxEmails]);

  // Compute unread state for every item
  const { allItems, displayItems, unreadCounts } = useMemo(() => {
    const itemsWithReadState: NotificationItem[] = rawItems.map(item => {
      const isMarkedReadById = readIds.has(item.id);
      const isMarkedReadByTimestamp = allReadTimestamp > 0 && item.timeMs <= allReadTimestamp;
      const isUnread = !isMarkedReadById && !isMarkedReadByTimestamp;
      return {
        ...item,
        isUnread
      };
    });

    const forumCount = itemsWithReadState.filter(i => i.type === 'forum' && i.isUnread).length;
    const calendarCount = itemsWithReadState.filter(i => i.type === 'calendar' && i.isUnread).length;
    const protokolleCount = itemsWithReadState.filter(i => i.type === 'protokolle' && i.isUnread).length;
    const profileCount = itemsWithReadState.filter(i => i.type === 'email' && i.isUnread).length;

    const counts = {
      forum: forumCount,
      calendar: calendarCount,
      protokolle: protokolleCount,
      profile: profileCount,
      total: forumCount + calendarCount + protokolleCount + profileCount,
    };

    return {
      allItems: itemsWithReadState,
      displayItems: itemsWithReadState.slice(0, 15),
      unreadCounts: counts
    };
  }, [rawItems, readIds, allReadTimestamp]);

  // Mark all items across the entire app as read
  const markAllAsRead = useCallback(() => {
    const now = Date.now();
    setAllReadTimestamp(now);
    saveAllReadTimestamp(now);

    setReadIds(prev => {
      const next = new Set(prev);
      rawItems.forEach(item => next.add(item.id));
      saveReadIds(next);
      return next;
    });

    if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
      (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(() => {});
    }
  }, [rawItems]);

  // Mark all items of a specific tab as read
  const markTabAsRead = useCallback((tab: TabType) => {
    const targetItems = rawItems.filter(item => item.tab === tab);
    if (targetItems.length === 0) return;

    setReadIds(prev => {
      let changed = false;
      const next = new Set(prev);
      targetItems.forEach(item => {
        if (!next.has(item.id)) {
          next.add(item.id);
          changed = true;
        }
      });
      if (changed) {
        saveReadIds(next);
        return next;
      }
      return prev;
    });
  }, [rawItems]);

  // Mark a single notification item as read
  const markItemAsRead = useCallback((itemId: string) => {
    setReadIds(prev => {
      if (prev.has(itemId)) return prev;
      const next = new Set(prev);
      next.add(itemId);
      saveReadIds(next);
      return next;
    });
  }, []);

  // When user actively visits a tab, automatically mark ALL items of that tab as read
  useEffect(() => {
    markTabAsRead(activeTab);
  }, [activeTab, markTabAsRead]);

  // Sync PWA App Badge on mobile home screen
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      if ('setAppBadge' in navigator && unreadCounts.total > 0) {
        (navigator as unknown as { setAppBadge: (count: number) => Promise<void> })
          .setAppBadge(unreadCounts.total)
          .catch(() => {});
      } else if ('clearAppBadge' in navigator) {
        (navigator as unknown as { clearAppBadge: () => Promise<void> })
          .clearAppBadge()
          .catch(() => {});
      }
    }
  }, [unreadCounts.total]);

  return {
    unreadCounts,
    unreadItems: displayItems,
    allItems,
    markAllAsRead,
    markTabAsRead,
    markItemAsRead
  };
}
