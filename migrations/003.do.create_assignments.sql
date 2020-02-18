CREATE TYPE category_values AS ENUM (
  'Homework', 'Project', 'Test', 'MidTerm', 'Final', 'Quiz', 'Presentation', 'Essay', 'Lab', 'Other');

CREATE TABLE assignments (
  assignment_id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  class_id INTEGER REFERENCES classes(class_id) ON DELETE CASCADE NOT NULL,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  notes TEXT NOT NULL,
  category category_values NOT NULL
);