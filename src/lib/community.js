import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  getDocs, limit, writeBatch, Timestamp,
  increment, arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';

const POSTS_COL = 'community';

// ── helpers ──────────────────────────────────────────────

const makeId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toIso = (v) => {
  if (!v) return new Date().toISOString();
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v?.toDate) return v.toDate().toISOString();
  return String(v);
};

const normalizePost = (id, data) => ({
  id,
  ...data,
  likes: Number(data.likes) || 0,
  createdAt: toIso(data.createdAt),
  comments: (data.comments || []).map((c) => ({ ...c, createdAt: toIso(c.createdAt) })),
});

// ── seed data ────────────────────────────────────────────

export const SEED_POSTS = [
  {
    title: 'JOIN 문제에서 테이블 순서가 헷갈릴 때',
    category: '질문',
    author: '초급러',
    body: 'orders, employees, products를 같이 쓰는 문제에서 어떤 테이블부터 잡아야 할지 자주 헷갈립니다. 기준 테이블을 정하는 좋은 방법이 있을까요?',
    createdAt: '2026-01-10T09:00:00.000Z',
    likes: 3,
    comments: [
      {
        id: 'seed-join-comment',
        author: 'NULL지마',
        body: '문제에서 무엇을 한 행으로 보고 싶은지 먼저 잡아보세요. 주문 목록이면 orders가 기준이고, 직원별 합계면 employees나 GROUP BY 대상이 기준이 됩니다.',
        createdAt: '2026-01-10T09:20:00.000Z',
      },
    ],
  },
  {
    title: 'GROUP BY 연습할 때 쓰는 체크리스트',
    category: '팁',
    author: '쿼리메이트',
    body: 'SELECT에 집계 함수가 아닌 컬럼이 있으면 GROUP BY에 들어가는지 먼저 확인합니다. 그 다음 HAVING과 WHERE의 역할을 분리하면 실수가 줄어듭니다.',
    createdAt: '2026-01-08T11:30:00.000Z',
    likes: 5,
    comments: [],
  },
];

// ── Firestore CRUD ───────────────────────────────────────

export function subscribeToPosts(callback, onError) {
  const q = query(collection(db, POSTS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => normalizePost(d.id, d.data())));
    },
    (err) => {
      console.error('[community] onSnapshot error:', err);
      if (onError) onError(err);
    }
  );
}

export async function seedPostsIfEmpty() {
  const col = collection(db, POSTS_COL);
  const snap = await getDocs(query(col, limit(1)));
  if (!snap.empty) return;

  const batch = writeBatch(db);
  for (const post of SEED_POSTS) {
    batch.set(doc(col), {
      ...post,
      createdAt: new Date(post.createdAt),
    });
  }
  await batch.commit();
}

export async function addPost({ title, category, author, body, uid, displayName, language = 'ko' }) {
  return addDoc(collection(db, POSTS_COL), {
    title: title.trim(),
    category,
    author: (displayName || author || '익명').trim(),
    authorUid: uid || null,
    language,
    body: body.trim(),
    createdAt: serverTimestamp(),
    likes: 0,
    likedBy: [],
    comments: [],
  });
}

export async function likePost(postId) {
  await updateDoc(doc(db, POSTS_COL, postId), { likes: increment(1) });
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, POSTS_COL, postId));
}

export async function editPost(postId, { title, category, body }) {
  await updateDoc(doc(db, POSTS_COL, postId), {
    title: title.trim(),
    category,
    body: body.trim(),
  });
}

export async function addComment(postId, { author, body, uid, displayName }) {
  const comment = {
    id: makeId(),
    author: (displayName || author || '익명').trim(),
    authorUid: uid || null,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
  await updateDoc(doc(db, POSTS_COL, postId), { comments: arrayUnion(comment) });
}
