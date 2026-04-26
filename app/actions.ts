'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function setActiveStudentCookie(studentId: string) {
  cookies().set('active_student_id', studentId, { path: '/' })
  redirect('/wcst')
}
