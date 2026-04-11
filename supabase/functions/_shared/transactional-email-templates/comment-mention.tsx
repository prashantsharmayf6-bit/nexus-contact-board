/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Ezy CRM'
const LOGO_URL = 'https://eoprxxobxtesoxwfjpgk.supabase.co/storage/v1/object/public/email-assets/ezycrm-logo.png'

interface Props {
  mentionedBy?: string
  leadName?: string
  commentPreview?: string
}

const CommentMentionEmail = ({ mentionedBy, leadName, commentPreview }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{mentionedBy || 'Someone'} mentioned you in a comment</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>You Were Mentioned</Heading>
        <Text style={text}>
          <strong>{mentionedBy || 'A team member'}</strong> mentioned you in a
          comment on lead <strong>{leadName || 'a lead'}</strong>.
        </Text>
        {commentPreview && (
          <Text style={quoteStyle}>
            "{commentPreview}"
          </Text>
        )}
        <Text style={text}>
          Log in to reply and continue the conversation.
        </Text>
        <Button style={button} href="#">
          View Comment
        </Button>
        <Text style={footer}>
          You're receiving this because you were mentioned in {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CommentMentionEmail,
  subject: (data: Record<string, any>) => `${data.mentionedBy || 'Someone'} mentioned you in a comment`,
  displayName: 'Comment mention',
  previewData: { mentionedBy: 'Admin User', leadName: 'Prashant Sharma', commentPreview: 'Can you follow up on this lead?' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(240, 20%, 12%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(240, 10%, 46%)', lineHeight: '1.5', margin: '0 0 25px' }
const quoteStyle = { fontSize: '14px', color: 'hsl(240, 10%, 46%)', lineHeight: '1.5', margin: '0 0 25px', padding: '12px 16px', borderLeft: '3px solid hsl(230, 80%, 56%)', backgroundColor: '#f8f9fa', borderRadius: '0 8px 8px 0' }
const button = { backgroundColor: 'hsl(230, 80%, 56%)', color: '#ffffff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
