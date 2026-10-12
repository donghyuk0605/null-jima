export const JAPANESE_LEARN_DETAILS = {
  select: {
    syntax: 'SELECT column1, column2\nFROM table_name;',
    examples: [
      ['すべてのカラムを取得', '* を使うと、テーブルのすべてのカラムを取得できます。'],
      ['必要なカラムだけを取得', '取得したいカラム名をカンマで区切って指定します。'],
      ['ASで別名を付ける', 'ASを使うと結果のカラムに別名を付けられます。', 'SELECT name AS employee_name, salary AS employee_salary FROM employees;'],
    ],
    tips: ['実務では、必要なカラムを明示するとクエリの意図が伝わりやすくなります。', 'ASは省略できます。例: SELECT name employee_name FROM employees;'],
  },
  where: {
    syntax: 'SELECT column_name\nFROM table_name\nWHERE condition;',
    examples: [
      ['数値で絞り込む', '給与が6,000,000以上の社員を取得します。'],
      ['文字列で絞り込む', 'サンプルデータに登録されている名前と一致する社員を取得します。'],
      ['ANDで条件を組み合わせる', '両方の条件を満たす行だけを取得します。'],
    ],
    tips: ['=、!=、<>、>、>=、<、<=などの比較演算子を使えます。', 'ANDは両方の条件、ORはいずれかの条件を満たす行を選びます。', "文字列はシングルクォート(' ')で囲みます。"],
  },
  orderby: {
    syntax: 'SELECT column_name\nFROM table_name\nORDER BY column_name [ASC|DESC];',
    examples: [
      ['給与の高い順に並べる', 'DESCは降順です。大きい値から先に表示します。'],
      ['名前の昇順で並べる', 'ASCは昇順で、並べ替えの標準指定です。'],
      ['複数の基準で並べる', '最初のカラムが同じ場合は、次のカラムで並べ替えます。'],
    ],
    tips: ['ASCは標準の指定なので省略できます。', 'DESCを指定すると降順になります。', 'NULLの並び方はデータベースや並べ替えの指定によって異なります。'],
  },
  groupby: {
    syntax: 'SELECT group_column, COUNT(*)\nFROM table_name\nGROUP BY group_column;',
    examples: [
      ['部署別の社員数', '部署IDでグループを作り、COUNT()で社員数を数えます。', 'SELECT department_id, COUNT(*) AS employee_count FROM employees GROUP BY department_id;'],
      ['部署別の平均給与', 'AVG()でグループごとの平均値を求めます。', 'SELECT department_id, AVG(salary) AS avg_salary FROM employees GROUP BY department_id;'],
      ['カテゴリ別の商品数と平均価格', '複数の集計関数を同時に使えます。', 'SELECT category, COUNT(*) AS product_count, AVG(price) AS avg_price FROM products GROUP BY category;'],
    ],
    tips: ['SELECTに書く集計対象以外のカラムは、GROUP BYにも指定するのが基本です。', 'COUNT(*)は行数を数え、COUNT(column)はNULLを除いて数えます。', 'グループの集計結果を絞り込む場合はHAVINGを使います。'],
  },
  join: {
    syntax: 'SELECT a.column_name, b.column_name\nFROM table_a a\nJOIN table_b b ON a.key_column = b.key_column;',
    examples: [
      ['社員名と部署名を一緒に取得', 'employees.department_idとdepartments.idを基準に結合します。', 'SELECT e.name, d.name AS department_name\nFROM employees e\nJOIN departments d ON e.department_id = d.id;'],
      ['注文の詳細を取得', '3つのテーブルを順番にJOINできます。', 'SELECT e.name AS employee_name, p.name AS product_name, o.quantity\nFROM orders o\nJOIN employees e ON o.employee_id = e.id\nJOIN products p ON o.product_id = p.id;'],
    ],
    tips: ['INNER JOINは、両方のテーブルで結合条件を満たす行を返します。', 'LEFT JOINは左側の行をすべて残し、対応する右側の行がない場合はNULLを返します。', 'FROM employees eのように別名を付けると、カラムの所属が分かりやすくなります。'],
  },
  aggregate: {
    syntax: 'SELECT COUNT(*), SUM(column_name), AVG(column_name), MAX(column_name), MIN(column_name)\nFROM table_name;',
    examples: [
      ['全社員の人数', 'COUNT(*)はテーブルの行数を返します。', 'SELECT COUNT(*) AS employee_count FROM employees;'],
      ['給与の統計', '合計、平均、最大、最小を同時に求めます。', 'SELECT SUM(salary) AS total_salary, AVG(salary) AS avg_salary,\n       MAX(salary) AS max_salary, MIN(salary) AS min_salary\nFROM employees;'],
      ['カテゴリ別の在庫合計', 'GROUP BYとSUM()を組み合わせて集計します。', 'SELECT category, SUM(stock) AS total_stock\nFROM products\nGROUP BY category;'],
    ],
    tips: ['COUNT(*)はNULLを含む行も数え、COUNT(column)はそのカラムがNULLの行を除きます。', 'SUM、AVG、MAX、MINはNULLを集計対象から除きます。', 'グループの集計値に条件を付ける場合は、WHEREではなくHAVINGを使います。'],
  },
  subquery: {
    syntax: 'SELECT column_name\nFROM table_name\nWHERE column_name >= (SELECT AVG(column_name) FROM table_name);',
    examples: [
      ['平均給与以上の社員', 'サブクエリで平均給与を求め、その値を比較条件に使います。'],
      ['最も高い商品', 'MAX()で求めた最高価格と一致する商品を取得します。'],
    ],
    tips: ['サブクエリは括弧の中に書きます。', '1つの値を返す場合は、=、>、<などで比較できます。', '複数の値を返す場合はINやEXISTSを使います。SQLiteではANY/ALLによる比較は使えません。'],
  },
  having: {
    syntax: 'SELECT group_column, COUNT(*)\nFROM table_name\nGROUP BY group_column\nHAVING COUNT(*) >= 2;',
    examples: [
      ['社員が2名以上の部署', '部署ごとに人数を集計し、HAVINGで2名以上の部署だけを残します。', 'SELECT department_id, COUNT(*) AS employee_count\nFROM employees\nGROUP BY department_id\nHAVING COUNT(*) >= 2;'],
      ['平均給与が5,000,000以上の部署', 'AVG()の結果に条件を付けます。', 'SELECT department_id,\n  COUNT(*) AS employee_count,\n  AVG(salary) AS avg_salary\nFROM employees\nGROUP BY department_id\nHAVING AVG(salary) >= 5000000\nORDER BY avg_salary DESC;'],
      ['WHEREとHAVINGを組み合わせる', '先にWHEREで行を絞り、GROUP BYで集計し、HAVINGでグループを絞ります。', "SELECT department_id, COUNT(*) AS employee_count, SUM(salary) AS total_salary\nFROM employees\nWHERE hire_date >= '2020-01-01'\nGROUP BY department_id\nHAVING COUNT(*) >= 2\nORDER BY total_salary DESC;"],
    ],
    tips: ['WHEREは個別の行、HAVINGは集計したグループを絞り込みます。', 'WHEREに集計関数を直接書くことはできません。', '主な処理順序はFROM、WHERE、GROUP BY、HAVING、SELECT、ORDER BYです。'],
  },
  'case-when': {
    syntax: 'SELECT CASE\n  WHEN condition1 THEN value1\n  WHEN condition2 THEN value2\n  ELSE default_value\nEND AS result_value\nFROM table_name;\n\nCOALESCE(column_name, fallback_value)\nNULLIF(value1, value2)',
    examples: [
      ['給与等級の分類', 'CASE WHENで給与の範囲に応じた等級を返します。', "SELECT name, salary,\n  CASE\n    WHEN salary >= 7000000 THEN 'S'\n    WHEN salary >= 6000000 THEN 'A'\n    WHEN salary >= 5000000 THEN 'B'\n    ELSE 'C'\n  END AS salary_grade\nFROM employees\nORDER BY salary DESC;"],
      ['COALESCEでNULLを置き換える', '左から最初のNULLではない値を返します。部署IDがNULLならunassignedを表示します。', "SELECT name,\n  COALESCE(CAST(department_id AS TEXT), 'unassigned') AS department\nFROM employees;"],
      ['NULLIFで特定の値をNULLにする', 'NULLIF(a, b)は両方の値が等しい場合にNULLを返します。条件付き集計にはCASEも使えます。', 'SELECT name, salary,\n  salary / NULLIF(salary, 0) AS ratio\nFROM employees;\n\nSELECT\n  COUNT(CASE WHEN department_id = 1 THEN 1 END) AS development_count,\n  COUNT(CASE WHEN department_id = 2 THEN 1 END) AS marketing_count\nFROM employees;'],
    ],
    tips: ['CASEはSELECT、WHERE、ORDER BYなどで使えます。', 'NULLとの比較にはIS NULLまたはIS NOT NULLを使います。NULL = NULLの結果はUNKNOWNです。', 'COALESCE(a, b, c)は、左から最初のNULLではない値を返します。'],
  },
  window: {
    syntax: 'function_name() OVER (\n  PARTITION BY group_column\n  ORDER BY sort_column\n  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n)',
    examples: [
      ['RANK・DENSE_RANK・ROW_NUMBER', 'RANKは同順位の次の番号を飛ばし、DENSE_RANKは連番にします。ROW_NUMBERは各行に固有の番号を付けます。', 'SELECT name, salary,\n  RANK() OVER (ORDER BY salary DESC) AS salary_rank,\n  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_salary_rank,\n  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_number\nFROM employees;'],
      ['部署内の給与順位', 'PARTITION BYで部署ごとに区切り、それぞれの部署内で順位を求めます。', 'SELECT name, department_id, salary,\n  RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank\nFROM employees\nORDER BY department_id, dept_rank;'],
      ['LAG・LEADで前後の行を参照', 'LAGは前の行、LEADは次の行の値を返します。期間ごとの比較などに使います。', 'SELECT name, salary,\n  LAG(salary) OVER (ORDER BY salary) AS prev_salary,\n  LEAD(salary) OVER (ORDER BY salary) AS next_salary,\n  salary - LAG(salary) OVER (ORDER BY salary) AS salary_difference\nFROM employees\nORDER BY salary;'],
      ['SUM OVERで累積合計', 'ROWS BETWEENで集計範囲を指定します。この例は最初の行から現在行までの合計です。', 'SELECT name, salary,\n  SUM(salary) OVER (ORDER BY salary ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_salary\nFROM employees\nORDER BY salary;'],
    ],
    tips: ['PARTITION BYはグループを区切りますが、GROUP BYと異なり各行を残します。', 'RANKとDENSE_RANKは、同順位がある場合の次の順位が異なります。', 'LAG(column, N, default_value)はN行前を参照し、行がなければ既定値を返します。'],
  },
  'set-ops': {
    syntax: 'SELECT ... UNION SELECT ...\nSELECT ... UNION ALL SELECT ...\nSELECT ... INTERSECT SELECT ...\nSELECT ... EXCEPT SELECT ...',
    examples: [
      ['UNIONで重複を除いて結合', '開発部署の社員と高給与の社員を結合し、重複する行を除きます。'],
      ['UNION ALLでそのまま結合', '重複を除かずに結果を結合します。', "SELECT 'employee' AS entity_type, name AS entity_name FROM employees\nUNION ALL\nSELECT 'department', name FROM departments;"],
      ['INTERSECTで共通部分を取得', '高給与の社員の部署IDと、2021年以前に入社した社員の部署IDの共通部分を求めます。'],
      ['EXCEPTで差分を取得', '全社員のIDから注文した社員のIDを除きます。'],
    ],
    tips: ['両方のSELECTはカラム数を合わせます。結果のカラム名は最初のSELECTを基準にします。', 'UNIONは重複を除く処理が必要です。重複を残してよい場合はUNION ALLを使います。', '結果全体のORDER BYは最後に1回だけ書きます。'],
  },
};

export const JAPANESE_CERT_SUBJECTS = {
  '데이터 모델링의 이해': 'データモデリングの理解',
  'SQL 기본 및 활용': 'SQLの基本と活用',
  'SQL 고급활용 및 튜닝': '高度なSQLとチューニング',
  '설치·패치·업그레이드': 'インストール・パッチ・アップグレード',
  '백업·복구와 RMAN': 'バックアップ・リカバリとRMAN',
  '멀티테넌트': 'マルチテナント',
  '가용성·진단·보안': '可用性・診断・セキュリティ',
};

export const JAPANESE_CERT_DETAILS = {
  sqld: {
    org: 'KDATA（韓国データ産業振興院）',
    desc: '韓国のSQL資格です。データベース設計からSQLの実務活用までを学びます。',
    passCriteria: '合計60点以上、各科目40%以上',
    cardPassCriteria: '合計60点以上',
    frequency: '年4回の定期実施',
    keyTopics: ['SELECT / WHERE / ORDER BY / GROUP BY / HAVING', 'INNER・LEFT・RIGHT・SELF・CROSS JOIN', '単一行・複数行・スカラー・インラインビューのサブクエリ', 'UNION / INTERSECT / EXCEPT', 'ROW_NUMBER / RANK / LAG / LEAD', 'CASE WHEN / DECODE', 'NULL処理: NVL / COALESCE / NULLIF', 'DDL / DML / TCLの基本'],
    studyPlan: ['1～2週: SELECT、WHERE、ORDER BY、GROUP BYを学習', '3～4週: JOINとサブクエリを集中練習', '5週: 集合演算とウィンドウ関数', '6週: DDL・DML・TCLとデータモデリング', '7～8週: 練習問題と間違えた問題の復習'],
    subjects: [{ topics: ['エンティティ・属性・関係', '正規化', 'ERD', '識別子'] }, { topics: ['SELECT / WHERE / ORDER BY', 'JOIN・サブクエリ', '集合演算', 'ウィンドウ関数', 'TCL / DCL'] }],
  },
  sqlp: {
    org: 'KDATA（韓国データ産業振興院）',
    desc: 'データモデリング、高度なSQL、実行計画とチューニングを学ぶ専門資格です。',
    passCriteria: '合計60点以上、各科目40%以上',
    cardPassCriteria: '合計60点以上',
    frequency: '年2回',
    keyTopics: ['オプティマイザーと実行計画の分析', 'インデックスの種類と設計', 'テーブルのパーティション設計', '階層クエリ: CONNECT BY', '高度な分析関数', 'ロックとトランザクション管理', '大量データの処理', 'SQLチューニング'],
    studyPlan: ['SQLDの範囲を復習してから開始', '1～3週: 階層クエリと高度な分析関数', '4～6週: 実行計画とインデックス', '7～9週: チューニングの練習', '10～12週: 練習問題と実技の準備'],
    subjects: [{ topics: ['データモデル', '正規化', '関係とJOIN', '識別子'] }, { topics: ['高度なJOIN', 'サブクエリ', '階層クエリ', 'ウィンドウ関数'] }, { format: '選択式40問・40点 + 実技2問・30点', topics: ['オプティマイザー', 'インデックス設計', '実行計画', 'SQLチューニング'] }],
  },
  ocp: {
    desc: 'Oracle Database 19c管理者向けのProfessional資格です。練習問題は1Z0-083の高度な管理範囲を中心に構成しています。',
    examFormat: '資格取得の学習経路: 1Z0-082 + 1Z0-083',
    passCriteria: '練習基準65点以上（公式の合格基準はOracleで確認）',
    cardPassCriteria: '練習基準65点以上',
    frequency: '随時受験（Oracleの日程を確認）',
    keyTopics: ['Oracle Database 19cのインストールとアップグレード', 'Grid InfrastructureとOracle Restart', 'RMANのバックアップ・リカバリ戦略', 'リカバリカタログと時点リカバリ', 'CDB/PDBの作成・複製・再配置', 'マルチテナントのセキュリティと共通ユーザー', 'Data Guardの基本運用', 'パフォーマンス診断とリソース管理'],
    studyPlan: ['1～2週: 19cアーキテクチャとAdmin Iの復習', '3～4週: インストール・パッチ・アップグレード', '5～7週: RMANのバックアップ・リカバリ練習', '8～10週: CDB/PDBとマルチテナント運用', '11～12週: 障害対応と実戦形式の練習問題'],
    subjects: [
      { format: '練習問題7問', topics: ['Oracle Restart', 'パッチ', 'アップグレード', 'Grid Infrastructure'] },
      { format: '練習問題8問', topics: ['RMANバックアップ', 'リカバリカタログ', 'PITR', '複製・転送'] },
      { format: '練習問題9問', topics: ['CDB/PDB', 'クローン・再配置', '共通ユーザー', 'アプリケーションコンテナ'] },
      { format: '練習問題6問', topics: ['Data Guard', '診断', '監査', 'リソース管理'] },
    ],
  },
};
