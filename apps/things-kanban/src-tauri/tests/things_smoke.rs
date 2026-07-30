#[test]
fn live_things_smoke_is_explicitly_opt_in() {
    let enabled = std::env::var("THINGS_KANBAN_LIVE_TESTS").ok().as_deref() == Some("1");
    let id_present = std::env::var("THINGS_KANBAN_TEST_TODO_ID").is_ok();
    if enabled {
        assert!(id_present, "live tests require a dedicated test todo ID");
    }
}
