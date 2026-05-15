import { useMemo, useState, useEffect } from 'react';
import Icon from '../components/Icon';
import {
  subscribeToPosts, addPost, likePost, deletePost, addComment,
  seedPostsIfEmpty, SEED_POSTS,
} from '../lib/community';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ['전체', '질문', '풀이 공유', '팁', '자유'];

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

const formatDate = (value) => {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fsError, setFsError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [category, setCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState({ title: '', category: '질문', author: '', body: '' });
  const [commentDraft, setCommentDraft] = useState({ author: '', body: '' });
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

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pagedPosts = filteredPosts.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const selectedPost = posts.find((p) => p.id === selectedId) ?? filteredPosts[0] ?? null;

  const handleCreatePost = async (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const ref = await addPost({
        ...draft,
        uid: user?.uid,
        displayName: user?.displayName,
      });
      setSelectedId(ref.id);
      setDraft({ title: '', category: '질문', author: '', body: '' });
    } catch (e) {
      alert('글 등록에 실패했습니다: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = (postId) => {
    likePost(postId).catch((e) => console.error('like failed:', e));
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('이 게시글을 삭제할까요?')) return;
    try {
      await deletePost(postId);
      if (selectedId === postId) setSelectedId(null);
    } catch (e) {
      alert('삭제에 실패했습니다: ' + e.message);
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
      alert('댓글 등록에 실패했습니다: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page community-page">
      <div className="page-header">
        <h2 className="page-title">커뮤니티</h2>
        <span className="page-desc">질문, 풀이, 학습 팁을 공유해보세요</span>
      </div>

      {fsError && (
        <div className="community-fs-error">
          <Icon name="error" style={{ width: 14, height: 14 }} />
          Firestore 연결 오류 — 읽기 전용으로 표시 중 ({fsError})
        </div>
      )}

      <div className="community-layout">
        <section className="community-main">
          <div className="community-toolbar">
            <div className="community-tabs">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  className={`community-tab ${category === item ? 'active' : ''}`}
                  onClick={() => { setCategory(item); setPage(0); }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="community-search">
              <input
                className="community-search-input"
                placeholder="게시글 검색..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => { setSearchQuery(''); setPage(0); }}>×</button>
              )}
            </div>
          </div>

          {searchQuery && (
            <div className="community-search-count">검색 결과: {filteredPosts.length}개</div>
          )}

          <div className="community-list">
            {loading ? (
              <div className="community-empty">불러오는 중...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="community-empty">조건에 맞는 게시글이 없습니다.</div>
            ) : (
              pagedPosts.map((post) => (
                <button
                  key={post.id}
                  className={`community-row ${selectedPost?.id === post.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(post.id)}
                >
                  <span className="community-row-category">{post.category}</span>
                  <span className="community-row-body">
                    <span className="community-row-title">{post.title}</span>
                    <span className="community-row-meta">
                      {post.author} · {formatDate(post.createdAt)} · 댓글 {post.comments.length}
                    </span>
                  </span>
                  <span className="community-row-likes">{post.likes}</span>
                </button>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="community-pagination">
              <button className="page-btn" onClick={() => setPage(0)} disabled={currentPage === 0}>«</button>
              <button className="page-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i).map(i => (
                <button
                  key={i}
                  className={`page-btn ${i === currentPage ? 'page-btn-active' : ''}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>›</button>
              <button className="page-btn" onClick={() => setPage(totalPages - 1)} disabled={currentPage >= totalPages - 1}>»</button>
            </div>
          )}

          {selectedPost && (
            <article className="community-detail">
              <div className="community-detail-head">
                <div>
                  <span className="community-detail-category">{selectedPost.category}</span>
                  <h3 className="community-detail-title">{selectedPost.title}</h3>
                  <p className="community-detail-meta">
                    {selectedPost.author} · {formatDate(selectedPost.createdAt)}
                  </p>
                </div>
                <div className="community-detail-actions">
                  <button className="btn btn-ghost-sm" onClick={() => handleLike(selectedPost.id)}>
                    추천 {selectedPost.likes}
                  </button>
                  <button className="btn btn-ghost-sm" onClick={() => handleDelete(selectedPost.id)}>
                    삭제
                  </button>
                </div>
              </div>

              <div className="community-detail-body">{renderBody(selectedPost.body)}</div>

              <div className="community-comments">
                <div className="community-comments-title">
                  <Icon name="message" className="inline-icon" />
                  댓글 {selectedPost.comments.length}
                </div>
                {selectedPost.comments.map((comment) => (
                  <div key={comment.id} className="community-comment">
                    <div className="community-comment-meta">
                      {comment.author} · {formatDate(comment.createdAt)}
                    </div>
                    <div className="community-comment-body">{comment.body}</div>
                  </div>
                ))}

                <form className="community-comment-form" onSubmit={handleAddComment}>
                  {!user && (
                    <input
                      value={commentDraft.author}
                      onChange={(e) => setCommentDraft((v) => ({ ...v, author: e.target.value }))}
                      placeholder="이름 (선택)"
                    />
                  )}
                  <textarea
                    value={commentDraft.body}
                    onChange={(e) => setCommentDraft((v) => ({ ...v, body: e.target.value }))}
                    placeholder="댓글을 입력하세요"
                    rows={3}
                  />
                  <button className="btn btn-secondary" type="submit" disabled={submitting}>
                    댓글 등록
                  </button>
                </form>
              </div>
            </article>
          )}
        </section>

        <aside className="community-compose">
          <div className="community-compose-title">새 글 작성</div>
          <form onSubmit={handleCreatePost}>
            <label>
              제목
              <input
                value={draft.title}
                onChange={(e) => setDraft((v) => ({ ...v, title: e.target.value }))}
                placeholder="질문이나 공유할 내용을 적어보세요"
              />
            </label>
            <label>
              분류
              <select
                value={draft.category}
                onChange={(e) => setDraft((v) => ({ ...v, category: e.target.value }))}
              >
                {CATEGORIES.filter((item) => item !== '전체').map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            {!user && (
              <label>
                작성자
                <input
                  value={draft.author}
                  onChange={(e) => setDraft((v) => ({ ...v, author: e.target.value }))}
                  placeholder="익명"
                />
              </label>
            )}
            <label>
              내용
              <textarea
                value={draft.body}
                onChange={(e) => setDraft((v) => ({ ...v, body: e.target.value }))}
                placeholder="SQL 코드, 오류 메시지, 풀이 아이디어를 자유롭게 남겨보세요"
                rows={9}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={submitting || !!fsError}>
              {submitting ? '등록 중...' : '등록'}
            </button>
            {fsError && (
              <p style={{ fontSize: 11, color: 'var(--err)', marginTop: 6 }}>
                Firestore 오류로 글을 등록할 수 없습니다.
              </p>
            )}
          </form>
        </aside>
      </div>
    </div>
  );
}
