import sqlite3

db_path = r'D:\web\XuefengAgent-Desktop\src-tauri\target\debug\resources\admission_clean.db'
conn = sqlite3.connect(db_path)

# 检查浙江电子数据的位次范围
rows = conn.execute("""
    SELECT MIN(rank), MAX(rank), AVG(rank) 
    FROM admission 
    WHERE province LIKE '%浙江%' AND major_name LIKE '%电子%' AND rank > 0
""").fetchall()
print(f"浙江电子位次范围: min={rows[0][0]}, max={rows[0][1]}, avg={rows[0][2]}")

# 用位次 5000 测试
rows = conn.execute("""
    SELECT school_name, major_name, score, rank, year 
    FROM admission 
    WHERE province LIKE '%浙江%' AND rank > 0 AND rank < 6000 AND rank >= 4000
    ORDER BY rank ASC LIMIT 5
""").fetchall()
print(f"浙江 位次4000-6000: {len(rows)} rows")
for r in rows:
    print(f"  {r[0]} - {r[1]} - score={r[2]} - rank={r[3]} - {r[4]}年")

conn.close()
