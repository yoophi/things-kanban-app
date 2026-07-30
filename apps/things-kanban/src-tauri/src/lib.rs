mod application;
mod domain;
mod inbound;
mod infrastructure;

pub fn run() {
    // The application icon is embedded at compile time by Tauri.
    infrastructure::logging::init();
    tauri::Builder::default()
        .manage(inbound::tauri::AppState::default())
        .invoke_handler(tauri::generate_handler![
            inbound::tauri::get_board,
            inbound::tauri::get_integration_status,
            inbound::tauri::transition_todo,
            inbound::tauri::open_in_things
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Things Kanban");
}
