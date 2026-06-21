const LEVEL_KEY = { '입문': 'lv.entry', '초급': 'lv.basic', '중급': 'lv.mid', '고급': 'lv.adv' };
const TAG_KEY = {
  '집계함수': 'tag.agg',
  '서브쿼리': 'tag.sub',
  '윈도우함수': 'tag.win',
  '상관서브쿼리': 'tag.correlatedSubquery',
};

const TEXT_REPLACEMENTS = [
  ['NULL지마', 'nullジマ'],
  ['쿼리', 'クエリ'],
  ['직원수', 'employee_count'], ['평균급여', 'avg_salary'], ['최고급여', 'max_salary'], ['최저급여', 'min_salary'],
  ['총급여', 'total_salary'], ['부서총급여', 'dept_total_salary'], ['총금액', 'total_amount'], ['주문금액', 'order_amount'],
  ['누적금액', 'running_amount'], ['총주문금액', 'total_order_amount'], ['직원이름', 'employee_name'],
  ['직원명', 'employee_name'], ['부서명', 'department_name'], ['상품명', 'product_name'], ['직원', 'employee'],
  ['부서', 'department'], ['상품', 'product'], ['이름', 'name'], ['급여', 'salary'], ['연봉', 'annual_salary'],
  ['급여등급', 'salary_grade'], ['부서내순위', 'dept_rank'], ['누적급여합', 'running_salary'],
  ['이전급여', 'prev_salary'], ['다음급여', 'next_salary'], ['이동평균', 'moving_avg'], ['비율', 'ratio'],
  ['입사연도', 'hire_year'], ['입사월', 'hire_month'], ['입사일', 'hire_date'], ['이름길이', 'name_length'],
  ['전체직원수', 'employee_count'], ['전체평균', 'overall_avg'], ['고급여', 'high_salary'], ['일반급여', 'normal_salary'],
  ['미배정', 'unassigned'], ['개발팀', 'Development'], ['마케팅팀', 'Marketing'], ['영업팀', 'Sales'], ['인사팀', 'HR'],
  ['전자제품', 'Electronics'], ['가구', 'Furniture'], ['사무용품', 'OfficeSupplies'],
  ['노트북', 'Laptop'], ['마우스', 'Mouse'], ['키보드', 'Keyboard'], ['모니터', 'Monitor'], ['책상', 'Desk'],
  ['의자', 'Chair'], ['화이트보드', 'Whiteboard'], ['볼펜세트', 'PenSet'],
  ['대기', 'pending'], ['처리', 'processing'], ['완료', 'done'], ['취소', 'cancelled'],
  ['홍길동', 'Taro'], ['김철수', 'Jiro'], ['이영희', 'Hanako'], ['박민수', 'Minato'],
  ['부모', 'parent'], ['자녀', 'child'], ['테스트', 'test'], ['삭제예정', 'to_delete'],
  ['구조', 'schema'], ['데이터', 'data'], ['복사', 'copy'], ['없음', 'none'], ['확인', 'check'],
  ['오류', 'error'], ['발견', 'found'], ['취소됨', 'rolled_back'], ['유지', 'kept'], ['중복', 'duplicate'],
  ['무시', 'ignore'], ['삭제', 'delete'], ['재삽입', 'reinsert'], ['업데이트됨', 'updated'],
  ['정수', 'integer'], ['부동소수점', 'real'], ['문자열', 'text'], ['바이너리', 'binary'], ['불리언', 'boolean'],
  ['날짜', 'date'], ['테이블', 'table'], ['컬럼', 'column'], ['정보', 'info'], ['목록', 'list'],
  ['외래키', 'foreign_key'], ['활성화', 'enabled'], ['상태', 'status'], ['오브젝트', 'object'],
  ['뷰', 'view'], ['인덱스', 'index'], ['생성', 'create'], ['추가', 'add'], ['변경', 'change'],
  ['조회', 'query'], ['성능', 'performance'], ['향상', 'improve'], ['조건', 'condition'], ['방지', 'prevent'],
  ['복합', 'composite'], ['단일', 'single'], ['기준', 'base'], ['같은', 'same'], ['유저', 'user'], ['타입', 'type'],
];

export const sanitizeJapaneseText = (value) => {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(sanitizeJapaneseText);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeJapaneseText(item)]));
  }
  if (typeof value !== 'string') return value;
  return TEXT_REPLACEMENTS.reduce(
    (text, [from, to]) => text.replaceAll(from, to),
    value
  ).replace(/[가-힣]+/g, 'jp');
};

const jaSafe = (value, language) => (language === 'ja' ? sanitizeJapaneseText(value) : value);

const JA_PROBLEMS = {
  1: ['全社員を表示', 'employeesテーブルからすべての社員情報を取得してください。', ['SELECT * を使うと全カラムを取得できます。', 'FROM句に取得するテーブル名を書きます。', 'SELECT * FROM employees;']],
  2: ['社員名と給与を表示', 'employeesテーブルから社員の名前(name)と給与(salary)だけを取得してください。', ['SELECT句に必要なカラム名を並べます。', 'SELECT name, salary の形で書いてみましょう。', 'SELECT name, salary FROM employees;']],
  3: ['全部署を表示', 'departmentsテーブルからすべての部署情報を取得してください。', ['departmentsテーブルを参照します。', 'SELECT * を使います。', 'SELECT * FROM departments;']],
  4: ['全商品を表示', 'productsテーブルからすべての商品情報を取得してください。', ['productsテーブルを参照します。', 'SELECT * を使います。', 'SELECT * FROM products;']],
  5: ['高給与の社員を表示', 'employeesテーブルから給与(salary)が6,000,000以上の社員をすべて取得してください。', ['WHERE句で条件を指定できます。', 'salary >= 6000000 条件を使います。', 'SELECT * FROM employees WHERE salary >= 6000000;']],
  6: ['開発チームの社員を表示', 'employeesテーブルから開発チーム(department_id = 1)の社員だけを取得してください。', ['WHERE句で部署を絞り込みます。', 'department_id = 1 条件を使います。', 'SELECT * FROM employees WHERE department_id = 1;']],
  7: ['2021年以降入社の社員', "employeesテーブルから2021年1月1日以降に入社した社員を取得してください。\n(hire_date >= '2021-01-01')", ["日付比較は文字列比較として扱えます。'2021-01-01' の形を使います。", "WHERE hire_date >= '2021-01-01' 条件を使います。", "SELECT * FROM employees WHERE hire_date >= '2021-01-01';"]],
  8: ['給与が高い順に並べる', 'employeesテーブルから社員を給与(salary)の高い順(降順)で取得してください。', ['ORDER BY句で並び替えの基準を指定します。', 'DESCは降順、大きい値から並べる指定です。', 'SELECT * FROM employees ORDER BY salary DESC;']],
  9: ['給与上位3名', 'employeesテーブルから給与が最も高い社員を3名だけ取得してください。', ['LIMITで返す行数を制限できます。', '先にORDER BY salary DESCで並べ、LIMITを使います。', 'SELECT * FROM employees ORDER BY salary DESC LIMIT 3;']],
  10: ['カテゴリ一覧を表示', 'productsテーブルから商品カテゴリ(category)の種類を重複なしで取得してください。', ['DISTINCTを使うと重複行を除外できます。', 'SELECT DISTINCT category の形で使います。', 'SELECT DISTINCT category FROM products;']],
  11: ['部署別の社員数', 'employeesテーブルで部署(department_id)ごとの社員数を取得してください。\nカラム名: department_id, 직원수', ['GROUP BYを使うとグループごとに集計できます。', 'COUNT(*) は行数を数えます。', 'SELECT department_id, COUNT(*) AS 직원수 FROM employees GROUP BY department_id;']],
  12: ['部署別の平均給与', 'employeesテーブルで部署(department_id)ごとの平均給与を取得してください。\nカラム名: department_id, 평균급여', ['AVG()関数は平均値を計算します。', 'GROUP BY department_idで部署ごとのグループを作ります。', 'SELECT department_id, AVG(salary) AS 평균급여 FROM employees GROUP BY department_id;']],
  13: ['社員名と部署名を一緒に表示', 'employeesとdepartmentsテーブルをJOINして、社員名(name)と部署名(departments.name)を取得してください。', ['JOINは2つのテーブルを結合します。', 'employees.department_id = departments.id で結合します。', 'SELECT e.name, d.name FROM employees e JOIN departments d ON e.department_id = d.id;']],
  14: ['注文金額の合計', 'ordersとproductsをJOINして、各注文の合計金額(quantity * price)を取得してください。\nカラム: orders.id, 총금액', ['ordersとproductsをproduct_idでJOINします。', 'quantity * priceで注文金額を計算できます。', 'SELECT o.id, o.quantity * p.price AS 총금액 FROM orders o JOIN products p ON o.product_id = p.id;']],
  15: ['社員が2名以上の部署', 'employeesテーブルで社員が2名以上いる部署のdepartment_idと社員数を取得してください。', ['HAVINGはGROUP BY後の集計条件に使います。', 'COUNT(*) >= 2 条件をHAVINGに書きます。', 'SELECT department_id, COUNT(*) AS 직원수 FROM employees GROUP BY department_id HAVING COUNT(*) >= 2;']],
  16: ['平均給与以上の社員', 'サブクエリを使い、全体の平均給与以上の社員の名前と給与を取得してください。', ['サブクエリは括弧の中にSELECTを入れます。', 'WHERE salary >= (SELECT AVG(salary) FROM employees) の形を使います。', 'SELECT name, salary FROM employees WHERE salary >= (SELECT AVG(salary) FROM employees);']],
  17: ['カテゴリ別の最高価格商品', 'productsテーブルでカテゴリごとの最高価格(MAX)を取得し、価格の降順で並べてください。\nカラム: category, 최고가격', ['MAX()関数は最大値を返します。', 'GROUP BY categoryでカテゴリごとにまとめます。', 'SELECT category, MAX(price) AS 최고가격 FROM products GROUP BY category ORDER BY 최고가격 DESC;']],
  18: ['社員別の総注文金額', 'orders, employees, productsの3テーブルをJOINして、社員別の総注文金額を取得してください。\nカラム: 직원이름, 총주문금액 / 金額の降順', ['3つのテーブルを順番にJOINします: orders -> employees, orders -> products', 'SUM(o.quantity * p.price)で総金額を計算します。', 'SELECT e.name AS 직원이름, SUM(o.quantity * p.price) AS 총주문금액 FROM orders o JOIN employees e ON o.employee_id = e.id JOIN products p ON o.product_id = p.id GROUP BY e.name ORDER BY 총주문금액 DESC;']],
  19: ['給与範囲で検索', 'employeesテーブルから給与が4,000,000以上6,000,000以下の社員をすべて取得してください。', ['BETWEEN a AND b はa以上b以下を意味します。', 'WHERE salary BETWEEN 4000000 AND 6000000 の形で書きます。', 'SELECT * FROM employees WHERE salary BETWEEN 4000000 AND 6000000;']],
  20: ["名前が'김'で始まる社員", "employeesテーブルから名前が'김'で始まる社員を取得してください。", ['LIKE演算子とワイルドカード%を使います。', "% は任意の文字列を意味します。'김%' は'김'で始まるすべての文字列です。", "SELECT * FROM employees WHERE name LIKE '김%';"]],
  21: ['特定部署の社員を表示', 'employeesテーブルから開発チーム(1番)と営業チーム(3番)所属の社員を取得してください。\nIN演算子を使います。', ['IN (値1, 値2, ...) は複数の値のどれかに一致する行を取得します。', 'WHERE department_id IN (1, 3) の形で使います。', 'SELECT * FROM employees WHERE department_id IN (1, 3);']],
  22: ['2番目に高い商品', 'productsテーブルから2番目に高い商品を1件取得してください。\nOFFSETを活用します。', ['ORDER BY price DESCで価格の降順に並べてからLIMITを使います。', 'LIMIT 1 OFFSET 1 は2行目を1件返します。', 'SELECT * FROM products ORDER BY price DESC LIMIT 1 OFFSET 1;']],
  23: ['2022年以降入社の高給与社員', 'employeesテーブルから2022年1月1日以降に入社し、給与が5,000,000以上の社員を取得してください。', ['ANDで2つの条件を両方満たす行を取得します。', "hire_date >= '2022-01-01' AND salary >= 5000000 条件を使います。", "SELECT * FROM employees WHERE hire_date >= '2022-01-01' AND salary >= 5000000;"]],
  24: ['全部署の社員数(社員なし部署を含む)', 'departmentsとemployeesをLEFT JOINして、すべての部署名(name)と社員数(직원수)を取得してください。\n社員がいない部署は0と表示します。', ['LEFT JOINは左側テーブルのすべての行を残します。', 'COUNT(e.id)はJOINされた社員がなければ0を返します。', 'SELECT d.name, COUNT(e.id) AS 직원수 FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id, d.name;']],
  25: ['給与等級の分類', "社員名(name)、給与(salary)、給与等級を取得してください。\n給与等級の基準:\n- 7,000,000以上: 'S'\n- 6,000,000以上: 'A'\n- 5,000,000以上: 'B'\n- その他: 'C'\n給与の降順で並べてください。", ['CASE WHEN ... THEN ... END構文をSELECT句で使います。', 'WHEN条件は上から順番に評価されます。', "SELECT name, salary, CASE WHEN salary >= 7000000 THEN 'S' WHEN salary >= 6000000 THEN 'A' WHEN salary >= 5000000 THEN 'B' ELSE 'C' END AS 급여등급 FROM employees ORDER BY salary DESC;"]],
  26: ['部署名別の平均給与と最高給与', 'departmentsとemployeesをJOINして、部署名(부서명)、平均給与、最高給与を取得してください。\n平均給与の降順で並べます。', ['JOIN後にGROUP BY d.nameで部署名ごとに集計します。', 'AVG(e.salary), MAX(e.salary)を使います。', 'SELECT d.name AS 부서명, AVG(e.salary) AS 평균급여, MAX(e.salary) AS 최고급여 FROM employees e JOIN departments d ON e.department_id = d.id GROUP BY d.id, d.name ORDER BY 평균급여 DESC;']],
  27: ['総注文金額が高い社員(上位3名)', 'orders, employees, productsをJOINして、総注文金額(quantity * priceの合計)が高い社員名と総注文金額を上位3名だけ取得してください。', ['3つのテーブルをJOINし、社員ごとにGROUP BY e.id, e.name します。', 'SUM(o.quantity * p.price)で総注文金額を求めます。', 'SELECT e.name AS 직원이름, SUM(o.quantity * p.price) AS 총주문금액 FROM orders o JOIN employees e ON o.employee_id = e.id JOIN products p ON o.product_id = p.id GROUP BY e.id, e.name ORDER BY 총주문금액 DESC LIMIT 3;']],
  28: ['部署内の給与順位', '各社員の名前、部署ID、給与、そしてその部署内での給与順位(RANK)を取得してください。\n部署ID昇順 -> 部署内順位昇順で並べます。', ['RANK() OVER (PARTITION BY ... ORDER BY ...) 構文を使います。', 'PARTITION BY department_idで部署ごとの順位を付けます。', 'SELECT name, department_id, salary, RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS 부서내순위 FROM employees ORDER BY department_id, 부서내순위;']],
  29: ['注文がない社員を表示', 'employeesテーブルから一度も注文していない社員の名前と部署IDを取得してください。\nNOT INまたはNOT EXISTSを使います。', ['NOT IN (サブクエリ)でordersに存在しない社員を探します。', 'SELECT DISTINCT employee_id FROM orders で注文した社員ID一覧を取得します。', 'SELECT name, department_id FROM employees WHERE id NOT IN (SELECT DISTINCT employee_id FROM orders);']],
  30: ['月別の累積注文金額', 'ordersとproductsをJOINして、注文日(order_date)、注文金額(quantity*price)、注文日順の累積金額を取得してください。\n注文日の昇順で並べます。', ['SUM() OVER (ORDER BY ...) 構文で累積合計を求めます。', 'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW は最初の行から現在行までの合計です。', 'SELECT o.order_date, o.quantity * p.price AS 주문금액, SUM(o.quantity * p.price) OVER (ORDER BY o.order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS 누적금액 FROM orders o JOIN products p ON o.product_id = p.id ORDER BY o.order_date;']],
  31: ['部署平均より給与が高い社員', '各社員について、自分が所属する部署の平均給与より高い社員の名前、部署ID、給与を取得してください。\n相関サブクエリを使います。', ['相関サブクエリは外側クエリのカラムを内側クエリで参照します。', 'サブクエリで WHERE department_id = e.department_id とし、同じ部署の平均を求めます。', 'SELECT name, department_id, salary FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id);']],
  32: ['部署別の給与等級人数集計', '各部署ごとに給与が6,000,000以上の高給与社員数(고급여)と、それ未満の社員数(일반급여)を取得してください。\nCASE WHENとSUMを組み合わせます。', ['SUM(CASE WHEN 条件 THEN 1 ELSE 0 END) パターンで条件付き集計ができます。', 'CASE WHEN salary >= 6000000 THEN 1 ELSE 0 END で高給与かどうかを0/1に変換します。', 'SELECT department_id, SUM(CASE WHEN salary >= 6000000 THEN 1 ELSE 0 END) AS 고급여, SUM(CASE WHEN salary < 6000000 THEN 1 ELSE 0 END) AS 일반급여 FROM employees GROUP BY department_id;']],
};

const JA_LEARN = {
  select: ['SELECT', '必要なカラムを取得する', 'SELECTはテーブルからデータを取得する最も基本的な命令です。'],
  where: ['WHERE', '条件でデータを絞り込む', 'WHERE句は条件に合う行だけを取得するときに使います。'],
  orderby: ['ORDER BY', '好きな基準で並べ替える', 'ORDER BYは取得結果を特定のカラム基準で並べ替えます。'],
  groupby: ['GROUP BY', 'グループごとに集計する', 'GROUP BYは同じ値を持つ行をグループ化し、集計関数と一緒に使います。'],
  join: ['JOIN', '複数テーブルをつなぐ', 'JOINは共通カラムを基準に複数テーブルのデータを結合します。'],
  aggregate: ['集計関数', 'COUNT / SUM / AVG', '集計関数は複数行のデータを1つの値に要約します。'],
  subquery: ['サブクエリ', 'SELECTの中のSELECT', 'サブクエリはクエリの中に入る別のクエリです。集計結果を条件に使うときに便利です。'],
  having: ['HAVING', 'グループに条件を付ける', 'HAVINGはGROUP BYで作られたグループに条件を適用します。WHEREが行を絞るなら、HAVINGはグループを絞ります。'],
  'case-when': ['CASE WHEN / NULL処理', '条件付き変換とNULLの扱い', 'CASE WHENは条件によって返す値を変えるSQLのif-elseです。NULLは「不明な値」なので専用の扱いが必要です。'],
  window: ['ウィンドウ関数', 'グループ集計 + 行を維持', 'ウィンドウ関数は集計しながらも各行を残して結果を表示します。SQLD/SQLPでも重要な概念です。'],
  'set-ops': ['集合演算', 'UNION / INTERSECT / EXCEPT', '集合演算は2つのSELECT結果を結合したり、共通部分や差分を求めたりします。'],
};

const localizeProblem = (problem, language) => {
  if (language !== 'ja') return problem;
  const entry = JA_PROBLEMS[problem.id];
  if (!entry) return problem;
  return {
    ...problem,
    title: sanitizeJapaneseText(entry[0]),
    description: sanitizeJapaneseText(entry[1]),
    hints: sanitizeJapaneseText(entry[2] || problem.hints),
    displayAnswer: sanitizeJapaneseText(problem.answer),
  };
};

export const localizeProblems = (problems, language) => problems.map((problem) => localizeProblem(problem, language));

export const localizeLearnTopic = (topic, language) => {
  if (language !== 'ja') return topic;
  const entry = JA_LEARN[topic.id];
  if (!entry) return topic;
  return {
    ...topic,
    title: entry[0],
    subtitle: entry[1],
    description: entry[2],
    syntax: sanitizeJapaneseText(topic.syntax),
    examples: sanitizeJapaneseText(topic.examples),
    tips: sanitizeJapaneseText(topic.tips),
  };
};

export const localizeLearnTopics = (topics, language) => topics.map((topic) => localizeLearnTopic(topic, language));

export const translateLevel = (level, t) => t(LEVEL_KEY[level] || level);

export const translateTag = (tag, t) => t(TAG_KEY[tag] || tag);

export const localizeCert = (cert, language) => {
  if (!cert) return cert;
  if (language !== 'ja') return cert;
  return {
    ...sanitizeJapaneseText(cert),
    level: cert.level,
    name: cert.name,
    fullName: cert.fullName,
    color: cert.color,
    examTime: cert.examTime,
    totalQ: cert.totalQ,
    totalScore: cert.totalScore,
  };
};

export const localizeCerts = (certs, language) => certs.map((cert) => localizeCert(cert, language));

export const localizeQuiz = (quiz, language) => {
  if (language !== 'ja') return quiz;
  return quiz.map((q) => ({
    ...sanitizeJapaneseText(q),
    id: q.id,
    answer: q.answer,
    sql: q.sql ? sanitizeJapaneseText(q.sql) : q.sql,
  }));
};

export const localizePosts = (posts, language) => posts.map((post) => {
  if (language !== 'ja') return post;
  const localized = sanitizeJapaneseText(post);
  return {
    ...localized,
    id: post.id,
    category: post.category,
    likes: post.likes,
    createdAt: post.createdAt,
    comments: post.comments?.map((comment) => ({
      ...sanitizeJapaneseText(comment),
      id: comment.id,
      createdAt: comment.createdAt,
    })) ?? [],
  };
});

export const localizeExampleGroups = (groups, language) => groups.map((group) => jaSafe(group, language));
