'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createCourse, createModule, getAllCourses } from '@/services/courses.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { BookOpen, Plus, ArrowLeft, Layers, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Course } from '@/types'

export default function AdminCoursesPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [courseForm, setCourseForm] = useState({ title: '', description: '', level: 'beginner', duration: '', tags: '' })
  const [modForm, setModForm] = useState({ title: '', content: '', video_url: '', duration: '', order_index: '1' })
  const [selectedCourse, setSelectedCourse] = useState('')

  useEffect(() => {
    const load = async () => {
      const [crs, { data: { user } }] = await Promise.all([getAllCourses(), supabase.auth.getUser()])
      setCourses(crs)
      if (user) setUserId(user.id)
    }
    load()
  }, [])

  const setC = (k: string, v: string) => setCourseForm(p => ({ ...p, [k]: v }))
  const setM = (k: string, v: string) => setModForm(p => ({ ...p, [k]: v }))

  const handleCreateCourse = async () => {
    if (!courseForm.title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return }
    setLoading(true)
    const { data, error } = await createCourse({
      title: courseForm.title.trim(),
      description: courseForm.description || undefined,
      level: courseForm.level as any,
      duration: courseForm.duration || undefined,
      tags: courseForm.tags ? courseForm.tags.split(',').map(t => t.trim()) : undefined,
      created_by: userId,
      is_published: true,
    })
    setLoading(false)
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return }
    setCourses(prev => [data, ...prev])
    setCourseForm({ title: '', description: '', level: 'beginner', duration: '', tags: '' })
    toast({ title: 'Course created!' })
  }

  const handleAddModule = async () => {
    if (!selectedCourse || !modForm.title.trim()) { toast({ title: 'Select course and add title', variant: 'destructive' }); return }
    setLoading(true)
    const { error } = await createModule({
      course_id: selectedCourse,
      title: modForm.title.trim(),
      content: modForm.content || undefined,
      video_url: modForm.video_url || undefined,
      duration: modForm.duration || undefined,
      order_index: parseInt(modForm.order_index) || 1,
    })
    setLoading(false)
    if (error) { toast({ title: 'Error', variant: 'destructive' }); return }
    setModForm({ title: '', content: '', video_url: '', duration: '', order_index: '1' })
    toast({ title: 'Module added!' })
  }

  const levelColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-muted-foreground hover:text-gray-900"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">Manage Courses</h1>
          <p className="text-muted-foreground text-sm">{courses.length} courses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Course */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" />New Course</h2>
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="e.g. Introduction to Python" value={courseForm.title} onChange={e => setC('title', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="What will students learn?" value={courseForm.description} onChange={e => setC('description', e.target.value)} className="min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select value={courseForm.level} onValueChange={v => setC('level', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Input placeholder="e.g. 4 hours" value={courseForm.duration} onChange={e => setC('duration', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input placeholder="python, programming, beginner" value={courseForm.tags} onChange={e => setC('tags', e.target.value)} />
            </div>
            <Button onClick={handleCreateCourse} disabled={loading} className="w-full bg-[#1E3A8A] hover:bg-[#1e40af]">
              Create Course
            </Button>
          </CardContent>
        </Card>

        {/* Add Module */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Layers className="h-4 w-4" />Add Module</h2>
            <div className="space-y-1.5">
              <Label>Select Course *</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger><SelectValue placeholder="Choose a course" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Module Title *</Label>
              <Input placeholder="e.g. Variables & Data Types" value={modForm.title} onChange={e => setM('title', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea placeholder="Module content / notes..." value={modForm.content} onChange={e => setM('content', e.target.value)} className="min-h-[60px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Video URL</Label>
              <Input placeholder="YouTube or other video URL" value={modForm.video_url} onChange={e => setM('video_url', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Input placeholder="e.g. 30 min" value={modForm.duration} onChange={e => setM('duration', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input type="number" min="1" value={modForm.order_index} onChange={e => setM('order_index', e.target.value)} />
              </div>
            </div>
            <Button onClick={handleAddModule} disabled={loading || !selectedCourse} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Add Module
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <div className="space-y-2">
        {courses.map(course => (
          <div key={course.id} className="bg-white border rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === course.id ? null : course.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left"
            >
              <BookOpen className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{course.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded-full ${levelColors[course.level]}`}>{course.level}</span>
                  {course.duration && <span>{course.duration}</span>}
                  <span>{course._modules_count ?? 0} modules</span>
                </div>
              </div>
              {expanded === course.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </button>
            {expanded === course.id && course.description && (
              <div className="px-4 pb-3 border-t bg-gray-50">
                <p className="text-sm text-muted-foreground pt-3">{course.description}</p>
                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {course.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
