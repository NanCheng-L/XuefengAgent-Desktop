use flate2::read::GzDecoder;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Read;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

struct AppState {
    db_path: Mutex<Option<PathBuf>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct AdmissionRecord {
    school: String,
    major: String,
    score: f64,
    rank: f64,
    year: i32,
}

#[derive(Serialize)]
struct RecommendResult {
    rank: i64,
    score: i64,
    chong: Vec<AdmissionRecord>,
    wen: Vec<AdmissionRecord>,
    bao: Vec<AdmissionRecord>,
}

#[derive(Serialize)]
struct QueryResult {
    count: usize,
    rows: Vec<DbRow>,
}

#[derive(Serialize)]
struct DbRow {
    province: String,
    year: i32,
    school_name: String,
    major_name: String,
    score: f64,
    rank: f64,
}

#[derive(Serialize)]
struct SearchResults {
    results: Vec<String>,
}

fn get_db_path(app: &tauri::AppHandle) -> PathBuf {
    let resource_dir = app
        .path()
        .resource_dir()
        .expect("failed to get resource dir");
    let db_path = resource_dir.join("resources").join("admission_clean.db");
    let gz_path = resource_dir.join("resources").join("admission_clean.db.gz");

    if !db_path.exists() && gz_path.exists() {
        let mut gz = fs::File::open(&gz_path).expect("failed to open gz");
        let mut decoder = GzDecoder::new(&mut gz);
        let mut buf = Vec::new();
        decoder.read_to_end(&mut buf).expect("failed to decompress");
        fs::write(&db_path, buf).expect("failed to write db");
    }

    db_path
}

fn init_db(app: &tauri::AppHandle, state: &AppState) {
    let db_path = get_db_path(app);
    if db_path.exists() {
        *state.db_path.lock().unwrap() = Some(db_path);
    }
}

fn query_db_single(db_path: &PathBuf, province: &str, school: &str, major: &str, limit: i64) -> Vec<DbRow> {
    let conn = match Connection::open(db_path) {
        Ok(c) => c,
        Err(_) => return vec![],
    };

    let mut conditions = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if !province.is_empty() {
        conditions.push("province LIKE ?".to_string());
        params.push(Box::new(format!("%{}%", province)));
    }
    if !school.is_empty() {
        conditions.push("school_name LIKE ?".to_string());
        params.push(Box::new(format!("%{}%", school)));
    }
    if !major.is_empty() {
        conditions.push("major_name LIKE ?".to_string());
        params.push(Box::new(format!("%{}%", major)));
    }

    if conditions.is_empty() {
        return vec![];
    }

    let where_clause = conditions.join(" AND ");
    let sql = format!(
        "SELECT province, year, school_name, major_name, score, rank FROM admission WHERE {} AND rank > 100 ORDER BY year DESC, rank ASC LIMIT ?",
        where_clause
    );
    params.push(Box::new(limit));

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    conn.prepare(&sql)
        .and_then(|mut stmt| {
            let rows = stmt
                .query_map(param_refs.as_slice(), |row| {
                    Ok(DbRow {
                        province: row.get(0)?,
                        year: row.get(1)?,
                        school_name: row.get(2)?,
                        major_name: row.get(3)?,
                        score: row.get(4)?,
                        rank: row.get(5)?,
                    })
                })?
                .filter_map(|r| r.ok())
                .collect();
            Ok(rows)
        })
        .unwrap_or_default()
}

fn query_recommend(
    db_path: &PathBuf,
    province: &str,
    keyword: &str,
    rank: i64,
    score: i64,
) -> RecommendResult {
    let conn = match Connection::open(db_path) {
        Ok(c) => c,
        Err(_) => {
            return RecommendResult {
                rank,
                score,
                chong: vec![],
                wen: vec![],
                bao: vec![],
            }
        }
    };

    let mut base = String::from("province LIKE ? AND (score > 0 OR rank > 0)");
    let mut bp: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    bp.push(Box::new(format!("%{}%", province)));

    if !keyword.is_empty() {
        let kws: Vec<&str> = keyword.split(',').collect();
        let kw_conds: Vec<String> = kws
            .iter()
            .map(|_| "(major_name LIKE ? OR school_name LIKE ?)".to_string())
            .collect();
        base.push_str(&format!(" AND ({})", kw_conds.join(" OR ")));
        for kw in &kws {
            bp.push(Box::new(format!("%{}%", kw)));
            bp.push(Box::new(format!("%{}%", kw)));
        }
    }

    let mut chong = Vec::new();
    let mut wen = Vec::new();
    let mut bao = Vec::new();

    let exec_query = |conn: &Connection,
                      base: &str,
                      bp: &mut Vec<Box<dyn rusqlite::types::ToSql>>,
                      extra_cond: &str,
                      order: &str,
                      limit: i64|
     -> Vec<AdmissionRecord> {
        let sql = format!(
            "SELECT school_name, major_name, score, rank, year FROM admission WHERE {} {} ORDER BY {} LIMIT ?",
            base, extra_cond, order
        );
        let prev_len = bp.len();
        bp.push(Box::new(limit));
        let param_refs: Vec<&dyn rusqlite::types::ToSql> =
            bp.iter().map(|p| p.as_ref()).collect();

        let result = conn.prepare(&sql)
            .and_then(|mut stmt| {
                let rows = stmt
                    .query_map(param_refs.as_slice(), |row| {
                        Ok(AdmissionRecord {
                            school: row.get(0)?,
                            major: row.get(1)?,
                            score: row.get(2)?,
                            rank: row.get(3)?,
                            year: row.get(4)?,
                        })
                    })?
                    .filter_map(|r| r.ok())
                    .collect();
                Ok(rows)
            })
            .unwrap_or_default();

        bp.truncate(prev_len);
        result
    };

    if rank > 0 {
        chong = exec_query(
            &conn,
            &base,
            &mut bp,
            &format!(" AND rank > 0 AND rank < {} AND rank >= {}", rank, (rank as f64 * 0.90) as i64),
            "rank ASC",
            50,
        );
        wen = exec_query(
            &conn,
            &base,
            &mut bp,
            &format!(" AND rank > 0 AND rank >= {} AND rank <= {}", rank, (rank as f64 * 1.3) as i64),
            "rank ASC",
            50,
        );
        bao = exec_query(
            &conn,
            &base,
            &mut bp,
            &format!(" AND rank > {} AND rank <= {}", (rank as f64 * 1.3) as i64, (rank as f64 * 1.6) as i64),
            "rank ASC",
            50,
        );
    }

    if chong.is_empty() && wen.is_empty() && bao.is_empty() && !keyword.is_empty() {
        let base2 = format!("province LIKE ? AND rank > 0");
        let mut bp2: Vec<Box<dyn rusqlite::types::ToSql>> =
            vec![Box::new(format!("%{}%", province))];
        chong = exec_query(
            &conn,
            &base2,
            &mut bp2,
            &format!(" AND rank < {} AND rank >= {}", rank, (rank as f64 * 0.90) as i64),
            "rank ASC",
            50,
        );
        wen = exec_query(
            &conn,
            &base2,
            &mut bp2,
            &format!(" AND rank >= {} AND rank <= {}", rank, (rank as f64 * 1.3) as i64),
            "rank ASC",
            50,
        );
        bao = exec_query(
            &conn,
            &base2,
            &mut bp2,
            &format!(" AND rank > {} AND rank <= {}", (rank as f64 * 1.3) as i64, (rank as f64 * 1.6) as i64),
            "rank ASC",
            50,
        );
    }

    if chong.is_empty() && wen.is_empty() && bao.is_empty() && score > 0 {
        chong = exec_query(
            &conn,
            &base,
            &mut bp,
            &format!(" AND score > {} AND score <= {}", score, score + 25),
            "score DESC",
            80,
        );
        wen = exec_query(
            &conn,
            &base,
            &mut bp,
            &format!(" AND score >= {} AND score <= {}", score - 25, score + 25),
            "score ASC",
            50,
        );
        bao = exec_query(
            &conn,
            &base,
            &mut bp,
            &format!(" AND score >= {} AND score < {}", score - 50, score - 25),
            "score ASC",
            50,
        );

        if chong.is_empty() && wen.is_empty() && bao.is_empty() {
            let base3 = format!("province LIKE ? AND (score > 0 OR rank > 0)");
            let mut bp3: Vec<Box<dyn rusqlite::types::ToSql>> =
                vec![Box::new(format!("%{}%", province))];
            chong = exec_query(
                &conn,
                &base3,
                &mut bp3,
                &format!(" AND score > {} AND score <= {}", score, score + 25),
                "score DESC",
                80,
            );
            wen = exec_query(
                &conn,
                &base3,
                &mut bp3,
                &format!(" AND score >= {} AND score <= {}", score - 25, score + 25),
                "score ASC",
                50,
            );
            bao = exec_query(
                &conn,
                &base3,
                &mut bp3,
                &format!(" AND score >= {} AND score < {}", score - 50, score - 25),
                "score ASC",
                50,
            );
        }
    }

    RecommendResult {
        rank,
        score,
        chong,
        wen,
        bao,
    }
}

#[tauri::command]
fn query_db(
    state: tauri::State<AppState>,
    province: String,
    school: String,
    major: String,
) -> Result<QueryResult, String> {
    let db_path = state.db_path.lock().unwrap();
    let path = db_path.as_ref().ok_or("数据库未加载")?;
    let rows = query_db_single(path, &province, &school, &major, 50);
    let count = rows.len();
    Ok(QueryResult { count, rows })
}

#[tauri::command]
fn recommend(
    state: tauri::State<AppState>,
    province: String,
    keyword: String,
    rank: i64,
    score: i64,
) -> Result<RecommendResult, String> {
    let db_path = state.db_path.lock().unwrap();
    let path = db_path.as_ref().ok_or("数据库未加载")?;
    Ok(query_recommend(path, &province, &keyword, rank, score))
}

#[tauri::command]
fn check_db(state: tauri::State<AppState>) -> bool {
    state.db_path.lock().unwrap().is_some()
}

#[tauri::command]
async fn search_baidu(query: String) -> Result<SearchResults, String> {
    let url = format!(
        "https://www.baidu.com/s?wd={}",
        url::form_urlencoded::byte_serialize(query.as_bytes()).collect::<String>()
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let html = resp.text().await.map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    let document = scraper::Html::parse_document(&html);

    // Try multiple selectors for search result snippets
    let selectors = [
        "span.content-right_8Zs40",
        "span[class^='content-right']",
        ".c-abstract",
        ".c-span-last .c-font-normal",
    ];

    for sel in &selectors {
        if let Ok(selector) = scraper::Selector::parse(sel) {
            for element in document.select(&selector) {
                let text: String = element.text().collect::<String>().trim().to_string();
                if text.len() > 20 && results.len() < 5 {
                    let clean = text.chars().take(300).collect();
                    if !results.contains(&clean) {
                        results.push(clean);
                    }
                }
            }
        }
        if !results.is_empty() {
            break;
        }
    }

    if results.is_empty() {
        results.push("百度搜索未返回可用结果。建议配置 Tavily Key 以获得更精准的AI搜索。".to_string());
    }

    Ok(SearchResults { results })
}

#[tauri::command]
async fn search_tavily(query: String, api_key: String, max_results: usize) -> Result<SearchResults, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(12))
        .build()
        .map_err(|e| e.to_string())?;

    let body = serde_json::json!({
        "query": query,
        "search_depth": "basic",
        "include_answer": true,
        "max_results": max_results
    });

    let resp = client
        .post("https://api.tavily.com/search")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;

    let mut results = Vec::new();

    if let Some(answer) = data.get("answer").and_then(|a| a.as_str()) {
        results.push(format!("[Tavily总结] {}", answer));
    }

    if let Some(items) = data.get("results").and_then(|r| r.as_array()) {
        for item in items.iter().take(max_results) {
            let title = item.get("title").and_then(|t| t.as_str()).unwrap_or("");
            let content = item.get("content").and_then(|c| c.as_str()).unwrap_or("");
            if !title.is_empty() && !content.is_empty() {
                results.push(format!("{}: {}", title, &content[..content.len().min(300)]));
            }
        }
    }

    Ok(SearchResults { results })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            db_path: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            query_db,
            recommend,
            check_db,
            search_baidu,
            search_tavily,
        ])
        .setup(|app| {
            let state = app.state::<AppState>();
            init_db(app.handle(), &state);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}