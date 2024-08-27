//! `SeaORM` Entity. Generated by sea-orm-codegen 0.12.3

use enums::EntityLot;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "collection_to_entity")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub created_on: DateTimeUtc,
    pub last_updated_on: DateTimeUtc,
    pub collection_id: String,
    pub entity_id: String,
    pub entity_lot: EntityLot,
    pub metadata_id: Option<String>,
    pub person_id: Option<String>,
    pub metadata_group_id: Option<String>,
    pub exercise_id: Option<String>,
    pub workout_id: Option<String>,
    pub information: Option<serde_json::Value>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::collection::Entity",
        from = "Column::CollectionId",
        to = "super::collection::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Collection,
    #[sea_orm(
        belongs_to = "super::exercise::Entity",
        from = "Column::ExerciseId",
        to = "super::exercise::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Exercise,
    #[sea_orm(
        belongs_to = "super::metadata::Entity",
        from = "Column::MetadataId",
        to = "super::metadata::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Metadata,
    #[sea_orm(
        belongs_to = "super::metadata_group::Entity",
        from = "Column::MetadataGroupId",
        to = "super::metadata_group::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    MetadataGroup,
    #[sea_orm(
        belongs_to = "super::person::Entity",
        from = "Column::PersonId",
        to = "super::person::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Person,
    #[sea_orm(
        belongs_to = "super::workout::Entity",
        from = "Column::WorkoutId",
        to = "super::workout::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Workout,
}

impl Related<super::collection::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Collection.def()
    }
}

impl Related<super::exercise::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Exercise.def()
    }
}

impl Related<super::metadata::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Metadata.def()
    }
}

impl Related<super::metadata_group::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::MetadataGroup.def()
    }
}

impl Related<super::person::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Person.def()
    }
}

impl Related<super::workout::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Workout.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}