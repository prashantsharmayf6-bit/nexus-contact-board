/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Ezy CRM'
const LOGO_URL = 'https://eoprxxobxtesoxwfjpgk.supabase.co/storage/v1/object/public/email-assets/ezycrm-logo.png'

interface Props {
  leadName?: string
  assignedBy?: string
}

const LeadAssignedEmail = ({ leadName, assignedBy }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>A lead has been assigned to you on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="48" height="48" style={logo} />
        <Heading style={h1}>Lead Assigned to You</Heading>
        <Text style={text}>
          {assignedBy ? `${assignedBy} has` : 'Someone has'} assigned the lead
          <strong> {leadName || 'a new lead'}</strong> to you in {SITE_NAME}.
        </Text>
        <Text style={text}>
          Log in to view the lead details and take action.
        </Text>
        <Button style={button} href="#">
          View Lead
        </Button>
        <Text style={footer}>
          You're receiving this because you're a member of {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LeadAssignedEmail,
  subject: (data: Record<string, any>) => `Lead "${data.leadName || 'New Lead'}" assigned to you`,
  displayName: 'Lead assigned',
  previewData: { leadName: 'Prashant Sharma', assignedBy: 'Admin User' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(240, 20%, 12%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(240, 10%, 46%)', lineHeight: '1.5', margin: '0 0 25px' }
const button = { backgroundColor: 'hsl(230, 80%, 56%)', color: '#ffffff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
