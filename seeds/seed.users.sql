INSERT INTO users (
  user_name,
  password,
  role,
  first_name,
  last_name,
  teacher_user_id
)
VALUES (
  'teacher',
  '$2a$12$v7Gf2m9S5OEnFdZZDc0yE.EZ8TcZGCrdSgugNoMN2RSUb5ICmDvxm',
  'teacher',
  'Mary',
  'Smith',
  NULL
),
(
  'student',
  '$2a$12$pnEVIDmgjU33i8Dw7F4ppOqEBqp7LmM7JCoaPDjNRTJb65IZNGirO',
  'student',
  'Kid',
  'Student',
  1
);