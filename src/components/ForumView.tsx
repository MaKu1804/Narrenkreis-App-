import React, { useState } from 'react';
import { 
  MessageSquare, 
  ThumbsUp, 
  Star, 
  BarChart2, 
  Plus, 
  Search, 
  Send, 
  CheckCircle2, 
  Filter, 
  Clock, 
  MessageCircle,
  HelpCircle,
  X,
  Trash2,
  Edit2,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  Square,
  CheckSquare
} from 'lucide-react';
import { ForumPost, UserProfile, Club, calculatePollResults, calculatePostRating } from '../utils/clubLogic';
import { ClubLogo } from './ClubLogo';
import { UserAvatar } from './UserAvatar';

interface ForumViewProps {
  posts: ForumPost[];
  currentUser: UserProfile;
  users?: UserProfile[];
  clubs: Club[];
  onAddPost: (newPost: ForumPost) => void;
  onRatePost: (postId: string, score: number) => void;
  onUpvotePost: (postId: string) => void;
  onVotePoll: (postId: string, optionId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onEditPost: (postId: string, updated: { title: string; content: string; category: ForumPost['category'] }) => void;
  onDeletePost: (postId: string) => void;
}

export const ForumView: React.FC<ForumViewProps> = ({
  posts,
  currentUser,
  users = [],
  clubs,
  onAddPost,
  onRatePost,
  onUpvotePost,
  onVotePoll,
  onAddComment,
  onEditPost,
  onDeletePost
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Edit and Delete post states
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<ForumPost['category']>('Allgemein');
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);

  // New post modal state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ForumPost['category']>('Allgemein');
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

  // Voter display states
  // Tracks expanded voter details for each option: key = `${postId}-${optId}`
  const [expandedOptionVoters, setExpandedOptionVoters] = useState<Record<string, boolean>>({});
  // Tracks global voter list expansion for an entire poll
  const [showAllPollVoters, setShowAllPollVoters] = useState<Record<string, boolean>>({});

  const categories = ['Alle', 'Allgemein', 'Narrenkreis-News', 'Umfrage'];

  // Resolve voter details (name, club, avatar)
  const getVoterInfo = (voterIdentifier: string) => {
    // 1. Current user match
    if (
      voterIdentifier === currentUser.id || 
      voterIdentifier === currentUser.name ||
      (currentUser.name.toLowerCase().includes('martin') && (voterIdentifier === 'user-martin' || voterIdentifier === 'user-1' || voterIdentifier === 'mk'))
    ) {
      const club = clubs.find(c => c.id === currentUser.clubId);
      return {
        id: currentUser.id,
        name: currentUser.name,
        clubName: club?.shortName || club?.name || '',
        avatar: currentUser.avatar || 'MK',
        isCurrent: true
      };
    }

    // 2. Search in all registered users
    const found = users.find(
      u => u.id === voterIdentifier || u.name.toLowerCase() === voterIdentifier.toLowerCase()
    );
    if (found) {
      const club = clubs.find(c => c.id === found.clubId);
      return {
        id: found.id,
        name: found.name,
        clubName: club?.shortName || club?.name || '',
        avatar: found.avatar || found.name.slice(0, 2).toUpperCase(),
        isCurrent: false
      };
    }

    // 3. Fallback
    const displayName = voterIdentifier.startsWith('user-') ? 'Vereinsmitglied' : voterIdentifier;
    return {
      id: voterIdentifier,
      name: displayName,
      clubName: '',
      avatar: displayName.slice(0, 2).toUpperCase(),
      isCurrent: false
    };
  };

  const handleVoteAndExpand = (postId: string, optionId: string) => {
    onVotePoll(postId, optionId);
    // Upon voting, expand this option's voter list so the user immediately sees the name list
    setExpandedOptionVoters(prev => ({
      ...prev,
      [`${postId}-${optionId}`]: true
    }));
  };

  const toggleOptionVoters = (postId: string, optionId: string) => {
    const key = `${postId}-${optionId}`;
    setExpandedOptionVoters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleAllPollVoters = (postId: string) => {
    setShowAllPollVoters(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'Alle' || post.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    let pollData = undefined;
    if (includePoll && pollQuestion.trim()) {
      const validOptions = pollOptions.filter(o => o.trim().length > 0);
      if (validOptions.length >= 2) {
        pollData = {
          question: pollQuestion.trim(),
          allowMultiple: pollAllowMultiple,
          options: validOptions.map((opt, idx) => ({
            id: `opt-${Date.now()}-${idx}`,
            text: opt.trim(),
            votes: []
          }))
        };
      }
    }

    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorClubId: currentUser.clubId,
      createdAt: new Date().toISOString(),
      upvotes: [],
      ratings: [],
      poll: pollData,
      comments: []
    };

    onAddPost(newPost);
    setNewTitle('');
    setNewContent('');
    setNewCategory('Allgemein');
    setIncludePoll(false);
    setPollQuestion('');
    setPollOptions(['Option 1', 'Option 2']);
    setPollAllowMultiple(false);
    setIsCreateModalOpen(false);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOpenEdit = (post: ForumPost) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editTitle.trim() || !editContent.trim()) return;
    onEditPost(editingPost.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      category: editCategory
    });
    setEditingPost(null);
  };

  const handleConfirmDelete = (postId: string) => {
    onDeletePost(postId);
    setDeleteConfirmPostId(null);
  };

  const handleCommentSubmit = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    onAddComment(postId, text);
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Forum durchsuchen (Titel, Inhalt, Verein)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Neuen Beitrag erstellen
          </button>
        </div>
      </div>

      {/* Categories interactive tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Forum Post List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">Keine Beiträge gefunden</h4>
            <p className="text-xs text-slate-500 mt-1">
              Erstelle den ersten Beitrag oder passe deine Suche an.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const authorClub = clubs.find(c => c.id === post.authorClubId);
            const { average: ratingAvg, count: ratingCount, userRating } = calculatePostRating(post.ratings, currentUser.id);
            const hasUpvoted = post.upvotes.includes(currentUser.id);
            const isCommentsExpanded = expandedCommentsPostId === post.id;

            return (
              <article 
                key={post.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 space-y-4"
              >
                {/* Header: Author + Club + Category */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ClubLogo club={authorClub} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{post.authorName}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-medium text-sky-700">
                          {authorClub?.shortName || authorClub?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(post.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600 font-medium">{post.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Rating Score Summary */}
                    <div className="flex items-center gap-1 bg-amber-50/80 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-900">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span className="tabular-nums">{ratingAvg > 0 ? ratingAvg : '—'}</span>
                      <span className="text-amber-600 font-normal text-[11px]">({ratingCount})</span>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(post)}
                        className="px-2.5 py-1 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200 bg-white shadow-2xs flex items-center gap-1 text-xs font-medium cursor-pointer"
                        title="Beitrag bearbeiten"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                        <span className="hidden sm:inline">Bearbeiten</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmPostId(post.id)}
                        className="px-2.5 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 bg-white shadow-2xs flex items-center gap-1 text-xs font-medium cursor-pointer"
                        title="Beitrag löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span className="hidden sm:inline">Löschen</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Interactive Poll Section if exists */}
                {post.poll && (
                  <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/40 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                      <BarChart2 className="w-4 h-4 text-sky-600" />
                      <span>Abstimmung: {post.poll.question}</span>
                    </div>

                    {(() => {
                      const pollResults = calculatePollResults(post.poll);
                      const hasVotedAny = post.poll.options.some(opt => opt.votes.includes(currentUser.id));

                      return (
                        <div className="space-y-2.5">
                          {pollResults.options.map((opt) => {
                            const isUserChoice = opt.votes.includes(currentUser.id);
                            const optionKey = `${post.id}-${opt.id}`;
                            const isCollapsed = expandedOptionVoters[optionKey] === false;

                            return (
                              <div key={opt.id} className="space-y-1">
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleVoteAndExpand(post.id, opt.id)}
                                  className={`w-full text-left p-2.5 rounded-lg border transition-all relative overflow-hidden group cursor-pointer ${
                                    isUserChoice
                                      ? 'border-sky-500 bg-white ring-1 ring-sky-500 font-semibold'
                                      : 'border-slate-200 bg-white/90 hover:border-sky-300'
                                  }`}
                                >
                                  {/* Percentage bar background fill */}
                                  <div 
                                    className={`absolute left-0 top-0 bottom-0 opacity-15 transition-all duration-500 ${
                                      isUserChoice ? 'bg-sky-600' : 'bg-slate-500 group-hover:bg-sky-400'
                                    }`}
                                    style={{ width: `${opt.percentage}%` }}
                                  />

                                  <div className="relative flex items-center justify-between text-xs text-slate-900">
                                    <span className="flex items-center gap-2">
                                      {isUserChoice ? (
                                        <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                                      ) : (
                                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 group-hover:border-sky-500" />
                                      )}
                                      <span className="leading-snug">{opt.text}</span>
                                    </span>

                                    <span className="font-mono tabular-nums text-slate-600 text-[11px] ml-2 shrink-0">
                                      {opt.percentage}% ({opt.count} {opt.count === 1 ? 'Stimme' : 'Stimmen'})
                                    </span>
                                  </div>
                                </button>

                                {/* List of names who voted for this option */}
                                {opt.votes.length > 0 && (
                                  <div className="ml-1 pl-3 pr-2 py-1.5 border-l-2 border-sky-400 bg-white/95 rounded-r-lg border border-slate-200/90 shadow-2xs space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] text-sky-950 font-semibold">
                                      <span className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                        <span>Abgestimmt haben ({opt.votes.length}):</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => toggleOptionVoters(post.id, opt.id)}
                                        className="text-[10px] text-sky-700 hover:text-sky-900 font-medium flex items-center gap-0.5 cursor-pointer"
                                      >
                                        {isCollapsed ? (
                                          <>
                                            <span>Namen anzeigen</span>
                                            <ChevronDown className="w-3 h-3" />
                                          </>
                                        ) : (
                                          <>
                                            <span>Ausblenden</span>
                                            <ChevronUp className="w-3 h-3" />
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    {!isCollapsed && (
                                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {opt.votes.map((voterId) => {
                                          const voter = getVoterInfo(voterId);
                                          return (
                                            <span
                                              key={voterId}
                                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${
                                                voter.isCurrent
                                                  ? 'bg-sky-50 text-sky-950 border-sky-300 font-semibold'
                                                  : 'bg-slate-50 text-slate-800 border-slate-200 font-medium'
                                              }`}
                                            >
                                              <span className="w-4 h-4 rounded-full overflow-hidden bg-sky-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                                {voter.avatar && (voter.avatar.startsWith('data:') || voter.avatar.startsWith('http') || voter.avatar.startsWith('/')) ? (
                                                  <img src={voter.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                  voter.name.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'VK'
                                                )}
                                              </span>
                                              <span>{voter.name}</span>
                                              {voter.clubName && (
                                                <span className="text-[10px] text-slate-500 font-normal">
                                                  · {voter.clubName}
                                                </span>
                                              )}
                                              {voter.isCurrent && (
                                                <span className="text-[10px] text-sky-700 font-bold">
                                                  (Du)
                                                </span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                            <span>Gesamt: {pollResults.totalVotes} {pollResults.totalVotes === 1 ? 'Stimme' : 'Stimmen'}</span>
                            <span>{hasVotedAny ? 'Deine Stimme ist erfasst (kann geändert werden)' : 'Klicke auf eine Option zum Abstimmen'}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Footer Controls: Bewertung (1-5 Stars), Upvote, Comments toggle */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Rating buttons 1-5 stars */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium mr-1">Bewerten:</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => onRatePost(post.id, star)}
                          className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                          title={`${star} von 5 Sternen vergeben`}
                          aria-label={`${star} Sterne vergeben`}
                        >
                          <Star 
                            className={`w-4 h-4 ${
                              (userRating && userRating >= star) 
                                ? 'fill-amber-400 text-amber-500' 
                                : 'hover:fill-amber-200'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                    {userRating && (
                      <span className="text-[11px] text-amber-800 font-medium ml-1">
                        (Deine Bewertung: {userRating}/5 Sterne)
                      </span>
                    )}
                  </div>

                  {/* Upvote & Comment toggles */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpvotePost(post.id)}
                      className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
                        hasUpvoted
                          ? 'bg-sky-50 border-sky-300 text-sky-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-sky-600' : ''}`} />
                      <span className="font-mono tabular-nums">{post.upvotes.length}</span>
                      <span>Hilfreich</span>
                    </button>

                    <button
                      onClick={() => setExpandedCommentsPostId(isCommentsExpanded ? null : post.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{post.comments.length} Kommentare</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {isCommentsExpanded && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 bg-slate-50/60 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-800">
                      Kommentare & Rückfragen ({post.comments.length})
                    </h4>

                    {post.comments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Noch keine Kommentare. Schreibe die erste Antwort!</p>
                    ) : (
                      <div className="space-y-2.5">
                        {post.comments.map((comm) => {
                          const commClub = clubs.find(c => c.id === comm.authorClubId);
                          return (
                            <div key={comm.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <ClubLogo club={commClub} size="xs" />
                                  <span className="font-bold text-slate-900">{comm.authorName}</span>
                                  <span className="text-slate-400 text-[11px]">
                                    ({commClub?.shortName || commClub?.name})
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(comm.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 pl-6 leading-relaxed">
                                {comm.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* New comment input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Antwort oder Notiz schreiben..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCommentSubmit(post.id);
                          }
                        }}
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Senden</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Create New Forum Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Neuen Forumsbeitrag erstellen
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 overflow-y-auto space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategorie *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                >
                  <option value="Allgemein">Allgemein</option>
                  <option value="Narrenkreis-News">Narrenkreis-News</option>
                  <option value="Umfrage">Umfrage / Abstimmung</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Titel des Beitrags *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Wer kommt mit zur Frühlingswanderung?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inhalt & Beschreibung *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Beschreibe deine Gedanken, deinen Vorschlag oder wichtige Informationen für alle Vereinsmitglieder..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Poll Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePoll}
                    onChange={(e) => setIncludePoll(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                  <span>Interaktive Abstimmung hinzufügen</span>
                </label>
              </div>

              {/* Poll Options Form */}
              {includePoll && (
                <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-sky-900 mb-1">
                      Abstimmungs-Frage *
                    </label>
                    <input
                      type="text"
                      required={includePoll}
                      placeholder="z.B. Welcher Wochentag passt euch am besten?"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-sky-900">
                      Antwort-Optionen (mind. 2)
                    </label>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const updated = [...pollOptions];
                            updated[idx] = e.target.value;
                            setPollOptions(updated);
                          }}
                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Option entfernen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {pollOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddPollOption}
                        className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Weitere Option hinzufügen
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Beitrag veröffentlichen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Forum Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Beitrag bearbeiten</h3>
              </div>
              <button
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategorie
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ForumPost['category'])}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="Allgemein">Allgemein</option>
                  <option value="Narrenkreis-News">Narrenkreis-News</option>
                  <option value="Umfrage">Umfrage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Titel des Beitrags *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inhalt *
                </label>
                <textarea
                  required
                  rows={6}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Änderungen speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Beitrag wirklich löschen?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmPostId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deleteConfirmPostId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
