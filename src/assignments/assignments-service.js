const AssignmentsService = {
  getAllAssignments(knex, user_id) {
    return knex
      .select('*')
      .from('assignments')
      .where('classes.user_id', user_id)
      .leftJoin('classes', 'assignments.class_id', 'classes.class_id')
      .leftJoin('users', 'users.user_id', 'classes.user_id')
      .orderBy([{ column: 'due_date' }, { column: 'title', order: 'asc' }])
  },
  getById(knex, id) {
    return knex
    .from('assignments')
    .select('*')
    .where('assignment_id', id)
    .leftJoin('classes', 'assignments.class_id', 'classes.class_id')
    .first()
  },
  updateAssignment(knex, id, newAssignmentFields) {
    return knex('assignments')
      .where({ assignment_id: id })
      .update(newAssignmentFields)
      .then(() => this.getById(knex, id))
  },
  insertAssignment(knex, newAssignment) {
    return knex
      .insert(newAssignment)
      .into('assignments')
      .returning('*')
      .then((row) => this.getById(knex, row[0].assignment_id))
  },
  deleteAssignment(knex, assignment_id) {
    return knex('assignments')
      .where({ assignment_id })
      .delete()
  }
};

module.exports = AssignmentsService;