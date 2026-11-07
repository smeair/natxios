import LegalLayout from '../components/LegalLayout.jsx';
import { LEGAL } from '../lib/legal.js';
import { Link } from '../lib/router.jsx';

const Mail = () => (LEGAL.email ? <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> : 'the contact details on this site');

const sections = [
  {
    id: 'agreement',
    title: 'Agreement to these terms',
    body: (
      <>
        <p>
          These Terms of Use ("Terms") are a legal agreement between you and {LEGAL.name} ("Natxios", "we", "us",
          "our"). They apply to your use of our website, quiz, fact of the day, newsletter, contact form and any related
          features (together, the "Services").
        </p>
        <p>
          By using the Services you confirm that you accept these Terms and our <Link to="/privacy">Privacy Policy</Link>.
          If you do not agree, you must not use the Services.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: 'Who can use the Services',
    body: (
      <p>
        Anyone may enjoy our facts and quiz. You must be at least 13 years old (or the minimum age in your country, if
        higher) to subscribe to the newsletter or use the contact form. If you are under 18, please use the Services
        with the involvement of a parent or guardian. If you use the Services on behalf of an organisation, you confirm
        that you are authorised to accept these Terms for it.
      </p>
    ),
  },
  {
    id: 'licence',
    title: 'Your licence to use the Services',
    body: (
      <p>
        We give you a personal, limited, non exclusive, non transferable and revocable licence to access and use the
        Services for your own personal, non commercial enjoyment, in line with these Terms. All rights not expressly
        given to you are reserved by Natxios.
      </p>
    ),
  },
  {
    id: 'ip',
    title: 'Our content and intellectual property',
    body: (
      <>
        <p>
          The Services and everything in them, including the facts, quiz questions, answers and explanations, our
          selection and arrangement of them (the question bank), text, graphics, design, code, the Natxios name and
          logo, are owned by or licensed to {LEGAL.name} and protected by copyright, database rights, trade mark law and
          other laws worldwide. Our question bank is a database in which we have made a substantial investment, and it
          is protected as such.
        </p>
        <p>
          You may enjoy the content, play the quiz, and share an individual fact or your own quiz score with friends or on
          social media, with a link back to Natxios. Apart from that, you must not copy, reproduce, republish, sell,
          license, translate, adapt or create collections or derivative works from our content without our prior
          written permission.
        </p>
        <p>
          "Natxios" and our logo are our trade marks. You must not use them in a way that suggests we endorse you or
          your products, or that is likely to cause confusion.
        </p>
      </>
    ),
  },
  {
    id: 'ai-tdm',
    title: 'No scraping, data mining or AI training',
    body: (
      <>
        <p>
          We expressly reserve all rights in our content against text and data mining, including for the purpose of
          training, fine tuning or evaluating artificial intelligence or machine learning models. This reservation is
          also expressed in machine readable form on the Services.
        </p>
        <p>
          You must not, and must not allow anyone else to, use any bot, crawler, scraper, script or other automated
          means to access, collect, copy, extract or index the Services or our content, or use our content to build or
          train any dataset, product or model, without our prior written permission. This does not affect mainstream
          search engines indexing pages that we allow to be indexed.
        </p>
      </>
    ),
  },
  {
    id: 'conduct',
    title: 'Acceptable use',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>break any law, or use the Services for anything fraudulent, harmful or unlawful;</li>
          <li>get around, disable or interfere with the daily quiz limit, rate limits, bot protection or any other security feature;</li>
          <li>try to collect, reconstruct or reverse engineer the question bank, answers or any part of the Services;</li>
          <li>probe, scan or test the vulnerability of the Services, or breach any security or authentication measure;</li>
          <li>overload, disrupt or attack the Services, including denial of service attacks, or introduce viruses or malicious code;</li>
          <li>frame or mirror the Services, or remove, hide or change any copyright or proprietary notice;</li>
          <li>impersonate anyone, give false information, or send spam, abusive, threatening, defamatory or unlawful content through the contact form or otherwise;</li>
          <li>use the Services in any way that could damage the reputation of Natxios.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'submissions',
    title: 'Messages, feedback and corrections you send us',
    body: (
      <p>
        If you send us messages, suggestions, ideas, fact corrections or other feedback ("Submissions"), you confirm
        that you have the right to send them and that they are not unlawful. You give us a worldwide, royalty free,
        perpetual and irrevocable licence to use, adapt and act on any Submission, including to improve our content,
        without any obligation or payment to you. We are not obliged to use or respond to any Submission.
      </p>
    ),
  },
  {
    id: 'accuracy',
    title: 'Educational content, accuracy and safety',
    body: (
      <>
        <p>
          Our content is provided for general interest, entertainment and education only. We work hard to share only
          real, checked facts and we correct mistakes when we find them, but science moves on and figures vary between
          sources. We do not promise that any content is complete, accurate, current or suitable for any purpose.
        </p>
        <p>
          Nothing in the Services is professional advice, including veterinary, medical, legal, safety or animal care
          advice. Always consult a qualified professional about the care of an animal. Never approach, handle, feed or
          disturb wild or dangerous animals because of anything you read here. You use the content at your own risk.
        </p>
        <p>If you think something is wrong, please tell us at <Mail /> or through our contact page.</p>
      </>
    ),
  },
  {
    id: 'quiz',
    title: 'The quiz',
    body: (
      <p>
        The quiz is free and for fun. We may limit how many rounds you can play, and change the quiz, its rules, limits
        or questions at any time. Scores and results have no monetary or other value, cannot be exchanged, and may be
        reset or removed. We may refuse or cancel results obtained through automation, cheating or breaking these Terms.
      </p>
    ),
  },
  {
    id: 'newsletter',
    title: 'Newsletter and communications',
    body: (
      <p>
        If you subscribe, we will email you our newsletter and related updates. You can unsubscribe at any time using
        the link in any email or by contacting us. How we handle your details is explained in our{' '}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    id: 'donations',
    title: 'Shop and donations',
    body: (
      <p>
        Our shop and donations are not yet available. When they open, additional terms (such as terms of sale,
        delivery, returns and refunds) will apply and will be shown to you before you buy or give.
      </p>
    ),
  },
  {
    id: 'third-party',
    title: 'Third party services and links',
    body: (
      <p>
        The Services contain links to, and features from, third party services such as Instagram, Facebook, YouTube,
        WhatsApp and X. We do not control and are not responsible for their content, policies or practices, and a link
        does not mean we endorse them. Your use of third party services is at your own risk and under their terms.
      </p>
    ),
  },
  {
    id: 'availability',
    title: 'Availability, changes and suspension',
    body: (
      <>
        <p>
          We provide the Services free of charge and may change, pause, withdraw or discontinue any part of them at any
          time, without notice and without liability. We do not promise that the Services will always be available,
          uninterrupted, secure or free of errors or viruses. You are responsible for protecting your own device.
        </p>
        <p>
          We may suspend or block your access, without notice, if we reasonably believe you have broken these Terms,
          to protect the Services or other users, or where required by law. The sections of these Terms that by their
          nature should continue (including intellectual property, disclaimers, liability and indemnity) will survive.
        </p>
      </>
    ),
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    body: (
      <p>
        To the fullest extent permitted by law, the Services and all content are provided "as is" and "as available",
        without any warranties, conditions or representations of any kind, express or implied, including any implied
        warranties of accuracy, satisfactory quality, fitness for a particular purpose or non infringement.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <>
        <p>
          To the fullest extent permitted by law, Natxios and its owners, contributors and service providers will not be
          liable for any indirect, incidental, special or consequential loss, or for any loss of data, profits, revenue,
          business, goodwill or opportunity, arising out of or in connection with the Services or these Terms, however
          caused, even if foreseeable.
        </p>
        <p>
          Because the Services are free, our total liability to you for all claims arising out of or in connection with
          the Services or these Terms is limited to 100 pounds sterling (or the equivalent in your local currency).
        </p>
        <p>
          Nothing in these Terms excludes or limits our liability for death or personal injury caused by our
          negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot be excluded or
          limited by law. If you are a consumer, nothing in these Terms affects your statutory rights.
        </p>
      </>
    ),
  },
  {
    id: 'indemnity',
    title: 'Your responsibility to us',
    body: (
      <p>
        To the extent permitted by law, you agree to indemnify and hold harmless Natxios and its owners and
        contributors from any claims, losses, damages, liabilities, costs and expenses (including reasonable legal
        fees) arising from your breach of these Terms, your misuse of the Services, or your infringement of anyone's
        rights.
      </p>
    ),
  },
  {
    id: 'copyright',
    title: 'Copyright complaints',
    body: (
      <p>
        We respect intellectual property. If you believe content on the Services infringes your rights, email{' '}
        <Mail /> with your contact details, a description of the work, where it appears on the Services, and a
        statement that you have a good faith belief the use is not authorised and that your notice is accurate. We
        will review it and, where appropriate, remove or correct the content.
      </p>
    ),
  },
  {
    id: 'force-majeure',
    title: 'Events outside our control',
    body: (
      <p>
        We are not responsible for any failure or delay caused by events outside our reasonable control, including
        outages of internet, hosting or other providers, cyber attacks, natural disasters, pandemics, war, strikes or
        actions of government.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these Terms',
    body: (
      <p>
        We may update these Terms from time to time, for example to reflect changes to the Services or the law. The
        "Last updated" date at the top shows when they last changed. If the changes are significant, we will let you
        know clearly. Continuing to use the Services after changes take effect means you accept the updated Terms.
      </p>
    ),
  },
  {
    id: 'general',
    title: 'General',
    body: (
      <ul>
        <li><strong>Entire agreement:</strong> these Terms and our Privacy Policy are the whole agreement between you and us about the Services.</li>
        <li><strong>Severability:</strong> if any part of these Terms is found invalid or unenforceable, the rest stays in full effect.</li>
        <li><strong>No waiver:</strong> if we delay or do not enforce any right, we do not give it up.</li>
        <li><strong>Assignment:</strong> you may not transfer your rights under these Terms. We may transfer ours, for example if Natxios is reorganised or sold.</li>
        <li><strong>Third party rights:</strong> no one other than you and us has any right to enforce these Terms.</li>
        <li><strong>Language:</strong> these Terms are written in English, and the English version prevails.</li>
      </ul>
    ),
  },
  {
    id: 'law',
    title: 'Governing law and disputes',
    body: (
      <>
        <p>
          These Terms and any dispute or claim arising out of or in connection with them or the Services are governed by
          the laws of {LEGAL.jurisdiction}, and the courts of {LEGAL.jurisdiction} have exclusive jurisdiction, except
          that if you are a consumer living elsewhere you may also have the benefit of mandatory protections and courts
          in your own country.
        </p>
        <p>Before starting any formal claim, please contact us at <Mail /> so we can try to resolve it informally.</p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: <p>Questions about these Terms? Email <Mail />.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Use"
      intro="The rules for using the Natxios website, quiz and content, including how our content is protected and the limits of our responsibility. Please read them carefully."
      sections={sections}
    />
  );
}
