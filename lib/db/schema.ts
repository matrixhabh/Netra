import { bigint, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const evidence = pgTable('evidence', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull(),
  originalFilename: text('original_filename').notNull(),
  title: text('title').notNull().default(''),
  mimeType: text('mime_type').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  storagePath: text('storage_path').notNull().unique(),
  uploadedBy: text('uploaded_by').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  status: text('status').notNull().default('Pending review'),
  description: text('description'),
})

export const evidenceAuditLog = pgTable('evidence_audit_log', {
  id: text('id').primaryKey(),
  evidenceId: text('evidence_id').notNull(),
  caseId: text('case_id').notNull(),
  action: text('action').notNull(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Evidence = typeof evidence.$inferSelect
export type NewEvidence = typeof evidence.$inferInsert

export const schema = { evidence, evidenceAuditLog }

export default schema
