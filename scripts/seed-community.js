import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD0VxqRkFczHPXrUbHX5tQh817u6HpkVnk',
  authDomain: 'null-jima.firebaseapp.com',
  projectId: 'null-jima',
  storageBucket: 'null-jima.firebasestorage.app',
  messagingSenderId: '538909356664',
  appId: '1:538909356664:web:215f1146dedc0853b4f38d',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const POSTS = [
  {
    title: 'GROUP BY 없이 COUNT 썼더니 오류가 나요',
    category: '질문',
    author: 'sql초보',
    body: 'SELECT department_id, COUNT(*) FROM employees 이렇게 쓰면 오류가 나는데 왜 그런가요? COUNT(*) 쓰면 자동으로 집계되는 거 아닌가요?',
    createdAt: new Date('2026-03-05T10:00:00Z'),
    likes: 4,
    comments: [
      {
        id: 'c1',
        author: '쿼리고수',
        body: 'SELECT에 집계 함수가 아닌 컬럼(department_id)이 있으면 반드시 GROUP BY에 포함해야 합니다. SELECT department_id, COUNT(*) FROM employees GROUP BY department_id; 로 써보세요.',
        createdAt: '2026-03-05T10:30:00Z',
      },
    ],
  },
  {
    title: 'HAVING vs WHERE 언제 쓰는지 정리',
    category: '팁',
    author: '데이터분석가K',
    body: `헷갈리는 분들을 위해 정리했습니다.
- WHERE: GROUP BY 이전에 행을 필터링 (집계 함수 사용 불가)
- HAVING: GROUP BY 이후 그룹을 필터링 (집계 함수 사용 가능)

예시:
-- 월급 500만원 이상인 사람만 집계
SELECT dept, COUNT(*) FROM employees
WHERE salary >= 5000000
GROUP BY dept
HAVING COUNT(*) >= 2;`,
    createdAt: new Date('2026-03-10T09:00:00Z'),
    likes: 12,
    comments: [],
  },
  {
    title: 'NULL 값 비교할 때 = 쓰면 안 되는 이유',
    category: '팁',
    author: 'NULL지마봇',
    body: `NULL은 "알 수 없는 값"이라서 = 연산자로 비교하면 항상 UNKNOWN이 됩니다.
즉, NULL = NULL도 TRUE가 아닙니다!

잘못된 예:
WHERE department_id = NULL  -- 항상 결과 없음

올바른 예:
WHERE department_id IS NULL
WHERE department_id IS NOT NULL

SQLD 시험에 자주 나오는 개념입니다.`,
    createdAt: new Date('2026-03-12T14:00:00Z'),
    likes: 9,
    comments: [
      {
        id: 'c2',
        author: '시험준비생',
        body: 'SQLD 공부하면서 이거 틀렸었는데 정리 감사합니다!',
        createdAt: '2026-03-12T15:00:00Z',
      },
    ],
  },
  {
    title: '문제 10번 서브쿼리 풀이 공유',
    category: '풀이 공유',
    author: '쿼리메이커',
    body: `평균 급여보다 높은 직원 조회 문제입니다.

SELECT name, salary
FROM employees
WHERE salary > (
  SELECT AVG(salary) FROM employees
)
ORDER BY salary DESC;

핵심은 WHERE 절에 스칼라 서브쿼리를 넣는 것!
AVG를 밖에서 계산하면 GROUP BY 없이는 SELECT에 name이랑 같이 못 씁니다.`,
    createdAt: new Date('2026-03-15T11:00:00Z'),
    likes: 7,
    comments: [
      {
        id: 'c3',
        author: '초보탈출',
        body: '스칼라 서브쿼리라는 개념을 몰랐는데 덕분에 이해했어요!',
        createdAt: '2026-03-15T12:00:00Z',
      },
      {
        id: 'c4',
        author: '쿼리메이커',
        body: '스칼라 서브쿼리는 단일 행 단일 열을 반환하는 서브쿼리입니다. WHERE, SELECT, HAVING 절 어디서도 쓸 수 있어요.',
        createdAt: '2026-03-15T12:30:00Z',
      },
    ],
  },
  {
    title: 'RANK vs DENSE_RANK vs ROW_NUMBER 차이점',
    category: '팁',
    author: '윈도우함수마스터',
    body: `세 함수 모두 순위를 매기지만 동점 처리 방식이 다릅니다.

급여: 7200, 6500, 6100, 6100, 5800 인 경우

RANK:       1, 2, 3, 3, 5  (동점 다음은 건너뜀)
DENSE_RANK: 1, 2, 3, 3, 4  (동점 다음은 이어서)
ROW_NUMBER: 1, 2, 3, 4, 5  (무조건 고유 번호)

SQLD에서 RANK/DENSE_RANK 차이를 묻는 문제가 자주 출제됩니다!`,
    createdAt: new Date('2026-03-18T16:00:00Z'),
    likes: 15,
    comments: [],
  },
  {
    title: 'JOIN할 때 ON vs WHERE 어디에 조건 쓰나요?',
    category: '질문',
    author: '조인헷갈림',
    body: 'LEFT JOIN할 때 ON 절에 조건 쓰는 것과 WHERE 절에 조건 쓰는 게 결과가 다른 경우가 있던데 언제 어디에 써야 하나요?',
    createdAt: new Date('2026-03-20T09:00:00Z'),
    likes: 6,
    comments: [
      {
        id: 'c5',
        author: '조인전문가',
        body: `INNER JOIN은 ON/WHERE 위치가 결과에 영향 없습니다.
LEFT JOIN은 다릅니다:
- ON에 조건: 오른쪽 테이블 필터링 후 조인 (왼쪽 행은 유지)
- WHERE에 조건: 조인 후 전체 결과 필터링 (NULL 행도 제거됨)

예시:
-- 모든 부서 + 급여 6000이상인 직원만 (직원 없으면 NULL)
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id AND e.salary >= 6000000`,
        createdAt: '2026-03-20T10:00:00Z',
      },
    ],
  },
  {
    title: 'SQLD 2과목 SQL 활용 공부 방법',
    category: '자유',
    author: '자격증준비',
    body: `SQLD 시험 준비 중인데 2과목이 너무 어렵네요. 윈도우 함수, 서브쿼리, 계층형 쿼리... 이 앱에서 연습하고 있는데 순서가 있을까요?`,
    createdAt: new Date('2026-03-22T13:00:00Z'),
    likes: 3,
    comments: [
      {
        id: 'c6',
        author: 'SQLD합격자',
        body: '① SELECT/WHERE/GROUP BY 기본 → ② JOIN → ③ 서브쿼리 → ④ CASE WHEN → ⑤ 윈도우함수 순서로 하시면 됩니다. 이 앱 학습도우미 탭이 그 순서로 되어있어요!',
        createdAt: '2026-03-22T14:00:00Z',
      },
    ],
  },
];

async function seed() {
  const col = collection(db, 'community');

  // 이미 데이터가 있으면 추가만 함
  const existing = await getDocs(query(col, limit(1)));
  if (!existing.empty) {
    console.log('기존 데이터 있음 — 새 글만 추가합니다.');
  }

  for (const post of POSTS) {
    const ref = await addDoc(col, post);
    console.log(`✓ 추가: [${post.category}] ${post.title} (${ref.id})`);
  }

  console.log(`\n완료: ${POSTS.length}개 게시글 추가됨`);
  process.exit(0);
}

seed().catch((e) => {
  console.error('오류:', e.message);
  process.exit(1);
});
