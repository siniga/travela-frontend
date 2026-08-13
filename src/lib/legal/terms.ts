import type { LegalDocument } from './types';

export const termsAndConditions: LegalDocument = {
  slug: 'terms',
  title: 'TheTravela Terms and Conditions',
  effectiveDate: 'January 2026',
  intro: [
    'Welcome to TheTravela, an eSIM and physical SIM card connectivity service operated by Onnela Limited. These Terms and Conditions ("Terms") govern your access to and use of TheTravela website, mobile applications, and SIM/eSIM services (together, the "Services"). By purchasing, activating, or otherwise using our Services, you agree to be bound by these Terms. If you do not agree, please do not use our Services.',
    'These Terms should be read together with our Privacy Policy, which explains how we collect, use, and protect your personal data in accordance with the Personal Data Protection Act 2022 (Tanzania) and, where applicable, the GDPR.',
  ],
  sections: [
    {
      number: '1',
      title: 'About Us',
      blocks: [
        {
          type: 'p',
          text: 'TheTravela is a prepaid mobile data connectivity solution provided by Onnela Limited, a company registered in Tanzania, offering both eSIM and physical SIM card options. TheTravela enables travellers and customers to purchase and activate prepaid mobile data plans for use during their stay or visitation in supported destinations.',
        },
      ],
    },
    {
      number: '2',
      title: 'Eligibility',
      blocks: [
        {
          type: 'p',
          text: 'To use our Services, you must:',
        },
        {
          type: 'ul',
          items: [
            'Be at least 18 years old, or have the consent of a parent or legal guardian;',
            'Have the legal capacity to enter into a binding agreement;',
            'Own or have authorised use of a device that is eSIM-compatible and network-unlocked;',
            'Provide accurate and complete registration and identification information as required for eSIM assignment and activation.',
          ],
        },
      ],
    },
    {
      number: '3',
      title: 'Description of Services',
      blocks: [
        {
          type: 'p',
          text: 'TheTravela provides prepaid eSIM data plans that allow customers to access mobile data connectivity through our network infrastructure partners. Specific features include:',
        },
        {
          type: 'ul',
          items: [
            'Selection and purchase of data plans based on destination, duration, and data volume;',
            'Remote eSIM provisioning via QR code or direct device installation;',
            "Assignment of network profiles intended to provide strong signal and connectivity coverage during the customer's stated duration and areas of visitation;",
            'Account and usage management tools, including activation, usage alerts, and expiry reminders.',
          ],
        },
        {
          type: 'p',
          text: 'We do not manufacture or control the underlying mobile networks. Connectivity is provided in partnership with third-party eSIM platform providers and mobile network operators ("Network Partners"), and coverage, speed, and quality may vary based on their infrastructure.',
        },
      ],
    },
    {
      number: '4',
      title: 'Account Registration and Device Requirements',
      blocks: [
        {
          type: 'p',
          text: 'To activate an eSIM, you must submit a certain amount of information, including your full name, email address, and eSIM activation date necessary for eSIM activation. You are responsible for:',
        },
        {
          type: 'ul',
          items: [
            'Ensuring your device is eSIM-compatible and carrier-unlocked before purchase;',
            'Providing accurate personal information;',
            'Maintaining the security of any account credentials associated with your use of the Services.',
          ],
        },
        {
          type: 'p',
          text: 'TheTravela is not responsible for activation failures caused by incompatible, locked, or improperly configured devices.',
        },
      ],
    },
    {
      number: '5',
      title: 'Purchases, Pricing, and Payment',
      blocks: [
        {
          type: 'ul',
          items: [
            'All prices for data plans are displayed on our website or app prior to purchase and are shown in the applicable currency, inclusive or exclusive of taxes as indicated at checkout.',
            'Payments are processed securely through third-party payment providers. TheTravela does not store your full payment card details.',
            'By completing a purchase, you authorise us and our payment processors to charge the applicable fees to your chosen payment method.',
            'We reserve the right to change pricing at any time, provided that changes will not affect orders already confirmed and paid for.',
          ],
        },
      ],
    },
    {
      number: '6',
      title: 'SIM Selection Responsibility',
      blocks: [
        {
          type: 'p',
          text: 'TheTravela offers both eSIM and physical SIM card options. Before completing a purchase, it is the customer\'s sole responsibility to:',
        },
        {
          type: 'ul',
          items: [
            'Confirm whether their device is eSIM-compatible and carrier-unlocked, or whether a physical SIM card is required;',
            'Select the correct SIM type (eSIM or physical SIM) that matches their device and travel needs;',
            'Verify all order details, including destination, data plan, and SIM type, before completing checkout.',
          ],
        },
        {
          type: 'p',
          text: "TheTravela is not responsible for a customer's incorrect selection of SIM type or plan, and such errors do not qualify for a refund, exchange, or credit once the purchase is completed. We strongly encourage customers to check their device compatibility and confirm all order details carefully prior to purchase.",
        },
      ],
    },
    {
      number: '7',
      title: 'Activation, Data Transfer, and Refund Policy',
      blocks: [
        {
          type: 'ul',
          items: [
            'eSIM profiles are delivered electronically (via QR code or app-based activation) and physical SIM cards are delivered or collected as arranged at the point of sale, and must be installed/inserted into a compatible device.',
            'Data plans are typically activated either immediately upon installation/insertion or upon first network connection in the destination country/region, as specified on the relevant plan.',
            'Each data plan has a defined validity period and data allowance, shown at the point of purchase. Unused data or validity does not carry over after expiry unless expressly stated otherwise.',
          ],
        },
        {
          type: 'note',
          title: 'No Data Transfer',
          text: 'Once a SIM card (eSIM or physical) has been purchased, the data allowance and plan associated with it are permanently and exclusively tied to that specific SIM card. Data cannot be transferred, reassigned, or moved to another SIM card, device, or customer account under any circumstances.',
        },
        {
          type: 'note',
          title: 'No Refunds',
          text: 'All SIM card and data plan purchases are final. Once a purchase is completed, no refunds will be issued, whether or not the SIM has been activated or the data has been used, except where a refund is strictly required by applicable mandatory consumer protection law. Customers are responsible for ensuring the correct SIM type, plan, and order details are selected before completing payment, as set out in Section 6.',
        },
        {
          type: 'p',
          text: "It is the customer's responsibility to install and activate the SIM within any timeframe specified for the purchased plan.",
        },
      ],
    },
    {
      number: '8',
      title: 'Fair Use and Acceptable Use Policy',
      blocks: [
        {
          type: 'p',
          text: 'You agree to use the Services only for lawful purposes and in accordance with these Terms. You must not:',
        },
        {
          type: 'ul',
          items: [
            'Use the Services for any fraudulent, unlawful, or misleading purpose;',
            'Attempt to resell, redistribute, or commercially exploit data plans without our written consent, unless purchased under an authorised reseller or partner agreement;',
            'Attempt to circumvent, reverse-engineer, or interfere with the eSIM provisioning system, network infrastructure, or security features of the Services;',
            'Use the Services in a manner that places excessive or abusive demand on network resources, including large-scale automated data usage inconsistent with normal personal or business travel use;',
            "Submit false, incomplete, or another person's identification or device information without authorisation.",
          ],
        },
        {
          type: 'p',
          text: 'We reserve the right to suspend or terminate access to the Services, without refund, for any breach of this Acceptable Use Policy.',
        },
      ],
    },
    {
      number: '9',
      title: 'Service Availability and Limitations',
      blocks: [
        {
          type: 'ul',
          items: [
            "Connectivity is dependent on the coverage, capacity, and performance of our Network Partners' infrastructure in each destination, and may be affected by factors outside our control, including local network conditions, regulatory restrictions, and device settings.",
            'We do not guarantee uninterrupted, error-free, or continuous availability of the Services and are not liable for temporary outages, reduced speeds, or coverage gaps caused by Network Partners or circumstances beyond our reasonable control.',
            'We may suspend the Services temporarily for maintenance, upgrades, or security reasons, and will endeavour to provide notice where reasonably possible.',
          ],
        },
      ],
    },
    {
      number: '10',
      title: 'Intellectual Property',
      blocks: [
        {
          type: 'p',
          text: 'All content on the TheTravela website and application, including logos, trademarks, text, graphics, software, and design elements, is the property of Onnela Limited or its licensors and is protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works from this content without our prior written consent.',
        },
      ],
    },
    {
      number: '11',
      title: 'Data Protection and Privacy',
      blocks: [
        {
          type: 'p',
          text: 'Your use of the Services is also governed by our Privacy Policy, which explains how we collect, use, share, and protect your personal data under the Personal Data Protection Act 2022, the guidelines of the Personal Data Protection Commission (PDPC) of Tanzania, and, where applicable, the GDPR. By using the Services, you consent to the data practices described in that policy.',
        },
      ],
    },
    {
      number: '12',
      title: 'Limitation of Liability',
      blocks: [
        {
          type: 'p',
          text: 'To the maximum extent permitted by applicable law:',
        },
        {
          type: 'ul',
          items: [
            'TheTravela and Onnela Limited shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of, or inability to use, the Services, including loss of data, loss of connectivity, or business interruption.',
            'Our total liability for any claim arising from these Terms or the Services shall not exceed the amount you paid for the specific data plan giving rise to the claim.',
            'Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited under applicable law, including liability for fraud or wilful misconduct.',
          ],
        },
      ],
    },
    {
      number: '13',
      title: 'Indemnification',
      blocks: [
        {
          type: 'p',
          text: 'You agree to indemnify and hold harmless Onnela Limited, its directors, employees, and Network Partners from any claims, losses, damages, liabilities, and expenses (including reasonable legal fees) arising from your breach of these Terms, misuse of the Services, or violation of any applicable law or third-party right.',
        },
      ],
    },
    {
      number: '14',
      title: 'Third-Party Services and Partners',
      blocks: [
        {
          type: 'p',
          text: 'The Services rely on third-party eSIM platform providers, mobile network operators, and payment processors. TheTravela is not responsible for the acts, omissions, or service quality of these third parties beyond our contractual and reasonable operational control, though we will make reasonable efforts to resolve issues raised through these partners on your behalf.',
        },
      ],
    },
    {
      number: '15',
      title: 'Suspension and Termination',
      blocks: [
        {
          type: 'p',
          text: 'We may suspend or terminate your access to the Services, in whole or in part, at any time, with or without notice, if we reasonably believe you have violated these Terms, engaged in fraudulent or unlawful activity, or where required by a regulatory authority such as the Tanzania Communications Regulatory Authority (TCRA) or the PDPC.',
        },
      ],
    },
    {
      number: '16',
      title: 'Changes to These Terms',
      blocks: [
        {
          type: 'p',
          text: 'We may update these Terms from time to time to reflect changes in our Services, legal requirements, or business practices. Material changes will be communicated through our website (www.onnela.co.tz) or other appropriate channels. Continued use of the Services after changes take effect constitutes acceptance of the revised Terms.',
        },
      ],
    },
    {
      number: '17',
      title: 'Governing Law and Dispute Resolution',
      blocks: [
        {
          type: 'p',
          text: 'These Terms are governed by and construed in accordance with the laws of the United Republic of Tanzania. Any disputes arising out of or in connection with these Terms shall first be addressed through good-faith negotiation between the parties, and if unresolved, shall be subject to the exclusive jurisdiction of the competent courts of Tanzania, without prejudice to any mandatory consumer protection rights you may have under the laws of your country of residence.',
        },
      ],
    },
    {
      number: '18',
      title: 'Contact Us',
      blocks: [
        {
          type: 'p',
          text: 'If you have any questions about these Terms and Conditions, please contact us at Onnela Limited, hello@onnelalimited.com, www.onnelalimited.com.',
        },
      ],
    },
  ],
  contact: {
    company: 'Onnela Limited',
    email: 'hello@onnelalimited.com',
    website: 'https://www.onnelalimited.com',
  },
};
