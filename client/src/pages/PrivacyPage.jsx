import LegalLayout from '../components/LegalLayout.jsx';
import LegalTable from '../components/LegalTable.jsx';
import { LEGAL } from '../lib/legal.js';
import { Link } from '../lib/router.jsx';
import { openCookieSettings } from '../lib/consent.js';

const Mail = () => (LEGAL.email ? <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> : 'the contact details on this site');

const sections = [
  {
    id: 'about',
    title: 'About this policy',
    body: (
      <>
        <p>
          This Privacy Policy explains how {LEGAL.name} ("Natxios", "we", "us", "our") collects, uses, stores, shares
          and protects personal data when you visit our website, play the quiz, subscribe to our newsletter or contact
          us (together, the "Services"). It also explains your rights and how to use them.
        </p>
        <p>
          We follow the principle of data minimisation: we collect as little personal data as possible, keep it for as
          short a time as possible, and never use it for advertising. Please read this policy together with our{' '}
          <Link to="/terms">Terms of Use</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'controller',
    title: 'Who is responsible for your data',
    body: (
      <p>
        {LEGAL.name} is the data controller responsible for your personal data. For any question or request about this
        policy or your data, contact us at <Mail />. We aim to reply within 30 days.
      </p>
    ),
  },
  {
    id: 'collect',
    title: 'What we collect, why, and our legal basis',
    body: (
      <>
        <p>We only collect the personal data described below. We do not collect special category data (such as health,
          religion or ethnicity), and we ask you not to send it to us.</p>
        <LegalTable
          caption="Personal data we process"
          head={['Activity', 'Data', 'Purpose', 'Legal basis']}
          rows={[
            ['Newsletter sign up', 'Email address, first name (optional), time of consent, scrambled IP address, browser description', 'To send the newsletter you asked for and to prevent spam sign ups', 'Your consent, which you can withdraw at any time'],
            ['Contact form', 'Name, email address, subject, message, scrambled IP address, browser description', 'To read and reply to your message and to prevent spam and abuse', 'Our legitimate interest in answering enquiries'],
            ['Quiz', 'A random player ID stored on your device; on our server, your place in the question bank and daily round counts, linked only to that random ID', 'To run a fair quiz with daily limits and no repeated questions', 'Our legitimate interest in providing the quiz'],
            ['Security', 'IP address (briefly, for rate limiting), scrambled IP address (for blocking attacks), request details', 'To protect the Services, prevent abuse, fraud and attacks', 'Our legitimate interest in keeping the Services secure'],
            ['Visitor statistics', 'A daily changing scrambled identifier, page visited; only daily totals are kept', 'To understand how the Services are used and improve them', 'Our legitimate interest in improving the Services'],
            ['Error logs', 'Page or feature involved, time, technical error details (no IP address or form contents)', 'To find and fix problems', 'Our legitimate interest in running a working website'],
          ]}
        />
        <p>
          Where we rely on legitimate interests, we have balanced our interests against your rights and minimised the
          data involved (for example by scrambling IP addresses). You can object at any time; see{' '}
          <a href="#rights">Your rights</a>.
        </p>
        <p>
          <strong>Sources:</strong> we collect personal data directly from you, or automatically from your device when
          you use the Services. We do not buy personal data or receive it from data brokers.
        </p>
        <p>
          <strong>Scrambled IP addresses:</strong> we use a one way cryptographic hash with a secret key. It lets us
          recognise repeated abuse, but cannot be turned back into your IP address.
        </p>
      </>
    ),
  },
  {
    id: 'not-do',
    title: 'What we do not do',
    body: (
      <ul>
        <li>We do not sell your personal data, and we do not share it for targeted or cross context advertising.</li>
        <li>We do not show ads or use advertising or social media tracking pixels.</li>
        <li>We do not build profiles about you or make decisions about you by automated means that have legal or similarly significant effects.</li>
        <li>We do not use your personal data to train artificial intelligence models.</li>
        <li>We do not knowingly collect personal data from children under 13.</li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and storage on your device',
    body: (
      <>
        <p>
          We do not use advertising or tracking cookies. We use only the following, which are strictly necessary for
          the Services you request, so they do not need your consent:
        </p>
        <LegalTable
          caption="Cookies and local storage"
          head={['Name', 'Type', 'Purpose', 'How long']}
          rows={[
            ['natxios-consent', 'Local storage', 'Remembers your cookie choice', 'Until you clear it'],
            ['natxios-quiz', 'Local storage', 'Random player ID, so you do not get repeated questions', 'Until you clear it'],
            ['nx_admin', 'Cookie (secure, HttpOnly)', 'Keeps the site owner signed in to the admin area; never set for visitors', 'Up to 2 hours'],
          ]}
        />
        <p>
          If we ever add optional analytics, it will only run after you accept it, and this policy will be updated
          first. You can change your choice at any time:{' '}
          <button type="button" className="legal__link-btn" onClick={openCookieSettings}>open cookie settings</button>.
        </p>
        <p>
          <strong>Do Not Track and Global Privacy Control:</strong> because we do not track you across sites or sell or
          share personal data, there is nothing for these signals to switch off. We respect them as a valid opt out
          where the law requires.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share data with',
    body: (
      <>
        <p>We only share personal data where necessary, with:</p>
        <ul>
          <li><strong>Service providers (processors)</strong> who help us run the Services, such as website hosting, database, caching, security and email delivery providers. They may only use the data on our instructions, under written contracts that require confidentiality and appropriate security.</li>
          <li><strong>Professional advisers</strong>, such as lawyers or accountants, where needed and under a duty of confidentiality.</li>
          <li><strong>Authorities</strong>, where we are required by law, court order or to protect the rights, safety or property of Natxios, our users or others.</li>
          <li><strong>A successor</strong>, if Natxios or its assets are transferred, reorganised or sold; this policy would continue to protect your data.</li>
        </ul>
        <p>
          Links to Instagram, Facebook, YouTube, WhatsApp, X and other sites take you to services we do not control.
          When you share your quiz score on those platforms, their own privacy policies apply.
        </p>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'International transfers',
    body: (
      <p>
        Our service providers may process data in countries other than your own, including outside the UK and the
        European Economic Area. When that happens, we use recognised safeguards, such as adequacy decisions, the UK
        International Data Transfer Agreement or Addendum, or the European Commission's Standard Contractual Clauses,
        and we take steps to make sure your data stays protected.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep data',
    body: (
      <>
        <LegalTable
          caption="Retention periods"
          head={['Data', 'Kept for']}
          rows={[
            ['Newsletter details', 'Until you unsubscribe or ask us to delete them'],
            ['Contact messages', 'Deleted automatically after 12 months, or sooner on request'],
            ['Daily quiz round counts', 'Until the end of the day (UTC)'],
            ['Quiz progress (linked only to a random player ID)', 'Up to 400 days after you last play'],
            ['Rate limit records', 'A few minutes, at most an hour'],
            ['Blocks for attack attempts', 'Up to an hour (scrambled IP address only)'],
            ['Visitor statistics', 'Daily totals only, for up to 90 days'],
            ['Error logs', 'Deleted automatically as the log rotates'],
          ]}
        />
        <p>We may keep data longer only if the law requires it, or to establish, exercise or defend legal claims.</p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect data',
    body: (
      <>
        <p>
          We use appropriate technical and organisational measures, including encrypted connections (HTTPS), strict
          security headers, rate limiting, bot protection, input validation, scrambled IP addresses, encrypted storage of
          our content, and access to personal data limited to the site owner using strong passwords and two factor
          authentication.
        </p>
        <p>
          No system is completely secure. If a personal data breach is likely to put your rights at risk, we will tell
          the relevant authority and, where required, you, without undue delay.
        </p>
      </>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li><strong>Access</strong> the personal data we hold about you and receive a copy;</li>
          <li><strong>Correct</strong> data that is inaccurate or incomplete;</li>
          <li><strong>Delete</strong> your data;</li>
          <li><strong>Restrict</strong> how we use it, or <strong>object</strong> to our use based on legitimate interests;</li>
          <li><strong>Data portability</strong>: receive your data in a common format or have it sent to someone else;</li>
          <li><strong>Withdraw consent</strong> at any time, for example by unsubscribing from the newsletter, without affecting what we did before;</li>
          <li><strong>Opt out</strong> of the sale or sharing of personal data and of targeted advertising (we do neither);</li>
          <li><strong>Not be discriminated against</strong> for using your rights.</li>
        </ul>
        <p>
          To use any right, email <Mail />. We may need to confirm your identity before acting on a request, to protect
          your data. We will respond within one month (or the time set by your local law). If we refuse a request, we
          will tell you why and how you can appeal.
        </p>
        <p>
          If you are unhappy with how we handle your data, please contact us first. You also have the right to
          complain to your data protection authority, for example the UK Information Commissioner's Office (ico.org.uk),
          your EU supervisory authority, or the Nigeria Data Protection Commission (ndpc.gov.ng).
        </p>
      </>
    ),
  },
  {
    id: 'regions',
    title: 'Information for specific regions',
    body: (
      <>
        <h3>United Kingdom and European Economic Area</h3>
        <p>We process personal data under the UK GDPR, the Data Protection Act 2018 and the EU GDPR, on the legal bases set out above.</p>
        <h3>United States</h3>
        <p>
          Residents of California and other states with consumer privacy laws have rights to know, delete, correct and
          opt out. In the last 12 months we have collected identifiers (such as email address and scrambled IP
          address) and internet activity (such as pages visited, in aggregate), only for the purposes above. We have not
          sold or shared personal information, and we do not use or disclose sensitive personal information.
        </p>
        <h3>Nigeria</h3>
        <p>We process personal data in line with the Nigeria Data Protection Act 2023 and you have the rights it provides.</p>
        <h3>Canada and elsewhere</h3>
        <p>Where other privacy laws apply to you, such as PIPEDA in Canada, you have the rights those laws provide and can use them by contacting us.</p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <p>
        Our facts and quiz are suitable for all ages, but the newsletter and contact form are only for people aged 13
        and over (or the minimum age in your country, if higher). We do not knowingly collect personal data from
        children under 13. If you believe a child has given us personal data, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy from time to time. We will change the "Last updated" date at the top, and if the
        changes are significant we will let you know clearly, for example on the website or by email to newsletter
        subscribers.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: <p>For any privacy question or request, email <Mail />.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro="What personal data Natxios collects, why, how long we keep it, who we share it with and your rights. We collect as little as we can and never use it for advertising."
      sections={sections}
    />
  );
}
