const bcrypt = require('bcryptjs');
const xss = require('xss');

const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;

const UsersService = {
  hasUserWithUserName(db, user_name) {
    return db('users')
      .where({ user_name })
      .first()
      .then(user => !!user)
  },
  insertUser(db, newUser) {
    return db
      .insert(newUser)
      .into('users')
      .returning('*')
      .then(([user]) => user)
  },
  getStudents(db, user_id) {
    return db
    .select('*')
    .from('users')
    .where('teacher_user_id', user_id)
  },
  validatePassword(password) {
    if (password.length < 8) {
      return 'Password be longer than 8 characters'
    }

    if (password.length > 72) {
      return 'Password be less than 72 characters'
    }

    if (password.startsWith(' ') || password.endsWith(' ')) {
      return 'Password must not start or end with empty spaces'
    }

    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
      return 'Password must contain one upper case, lower case, number and special character'
    }

    return null
  },
  validateUserName(user_name) {
    if (user_name.startsWith(' ') || user_name.endsWith(' ')) {
      return 'User Name must not start or end with empty spaces'
    }
  },
  hashPassword(password) {
    return bcrypt.hash(password, 12)
  },
  serializeUser(user) {
    return {
      user_id: user.user_id,
      teacher_user_id: user.teacher_user_id,
      first_name: xss(user.first_name),
      last_name: xss(user.last_name),
      user_name: xss(user.user_name),
      role: xss(user.role),
      date_created: new Date(user.date_created),
    }
  }
}

module.exports = UsersService