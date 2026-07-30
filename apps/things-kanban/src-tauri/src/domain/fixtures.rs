#![cfg(test)]

use crate::domain::model::{AreaRef, CompletionStatus, ProjectRef, TagRef, ThingsId, Todo};

#[allow(dead_code)]
pub fn active_area(id: &str, name: &str) -> AreaRef {
    AreaRef {
        id: ThingsId::new(id).expect("fixture id"),
        name: name.into(),
        active: true,
    }
}

pub fn todo_with_tags(status: CompletionStatus, tags: &[&str]) -> Todo {
    let area = active_area("area", "Area");
    Todo {
        id: ThingsId::new("todo").expect("fixture id"),
        title: "Fixture".into(),
        completion_status: status,
        is_today: false,
        due_date: None,
        scheduled_date: None,
        completion_date: None,
        project: Some(ProjectRef {
            id: ThingsId::new("project").expect("fixture project id"),
            name: "Project".into(),
            area: Some(area.clone()),
            active: true,
        }),
        area: Some(area),
        tags: tags
            .iter()
            .map(|name| TagRef {
                id: None,
                name: (*name).into(),
            })
            .collect(),
        modified_at: None,
    }
}
