// Starter list of alternative tasks, loaded into the `tasks` table on first run.
//
// These are short, low-effort actions a person can do instead of acting on a
// checking urge — general coping / redirection, not medical advice, and they make
// no judgement about the user.
//
// `categories` tags which checking-urge type(s) (Epic 5) a task is an especially
// good fit for — 'body-checking', 'reassurance', or 'info-searching', matching the
// urge options in UrgeView. An empty array means the task is universal and can be
// offered for any urge type. `durationSeconds` is the suggested length backing the
// time mentioned in each task's `body` text (e.g. "about two minutes").
//
// Wording is a first pass — expected to be refined with the team.

export const seedTasks = [
  {
    title: 'Take a short walk',
    body: 'Walk for about five minutes, leaving your phone behind if you can.',
    categories: ['body-checking'],
    durationSeconds: 300,
  },
  {
    title: 'Box breathing',
    body: 'Breathe in for 4, hold for 4, out for 4, hold for 4. Repeat for two minutes.',
    categories: ['body-checking'],
    durationSeconds: 120,
  },
  {
    title: 'Cool down',
    body: 'Splash cool water on your face for about 30 seconds.',
    categories: ['body-checking'],
    durationSeconds: 30,
  },
  {
    title: 'Stretch it out',
    body: 'Do ten slow stretches for about two minutes, holding each for a few seconds.',
    categories: ['body-checking'],
    durationSeconds: 120,
  },
  {
    title: 'Step outside',
    body: 'Go outside for three minutes of fresh air.',
    categories: ['body-checking', 'info-searching'],
    durationSeconds: 180,
  },
  {
    title: 'Shake it out',
    body: 'Stand up and shake your arms and legs for about 30 seconds, like shaking off water.',
    categories: ['body-checking'],
    durationSeconds: 30,
  },
  {
    title: 'Ten reps',
    body: 'Do ten squats at a steady pace — about one minute.',
    categories: ['body-checking'],
    durationSeconds: 60,
  },
  {
    title: 'Texture scan',
    body: 'Touch three different textures in the room — fabric, wood, metal — and name each one out loud. About one minute.',
    categories: ['body-checking'],
    durationSeconds: 60,
  },
  {
    title: '5-4-3-2-1 grounding',
    body: 'Take about two minutes to name 5 things you can see, 4 you can feel, 3 you can hear, 2 you can smell, 1 you can taste.',
    categories: ['reassurance'],
    durationSeconds: 120,
  },
  {
    title: 'Park the worry',
    body: 'Spend about one minute writing the worry down in one sentence, then close the note and come back to it later.',
    categories: ['reassurance'],
    durationSeconds: 60,
  },
  {
    title: 'Make a warm drink',
    body: 'Make a cup of tea and drink it slowly for about three minutes, paying attention to the warmth.',
    categories: ['reassurance'],
    durationSeconds: 180,
  },
  {
    title: 'Comfort phrase',
    body: 'Over about one minute, say your comfort phrase slowly, three times out loud, pausing between each one.',
    categories: ['reassurance'],
    durationSeconds: 60,
  },
  {
    title: 'Wash two dishes',
    body: 'Take about two minutes to wash two dishes, mugs, or cups by hand, and dry them.',
    categories: ['reassurance'],
    durationSeconds: 120,
  },
  {
    title: 'Reset one surface',
    body: 'Tidy your desk for about two minutes.',
    categories: ['info-searching'],
    durationSeconds: 120,
  },
  {
    title: 'One song, nothing else',
    body: 'Play one song from start to finish — about four minutes — and just listen, no other screens.',
    categories: ['info-searching'],
    durationSeconds: 240,
  },
  {
    title: 'Sort five things',
    body: 'Spend about two minutes picking up five loose items lying around and putting each one back where it belongs.',
    categories: ['info-searching'],
    durationSeconds: 120,
  },
  {
    title: 'Read something physical',
    body: 'Pick up a physical book nearby and read one page — about two minutes.',
    categories: ['info-searching'],
    durationSeconds: 120,
  },
  {
    title: 'Doodle it out',
    body: 'Grab a pen and paper and doodle or scribble for two minutes — no screens.',
    categories: ['info-searching'],
    durationSeconds: 120,
  },
  {
    title: 'Count it down',
    body: 'Count backwards from 100 in steps of 7, entirely in your head, no phone — about one minute.',
    categories: ['info-searching'],
    durationSeconds: 60,
  },
  {
    title: 'Mini reset',
    body: 'Over about two minutes: water a plant, empty one bin, and plug in one uncharged device — do all three before you stop.',
    categories: [],
    durationSeconds: 120,
  },
  {
    title: 'Voice note to yourself',
    body: 'Record a one-minute voice memo about your day, just for yourself.',
    categories: [],
    durationSeconds: 60,
  },
]
