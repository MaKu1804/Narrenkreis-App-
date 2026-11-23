import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppNotifications } from './utils/notifications';
import { 
  INITIAL_CLUBS, 
  INITIAL_USERS, 
  INITIAL_FORUM_POSTS, 
  INITIAL_EXCURSIONS,
  INITIAL_SENT_EMAILS,
  INITIAL_PROTOCOLS
} from './data/mockData';
import { 
  Club, 
  UserProfile, 
  ForumPost, 
  Excursion,
  SentEmail,
  MeetingProtocol,
  PraesidiumRole,
  VereinigungRole,
  VereinigungEntry,
  VereinigungSettings,
  VEREINIGUNG_LOGO_URL,
  isPraesidiumMember,
  canManageVereinigungNews,
  clearMailboxForUser,
  deleteSingleEmail
} from './utils/clubLogic';
import { Navbar, TabType } from './components/Navbar';
import { ForumView } from './components/ForumView';
import { CalendarView } from './components/CalendarView';
import { ClubDirectory } from './components/ClubDirectory';
import { ProtocolsView } from './components/ProtocolsView';
import { ProfileView, ProfileSubTab } from './components/ProfileView';
import { PraesidiumView, PraesidiumTab } from './components/PraesidiumView';
import { VereinigungBadenPfalzSection, VereinigungSubTab } from './components/VereinigungBadenPfalzSection';
import { AuthModal } from './components/AuthModal';
import { LegalModal } from './components/LegalModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LogIn, Share2, Check, Smartphone, Sun, Moon } from 'lucide-react';
import { testConnection } from './utils/firebase';
import { 
  initializeFirestoreData, 
  subscribeToUsers, 
  subscribeToClubs, 
  subscribeToProtocols, 
  subscribeToForum, 
  subscribeToExcursions, 
  subscribeToSentEmails,
  subscribeToVereinigungEntries,
  subscribeToVereinigungSettings,
  dbSaveUser,
  dbDeleteUser,
  dbSaveClub,
  dbDeleteClub,
  dbSaveProtocol,
  dbDeleteProtocol,
  dbSaveForumPost,
  dbDeleteForumPost,
  dbSaveExcursion,
  dbDeleteExcursion,
  dbSaveSentEmail,
  dbDeleteSentEmail,
  dbSaveVereinigungEntry,
  dbDeleteVereinigungEntry,
  dbSaveVereinigungSettings,
  syncAllFromFirestore
} from './utils/firebaseService';

const STORAGE_KEY_PREFIX = 'narrenkreis_bruchsal_v3_clean_';

export default function App() {
  // LocalStorage state with Narrenkreis Bruchsal defaults (11 offizielle Mitgliedsvereine)
  const [clubs, setClubs] = useState<Club[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}clubs`);
      if (!saved) return INITIAL_CLUBS;
      const parsed: Club[] = JSON.parse(saved);
      // Ensure the 11 authentic clubs from the register are present
      const hasAllClubs = parsed.some(c => c.name.includes('Drehfüchs')) && 
                          parsed.some(c => c.name.includes('Hambrücker')) && 
                          parsed.some(c => c.name.includes('Schmagges'));
      if (!hasAllClubs) {
        return INITIAL_CLUBS;
      }
      return parsed.map(c => {
        const init = INITIAL_CLUBS.find(i => i.id === c.id);
        return {
          ...c,
          website: c.website || init?.website
        };
      });
    } catch {
      return INITIAL_CLUBS;
    }
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
      if (!saved) return INITIAL_USERS;
      const parsed: UserProfile[] = JSON.parse(saved);
      // Ensure Martin Kuntzsch has isPraesident and isZugmarschall set to true as in Screenshot 151811
      const updated = parsed.map(u => {
        if (u.name.toLowerCase().includes('kuntzsch') || u.email.includes('faschingsgemeinschaft-gs')) {
          return {
            ...u,
            isPraesident: u.isPraesident ?? true,
            isZugmarschall: u.isZugmarschall ?? true
          };
        }
        return u;
      });
      return updated;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}currentUserId`);
      return saved || 'user-martin';
    } catch {
      return 'user-martin';
    }
  });

  const [forumPosts, setForumPosts] = useState<ForumPost[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}forumPosts`);
      if (!saved) return INITIAL_FORUM_POSTS;
      const parsed = JSON.parse(saved);
      return parsed.map((p: any) => ({
        ...p,
        category: p.category === 'Vereins-News' ? 'Narrenkreis-News' : p.category
      }));
    } catch {
      return INITIAL_FORUM_POSTS;
    }
  });

  const [excursions, setExcursions] = useState<Excursion[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}excursions`);
      return saved ? JSON.parse(saved) : INITIAL_EXCURSIONS;
    } catch {
      return INITIAL_EXCURSIONS;
    }
  });

  const [sentEmails, setSentEmails] = useState<SentEmail[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sentEmails`);
      return saved ? JSON.parse(saved) : INITIAL_SENT_EMAILS;
    } catch {
      return INITIAL_SENT_EMAILS;
    }
  });

  const [protocols, setProtocols] = useState<MeetingProtocol[]>(() => {
    try {
      const isInit = localStorage.getItem(`${STORAGE_KEY_PREFIX}protocols_initialized`);
      const deletedLocal: string[] = JSON.parse(localStorage.getItem('narrenkreis_bruchsal_v3_clean_deleted_protocols') || '[]');
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}protocols`);
      if (saved) {
        const list: MeetingProtocol[] = JSON.parse(saved);
        return list.filter(p => !deletedLocal.includes(p.id));
      }
      if (isInit) {
        return [];
      }
      return INITIAL_PROTOCOLS.filter(p => !deletedLocal.includes(p.id));
    } catch {
      return [];
    }
  });

  const [vereinigungEntries, setVereinigungEntries] = useState<VereinigungEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}vereinigungEntries`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [vereinigungSettings, setVereinigungSettings] = useState<VereinigungSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}vereinigungSettings`);
      return saved ? JSON.parse(saved) : { id: 'vereinigung_config', notificationEmails: [] };
    } catch {
      return { id: 'vereinigung_config', notificationEmails: [] };
    }
  });

  // Authentication Gate State - Login as Landing Screen with Auto-Remember
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}isLoggedIn`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Tabs in order: FORUM, Kalender, Vereine, Protokolle, Vereinigung, Profil, Präsidium
  const [activeTab, setActiveTab] = useState<TabType>('forum');
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('profile');
  const [praesidiumSubTab, setPraesidiumSubTab] = useState<PraesidiumTab>('vereine');
  const [vereinigungSubTab, setVereinigungSubTab] = useState<VereinigungSubTab>('news');
  const [isVereinigungCreateOpen, setIsVereinigungCreateOpen] = useState(false);
  const [messengerTargetUserId, setMessengerTargetUserId] = useState<string | null>(null);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [createEventInitialDate, setCreateEventInitialDate] = useState<string | undefined>(undefined);

  // Auth and Legal portal modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'impressum' | 'datenschutz'>('impressum');

  // Dark Mode Theme (persisted in localStorage, sets .dark on document.documentElement)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('narrenkreis_theme_dark');
      if (saved !== null) return saved === 'true';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('narrenkreis_theme_dark', String(isDarkMode));
    } catch {}
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleOpenMessengerForUser = (userId: string) => {
    setMessengerTargetUserId(userId);
    setProfileSubTab('messenger');
    setActiveTab('profile');
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const [isPwaBannerDismissed, setIsPwaBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('narrenkreis_pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissPwaBanner = () => {
    setIsPwaBannerDismissed(true);
    try {
      localStorage.setItem('narrenkreis_pwa_banner_dismissed', 'true');
    } catch {}
  };

  const handleShareApp = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Narrenkreis Bruchsal App',
          text: 'Offizielles Portal des Narrenkreis Bruchsal für alle Mitgliedsvereine (Tipp: Im normalen Browser Safari oder Chrome öffnen):\n',
          url
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleOpenLegal = (tab: 'impressum' | 'datenschutz') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}isLoggedIn`, 'false');
  };

  const handleUpdateClubLogo = (clubId: string, newLogo: string) => {
    setClubs(prev => {
      const next = prev.map(c => c.id === clubId ? { ...c, logo: newLogo } : c);
      const target = next.find(c => c.id === clubId);
      if (target) dbSaveClub(target);
      return next;
    });
  };

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}isLoggedIn`, String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}clubs`, JSON.stringify(clubs));
  }, [clubs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}currentUserId`, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}forumPosts`, JSON.stringify(forumPosts));
  }, [forumPosts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}excursions`, JSON.stringify(excursions));
  }, [excursions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}sentEmails`, JSON.stringify(sentEmails));
  }, [sentEmails]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}protocols`, JSON.stringify(protocols));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}protocols_initialized`, 'true');
  }, [protocols]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}vereinigungEntries`, JSON.stringify(vereinigungEntries));
  }, [vereinigungEntries]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}vereinigungSettings`, JSON.stringify(vereinigungSettings));
  }, [vereinigungSettings]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const fresh = await syncAllFromFirestore();
      if (fresh.users.length > 0) {
        setUsers(fresh.users);
      }
      if (fresh.clubs.length > 0) {
        const enriched = fresh.clubs.map(c => {
          const init = INITIAL_CLUBS.find(i => i.id === c.id || i.name.toLowerCase() === c.name.toLowerCase() || (i.shortName && i.shortName.toLowerCase() === c.shortName?.toLowerCase()));
          return {
            ...c,
            website: c.website || init?.website
          };
        });
        setClubs(enriched);
      }
      if (fresh.protocols.length > 0) {
        setProtocols(fresh.protocols);
      }
      if (fresh.forumPosts.length > 0) {
        setForumPosts(fresh.forumPosts);
      }
      if (fresh.excursions.length > 0) {
        setExcursions(fresh.excursions);
      }
      if (fresh.sentEmails.length > 0) {
        setSentEmails(fresh.sentEmails);
      }
      setVereinigungEntries(fresh.vereinigungEntries);
      setVereinigungSettings(fresh.vereinigungSettings);
      console.log(`[Cloud Sync] Erfolgreich synchronisiert: ${fresh.users.length} Benutzer, ${fresh.clubs.length} Vereine.`);
    } catch (err) {
      console.error('[Cloud Sync Fehler]:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Firestore Cloud Database Realtime Sync & Initialization
  useEffect(() => {
    testConnection();
    initializeFirestoreData();

    const unsubUsers = subscribeToUsers((freshUsers) => {
      if (freshUsers.length > 0) {
        setUsers(freshUsers);
      }
    });
    const unsubClubs = subscribeToClubs((freshClubs) => {
      if (freshClubs.length > 0) {
        const enriched = freshClubs.map(c => {
          const init = INITIAL_CLUBS.find(i => i.id === c.id || i.name.toLowerCase() === c.name.toLowerCase() || (i.shortName && i.shortName.toLowerCase() === c.shortName?.toLowerCase()));
          return {
            ...c,
            website: c.website || init?.website
          };
        });
        setClubs(enriched);
      }
    });
    const unsubProtocols = subscribeToProtocols((freshProtocols) => {
      setProtocols(freshProtocols);
    });
    const unsubForum = subscribeToForum((freshPosts) => {
      setForumPosts(freshPosts);
    });
    const unsubExcursions = subscribeToExcursions((freshExcursions) => {
      setExcursions(freshExcursions);
    });
    const unsubEmails = subscribeToSentEmails((freshEmails) => {
      setSentEmails(freshEmails);
    });
    const unsubVereinigung = subscribeToVereinigungEntries((freshEntries) => {
      setVereinigungEntries(freshEntries);
    });
    const unsubVereinigungSettings = subscribeToVereinigungSettings((freshSettings) => {
      setVereinigungSettings(freshSettings);
    });

    return () => {
      unsubUsers();
      unsubClubs();
      unsubProtocols();
      unsubForum();
      unsubExcursions();
      unsubEmails();
      unsubVereinigung();
      unsubVereinigungSettings();
    };
  }, [handleManualSync]);

  // Einmalige Bereinigung: Entfernt veraltete Beispieldaten aus dem Browser-Speicher
  useEffect(() => {
    try {
      localStorage.removeItem('narrenkreis_bruchsal_forumPosts');
      localStorage.removeItem('narrenkreis_bruchsal_excursions');
      localStorage.removeItem('narrenkreis_bruchsal_sentEmails');
      localStorage.removeItem('narrenkreis_bruchsal_v2_forumPosts');
      localStorage.removeItem('narrenkreis_bruchsal_v2_excursions');
      localStorage.removeItem('narrenkreis_bruchsal_v2_sentEmails');
    } catch {
      // Ignore
    }

    if (['user-markus', 'user-susanne', 'user-claudia'].includes(currentUserId)) {
      setCurrentUserId('user-martin');
    }
  }, []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || INITIAL_USERS[0];
  const currentClub = clubs.find(c => c.id === currentUser.clubId);
  const isPraesidium = isPraesidiumMember(currentUser);

  // Profile-specific inbox emails for notifications
  const userInboxEmails = useMemo(() => {
    return sentEmails.filter(m => {
      const isSender = m.senderUserId === currentUser.id || (!m.senderUserId && m.fromEmail === currentUser.email);
      if (isSender) return false;
      if (m.recipientEmails && m.recipientEmails.includes(currentUser.email)) return true;
      if (m.recipientType === 'club' && m.targetId === currentUser.clubId) return true;
      if (m.recipientType === 'all') return true;
      if (m.recipientType === 'verteiler_praesident' && currentUser.isPraesident) return true;
      if (m.recipientType === 'verteiler_zugmarschall' && currentUser.isZugmarschall) return true;
      return false;
    });
  }, [sentEmails, currentUser]);

  const { unreadCounts, unreadItems, markAllAsRead } = useAppNotifications({
    forumPosts,
    excursions,
    protocols,
    userInboxEmails,
    activeTab,
  });

  // Automatically kick non-praesidium members out of the praesidium tab
  useEffect(() => {
    if (activeTab === 'praesidium' && !isPraesidium) {
      setActiveTab('forum');
    }
  }, [activeTab, isPraesidium]);

  const handleTabChange = (tab: TabType) => {
    if (tab === 'praesidium' && !isPraesidium) {
      setActiveTab('forum');
      return;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddClub = (newClub: Club) => {
    setClubs(prev => [...prev, newClub]);
    dbSaveClub(newClub);
  };

  const handleEditClub = (clubId: string, updated: Partial<Club>) => {
    setClubs(prev => {
      const next = prev.map(c => c.id === clubId ? { ...c, ...updated } : c);
      const target = next.find(c => c.id === clubId);
      if (target) dbSaveClub(target);
      return next;
    });
  };

  const handleDeleteClub = (clubId: string) => {
    setClubs(prev => prev.filter(c => c.id !== clubId));
    dbDeleteClub(clubId);
    // If current user belonged to deleted club, reassign to remaining first club
    const remainingClubId = clubs.find(c => c.id !== clubId)?.id || '';
    setUsers(prev => {
      const next = prev.map(u => u.clubId === clubId ? { ...u, clubId: remainingClubId } : u);
      next.filter(u => u.clubId === remainingClubId).forEach(u => dbSaveUser(u));
      return next;
    });
  };

  // User management
  const handleUpdateUser = (updated: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    dbSaveUser(updated);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    dbDeleteUser(userId);
    if (currentUserId === userId) {
      const remaining = users.filter(u => u.id !== userId);
      if (remaining[0]) {
        setCurrentUserId(remaining[0].id);
      }
    }
  };

  const handleSwitchUser = (userId: string) => {
    setCurrentUserId(userId);
  };

  const handleCreateUser = (newUser: UserProfile) => {
    setUsers(prev => [...prev, newUser]);
    dbSaveUser(newUser);
  };

  const handleUpdateUserRole = (userId: string, newRole: PraesidiumRole | null) => {
    setUsers(prev => {
      const next = prev.map(u => u.id === userId ? { ...u, praesidiumRole: newRole } : u);
      const target = next.find(u => u.id === userId);
      if (target) dbSaveUser(target);
      return next;
    });
  };

  const handleUpdateUserVereinigungRole = (userId: string, newRole: VereinigungRole | null) => {
    if (!isPraesidium) return;
    setUsers(prev => {
      const next = prev.map(u => u.id === userId ? { ...u, vereinigungRole: newRole } : u);
      const target = next.find(u => u.id === userId);
      if (target) dbSaveUser(target);
      return next;
    });
  };

  const handleSaveVereinigungSettings = (settings: VereinigungSettings) => {
    if (!isPraesidium) return;
    setVereinigungSettings(settings);
    dbSaveVereinigungSettings(settings);
  };

  // Messenger & Mailbox handlers
  const handleSendEmail = (email: SentEmail) => {
    setSentEmails(prev => [email, ...prev]);
    dbSaveSentEmail(email);
  };

  const handleClearMailbox = (folder: 'sent' | 'inbox' | 'all') => {
    const remaining = clearMailboxForUser(currentUser.id, currentUser.email, sentEmails, folder);
    const deletedIds = sentEmails.filter(m => !remaining.some(r => r.id === m.id)).map(m => m.id);
    setSentEmails(remaining);
    deletedIds.forEach(id => dbDeleteSentEmail(id));
  };

  const handleDeleteEmail = (emailId: string) => {
    setSentEmails(prev => deleteSingleEmail(emailId, prev));
    dbDeleteSentEmail(emailId);
  };

  // Forum handlers
  const handleAddPost = (newPost: ForumPost) => {
    setForumPosts(prev => [newPost, ...prev]);
    dbSaveForumPost(newPost);
  };

  const handleEditPost = (postId: string, updated: { title: string; content: string; category: ForumPost['category'] }) => {
    setForumPosts(prev => {
      const next = prev.map(p => p.id === postId ? { ...p, ...updated } : p);
      const target = next.find(p => p.id === postId);
      if (target) dbSaveForumPost(target);
      return next;
    });
  };

  const handleDeletePost = (postId: string) => {
    setForumPosts(prev => prev.filter(p => p.id !== postId));
    dbDeleteForumPost(postId);
  };

  // Auth handlers
  const handleLogin = (user: UserProfile) => {
    setCurrentUserId(user.id);
    setIsLoggedIn(true);
  };

  const handleRegister = (newUser: UserProfile) => {
    setUsers(prev => {
      const exists = prev.some(u => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase());
      if (exists) {
        return prev.map(u => (u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase()) ? newUser : u);
      }
      return [newUser, ...prev];
    });
    setCurrentUserId(newUser.id);
    setIsLoggedIn(true);
    dbSaveUser(newUser);
  };

  const handleRatePost = (postId: string, score: number) => {
    setForumPosts(prev => {
      const next = prev.map(post => {
        if (post.id !== postId) return post;
        const existing = post.ratings.findIndex(r => r.userId === currentUser.id);
        let updatedRatings = [...post.ratings];
        if (existing >= 0) {
          updatedRatings[existing] = { userId: currentUser.id, score };
        } else {
          updatedRatings.push({ userId: currentUser.id, score });
        }
        return { ...post, ratings: updatedRatings };
      });
      const target = next.find(p => p.id === postId);
      if (target) dbSaveForumPost(target);
      return next;
    });
  };

  const handleUpvotePost = (postId: string) => {
    setForumPosts(prev => {
      const next = prev.map(post => {
        if (post.id !== postId) return post;
        const hasUpvoted = post.upvotes.includes(currentUser.id);
        return {
          ...post,
          upvotes: hasUpvoted 
            ? post.upvotes.filter(id => id !== currentUser.id)
            : [...post.upvotes, currentUser.id]
        };
      });
      const target = next.find(p => p.id === postId);
      if (target) dbSaveForumPost(target);
      return next;
    });
  };

  const handleVotePoll = (postId: string, optionId: string) => {
    setForumPosts(prev => {
      const next = prev.map(post => {
        if (post.id !== postId || !post.poll) return post;

        // Check if multiple choice is active or indicated in title/content
        const isMultiple = Boolean(
          post.poll.allowMultiple ||
          post.title.toLowerCase().includes('mehrfach') ||
          post.content.toLowerCase().includes('mehrfach')
        );

        const updatedOptions = post.poll.options.map(opt => {
          const userAlreadyVoted = opt.votes.includes(currentUser.id);
          
          if (isMultiple) {
            // In multiple choice mode: toggle this option only
            if (opt.id === optionId) {
              const newVotes = userAlreadyVoted
                ? opt.votes.filter(id => id !== currentUser.id)
                : [...opt.votes, currentUser.id];
              return { ...opt, votes: newVotes };
            }
            return opt;
          } else {
            // Single choice mode: if clicking already selected, toggle off; otherwise move vote
            const votesWithoutUser = opt.votes.filter(id => id !== currentUser.id);
            if (opt.id === optionId) {
              return {
                ...opt,
                votes: userAlreadyVoted ? votesWithoutUser : [...votesWithoutUser, currentUser.id]
              };
            }
            return { ...opt, votes: votesWithoutUser };
          }
        });

        return {
          ...post,
          poll: { ...post.poll, options: updatedOptions }
        };
      });
      const target = next.find(p => p.id === postId);
      if (target) dbSaveForumPost(target);
      return next;
    });
  };

  const handleAddComment = (postId: string, content: string) => {
    setForumPosts(prev => {
      const next = prev.map(post => {
        if (post.id !== postId) return post;
        const newComment = {
          id: `comm-${Date.now()}`,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorClubId: currentUser.clubId,
          content,
          createdAt: new Date().toISOString(),
          upvotes: []
        };
        return { ...post, comments: [...post.comments, newComment] };
      });
      const target = next.find(p => p.id === postId);
      if (target) dbSaveForumPost(target);
      return next;
    });
  };

  // Excursion handlers (for calendar and event planning)
  const handleAddExcursion = (newExcursion: Excursion) => {
    setExcursions(prev => [newExcursion, ...prev]);
    dbSaveExcursion(newExcursion);
  };

  const handleRegisterAttendees = (excursionId: string, attendeeNames: string[]) => {
    setExcursions(prev => {
      const next = prev.map(exc => {
        if (exc.id !== excursionId) return exc;

        const newRegistration = {
          id: `reg-${Date.now()}`,
          registeredByUserId: currentUser.id,
          registeredByUserName: currentUser.name,
          clubId: currentUser.clubId,
          clubName: currentClub?.name || 'Unabhängig',
          attendees: attendeeNames.map(name => ({
            name,
            notes: name === currentUser.name ? `${currentUser.positionInClub}` : 'Vereinsmitglied'
          })),
          registeredAt: new Date().toISOString()
        };

        return {
          ...exc,
          registrations: [...exc.registrations, newRegistration]
        };
      });
      const target = next.find(e => e.id === excursionId);
      if (target) dbSaveExcursion(target);
      return next;
    });
  };

  const handleCancelRegistration = (excursionId: string, registrationId: string) => {
    setExcursions(prev => {
      const next = prev.map(exc => {
        if (exc.id !== excursionId) return exc;
        return {
          ...exc,
          registrations: exc.registrations.filter(r => r.id !== registrationId)
        };
      });
      const target = next.find(e => e.id === excursionId);
      if (target) dbSaveExcursion(target);
      return next;
    });
  };

  const handleEditExcursion = (excursionId: string, updated: Partial<Excursion>) => {
    setExcursions(prev => {
      const next = prev.map(exc => exc.id === excursionId ? { ...exc, ...updated } : exc);
      const target = next.find(e => e.id === excursionId);
      if (target) dbSaveExcursion(target);
      return next;
    });
  };

  const handleDeleteExcursion = (excursionId: string) => {
    setExcursions(prev => prev.filter(exc => exc.id !== excursionId));
    dbDeleteExcursion(excursionId);
  };

  const handleAddProtocol = (protocol: MeetingProtocol) => {
    setProtocols(prev => [protocol, ...prev]);
    dbSaveProtocol(protocol);
  };

  const handleDeleteProtocol = (protocolId: string) => {
    if (!isPraesidium) {
      console.warn('Nur Präsidiumsmitglieder dürfen Protokolle löschen.');
      return;
    }
    setProtocols(prev => prev.filter(p => p.id !== protocolId));
    dbDeleteProtocol(protocolId);
  };

  // Vereinigung Baden Pfalz handlers
  const handleSaveVereinigungEntry = (entry: VereinigungEntry) => {
    const existing = vereinigungEntries.find(e => e.id === entry.id);
    if (entry.type === 'news') {
      if (!canManageVereinigungNews(currentUser)) return;
    } else {
      if (existing && !isPraesidium && existing.authorId !== currentUser.id) {
        return;
      }
    }

    setVereinigungEntries(prev => {
      const exists = prev.some(e => e.id === entry.id);
      const next = exists
        ? prev.map(e => e.id === entry.id ? entry : e)
        : [entry, ...prev];
      return [...next].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    dbSaveVereinigungEntry(entry);
  };

  const handleDeleteVereinigungEntry = (entryId: string) => {
    const target = vereinigungEntries.find(e => e.id === entryId);
    if (!target) return;

    if (target.type === 'news') {
      if (!canManageVereinigungNews(currentUser)) return;
    } else {
      if (!isPraesidium && target.authorId !== currentUser.id) return;
    }

    setVereinigungEntries(prev => prev.filter(e => e.id !== entryId));
    dbDeleteVereinigungEntry(entryId);
  };

  const handleAddVereinigungComment = (entryId: string, content: string) => {
    const trimmed = content.trim().slice(0, 2000);
    if (!trimmed) return;
    const nowIso = new Date().toISOString();
    const newComment = {
      id: `vcomm-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorClubId: currentUser.clubId || '',
      content: trimmed,
      createdAt: nowIso,
    };

    setVereinigungEntries(prev => {
      let updatedTarget: VereinigungEntry | undefined;
      const next = prev.map(entry => {
        if (entry.id !== entryId) return entry;
        updatedTarget = {
          ...entry,
          comments: [...(entry.comments || []), newComment].slice(-200),
          updatedAt: nowIso,
        };
        return updatedTarget;
      });
      if (updatedTarget) {
        dbSaveVereinigungEntry(updatedTarget);
      }
      return next;
    });
  };

  const handleDeleteVereinigungComment = (entryId: string, commentId: string) => {
    setVereinigungEntries(prev => {
      let updatedTarget: VereinigungEntry | undefined;
      const next = prev.map(entry => {
        if (entry.id !== entryId) return entry;
        const targetComment = (entry.comments || []).find(c => c.id === commentId);
        if (!targetComment) return entry;
        const allowed =
          targetComment.authorId === currentUser.id ||
          isPraesidium ||
          (entry.type === 'news' && canManageVereinigungNews(currentUser));
        if (!allowed) return entry;

        updatedTarget = {
          ...entry,
          comments: (entry.comments || []).filter(c => c.id !== commentId),
          updatedAt: new Date().toISOString(),
        };
        return updatedTarget;
      });
      if (updatedTarget) {
        dbSaveVereinigungEntry(updatedTarget);
      }
      return next;
    });
  };


  // If not logged in, show the Login & Registration Portal as the exclusive Landing Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden w-full max-w-full transition-colors duration-200">
        {/* Heraldic Watermark Background on every page (Screenshot 104014) - Kräftiger dargestellt */}
        <div 
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden select-none max-w-full"
        >
          <img
            src="/assets/aistudio/Screenshot_20261021-104014_46b428b6.png"
            alt=""
            className="w-[90vw] max-w-[680px] max-h-[85vh] object-contain opacity-[0.24] dark:opacity-[0.12] filter contrast-125 saturate-110 drop-shadow-sm pointer-events-none"
          />
        </div>

        {/* Realtime Offline Notice */}
        <OfflineIndicator onSyncNow={handleManualSync} />

        {/* Top Header */}
        <header className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6 shadow-2xs transition-colors">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <a
              href="https://narrenkreis-bruchsal.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity no-underline cursor-pointer"
              title="Offizielle Website: https://narrenkreis-bruchsal.de/"
            >
              <img
                src="/assets/aistudio/Screenshot_20261021-104615_ee27e84a.png"
                alt="Narrenkreis Bruchsal Logo"
                className="w-9 h-11 object-contain shrink-0 drop-shadow-xs group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="font-extrabold text-red-950 dark:text-red-300 text-base sm:text-lg block leading-tight group-hover:text-red-800 dark:group-hover:text-red-200 transition-colors">
                  Narrenkreis Bruchsal
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  Interessensgemeinschaft in Sachen Fasnacht
                </span>
              </div>
            </a>

            <div className="flex items-center gap-2 sm:gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {/* Dark Mode Switcher for evening meetings / dark halls */}
              <button
                type="button"
                onClick={handleToggleTheme}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                title={isDarkMode ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren (Sitzungen / Festhallen)'}
                aria-label="Design umschalten"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
                <span className="hidden sm:inline text-xs font-semibold">{isDarkMode ? 'Hell' : 'Dunkel'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title="Diesen Link für Mitglieder kopieren oder per WhatsApp teilen"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />}
                <span>{copiedLink ? 'Link kopiert!' : 'App-Link teilen'}</span>
              </button>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={() => handleOpenLegal('impressum')}
                className="hover:text-red-700 dark:hover:text-red-400 underline cursor-pointer hidden sm:inline"
              >
                Impressum
              </button>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={() => handleOpenLegal('datenschutz')}
                className="hover:text-red-700 dark:hover:text-red-400 underline cursor-pointer hidden sm:inline"
              >
                Datenschutz
              </button>
            </div>
          </div>
        </header>

        {/* Main Landing Login / Register Form */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-md mb-4">
            <PWAInstallBanner />
          </div>

          <div className="text-center mb-6 max-w-md">
            <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-950/70 text-red-900 dark:text-red-300 text-xs font-bold rounded-full mb-2 border border-red-200/60 dark:border-red-800/60">
              Geschützter Mitgliederbereich
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Willkommen beim Narrenkreis Bruchsal
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Bitte melde dich an oder registriere dich als Mitglied deines Fastnachtsvereins, um auf Termine, Vereinsregister und das Forum zuzugreifen.
            </p>
          </div>

          <AuthModal
            isOpen={true}
            isLandingPage={true}
            onClose={() => {}}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onUpdateUser={handleUpdateUser}
            users={users}
            clubs={clubs}
            onOpenLegal={handleOpenLegal}
          />
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs py-4 px-4 text-xs text-slate-500 dark:text-slate-400 text-center transition-colors">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© Narrenkreis Bruchsal · 76646 Bruchsal</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenLegal('impressum')}
                className="hover:text-red-700 dark:hover:text-red-400 underline cursor-pointer"
              >
                Impressum
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={() => handleOpenLegal('datenschutz')}
                className="hover:text-red-700 dark:hover:text-red-400 underline cursor-pointer"
              >
                Datenschutzerklärung
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="font-medium text-slate-500 dark:text-slate-400">designed by Martin Kuntzsch</span>
            </div>
          </div>
        </footer>

        {/* Legal Modal */}
        <LegalModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
        />
      </div>
    );
  }

  const isVereinigungWatermark = activeTab === 'vereinigung';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden w-full max-w-full transition-colors duration-200">
      {/* Heraldic Watermark Background: Vereinigung Baden Pfalz Wimpel nur beim entsprechenden Reiter */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden select-none max-w-full"
      >
        {isVereinigungWatermark ? (
          <img
            src={VEREINIGUNG_LOGO_URL}
            alt=""
            className="w-[86vw] max-w-[540px] max-h-[80vh] object-contain opacity-[0.22] dark:opacity-[0.14] mix-blend-multiply dark:mix-blend-normal rounded-3xl filter contrast-110 drop-shadow-sm pointer-events-none"
          />
        ) : (
          <img
            src="/assets/aistudio/Screenshot_20261021-104014_46b428b6.png"
            alt=""
            className="w-[90vw] max-w-[680px] max-h-[85vh] object-contain opacity-[0.24] dark:opacity-[0.10] filter contrast-125 saturate-110 drop-shadow-sm pointer-events-none"
          />
        )}
      </div>

      {/* Realtime Offline Notice */}
      <OfflineIndicator onSyncNow={handleManualSync} />

      {/* Top Bar with the tabs in order */}
      <div className="relative z-50">
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentUser={currentUser}
          currentClub={currentClub}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onShareApp={handleShareApp}
          copiedLink={copiedLink}
          unreadCounts={unreadCounts}
          unreadItems={unreadItems}
          onMarkAllAsRead={markAllAsRead}
          onSyncDatabase={handleManualSync}
          isSyncing={isSyncing}
          usersCount={users.length}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />
      </div>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* PWA Install Banner */}
        {!isPwaBannerDismissed && (
          <PWAInstallBanner onDismiss={handleDismissPwaBanner} />
        )}

        {/* Tab 1: FORUM */}
        {activeTab === 'forum' && (
          <ForumView
            posts={forumPosts}
            currentUser={currentUser}
            users={users}
            clubs={clubs}
            onAddPost={handleAddPost}
            onRatePost={handleRatePost}
            onUpvotePost={handleUpvotePost}
            onVotePoll={handleVotePoll}
            onAddComment={handleAddComment}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
          />
        )}

        {/* Tab 2: KALENDER */}
        {activeTab === 'calendar' && (
          <CalendarView
            excursions={excursions}
            clubs={clubs}
            currentUser={currentUser}
            onSelectExcursion={() => {}}
            onOpenCreateExcursion={(defaultDate) => {
              setCreateEventInitialDate(defaultDate);
              setIsCreateEventModalOpen(true);
            }}
            onAddExcursion={handleAddExcursion}
            onEditExcursion={handleEditExcursion}
            onDeleteExcursion={handleDeleteExcursion}
            onRegisterAttendees={handleRegisterAttendees}
            onCancelRegistration={handleCancelRegistration}
            isCreateOpen={isCreateEventModalOpen}
            onCloseCreate={() => setIsCreateEventModalOpen(false)}
            initialCreateDate={createEventInitialDate}
          />
        )}

        {/* Tab 3: VEREINE */}
        {activeTab === 'clubs' && (
          <ClubDirectory
            clubs={clubs}
            users={users}
            currentUser={currentUser}
            onSelectClubToJoin={(clubId) => {
              handleUpdateUser({
                ...currentUser,
                clubId
              });
              handleTabChange('profile');
            }}
            onOpenMessengerForUser={handleOpenMessengerForUser}
            onNavigateToPraesidium={() => handleTabChange('praesidium')}
            onSyncDatabase={handleManualSync}
            isSyncing={isSyncing}
          />
        )}

        {/* Tab 4: PROTOKOLLE */}
        {activeTab === 'protokolle' && (
          <ProtocolsView
            protocols={protocols}
            currentUser={currentUser}
            onAddProtocol={handleAddProtocol}
            onDeleteProtocol={handleDeleteProtocol}
          />
        )}

        {/* Tab 5: VEREINIGUNG BADEN PFALZ (Für alle Vereine · Änderungsportal & Verbands-News) */}
        {activeTab === 'vereinigung' && (
          <VereinigungBadenPfalzSection
            currentUser={currentUser}
            users={users}
            clubs={clubs}
            entries={vereinigungEntries}
            additionalNotificationEmails={vereinigungSettings.notificationEmails}
            activeSubTab={vereinigungSubTab}
            onSubTabChange={setVereinigungSubTab}
            onSaveEntry={handleSaveVereinigungEntry}
            onDeleteEntry={handleDeleteVereinigungEntry}
            onAddComment={handleAddVereinigungComment}
            onDeleteComment={handleDeleteVereinigungComment}
            onSendEmail={handleSendEmail}
            isCreateOpen={isVereinigungCreateOpen}
            onOpenCreate={() => setIsVereinigungCreateOpen(true)}
            onCloseCreate={() => setIsVereinigungCreateOpen(false)}
          />
        )}

        {/* Tab 6: PROFIL (Mit Unter-Reitern: Mein Profil & E-Mail Messenger) */}
        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            allUsers={users}
            clubs={clubs}
            sentEmails={sentEmails}
            onUpdateUser={handleUpdateUser}
            onCreateUser={handleCreateUser}
            onClearMailbox={handleClearMailbox}
            onDeleteEmail={handleDeleteEmail}
            onSendEmail={handleSendEmail}
            activeSubTab={profileSubTab}
            onSubTabChange={setProfileSubTab}
            initialRecipientUserId={messengerTargetUserId}
          />
        )}

        {/* Tab 7: PRÄSIDIUM (Ausschließlich für gewählte Präsidiumsmitglieder) */}
        {activeTab === 'praesidium' && isPraesidium && (
          <PraesidiumView
            currentUser={currentUser}
            allUsers={users}
            clubs={clubs}
            onAddClub={handleAddClub}
            onEditClub={handleEditClub}
            onDeleteClub={handleDeleteClub}
            onUpdateUserRole={handleUpdateUserRole}
            onUpdateUserVereinigungRole={handleUpdateUserVereinigungRole}
            onUpdateClubLogo={handleUpdateClubLogo}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onCreateUser={handleCreateUser}
            activeSubTab={praesidiumSubTab}
            onSubTabChange={setPraesidiumSubTab}
            vereinigungSettings={vereinigungSettings}
            onSaveVereinigungSettings={handleSaveVereinigungSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs py-6 mt-12 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="https://narrenkreis-bruchsal.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-red-950 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 transition-colors cursor-pointer"
              title="Offizielle Website: https://narrenkreis-bruchsal.de/"
            >
              Narrenkreis Bruchsal
            </a>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span>Interessensgemeinschaft in Sachen Fasnacht</span>
          </div>

          {/* Legal, PWA and Auth Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs">
            <button
              type="button"
              onClick={() => setIsPwaBannerDismissed(false)}
              className="text-amber-900 dark:text-amber-300 hover:text-amber-950 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800/80 transition-colors cursor-pointer shadow-2xs"
              title="Anleitung: Als App auf dem Handy-Startbildschirm installieren"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
              <span>App aufs Handy</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('impressum')}
              className="text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 font-semibold underline transition-colors cursor-pointer"
            >
              Impressum
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('datenschutz')}
              className="text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 font-semibold underline transition-colors cursor-pointer"
            >
              Datenschutzerklärung
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
              <span>Login-Portal & Registrierung</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">designed by Martin Kuntzsch</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login & Registration Portal mit Pflichtfeldern und Impressums-Zustimmung) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onUpdateUser={handleUpdateUser}
        users={users}
        clubs={clubs}
        onOpenLegal={handleOpenLegal}
      />

      {/* Legal Modal (Impressum & Datenschutzerklärung gemäß § 5 TMG / DSGVO) */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </div>
  );
}
