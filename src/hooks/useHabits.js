import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useHabits(userId) {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHabits = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) setError(error.message)
    else setHabits(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const addHabit = async (name, emoji = '✅') => {
    const { data, error } = await supabase
      .from('habits')
      .insert([{ user_id: userId, name, emoji }])
      .select()
      .single()

    if (error) throw new Error(error.message)
    setHabits(prev => [...prev, data])
    return data
  }

  const updateHabit = async (id, name, emoji) => {
    const { data, error } = await supabase
      .from('habits')
      .update({ name, emoji })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    setHabits(prev => prev.map(h => (h.id === id ? data : h)))
    return data
  }

  const deleteHabit = async (id) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  return { habits, loading, error, fetchHabits, addHabit, updateHabit, deleteHabit }
}
