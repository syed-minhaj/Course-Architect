import {
    pgTable,
    text,
    integer,
    jsonb,
    primaryKey,
    pgEnum,
    index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import {user, userToCourseTaken} from  "./auth-schema";

const typeEnum = pgEnum('text', ["article" , "youtube video" , "podcast"]);
const accessEnum = pgEnum('text', ["public" , "private"]);

/* ================= COURSE ================= */
export const courses = pgTable("courses", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    courseTitle: text("course_title").notNull(),
    introSummary: text("intro_summary").notNull(),
    createrId: text("creater_id").notNull(),
    access : accessEnum("access").notNull().default("public"),
}, (table) => [
    index("course_id_idx").on(table.id),
    index("course_createrId_idx").on(table.createrId),
    index("courses_search_vector_idx").using("gin", sql`
        setweight(to_tsvector('english', ${table.courseTitle}), 'A') ||
        setweight(to_tsvector('english', ${table.introSummary}), 'B')
    `),
]);

/* ================= CHAPTER ================= */
export const chapters = pgTable("chapters", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    courseId: text("course_id")
        .references(() => courses.id, { onDelete: "cascade" })
        .notNull(),
    title: text("title").notNull(),
    order: integer("order").notNull(),
}, (table) => [
    index("chapter_courseId_idx").on(table.courseId),
]);

/* ================= MODULE ================= */
export const modules = pgTable("modules", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    courseId: text("course_id")
        .references(() => courses.id , { onDelete: "cascade" })
        .notNull(),
    chapterId: text("chapter_id")
        .references(() => chapters.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    conceptualDeepDive: text("conceptual_deep_dive").notNull(),
} , (table) => [
    index("module_courseId_idx").on(table.courseId),
    index("module_chapterId_idx").on(table.chapterId),
    index("module_title_idx").on(table.title),
]);

/* ================= EXTERNAL RESOURCES ================= */
export const externalResources = pgTable("external_resources", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    moduleId: text("module_id")
        .references(() => modules.id , { onDelete: "cascade" })
        .notNull(),
    type: typeEnum("type").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
} , (table) => [
    index("external_resources_moduleId_idx").on(table.moduleId),
]);

/* ================= PRIMARY MISSION ================= */
export const primaryMissions = pgTable("primary_missions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    moduleId: text("module_id")
        .references(() => modules.id , { onDelete: "cascade" })
        .notNull(),
    title: text("title").notNull(),
    instructions: text("instructions").notNull(),
    rubric: jsonb("rubric").$type<string[]>().notNull(),
} , (table) => [
    index("primary_missions_moduleId_idx").on(table.moduleId),
]);

/* ================= QUICK QUIZ ================= */
export const quickQuizzes = pgTable("quick_quizzes", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    moduleId: text("module_id")
        .references(() => modules.id , { onDelete: "cascade" })
        .notNull(),
    question: text("question").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    answer: text("answer").notNull(),
} , (table) => [
    index("quick_quizzes_moduleId_idx").on(table.moduleId),
]);

export const userToQuickQuizzesPassed = pgTable("user_to_quick_quizzes_passed", {
    userId: text("user_id")
        .references(() => user.id , { onDelete: "cascade" })
        .notNull(),
    quickQuizId: text("quick_quiz_id")
        .references(() => quickQuizzes.id , { onDelete: "cascade" })
        .notNull()
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.quickQuizId] }),
}));

export const userToPrimaryMissionsPassed = pgTable("user_to_primary_missions_passed", {
    userId: text("user_id")
        .references(() => user.id , { onDelete: "cascade" })
        .notNull(),
    primaryMissionId: text("primary_mission_id")
        .references(() => primaryMissions.id , { onDelete: "cascade" })
        .notNull()
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.primaryMissionId] }),
}));

/* ================= RELATIONS ================= */
export const courseRelations = relations(courses, ({ many , one}) => ({
    modules: many(modules),
    chapters: many(chapters),
    creator: one(user, {
        fields: [courses.createrId],
        references: [user.id],
    }),
    student : many(userToCourseTaken),
}));

export const moduleRelations = relations(modules, ({ many, one }) => ({
    course: one(courses, {
        fields: [modules.courseId],
        references: [courses.id],
    }),
    chapter: one(chapters, {
        fields: [modules.chapterId],
        references: [chapters.id],
    }),
    resources: many(externalResources),
    missions: many(primaryMissions),
    quizzes: many(quickQuizzes),
}));

export const chapterRelations = relations(chapters, ({ many, one }) => ({
    course: one(courses, {
        fields: [chapters.courseId],
        references: [courses.id],
    }),
    modules: many(modules),
}));

export const quickQuizzesRelations = relations(quickQuizzes, ({ one, many }) => ({
    module: one(modules, {
        fields: [quickQuizzes.moduleId],
        references: [modules.id],
    }),
    passedUsers: many(userToQuickQuizzesPassed)
}));

export const primaryMissionsRelations = relations(primaryMissions, ({ one , many }) => ({
    module: one(modules, {
        fields: [primaryMissions.moduleId],
        references: [modules.id],
    }),
    passedUsers: many(userToPrimaryMissionsPassed)
}));

export const externalResourcesRelations = relations(externalResources, ({ one }) => ({
    module: one(modules, {
        fields: [externalResources.moduleId],
        references: [modules.id],
    }),
}));

export const userToQuickQuizzesPassedRelations = relations(userToQuickQuizzesPassed, ({ one }) => ({
    user: one(user, {
        fields: [userToQuickQuizzesPassed.userId],
        references: [user.id],
    }),
    quickQuizzes: one(quickQuizzes, {
        fields: [userToQuickQuizzesPassed.quickQuizId],
        references: [quickQuizzes.id],
    }),
}));

export const userToPrimaryMissionsPassedRelations = relations(userToPrimaryMissionsPassed, ({ one }) => ({
    user: one(user, {
        fields: [userToPrimaryMissionsPassed.userId],
        references: [user.id],
    }),
    primaryMissions: one(primaryMissions, {
        fields: [userToPrimaryMissionsPassed.primaryMissionId],
        references: [primaryMissions.id],
    }),
}));
