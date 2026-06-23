#!/usr/bin/env python3
"""雪峰Agent — 纯 API 服务器：数据库查询 + 联网搜索"""
import os, re, json, sqlite3, gzip, shutil, urllib.request, urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

HERE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(HERE, 'admission_clean.db')
GZ_PATH = os.path.join(HERE, 'admission_clean.db.gz')
if not os.path.exists(DB_PATH) and os.path.exists(GZ_PATH):
    with gzip.open(GZ_PATH, 'rb') as gz:
        with open(DB_PATH, 'wb') as f:
            shutil.copyfileobj(gz, f)

HAS_DB = os.path.exists(DB_PATH)

PROVINCES = ['北京','天津','上海','重庆','河北','山西','辽宁','吉林','黑龙江','江苏','浙江','安徽',
             '福建','江西','山东','河南','湖北','湖南','广东','广西','海南','四川','贵州','云南',
             '西藏','陕西','甘肃','青海','宁夏','新疆','内蒙古']

def query_db(province=None, school=None, major=None, limit=50):
    if not HAS_DB: return None
    conn = sqlite3.connect(DB_PATH)
    conds, params = [], []
    if province: conds.append("province LIKE ?"); params.append(f"%{province}%")
    if school: conds.append("school_name LIKE ?"); params.append(f"%{school}%")
    if major: conds.append("major_name LIKE ?"); params.append(f"%{major}%")
    if not conds: conn.close(); return None
    sql = f"SELECT province,year,school_name,major_name,score,rank FROM admission WHERE {' AND '.join(conds)} AND rank>100 ORDER BY year DESC,rank ASC LIMIT ?"
    params.append(limit)
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [{'province':r[0],'year':r[1],'school_name':r[2],'major_name':r[3],'score':r[4],'rank':r[5]} for r in rows]

def web_search(query, n=5):
    results = []
    try:
        url = "https://www.baidu.com/s?wd=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        snippets = re.findall(r'<span class="content-right_[^"]*">(.*?)</span>', html)
        for s in snippets[:n]:
            clean = re.sub(r'<[^>]+>', '', s).strip()
            if len(clean) > 20:
                results.append(clean[:300])
        if not results:
            fallback = re.findall(r'class="c-abstract"[^>]*>(.*?)</span>', html)
            for s in fallback[:n]:
                clean = re.sub(r'<[^>]+>', '', s).strip()
                if len(clean) > 20:
                    results.append(clean[:300])
        if not results:
            results.append("百度搜索未返回可用结果，建议注册 Tavily Key 以获得更精准的AI搜索。")
    except Exception as e:
        results.append(f"搜索暂不可用（{e}）。建议注册 Tavily Key 以获得更精准的AI搜索。")
    return results if results else ["搜索无结果。请在前端API设置中填入Tavily Key以启用联网搜索。"]

class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Methods','GET,OPTIONS')
        self.send_header('Access-Control-Allow-Headers','*')

    def _send(self, data, code=200):
        self.send_response(code)
        self.send_header('Content-Type','application/json;charset=utf-8')
        self._cors()
        self.send_header('Cache-Control','no-store, no-cache, must-revalidate, max-age=0')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == '/ping':
            return self._send({'ok':True,'db':HAS_DB})

        if self.path.startswith('/query'):
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            rows = query_db(qs.get('province',[''])[0], qs.get('school',[''])[0], qs.get('major',[''])[0])
            return self._send({'db':rows,'count':len(rows) if rows else 0})

        if self.path.startswith('/recommend'):
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            prov = qs.get('province',[''])[0]
            major = qs.get('major',[''])[0]
            keyword = qs.get('keyword',[''])[0]
            try: rank = int(qs.get('rank',['0'])[0])
            except: rank = 0
            try: score = int(qs.get('score',['0'])[0])
            except: score = 0
            print(f"[RECOMMEND] prov={prov} rank={rank} score={score} kw={keyword[:30] if keyword else 'none'}")
            if prov and (rank > 0 or score > 0):
                conn = sqlite3.connect(DB_PATH)
                base = "province LIKE ? AND (score>0 OR rank>0)"
                bp = [f'%{prov}%']
                if major: base += " AND major_name LIKE ?"; bp.append(f'%{major}%')
                if keyword:
                    kws = keyword.split(',')
                    kw_conds = []
                    for kw in kws:
                        kw_conds.append("(major_name LIKE ? OR school_name LIKE ?)")
                        bp.append(f'%{kw}%'); bp.append(f'%{kw}%')
                    base += " AND (" + " OR ".join(kw_conds) + ")"

                chong = []; wen = []; bao = []

                if rank > 0:
                    chong = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                        conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE {base} AND rank>0 AND rank<? AND rank>=? ORDER BY rank ASC LIMIT 50",
                        bp+[rank, max(1,int(rank*0.90))]).fetchall()]
                    wen = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                        conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE {base} AND rank>0 AND rank>=? AND rank<=? ORDER BY rank ASC LIMIT 50",
                        bp+[rank, int(rank*1.3)]).fetchall()]
                    bao = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                        conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE {base} AND rank>0 AND rank>? AND rank<=? ORDER BY rank ASC LIMIT 50",
                        bp+[int(rank*1.3), int(rank*1.6)]).fetchall()]

                if not (chong or wen or bao) and keyword:
                    chong = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                        conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE province LIKE ? AND rank>0 AND rank<? AND rank>=? ORDER BY rank ASC LIMIT 50",
                        [f'%{prov}%', rank, max(1,int(rank*0.90))]).fetchall()]
                    wen = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                        conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE province LIKE ? AND rank>0 AND rank>=? AND rank<=? ORDER BY rank ASC LIMIT 50",
                        [f'%{prov}%', rank, int(rank*1.3)]).fetchall()]
                    bao = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                        conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE province LIKE ? AND rank>0 AND rank>? AND rank<=? ORDER BY rank ASC LIMIT 50",
                        [f'%{prov}%', int(rank*1.3), int(rank*1.6)]).fetchall()]

                if not (chong or wen or bao) and score > 0:
                    chong = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                        conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE {base} AND score>? AND score<=? ORDER BY score DESC LIMIT 80",
                        bp+[score, score+25]).fetchall()]
                    wen = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                        conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE {base} AND score>=? AND score<=? ORDER BY score ASC LIMIT 50",
                        bp+[score-25, score+25]).fetchall()]
                    bao = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                        conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE {base} AND score>=? AND score<? ORDER BY score ASC LIMIT 50",
                        bp+[score-50, score-25]).fetchall()]
                    if not (chong or wen or bao):
                        base2 = "province LIKE ? AND (score>0 OR rank>0)"
                        bp2 = [f'%{prov}%']
                        chong = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                            conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE {base2} AND score>? AND score<=? ORDER BY score DESC LIMIT 80",
                            bp2+[score, score+25]).fetchall()]
                        wen = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                            conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE {base2} AND score>=? AND score<=? ORDER BY score ASC LIMIT 50",
                            bp2+[score-25, score+25]).fetchall()]
                        bao = [{'school':r[0],'major':r[1],'score':r[2],'rank':r[3],'year':r[4]} for r in
                            conn.execute(f"SELECT school_name,major_name,score,rank,year FROM admission WHERE {base2} AND score>=? AND score<? ORDER BY score ASC LIMIT 50",
                            bp2+[score-50, score-25]).fetchall()]
                conn.close()
                return self._send({'rank':rank,'score':score,'chong':chong,'wen':wen,'bao':bao})
            return self._send({'error':'need province and rank or score'},400)

        if self.path.startswith('/search'):
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            q = qs.get('q',[''])[0]
            if q: return self._send({'results':web_search(q)})
            return self._send({'results':[]})

        self._send({'error':'not found'}, 404)

    def log_message(self, format, *args):
        msg = format%args if args else format
        if '/recommend' in msg or '/query' in msg or '/ping' in msg or '/search' in msg:
            print(f"[REQ] {msg}")


def main():
    port = 19876
    server = HTTPServer(('127.0.0.1', port), Handler)
    print(f'XuefengAgent API: http://127.0.0.1:{port}/')
    print(f'数据库: {"已加载" if HAS_DB else "未找到"}')
    try: server.serve_forever()
    except KeyboardInterrupt: server.shutdown(); print('\n已停止')

if __name__ == '__main__': main()