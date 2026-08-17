// ═══════════════════════════════════════════════════════════════
// MANASYN v2 — ENHANCED AI RESPONSE ENGINE
// More human, less robotic. Contextual, empathetic, varied.
// ═══════════════════════════════════════════════════════════════

function generateAIResponse(message, conversationHistory = []) {
  const msg = message.toLowerCase();
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  // ── Crisis detection (highest priority) ──
  if (/suicid|kill myself|end my life|hurt myself|self.?harm|don'?t want to live|take my life|no reason to live/i.test(msg)) {
    return "I'm really glad you felt able to share that with me. What you're feeling right now matters, and you don't have to carry this alone.\n\nI want to be honest with you — I'm not a crisis service, and what you're describing needs more support than I can give you here. Please reach out right now:\n\n• iCall: 9152987821 (free, Mon-Sat 8AM-10PM)\n• AASRA: 9820466726 (24/7)\n• Emergency: 112\n\nYou can also go to your nearest hospital. There are people who want to listen and help. Would you like me to stay here with you while you reach out?";
  }

  // ── Contextual: check if this is a follow-up ──
  const isFollowUp = conversationHistory.length > 2;
  const lastMessages = conversationHistory.slice(-4);

  // ── Overwhelm / stress ──
  if (/overwhelm|stress|too much|can'?t cope|pressure|burnt|burnout|drowning|sinking/i.test(msg)) {
    const responses = [
      `That sounds like a lot to carry. When everything piles up at once, it can feel like you're bracing yourself all the time. I'm wondering — when did you first start feeling this weight?`,
      `I can hear how much is on your plate right now. It makes sense that you'd feel overwhelmed — that's not a weakness, it's a reasonable response to a lot happening at once. What would feel most helpful — talking through what's going on, or starting with one small thing you could do today?`,
      `It takes courage to say that out loud. Sometimes overwhelm is a sign that we've been pushing through for too long without giving ourselves space to breathe. Can you tell me a bit more about what's been happening?`,
    ];
    return pickVaried(responses, msg);
  }

  // ── Anxiety ──
  if (/anxious|anxiety|panic|nervous|worried|scared|afraid|on edge|racing thoughts/i.test(msg)) {
    const responses = [
      `I can sense that this has been unsettling for you. Anxiety has a way of making everything feel urgent and bigger than it is. What's been pulling your attention the most?`,
      `That feeling of your mind racing ahead of you — I hear you. It's exhausting. Sometimes it helps to slow down and notice what's happening right now, in this moment. Would you like to try that together, or would you rather talk through what's been going on?`,
      `It sounds like anxiety has been showing up in your life in a way that's hard to ignore. You're not overreacting — anxiety is real, and it takes a toll. What's been triggering it, if you've noticed?`,
    ];
    return pickVaried(responses, msg);
  }

  // ── Sadness / depression ──
  if (/sad|depress|down|hopeless|empty|lonely|alone|low|dark|numb|nothing matters/i.test(msg)) {
    const responses = [
      `I'm glad you felt able to share that. Those feelings can be heavy in a way that's hard to put into words — like you're moving through fog. You don't need to have it all figured out right now. Would you like to explore what's been contributing to this, or would it help to just sit with it for a moment?`,
      `What you're describing sounds really difficult. I want you to know that feeling this way doesn't mean something is wrong with you — it means something is weighing on you. Can you tell me when you first started feeling this way?`,
      `I hear you. Sometimes it's hard to even name what's wrong — it's just a heaviness that's there. That's valid. I'm here, and I'm not going anywhere. What's been on your mind the most lately?`,
    ];
    return pickVaried(responses, msg);
  }

  // ── Anger ──
  if (/angry|anger|frustrat|irritat|mad|furious|pissed/i.test(msg)) {
    const responses = [
      `It sounds like there's a lot of energy behind what you're feeling. Anger often carries important information — it can tell us when a boundary has been crossed, or when something we care about is at stake. What do you think this anger is trying to tell you?`,
      `I can hear that this has been building up. Anger is one of those feelings that gets a bad reputation, but it's often pointing at something that matters. What's been happening that's led to this?`,
    ];
    return pickVaried(responses, msg);
  }

  // ── Sleep ──
  if (/sleep|insomnia|can'?t sleep|tired|exhausted|nightmare|waking up/i.test(msg)) {
    const responses = [
      `Sleep is so foundational — when it's disrupted, everything else feels harder. Sometimes there's a pattern to it: certain thoughts that show up at night, or a routine that's shifted. What's your mind usually doing when you can't sleep?`,
      `I can understand how exhausting that must be. Sleep and mental health are closely linked — each affects the other. Has this been going on for a while, or is it more recent?`,
    ];
    return pickVaried(responses, msg);
  }

  // ── Relationships ──
  if (/relationship|partner|boyfriend|girlfriend|spouse|husband|wife|friend|family|parent|mom|dad|breakup|fight|argument/i.test(msg)) {
    const responses = [
      `Relationships can be some of the most meaningful and challenging parts of our lives. It sounds like this has been weighing on you. What's been happening?`,
      `I can hear that this matters to you. Relationships have a way of touching the deepest parts of who we are. Can you tell me more about what's been going on?`,
    ];
    return pickVaried(responses, msg);
  }

  // ── Work / study ──
  if (/work|study|college|exam|job|career|office|boss|teacher|grade|assignment|deadline/i.test(msg)) {
    const responses = [
      `It sounds like this has been taking up a lot of your mental space. When work or study feels relentless, it can be hard to see beyond it. What's been feeling most challenging right now?`,
      `I can hear the pressure in what you're saying. Sometimes it helps to break things down — not into a to-do list, but just to understand what's actually going on. What's been on your mind the most?`,
    ];
    return pickVaried(responses, msg);
  }

  // ── Greeting ──
  if (/^(hi|hello|hey|namaste|good morning|good evening|good afternoon)/i.test(msg.trim())) {
    return `Good ${timeGreeting}. I'm here to listen. How have you been doing lately — not just today, but in general?`;
  }

  // ── Thanks ──
  if (/thank|thanks|grateful|appreciate/i.test(msg)) {
    return `You're welcome. I'm glad I could be here. Is there anything else on your mind, or would you like to take a moment to reflect on what we've talked about?`;
  }

  // ── Reflection / patterns ──
  if (/reflect|understand|pattern|why do i|why am i|always|keep doing|same thing/i.test(msg)) {
    const responses = [
      `That's a really meaningful question. Self-understanding often starts with noticing patterns — the thoughts, feelings, and situations that show up repeatedly. What pattern have you been noticing?`,
      `I think you've just asked one of the most important questions there is. The fact that you're curious about it means you're already doing the work. What made you start thinking about this?`,
    ];
    return pickVaried(responses, msg);
  }

  // ── "I don't know" ──
  if (/i don'?t know|not sure|confused|lost|don'?t understand/i.test(msg)) {
    return `That's okay. You don't need to have it all figured out right now. Sometimes "I don't know" is the most honest place to start. Let's sit with that for a moment — what does it feel like, not knowing?`;
  }

  // ── Follow-up: if user gives a short response, go deeper ──
  if (isFollowUp && message.split(' ').length < 5) {
    const responses = [
      `Can you tell me a bit more about that?`,
      `What's that been like for you?`,
      `I'd like to understand more — what do you mean when you say that?`,
      `Hmm. What feelings come up when you think about that?`,
    ];
    return pickVaried(responses, msg);
  }

  // ── Default: varied, contextual ──
  const responses = [
    `Thank you for sharing that. I'd like to understand more — what's that experience been like for you?`,
    `I hear you. Can you tell me a bit more about what's been going on?`,
    `It takes courage to put this into words. What feelings come up when you think about this?`,
    `I'm here, and I'm listening. Would you like to explore this further, or would it help to take a step back and look at the bigger picture?`,
    `That sounds important. What would feel most helpful right now — talking through this, or finding a practical next step?`,
  ];
  return pickVaried(responses, msg);
}

// Pick a varied response — avoids the "robotic repetition" problem
function pickVaried(responses, seed) {
  // Use message length + character codes as a pseudo-random seed
  // so the same message doesn't always get the same response
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % responses.length;
  return responses[index];
}

module.exports = { generateAIResponse };