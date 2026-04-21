/**
 * Review Service - Internal API for Review Workflows
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase config')
  }
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
}

export const REVIEW_ACTION = {
  APPROVE: 'approved',
  REJECT: 'rejected',
  MERGE: 'merged'
}

export async function listReviewOffers(options = {}) {
  const { limit = 50, offset = 0, status = 'review' } = options
  const supabase = getClient()
  
  const { data, error, count } = await supabase
    .from('raw_offers')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw new Error(`Failed: ${error.message}`)
  return { items: data || [], count: count || 0, limit, offset }
}

export async function getReviewOffer(id) {
  const supabase = getClient()
  const { data, error } = await supabase.from('raw_offers').select('*').eq('id', id).single()
  if (error || !data) throw new Error(`Not found: ${id}`)
  
  let statusNotes = {}
  try { statusNotes = data.status_notes ? JSON.parse(data.status_notes) : {} } catch {}
  
  return {
    id: data.id, title: data.title, description: data.description,
    status: data.status, source: data.source, url: data.url,
    createdAt: data.created_at, processedAt: data.processed_at, statusNotes
  }
}

export async function approveReviewOffer(id, approvedBy = 'system') {
  const { approveReview } = await import('../actions.js')
  return approveReview(id, approvedBy)
}

export async function rejectReviewOffer(id, reason, rejectedBy = 'system') {
  const { rejectReview } = await import('../actions.js')
  return rejectReview(id, reason, rejectedBy)
}

export async function mergeReviewOffer(id, targetId, mergedBy = 'system') {
  const { mergeReview } = await import('../actions.js')
  return mergeReview(id, targetId, mergedBy)
}

export async function getReviewAudit(id) {
  const supabase = getClient()
  const { data, error } = await supabase.from('raw_offers')
    .select('id, status, status_notes, processed_at').eq('id', id).single()
  if (error || !data) throw new Error(`Not found: ${id}`)
  
  let audit = {}
  try { audit = data.status_notes ? JSON.parse(data.status_notes) : {} } catch {}
  return { id: data.id, currentStatus: data.status, audit, processedAt: data.processed_at }
}

export async function getReviewStats() {
  const supabase = getClient()
  const statuses = ['review', 'approved', 'rejected', 'merged', 'skipped_duplicate']
  const stats = {}
  for (const s of statuses) {
    const { count } = await supabase.from('raw_offers')
      .select('*', { count: 'exact', head: true }).eq('status', s)
    stats[s] = count || 0
  }
  return stats
}
