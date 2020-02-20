const ClassesService = {
  getAllClasses(knex, user_id) {
    return knex
      .select('*')
      .from('classes')
      .where('classes.user_id', user_id)
      .leftJoin('users', 'users.user_id', 'classes.user_id')
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