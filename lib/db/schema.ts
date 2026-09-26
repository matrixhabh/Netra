import { bigint, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

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

export type Evidence = typeof evidence.$inferSelect
export type NewEvidence = typeof evidence.$inferInsert

export const schema = { evidence }

export default schema
