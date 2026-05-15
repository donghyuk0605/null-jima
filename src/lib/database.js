let db = null;

export async function initDB() {
  if (db) return db;

  const SQL = await window.initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
  db = new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      budget INTEGER
    );
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      department_id INTEGER,
      salary INTEGER,
      hire_date TEXT,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      price REAL,
      stock INTEGER
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      employee_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      order_date TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  const existing = db.exec("SELECT COUNT(*) FROM employees")[0].values[0][0];
  if (existing === 0) {
    db.run(`
      INSERT INTO departments VALUES
        (1, '개발팀', 5000000),
        (2, '마케팅팀', 3000000),
        (3, '영업팀', 4000000),
        (4, '인사팀', 2000000);

      INSERT INTO employees VALUES
        (1,  '김민준', 1, 6500000, '2020-03-15'),
        (2,  '이서연', 1, 5800000, '2021-07-01'),
        (3,  '박지훈', 2, 4200000, '2019-11-20'),
        (4,  '최유나', 3, 5100000, '2022-01-10'),
        (5,  '정도윤', 1, 7200000, '2018-05-30'),
        (6,  '강하은', 4, 3900000, '2023-02-14'),
        (7,  '조시우', 2, 4600000, '2020-09-05'),
        (8,  '윤아름', 3, 5500000, '2021-04-22'),
        (9,  '임재원', 1, 6100000, '2022-08-11'),
        (10, '한소율', 4, 3700000, '2023-06-01');

      INSERT INTO products VALUES
        (1, '노트북',    '전자제품', 1200000, 50),
        (2, '마우스',    '전자제품',   35000, 200),
        (3, '키보드',    '전자제품',   85000, 150),
        (4, '모니터',    '전자제품',  450000, 80),
        (5, '책상',      '가구',      320000, 30),
        (6, '의자',      '가구',      280000, 45),
        (7, '화이트보드','사무용품',   150000, 20),
        (8, '볼펜세트',  '사무용품',   12000, 500);

      INSERT INTO orders VALUES
        (1,  1, 1, 2, '2024-01-05'),
        (2,  3, 3, 5, '2024-01-12'),
        (3,  5, 4, 1, '2024-02-01'),
        (4,  2, 2, 3, '2024-02-15'),
        (5,  7, 5, 2, '2024-03-03'),
        (6,  4, 6, 1, '2024-03-18'),
        (7,  9, 1, 1, '2024-04-07'),
        (8,  1, 8, 10,'2024-04-20'),
        (9,  6, 7, 1, '2024-05-02'),
        (10, 8, 3, 2, '2024-05-15'),
        (11, 5, 2, 5, '2024-06-01'),
        (12, 2, 4, 2, '2024-06-20');
    `);
  }

  // Create customers + sales tables
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      region TEXT,
      grade TEXT,
      join_date TEXT
    );
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      product_id INTEGER,
      employee_id INTEGER,
      quantity INTEGER,
      unit_price INTEGER,
      total_amount INTEGER,
      sale_date TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  const custExist = db.exec("SELECT COUNT(*) FROM customers")[0].values[0][0];
  if (custExist === 0) {
    db.run(`
      INSERT INTO customers VALUES
        (1,  '황민철', 'hwang@example.com',  '서울', 'VIP',  '2021-03-10'),
        (2,  '오지은', 'oh@example.com',     '부산', '일반', '2022-07-15'),
        (3,  '백준호', 'baek@example.com',   '서울', '골드', '2020-11-20'),
        (4,  '신예린', 'shin@example.com',   '대구', '일반', '2023-01-05'),
        (5,  '류성민', 'ryu@example.com',    '인천', 'VIP',  '2019-08-30'),
        (6,  '곽다영', 'kwak@example.com',   '서울', '골드', '2022-04-12'),
        (7,  '문태준', 'moon@example.com',   '광주', '일반', '2023-05-18'),
        (8,  '배소희', 'bae@example.com',    '부산', 'VIP',  '2020-12-01'),
        (9,  '서동훈', 'seo@example.com',    '서울', '일반', '2021-09-07'),
        (10, '전미래', 'jeon@example.com',   '인천', '골드', '2022-02-28'),
        (11, '홍태양', 'hong@example.com',   '서울', 'VIP',  '2020-06-15'),
        (12, '남지수', 'nam@example.com',    '대구', '일반', '2023-03-22'),
        (13, '마준혁', 'ma@example.com',     '부산', '골드', '2021-10-10'),
        (14, '유하린', 'yoo@example.com',    '서울', '일반', '2022-08-05'),
        (15, '엄기태', 'eom@example.com',    '광주', 'VIP',  '2019-12-20');

      INSERT INTO sales VALUES
        (1,  1,  1, 1,  2, 1200000, 2400000, '2024-01-08'),
        (2,  3,  3, 3,  3,   85000,  255000, '2024-01-15'),
        (3,  5,  4, 5,  1,  450000,  450000, '2024-02-03'),
        (4,  8,  2, 2, 10,   35000,  350000, '2024-02-20'),
        (5,  11, 1, 9,  1, 1200000, 1200000, '2024-03-05'),
        (6,  2,  6, 4,  2,  280000,  560000, '2024-03-10'),
        (7,  6,  5, 7,  1,  320000,  320000, '2024-03-22'),
        (8,  15, 1, 1,  3, 1200000, 3600000, '2024-04-01'),
        (9,  4,  8, 6,  5,   12000,   60000, '2024-04-11'),
        (10, 10, 4, 8,  2,  450000,  900000, '2024-04-18'),
        (11, 1,  3, 1,  1,   85000,   85000, '2024-05-02'),
        (12, 13, 7, 5,  1,  150000,  150000, '2024-05-09'),
        (13, 7,  2, 3,  4,   35000,  140000, '2024-05-20'),
        (14, 5,  1, 9,  2, 1200000, 2400000, '2024-06-01'),
        (15, 9,  6, 2,  1,  280000,  280000, '2024-06-08'),
        (16, 12, 5, 7,  2,  320000,  640000, '2024-06-15'),
        (17, 3,  4, 4,  1,  450000,  450000, '2024-06-22'),
        (18, 8,  3, 1,  2,   85000,  170000, '2024-07-03'),
        (19, 11, 2, 5,  5,   35000,  175000, '2024-07-10'),
        (20, 14, 1, 3,  1, 1200000, 1200000, '2024-07-20');
    `);
  }

  return db;
}

export function runQuery(sql) {
  if (!db) throw new Error('DB가 초기화되지 않았습니다.');
  return db.exec(sql);
}

export function translateSqlError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('no such column')) {
    const column = message.match(/no such column: ([^\s]+)/i)?.[1];
    return `컬럼명이 잘못됐어요.${column ? ` (${column})` : ''} 테이블 스키마를 확인해보세요.`;
  }
  if (lower.includes('no such table')) {
    const table = message.match(/no such table: ([^\s]+)/i)?.[1];
    return `테이블 이름을 찾을 수 없어요.${table ? ` (${table})` : ''} 왼쪽 스키마의 테이블 목록을 확인해보세요.`;
  }
  if (lower.includes('syntax error')) {
    return 'SQL 문법에 오류가 있어요. SELECT, FROM, WHERE 같은 키워드 순서와 쉼표를 확인해보세요.';
  }
  if (lower.includes('ambiguous column')) {
    return '어느 테이블의 컬럼인지 모호해요. e.name처럼 테이블 별칭을 붙여보세요.';
  }
  if (lower.includes('misuse of aggregate') || lower.includes('aggregate')) {
    return '집계 함수 사용 위치를 확인해보세요. 집계 조건은 WHERE가 아니라 HAVING에 쓰는 경우가 많습니다.';
  }
  if (lower.includes('incomplete input')) {
    return 'SQL 문장이 끝나지 않았어요. 괄호, 따옴표, 조건식을 마저 닫아주세요.';
  }

  return `SQL 실행 중 오류가 발생했어요. ${message}`;
}

export function getSchema() {
  if (!db) return [];
  const result = db.exec(`
    SELECT m.name as table_name, p.name as col_name, p.type as col_type
    FROM sqlite_master m
    JOIN pragma_table_info(m.name) p
    WHERE m.type = 'table'
    ORDER BY m.name, p.cid
  `);
  if (!result.length) return [];
  const tables = {};
  for (const row of result[0].values) {
    const [tbl, col, type] = row;
    if (!tables[tbl]) tables[tbl] = [];
    tables[tbl].push({ col, type });
  }
  return Object.entries(tables).map(([name, columns]) => ({ name, columns }));
}

const serializeValue = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number(value.toFixed(6)).toString();
  return String(value).trim();
};

const serializeRow = (row) => row.map(serializeValue).join('\t');

const findFirstDifferentCell = (userRows, ansRows) => {
  for (let rowIndex = 0; rowIndex < Math.min(userRows.length, ansRows.length); rowIndex += 1) {
    for (let colIndex = 0; colIndex < Math.min(userRows[rowIndex].length, ansRows[rowIndex].length); colIndex += 1) {
      if (serializeValue(userRows[rowIndex][colIndex]) !== serializeValue(ansRows[rowIndex][colIndex])) {
        return {
          row: rowIndex + 1,
          col: colIndex + 1,
          expected: serializeValue(ansRows[rowIndex][colIndex]),
          actual: serializeValue(userRows[rowIndex][colIndex]),
        };
      }
    }
  }
  return null;
};

export function getRowsModified() {
  return db ? db.getRowsModified() : 0;
}

export function getTableStats() {
  if (!db) return {};
  const tables = getSchema();
  const stats = {};
  for (const tbl of tables) {
    try {
      const r = db.exec(`SELECT COUNT(*) FROM "${tbl.name}"`);
      stats[tbl.name] = { rowCount: r[0]?.values[0]?.[0] ?? 0 };
    } catch { stats[tbl.name] = { rowCount: 0 }; }
  }
  return stats;
}

export function getTableIndexes() {
  if (!db) return {};
  const tables = getSchema();
  const result = {};
  for (const tbl of tables) {
    try {
      const idxList = db.exec(`PRAGMA index_list("${tbl.name}")`);
      if (!idxList.length) { result[tbl.name] = []; continue; }
      const indexes = [];
      for (const row of idxList[0].values) {
        const [, idxName, unique] = row;
        const colRes = db.exec(`PRAGMA index_info("${idxName}")`);
        const cols = colRes.length ? colRes[0].values.map(r => r[2]) : [];
        indexes.push({ name: String(idxName), unique: Boolean(unique), columns: cols });
      }
      result[tbl.name] = indexes;
    } catch { result[tbl.name] = []; }
  }
  return result;
}

export function getRelationships() {
  if (!db) return [];
  const tables = getSchema();
  const rels = [];
  for (const tbl of tables) {
    try {
      const res = db.exec(`PRAGMA foreign_key_list("${tbl.name}")`);
      if (!res.length) continue;
      for (const row of res[0].values) {
        // row: [id, seq, table, from, to, on_update, on_delete, match]
        rels.push({ from: tbl.name, fromCol: row[3], to: row[2], toCol: row[4] });
      }
    } catch {
      // Ignore tables whose foreign key metadata cannot be read.
    }
  }
  return rels;
}

export function gradeQuery(userSql, answerSql, checkOrder = false, options = {}) {
  try {
    const userRes = db.exec(userSql.trim());
    const ansRes = db.exec(answerSql.trim());

    if (!userRes.length && !ansRes.length) return { correct: true, checks: ['실행 결과가 정답과 같습니다.'] };
    if (!userRes.length) return { correct: false, msg: '결과가 비어있습니다.', checks: ['SELECT 결과가 반환되지 않았어요.'] };
    if (!ansRes.length) return { correct: false, msg: '예상치 못한 오류가 발생했습니다.' };

    const userRows = userRes[0].values;
    const ansRows = ansRes[0].values;
    const userColumns = userRes[0].columns;
    const ansColumns = ansRes[0].columns;
    const checks = [];

    if (userRows.length !== ansRows.length) {
      return {
        correct: false,
        msg: `행 수가 다릅니다. (정답: ${ansRows.length}행 / 내 결과: ${userRows.length}행)`,
        checks: [
          '행 개수가 정답과 달라요.',
          'WHERE 조건, JOIN 조건, GROUP BY 범위를 다시 확인해보세요.',
        ],
      };
    }

    if (userColumns.length !== ansColumns.length) {
      return {
        correct: false,
        msg: `컬럼 수가 다릅니다. (정답: ${ansColumns.length}개 / 내 결과: ${userColumns.length}개)`,
        checks: ['SELECT 절에 필요한 컬럼만 들어갔는지 확인해보세요.'],
      };
    }

    if (options.strictColumns && JSON.stringify(userColumns) !== JSON.stringify(ansColumns)) {
      return {
        correct: false,
        msg: '컬럼 이름이나 순서가 다릅니다.',
        checks: [
          `정답 컬럼: ${ansColumns.join(', ')}`,
          `내 컬럼: ${userColumns.join(', ')}`,
        ],
      };
    }

    const userSerialOriginal = userRows.map(serializeRow);
    const ansSerialOriginal = ansRows.map(serializeRow);
    const userSerial = checkOrder ? userSerialOriginal : [...userSerialOriginal].sort();
    const ansSerial = checkOrder ? ansSerialOriginal : [...ansSerialOriginal].sort();

    if (JSON.stringify(userSerial) !== JSON.stringify(ansSerial)) {
      const unorderedUser = [...userSerialOriginal].sort();
      const unorderedAnswer = [...ansSerialOriginal].sort();
      if (checkOrder && JSON.stringify(unorderedUser) === JSON.stringify(unorderedAnswer)) {
        return {
          correct: false,
          msg: '데이터는 맞지만 정렬 순서가 다릅니다.',
          checks: ['ORDER BY 기준과 ASC/DESC 방향을 확인해보세요.'],
        };
      }

      const diff = findFirstDifferentCell(userRows, ansRows);
      return {
        correct: false,
        msg: diff
          ? `${diff.row}행 ${diff.col}번째 값이 달라요. (정답: ${diff.expected} / 내 결과: ${diff.actual})`
          : '행 수는 같지만 데이터 값이 다릅니다.',
        checks: [
          '특정 값이 정답과 달라요.',
          '계산식, JOIN 조건, 집계 함수가 정확한지 확인해보세요.',
        ],
      };
    }

    if (JSON.stringify(userColumns) !== JSON.stringify(ansColumns)) {
      checks.push('값은 정답과 같습니다. 컬럼 별칭은 달라도 정답으로 인정했어요.');
    } else {
      checks.push('컬럼과 값이 정답과 같습니다.');
    }
    if (checkOrder) checks.push('정렬 순서도 올바릅니다.');

    return { correct: true, checks };
  } catch (e) {
    return { correct: false, msg: translateSqlError(e), checks: ['SQL이 실행되지 않아 채점할 수 없어요.'] };
  }
}
