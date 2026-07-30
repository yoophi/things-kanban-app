#![cfg(test)]

use crate::domain::model::{AreaRef, ThingsId};

#[allow(dead_code)]
pub fn active_area(id: &str, name: &str) -> AreaRef {
    AreaRef {
        id: ThingsId::new(id).expect("fixture id"),
        name: name.into(),
        active: true,
    }
}
