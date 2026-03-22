Course/webinar platform — Netflix + Coursera style learning system

## DB Tables (17 new)
courses, modules, lessons, course_enrollments, lesson_progress, course_resources, course_purchases, course_favorites, lesson_bookmarks, user_lesson_activity, learning_paths, path_courses, quizzes, quiz_questions, quiz_answers, user_quiz_attempts, user_quiz_answers

## Routes
- /dashboard/courses — main listing (continue learning, my courses, saved, favorites, paths, all)
- /dashboard/courses/:courseId — course detail with curriculum
- /dashboard/courses/:courseId/lesson/:lessonId — lesson viewer with quiz
- /dashboard/learning-paths/:pathId — learning path detail
- /dashboard/admin-courses — admin CRUD (courses, modules, lessons, paths, analytics)

## Features
- Free + paid courses, enrollment, progress tracking
- Lesson completion, bookmarking, activity tracking
- Quizzes with pass/fail, retake
- Learning paths (admin-created, auto-enroll)
- Course favorites, search/filter
- Admin: create/edit/delete courses, modules, lessons, paths
- Admin analytics: enrollments, completion rate, revenue
