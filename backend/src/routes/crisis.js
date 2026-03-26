import { Router } from 'express';
import { ok } from '../utils/responses.js';

const router = Router();

const CRISIS_RESOURCES = {
  emergencyHotline: {
    name: 'Sri Lanka National Mental Health Helpline',
    number: '1926',
    available: '24/7',
    description: 'Free, confidential counselling and crisis support in Sinhala, Tamil, and English.',
    isSriLanka: true,
    actionLabel: 'Call 1926 now'
  },
  supportText:
    'You are not alone. Many people experience moments of overwhelming distress, and support is available right now.\n\nReaching out is a strength. The people on these lines are trained to listen, help you stay safe, and connect you with immediate support.\n\nIf you are in immediate physical danger, call 119 or go to your nearest Emergency Room immediately.',
  localResources: [
    {
      name: 'National Mental Health Helpline',
      number: '1926',
      available: '24/7',
      description: 'National crisis support and referral line for urgent mental health distress.',
      isSriLanka: true,
      actionLabel: 'Call now'
    },
    {
      name: 'Sumithrayo',
      number: '+94 11 269 6666',
      available: '24/7',
      description: 'Confidential emotional support and befriending service for people in distress.',
      isSriLanka: true,
      actionLabel: 'Call Sumithrayo'
    },
    {
      name: 'CCCline (Child and Adolescent Support)',
      number: '1929',
      available: 'Mon-Fri 8am-8pm',
      description: 'Support line focused on children, adolescents, and families needing urgent guidance.',
      isSriLanka: true,
      actionLabel: 'Call 1929'
    },
    {
      name: 'IASP Crisis Centres Directory',
      number: 'https://www.iasp.info/resources/Crisis_Centres/',
      available: 'Varies by country',
      description: 'International directory of crisis centres for people seeking support outside Sri Lanka.',
      isSriLanka: false,
      actionLabel: 'Open directory'
    }
  ],
  quickActionLabels: [
    'Call 1926',
    'Contact someone you trust',
    'Go to a safe public or family space',
    'Call 119 if you are in immediate danger'
  ]
};

router.get('/crisis/resources', async (req, res) => {
  return ok(res, { resources: CRISIS_RESOURCES });
});

export default router;
