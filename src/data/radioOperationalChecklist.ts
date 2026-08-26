export type RadioCheck = {
  id: string;
  phase: 'station' | 'automation' | 'live' | 'outside-broadcast' | 'recovery' | 'mike';
  title: string;
  action: string;
  done?: boolean;
};

export const RADIO_OPERATIONAL_CHECKLIST: RadioCheck[] = [
  { id: 'station-library', phase: 'station', title: 'Real audio library', action: 'Load real music and finished Farmers Table audio. Do not create fake advertisers or events.' },
  { id: 'station-tags', phase: 'station', title: 'Audio names and tags', action: 'Check artist/title and give station assets clear names so they are easy to find.' },
  { id: 'automation-clock', phase: 'automation', title: 'Programme clock', action: 'Match the RadioDJ hour/slot to the Farmers Table month schedule.' },
  { id: 'automation-breaks', phase: 'automation', title: 'Break positions', action: 'Leave clear positions for real jingles, adverts and community announcements.' },
  { id: 'automation-fallback', phase: 'automation', title: 'Automation fallback', action: 'Test that scheduled automation continues when a live encoder stops.' },
  { id: 'live-studio', phase: 'live', title: 'Studio live test', action: 'Send a short live microphone test through the agreed Live365 connection and check the listener hears it.' },
  { id: 'live-return', phase: 'live', title: 'Return to automation', action: 'End the live session and confirm the next scheduled/automated item takes over cleanly.' },
  { id: 'ob-butt', phase: 'outside-broadcast', title: 'BUTT prepared', action: 'Have the BUTT connection configured before leaving for the venue. Never try to configure it for the first time on site.' },
  { id: 'ob-soundcheck', phase: 'outside-broadcast', title: '10-second sound check', action: 'Check microphone, headphones, levels and internet before going live.' },
  { id: 'ob-record', phase: 'outside-broadcast', title: 'Record-only fallback', action: 'If the connection is unreliable, record the visit instead of forcing a live broadcast.' },
  { id: 'ob-media', phase: 'outside-broadcast', title: 'Capture supporting media', action: 'Take a few photos, a short video clip and brief notes alongside the audio.' },
  { id: 'recovery-stop', phase: 'recovery', title: 'Stop if fog hits', action: 'Do not improvise technical changes. Stop, save what is safe, and use the prepared recovery route.' },
  { id: 'recovery-record', phase: 'recovery', title: 'Protect the recording', action: 'If unsure live, switch to Record-Only. A clean recording can be used later.' },
  { id: 'mike-month', phase: 'mike', title: 'Run the full month', action: 'Tell Mike which parts of the month schedule you successfully tested and which ones caused problems.' },
  { id: 'mike-ob', phase: 'mike', title: 'Prepare OB questions', action: 'Bring specific questions about venue broadcasts, live handover, backup connection and return to automation.' },
  { id: 'mike-notes', phase: 'mike', title: 'Keep a headache list', action: 'Write down anything confusing rather than trying to solve it from memory. Use the video call to work through the list.' },
];
