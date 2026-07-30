use std::fs;

#[test]
fn no_sqlite_write_path_exists() {
    let root = concat!(env!("CARGO_MANIFEST_DIR"), "/src");
    let source = walk(root);
    assert!(!source.contains("INSERT INTO"));
    assert!(!source.contains("UPDATE TM"));
    assert!(!source.contains("DELETE FROM"));
}

#[test]
fn logs_do_not_include_todo_notes() {
    let source = walk(concat!(env!("CARGO_MANIFEST_DIR"), "/src"));
    assert!(!source.contains("tracing::info!(todo.title"));
    assert!(!source.contains("tracing::info!(todo.notes"));
    assert!(!source.contains("tracing::info!(todo.tags"));
}

fn walk(root: &str) -> String {
    let mut output = String::new();
    for entry in fs::read_dir(root).expect("source directory") {
        let path = entry.expect("entry").path();
        if path.is_dir() {
            output.push_str(&walk(path.to_str().expect("path")));
        } else if path.extension().and_then(|value| value.to_str()) == Some("rs") {
            output.push_str(&fs::read_to_string(path).expect("source"));
        }
    }
    output
}
