"use server";

import { requireUser } from "@/lib/auth/guards";
import { searchCourses, searchTeachers } from "./search";

/** Used by the upload wizard's pickers. Always scoped to the caller's school. */
export async function searchTeachersAction(query: string) {
  const user = await requireUser();
  return searchTeachers(user.schoolId, query);
}

export async function searchCoursesAction(query: string) {
  const user = await requireUser();
  return searchCourses(user.schoolId, query);
}
