import React, { useState } from 'react';

const Section = ({ num, title, children }) => (
  <div style={{ marginBottom: '2.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 13, color: '#a5b4fc', flexShrink: 0 }}>{num}</div>
      <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 19, fontWeight: 700 }}>{title}</h2>
    </div>
    <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.9, paddingLeft: 48 }}>{children}</div>
  </div>
);

const Bullet = ({ children }) => (
  <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
    <span style={{ color: '#a5b4fc', flexShrink: 0 }}>→</span>
    <span>{children}</span>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem', paddingTop: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 11, fontWeight: 600, color: '#a5b4fc', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Legal Document
        </div>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 40, fontWeight: 700, marginBottom: '0.75rem' }}>Privacy Policy</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)' }}>
          <span>📅 Last updated: May 2026</span>
          <span>⬡ TaskFlow Platform</span>
        </div>
        <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', borderRadius: 'var(--r-md)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          This Privacy Policy explains how TaskFlow ("we", "us", "our") collects, uses, and protects your information when you use our platform. By using TaskFlow, you agree to this policy.
        </div>
      </div>

      <Section num="01" title="Who We Are">
        <p>TaskFlow is a team task management platform built and operated by Yash Rajput, an independent developer based in India. This is an independent project and not affiliated with any corporation.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 4 }}>EMAIL</div>
            <a href="mailto:rajput.kyar@gmail.com" style={{ color: '#a5b4fc', fontWeight: 500, textDecoration: 'none' }}>rajput.kyar@gmail.com</a>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 4 }}>LINKEDIN</div>
            <a href="https://linkedin.com/in/yash9rajput/" target="_blank" rel="noreferrer" style={{ color: '#67e8f9', fontWeight: 500, textDecoration: 'none' }}>linkedin/yashrajput</a>
          </div>
        </div>
      </Section>

      <Section num="02" title="Information We Collect">
        <p style={{ marginBottom: '0.75rem' }}>We collect only the minimum data necessary to operate the platform:</p>
        <Bullet><strong>Account Data:</strong> Your name, email address, and password (stored as a bcrypt hash — we never store plain-text passwords).</Bullet>
        <Bullet><strong>Usage Data:</strong> Projects, tasks, and notes you create within the platform.</Bullet>
        <Bullet><strong>Notes & Attachments:</strong> Notes are stored locally in your browser (localStorage). File attachments in notes use base64 encoding stored in your browser only.</Bullet>
        <Bullet><strong>Session Data:</strong> A JWT (JSON Web Token) stored in your browser's localStorage to keep you logged in.</Bullet>
      </Section>

      <Section num="03" title="How We Use Your Information">
        <Bullet>To authenticate you and maintain your session securely.</Bullet>
        <Bullet>To display your projects, tasks, and team information within the app.</Bullet>
        <Bullet>To enable team collaboration — your name and email are visible to other members of your workspace.</Bullet>
        <Bullet>To provide the AI Assistant feature (prompts are sent to the Anthropic Claude API — see Section 8).</Bullet>
        <Bullet>We do NOT sell, rent, or share your data with third parties for marketing purposes.</Bullet>
      </Section>

      <Section num="04" title="Data Storage and Security">
        <Bullet><strong>Database:</strong> Account, project, and task data is stored in a managed PostgreSQL database hosted on Railway (railway.app).</Bullet>
        <Bullet><strong>Password Security:</strong> All passwords are hashed using bcryptjs with a salt factor of 10. Plain-text passwords are never stored or logged.</Bullet>
        <Bullet><strong>Authentication:</strong> We use JWT tokens with expiration. Tokens are stored in localStorage and sent via Authorization headers.</Bullet>
        <Bullet><strong>HTTPS:</strong> All traffic between your browser and our servers is encrypted via HTTPS (enforced by Railway's infrastructure).</Bullet>
        <Bullet><strong>Notes:</strong> Notes data is stored exclusively in your browser's localStorage and never sent to our servers.</Bullet>
      </Section>

      <Section num="05" title="Cookies and Local Storage">
        <p style={{ marginBottom: '0.75rem' }}>TaskFlow uses browser localStorage (not cookies) to store:</p>
        <Bullet>Your authentication JWT token (key: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>token</code>)</Bullet>
        <Bullet>Your notes data (key: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>tf-notes-v1</code>)</Bullet>
        <Bullet>Your selected theme preference (key: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>tf-theme</code>)</Bullet>
        <p style={{ marginTop: '0.75rem' }}>You can clear all localStorage data at any time via your browser's developer tools. Signing out removes the authentication token automatically.</p>
      </Section>

      <Section num="06" title="Advertising">
        <p>TaskFlow contains <strong>no advertising</strong> of any kind. We do not display ads, run ad networks, or allow advertisers to target users. The platform is completely ad-free.</p>
      </Section>

      <Section num="07" title="Third-Party Services">
        <p style={{ marginBottom: '0.75rem' }}>TaskFlow uses the following third-party services:</p>
        <Bullet><strong>Railway (railway.app):</strong> Cloud hosting for backend API and PostgreSQL database. Subject to Railway's privacy policy.</Bullet>
        <Bullet><strong>Anthropic Claude API:</strong> Powers the AI Assistant. When you use the AI section, your messages are sent to Anthropic's API. Subject to Anthropic's privacy policy. We do not store AI conversation history on our servers.</Bullet>
        <Bullet><strong>Google Fonts:</strong> Loads the Clash Display and Satoshi fonts. Your IP address may be logged by Google as part of the font request.</Bullet>
      </Section>

      <Section num="08" title="Your Rights and Choices">
        <Bullet><strong>Access:</strong> You can view all your data within the TaskFlow interface.</Bullet>
        <Bullet><strong>Deletion:</strong> You can delete your projects, tasks, and notes at any time. To delete your account entirely, contact us at rajput.kyar@gmail.com.</Bullet>
        <Bullet><strong>Data Export:</strong> Notes can be shared/copied from within the app. Database exports are available on request.</Bullet>
        <Bullet><strong>Opt-out:</strong> You may stop using TaskFlow at any time. Simply close the app and clear your localStorage to remove all local data.</Bullet>
      </Section>

      <Section num="09" title="Children's Privacy">
        <p>TaskFlow is not designed for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with their information, please contact us immediately at <a href="mailto:rajput.kyar@gmail.com" style={{ color: '#a5b4fc' }}>rajput.kyar@gmail.com</a> and we will take immediate action.</p>
      </Section>

      <Section num="10" title="Changes to This Policy">
        <p>We may update this Privacy Policy from time to time to reflect changes in the platform or legal requirements. When we do, the "Last updated" date at the top of this page will be revised. Continued use of TaskFlow after changes constitutes your acceptance of the updated policy.</p>
        <p style={{ marginTop: '0.75rem' }}>For significant changes, we will display a notice within the application.</p>
      </Section>

      <Section num="11" title="Contact Us">
        <p style={{ marginBottom: '1rem' }}>If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please reach out:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 500 }}>
          <div style={{ padding: '1rem', borderRadius: 'var(--r-md)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>EMAIL</div>
            <a href="mailto:rajput.kyar@gmail.com" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>rajput.kyar@gmail.com</a>
          </div>
          <div style={{ padding: '1rem', borderRadius: 'var(--r-md)', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>LINKEDIN</div>
            <a href="https://linkedin.com/in/yash9rajput/" target="_blank" rel="noreferrer" style={{ color: '#67e8f9', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>linkedin/yashrajput</a>
          </div>
        </div>
      </Section>

      <div style={{ textAlign: 'center', padding: '2rem', borderRadius: 'var(--r-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>© 2026 TaskFlow · Built by Yash Rajput · All rights reserved</div>
      </div>
    </div>
  );
}
