const ClassesService = {
  getAllClasses(knex) {
    return knex
      .select('*')
      .from('classes')
      .orderBy('class_name')
  },
  getById(knex, id) {
    return knex
    .from('classes')
    .select('*')
    .where('class_id', id)
    .first()
  },
  updateClass(knex, id, newClassesFields) {
    return knex('classes')
      .where({ class_id: id })
      .update(newClassesFields)
  },
  insertClass(knex, newClasses) {
    return knex
      .insert(newClasses)
      .into('classes')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },
  deleteClass(knex, class_id) {
    return knex('classes')
      .where({ class_id })
      .delete()
  }
};

module.exports = ClassesService;