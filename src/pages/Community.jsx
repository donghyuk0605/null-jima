import { useMemo, useState, useEffect } from 'react';
import Icon from '../components/Icon';
import {
  subscribeToPosts, addPost, likePost, deletePost, addComment, editPost,
  seedPostsIfEmpty, SEED_POSTS,
} from '../lib/community';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { localizePosts } from '../lib/localizedContent';

const CATEGORIES = [
  { value: '전체', key: 'category.all' },
  { value: '질문', key: 'category.question' },
  { value: '풀이 공유', key: 'category.solution' },
  { value: '팁', key: 'category.tip' },
  { value: '자유', key: 'category.free' },
];

function getCategoryKey(value) {
  return CATEGORIES.find((item) => item.value === value)?.key ?? 'category.free';
}

function highlightSql(code) {
  const keywords = ['SELECT','FROM','WHERE','GROUP BY','HAVING','ORDER BY','JOIN','LEFT','RIGHT','INNER','OUTER','ON','INSERT','UPDATE','DELETE','CREATE','DROP','ALTER','TABLE','INDEX','VIEW','AS','AND','OR','NOT','IN','IS','NULL','LIKE','BETWEEN','DISTINCT','COUNT','SUM','AVG','MAX','MIN','CASE','WHEN','THEN','ELSE','END','WITH','UNION','INTERSECT','EXCEPT','LIMIT','OFFSET','BY','ASC','DESC','INTO','VALUES','SET'];

  // Escape HTML first
  let result = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // Highlight strings
  result = result.replace(/'([^']*)'/g, '<span class="sql-str">\'$1\'</span>');

  // Highlight comments
  result = result.replace(/--(.*)/g, '<span class="sql-comment">--$1</span>');

  // Highlight numbers
  result = result.replace(/\b(\d+)\b/g, '<span class="sql-num">$1</span>');

  // Highlight keywords (word boundary)
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  result = result.replace(keywordRegex, '<span class="sql-kw">$1</span>');

  return result;
}

function renderBody(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks = [];
  let codeLines = [];
  let inCode = false;
  let textLines = [];

  const flushText = () => {
    if (textLines.length > 0) {
      blocks.push({ type: 'text', content: textLines.join('\n') });
      textLines = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('```') || line.startsWith('~~~')) {
      if (!inCode) {
        flushText();
        inCode = true;
      } else {
        blocks.push({ type: 'code', content: codeLines.join('\n') });
        codeLines = [];
        inCode = false;
      }
    } else if (inCode) {
      codeLines.push(line);
    } else if (line.startsWith('    ') || line.startsWith('\t')) {
      flushText();
      blocks.push({ type: 'code', content: line.replace(/^( {4}|\t)/, '') });
    } else {
      textLines.push(line);
    }
  }
  if (codeLines.length > 0) blocks.push({ type: 'code', content: codeLines.join('\n') });
  flushText();

  return blocks.map((block, i) => {
    if (block.type === 'code') {
      return (
        <pre key={i} className="post-code-block" dangerouslySetInnerHTML={{ __html: highlightSql(block.content) }} />
      );
    }
    return (
      <p key={i} className="post-body-text" style={{ whiteSpace: 'pre-wrap' }}>{block.content}</p>
    );
  });
}

const formatDate = (value, language) => {
  try {
    return new Intl.DateTimeFormat(language === 'ja' ? 'ja-JP' : 'ko-KR', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

export default function Community() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fsError, setFsError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [category, setCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState({ title: '', category: '질문', author: '', body: '' });
  const [commentDraft, setCommentDraft] = useState({ author: '', body: '' });
  const [editingPost, setEditingPost] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: '', category: '질문', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    // seed 먼저 실행 (이미 데이터 있으면 no-op)
    seedPostsIfEmpty().catch((e) => console.warn('[community] seed failed:', e));

    const unsub = subscribeToPosts(
      (nextPosts) => {
        setPosts(nextPosts);
        setLoading(false);
        setFsError(null);
        setSelectedId((prev) => prev ?? nextPosts[0]?.id ?? null);
      },
      (err) => {
        // Firestore 연결 실패 → 시드 데이터로 fallback
        console.error('[community] Firestore error:', err);
        setFsError(err.message || 'Firestore 연결 실패');
        setPosts(SEED_POSTS.map((p, i) => ({ ...p, id: `seed-${i}` })));
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filteredPosts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = category === '전체' || post.category === category;
      const haystack = `${post.title} ${post.author} ${post.body}`.toLowerCase();
      return matchesCategory && (!keyword || haystack.includes(keyword));
    });
  }, [category, posts, searchQuery]);
  const localizedPosts = useMemo(() => localizePosts(posts, language), [language, posts]);
  const localizedFilteredPosts = useMemo(() => localizePosts(filteredPosts, language), [filteredPosts, language]);

  const totalPages = Math.max(1, Math.ceil(localizedFilteredPosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pagedPosts = localizedFilteredPosts.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const selectedPost = localizedPosts.find((p) => p.id === selectedId) ?? localizedFilteredPosts[0] ?? null;

  const handleCreatePost = async (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const ref = await addPost({
        ...draft,
        language,
        uid: user?.uid,
        displayName: user?.displayName,
      });
      setSelectedId(ref.id);
      setDraft({ title: '', category: '질문', author: '', body: '' });
    } catch (e) {
      alert(t('community.createFailed', { message: e.message }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = (postId) => {
    likePost(postId).catch((e) => console.error('like failed:', e));
  };

  const handleDelete = async (postId) => {
    if (!window.confirm(t('community.deleteConfirm'))) return;
    try {
      await deletePost(postId);
      if (selectedId === postId) setSelectedId(null);
    } catch (e) {
      alert(t('community.deleteFailed', { message: e.message }));
    }
  };

  const handleEditPost = async (event) => {
    event.preventDefault();
    if (!editDraft.title.trim() || !editDraft.body.trim() || submitting) return;
    setSubmitting(true);
    try {
      await editPost(editingPost, editDraft);
      setEditingPost(null);
    } catch (e) {
      alert(t('community.editFailed', { message: e.message }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();
    if (!selectedPost || !commentDraft.body.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment(selectedPost.id, {
        ...commentDraft,
        uid: user?.uid,
        displayName: user?.displayName,
      });
      setCommentDraft({ author: '', body: '' });
    } catch (e) {
      alert(t('community.commentFailed', { message: e.message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page community-page">
      <div className="page-header">
        <h2 className="page-title">{t('community.title')}</h2>
        <span className="page-desc">{t('community.desc')}</span>
      </div>

      {fsError && (
        <div className="community-fs-error">
          <Icon name="error" style={{ width: 14, height: 14 }} />
          {t('community.fsError', { message: fsError })}
        </div>
      )}

      <div className="community-layout">
        <section className="community-main">
          <div className="community-toolbar">
            <div className="community-tabs">
              {CATEGORIES.map((item) => (
                <button
                  key={item.value}
                  className={`community-tab ${category === item.value ? 'active' : ''}`}
                  onClick={() => { setCategory(item.value); setPage(0); }}
                >
                  {t(item.key)}
                </button>
              ))}
            </div>
            <div className="community-search">
              <input
                className="community-search-input"
                placeholder={t('community.searchPlaceholder')}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => { setSearchQuery(''); setPage(0); }}><Icon name="close" style={{width:10,height:10}} /></button>
              )}
            </div>
          </div>

          {searchQuery && (
            <div className="community-search-count">{t('community.searchCount', { count: filteredPosts.length })}</div>
          )}

          <div className="community-list">
            {loading ? (
              <div className="community-empty">{t('community.loading')}</div>
            ) : filteredPosts.length === 0 ? (
              <div className="community-empty">{t('community.empty')}</div>
            ) : (
              pagedPosts.map((post) => (
                <button
                  key={post.id}
                  className={`community-row ${selectedPost?.id === post.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(post.id)}
                >
                  <span className="community-row-category">{t(getCategoryKey(post.category))}</span>
                  <span className="community-row-body">
                    <span className="community-row-title">{post.title}</span>
                    <span className="community-row-meta">
                      {post.author} · {formatDate(post.createdAt, language)} · {t('community.comments', { count: post.comments.length })}
                    </span>
                  </span>
                  <span className="community-row-likes">{post.likes}</span>
                </button>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="community-pagination">
              <button className="page-btn" onClick={() => setPage(0)} disabled={currentPage === 0}><Icon name="skip-first" style={{width:14,height:14}} /></button>
              <button className="page-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}><Icon name="prev" style={{width:14,height:14}} /></button>
              {Array.from({ length: totalPages }, (_, i) => i).map(i => (
                <button
                  key={i}
                  className={`page-btn ${i === currentPage ? 'page-btn-active' : ''}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}><Icon name="next" style={{width:14,height:14}} /></button>
              <button className="page-btn" onClick={() => setPage(totalPages - 1)} disabled={currentPage >= totalPages - 1}><Icon name="skip-last" style={{width:14,height:14}} /></button>
            </div>
          )}

          {selectedPost && (
            <article className="community-detail">
              <div className="community-detail-head">
                <div>
                  <span className="community-detail-category">{t(getCategoryKey(selectedPost.category))}</span>
                  <h3 className="community-detail-title">{selectedPost.title}</h3>
                  <p className="community-detail-meta">
                    {selectedPost.author} · {formatDate(selectedPost.createdAt, language)}
                  </p>
                </div>
                <div className="community-detail-actions">
                  <button className="btn btn-ghost-sm" onClick={() => handleLike(selectedPost.id)}>
                    {t('community.like', { count: selectedPost.likes })}
                  </button>
                  <button className="btn btn-ghost-sm" onClick={() => { setEditingPost(selectedPost.id); setEditDraft({ title: selectedPost.title, category: selectedPost.category, body: selectedPost.body }); }}>
                    {t('community.edit')}
                  </button>
                  <button className="btn btn-ghost-sm" onClick={() => handleDelete(selectedPost.id)}>
                    {t('community.delete')}
                  </button>
                </div>
              </div>

              {editingPost === selectedPost?.id ? (
                <form className="community-edit-form" onSubmit={handleEditPost}>
                  <input value={editDraft.title} onChange={e => setEditDraft(v => ({...v, title: e.target.value}))} placeholder={t('community.postTitle')} />
                  <select value={editDraft.category} onChange={e => setEditDraft(v => ({...v, category: e.target.value}))}>
                    {CATEGORIES.filter(c => c.value !== '전체').map(c => (
                      <option key={c.value} value={c.value}>{t(c.key)}</option>
                    ))}
                  </select>
                  <textarea value={editDraft.body} onChange={e => setEditDraft(v => ({...v, body: e.target.value}))} rows={8} />
                  <div style={{display:'flex', gap:8}}>
                    <button className="btn btn-primary" type="submit" disabled={submitting}>{t('settings.save')}</button>
                    <button className="btn btn-ghost-sm" type="button" onClick={() => setEditingPost(null)}>{t('community.cancel')}</button>
                  </div>
                </form>
              ) : (
                <div className="community-detail-body">{renderBody(selectedPost.body)}</div>
              )}

              <div className="community-comments">
                <div className="community-comments-title">
                  <Icon name="message" className="inline-icon" />
                  {t('community.comments', { count: selectedPost.comments.length })}
                </div>
                {selectedPost.comments.map((comment) => (
                  <div key={comment.id} className="community-comment">
                    <div className="community-comment-meta">
                      {comment.author} · {formatDate(comment.createdAt, language)}
                    </div>
                    <div className="community-comment-body">{comment.body}</div>
                  </div>
                ))}

                <form className="community-comment-form" onSubmit={handleAddComment}>
                  {!user && (
                    <input
                      value={commentDraft.author}
                      onChange={(e) => setCommentDraft((v) => ({ ...v, author: e.target.value }))}
                      placeholder={t('community.commentAuthorPlaceholder')}
                    />
                  )}
                  <textarea
                    value={commentDraft.body}
                    onChange={(e) => setCommentDraft((v) => ({ ...v, body: e.target.value }))}
                    placeholder={t('community.commentPlaceholder')}
                    rows={3}
                  />
                  <button className="btn btn-secondary" type="submit" disabled={submitting}>
                    {t('community.commentSubmit')}
                  </button>
                </form>
              </div>
            </article>
          )}
        </section>

        <aside className="community-compose">
          <div className="community-compose-title">{t('community.composeTitle')}</div>
          <form onSubmit={handleCreatePost}>
            <label>
              {t('community.postTitle')}
              <input
                value={draft.title}
                onChange={(e) => setDraft((v) => ({ ...v, title: e.target.value }))}
                placeholder={t('community.postTitlePlaceholder')}
              />
            </label>
            <label>
              {t('community.category')}
              <select
                value={draft.category}
                onChange={(e) => setDraft((v) => ({ ...v, category: e.target.value }))}
              >
                {CATEGORIES.filter((item) => item.value !== '전체').map((item) => (
                  <option key={item.value} value={item.value}>{t(item.key)}</option>
                ))}
              </select>
            </label>
            {!user && (
              <label>
                {t('community.author')}
                <input
                  value={draft.author}
                  onChange={(e) => setDraft((v) => ({ ...v, author: e.target.value }))}
                  placeholder={t('community.authorPlaceholder')}
                />
              </label>
            )}
            <label>
              {t('community.body')}
              <textarea
                value={draft.body}
                onChange={(e) => setDraft((v) => ({ ...v, body: e.target.value }))}
                placeholder={t('community.bodyPlaceholder')}
                rows={9}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={submitting || !!fsError}>
              {submitting ? t('community.submitting') : t('community.submit')}
            </button>
            {fsError && (
              <p style={{ fontSize: 11, color: 'var(--err)', marginTop: 6 }}>
                {t('community.writeDisabled')}
              </p>
            )}
          </form>
        </aside>
      </div>
    </div>
  );
}
