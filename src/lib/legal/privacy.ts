import type { LegalDocument } from './types';

export const privacyPolicy: LegalDocument = {
  slug: 'privacy',
  title: 'TheTravela Privacy Policy',
  effectiveDate: 'January 2026',
  intro: [
    'At Onnela Limited we are committed to safeguarding the personal information of all travellers and customers who utilize our TheTravela eSIM services. This privacy policy outlines how we collect, use, share, and protect your data in accordance with the Personal Data Protection Act of 2022 and the guidelines established by the Personal Data Protection Commission (PDPC) of Tanzania, as well as the General Data Protection Regulation (GDPR) for data subjects in the European Economic Area (EEA) or where GDPR applies.',
  ],
  sections: [
    {
      number: '1',
      title: 'Information Submitted To TheTravela (Onnela Limited)',
      blocks: [
        {
          type: 'p',
          text: 'To access TheTravela eSIM services, the traveller/customer shall be required to submit the following information:',
        },
        {
          type: 'ul',
          items: [
            'Contact and identification details such as full names, email addresses, phone numbers, nationality, duration of stay and areas of visitation in order for TheTravela to assign eSIM that provides the strongest signal/connectivity during your stay or visitation',
            'Device identifiers necessary for eSIM activation (e.g., IMEI and EID)',
            'Payment information (processed securely via third-party providers; we do not store full card details)',
          ],
        },
        {
          type: 'p',
          text: 'By accepting the terms and conditions, the customer is also accepting that Onnela Limited may access necessary network and usage data from our eSIM infrastructure partners for the provision and optimisation of your connectivity service.',
        },
      ],
    },
    {
      number: '2',
      title: 'Why We Collect Your Data',
      blocks: [
        {
          type: 'p',
          text: 'The information gathered is used for the following purposes:',
        },
        {
          type: 'ul',
          items: [
            'Processing eSIM purchase and activation requests',
            'Providing, managing and optimising data connectivity services',
            'Troubleshooting, support and account management',
            'Enhancing our services and user experience',
            'Meeting legal obligations under the Personal Data Protection Act 2022, PDPC guidelines, and GDPR',
            'Providing updates and notifications regarding your eSIM (activation, usage alerts, expiry reminders)',
          ],
        },
      ],
    },
    {
      number: '3',
      title: 'Legal Grounds for Using Your Data',
      blocks: [
        {
          type: 'p',
          text: 'We rely on customer consent, contractual necessity, legitimate business interests and legal requirements to process personal information in accordance with the Personal Data Protection Act 2022 (PDPC) and GDPR (where applicable to EEA/EU subjects). You may withdraw your consent at any time but doing so will limit the services we can offer you.',
        },
      ],
    },
    {
      number: '4',
      title: 'Restricted Data Usage',
      blocks: [
        {
          type: 'p',
          text: 'In compliance with the Personal Data Protection Act 2022, PDPC guidelines and GDPR, we do not access or process the following prohibited information:',
        },
        {
          type: 'ul',
          items: [
            'Information irrelevant to TheTravela eSIM services',
            'Data used for fraudulent or misleading purposes',
            'Biometric or sensitive personal data without explicit authorisation',
          ],
        },
      ],
    },
    {
      number: '5',
      title: 'Sharing of Personal Data',
      blocks: [
        {
          type: 'p',
          text: 'We only share your personal data under the following circumstances:',
        },
        {
          type: 'ul',
          items: [
            'Regulatory Requirements: Sharing data with regulatory bodies such as the Personal Data Protection Commission (PDPC) and the Tanzania Communications Regulatory Authority (TCRA) to meet legal obligations',
            'Service Providers: Sharing limited data with trusted eSIM platform providers, network operators and payment processors under strict confidentiality and data processing agreements compliant with PDPC and GDPR',
            'Legal Proceedings: Disclosure of data during legal proceedings or in response to valid legal requirements',
          ],
        },
      ],
    },
    {
      number: '6',
      title: 'Consent',
      blocks: [
        {
          type: 'p',
          text: 'By using our services, you agree to the collection and handling of your personal data as described. You can withdraw consent in writing, though this may impact service delivery.',
        },
      ],
    },
    {
      number: '7',
      title: 'Data Security',
      blocks: [
        {
          type: 'p',
          text: 'We ensure the protection of your data through robust security measures, including encryption, secure access control, and regular security system audits.',
        },
      ],
    },
    {
      number: '8',
      title: 'Data Protection Measures',
      blocks: [
        {
          type: 'p',
          text: 'We apply strong security practices, including encryption, access controls, and regular system checks to safeguard your data. Access to sensitive information is restricted to authorised personnel.',
        },
      ],
    },
    {
      number: '9',
      title: 'Data Retention',
      blocks: [
        {
          type: 'p',
          text: 'Your information is kept only as long as necessary for service delivery or regulatory compliance (including PDPC and GDPR retention obligations). After this period, data is securely deleted or anonymised.',
        },
      ],
    },
    {
      number: '10',
      title: 'International Data Transfers',
      blocks: [
        {
          type: 'p',
          text: 'If your information needs to be transferred outside Tanzania, it will be done with approval of the Personal Data Protection Commission (PDPC) in accordance with Part V of the Personal Data Protection Act 2022 and only where appropriate safeguards are in place (including Standard Contractual Clauses or other GDPR-compliant mechanisms for EEA/EU data subjects).',
        },
      ],
    },
    {
      number: '11',
      title: 'Legal and Regulatory Compliance',
      blocks: [
        {
          type: 'p',
          text: 'We uphold all legal requirements by:',
        },
        {
          type: 'ul',
          items: [
            'Maintaining transparency in data usage',
            'Avoiding deceptive data collection practices',
            'Ensuring fairness and accuracy in data used for service decisions',
            'Respecting the rights of data subjects under the Personal Data Protection Act 2022 (PDPC) and GDPR (including rights of access, rectification, erasure, restriction, portability and objection)',
          ],
        },
      ],
    },
    {
      number: '12',
      title: 'Updates to This Policy',
      blocks: [
        {
          type: 'p',
          text: 'We reserve the right to update this policy periodically to reflect changes in regulations or internal practices and communicate the changes through our channels such as website www.onnelalimited.com.',
        },
        {
          type: 'p',
          text: 'For any questions, to exercise your data subject rights, or to contact our data protection team, please write to hello@onnelalimited.com.',
        },
        {
          type: 'p',
          text: 'This policy is effective as of January 2026 for TheTravela eSIM Solution by Onnela Limited.',
        },
      ],
    },
  ],
  contact: {
    company: 'Onnela Limited',
    email: 'hello@onnelalimited.com',
    website: 'https://www.onnelalimited.com',
    extra: 'Data protection enquiries and data subject rights requests.',
  },
};
