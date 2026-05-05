use reqwest::Method;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NativeRequestPayload {
  method: String,
  url: String,
  headers: Vec<NativeHeader>,
  body: Option<String>,
  send_credentials: bool,
}

#[derive(Debug, Deserialize)]
struct NativeHeader {
  key: String,
  value: String,
  enabled: bool,
}

#[derive(Debug, Serialize)]
struct NativeResponseHeader {
  key: String,
  value: String,
}

#[derive(Debug, Serialize)]
struct NativeResponsePayload {
  status: u16,
  body: String,
  headers: Vec<NativeResponseHeader>,
}

#[tauri::command]
async fn send_native_request(payload: NativeRequestPayload) -> Result<NativeResponsePayload, String> {
  let method = Method::from_bytes(payload.method.as_bytes()).map_err(|e| e.to_string())?;
  let client = reqwest::Client::builder()
    .cookie_store(payload.send_credentials)
    .build()
    .map_err(|e| e.to_string())?;

  let mut request = client.request(method, payload.url);
  for header in payload.headers {
    if header.enabled && !header.key.trim().is_empty() {
      request = request.header(header.key, header.value);
    }
  }

  if let Some(body) = payload.body {
    if !body.is_empty() {
      request = request.body(body);
    }
  }

  let response = request.send().await.map_err(|e| e.to_string())?;
  let status = response.status().as_u16();
  let headers = response
    .headers()
    .iter()
    .map(|(key, value)| NativeResponseHeader {
      key: key.to_string(),
      value: value.to_str().unwrap_or_default().to_string(),
    })
    .collect();
  let body = response.text().await.map_err(|e| e.to_string())?;
  Ok(NativeResponsePayload { status, body, headers })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![send_native_request])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
