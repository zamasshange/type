export interface Quote {
  text: string;
  source: string;
  length: "short" | "medium" | "long";
}

export const QUOTES: Quote[] = [
  {
    text: "The only way to do great work is to love what you do.",
    source: "Steve Jobs",
    length: "short",
  },
  {
    text: "In the middle of difficulty lies opportunity.",
    source: "Albert Einstein",
    length: "short",
  },
  {
    text: "It is not the mountain we conquer, but ourselves.",
    source: "Edmund Hillary",
    length: "short",
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    source: "Eleanor Roosevelt",
    length: "short",
  },
  {
    text: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
    source: "Ralph Waldo Emerson",
    length: "medium",
  },
  {
    text: "I have not failed. I've just found ten thousand ways that won't work.",
    source: "Thomas Edison",
    length: "medium",
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    source: "Will Durant",
    length: "medium",
  },
  {
    text: "You cannot swim for new horizons until you have courage to lose sight of the shore.",
    source: "William Faulkner",
    length: "medium",
  },
  {
    text: "Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did do. So throw off the bowlines. Sail away from the safe harbor. Catch the trade winds in your sails. Explore. Dream. Discover.",
    source: "H. Jackson Brown Jr.",
    length: "long",
  },
  {
    text: "It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood.",
    source: "Theodore Roosevelt",
    length: "long",
  },
  {
    text: "All that is gold does not glitter, not all those who wander are lost; the old that is strong does not wither, deep roots are not reached by the frost.",
    source: "J.R.R. Tolkien",
    length: "medium",
  },
  {
    text: "There is nothing like looking, if you want to find something. You certainly usually find something, if you look, but it is not always quite the something you were after.",
    source: "J.R.R. Tolkien",
    length: "medium",
  },
  {
    text: "The world is indeed full of peril, and in it there are many dark places; but still there is much that is fair, and though in all lands love is now mingled with grief, it grows perhaps the greater.",
    source: "J.R.R. Tolkien",
    length: "long",
  },
  {
    text: "Once you have tasted flight, you will forever walk the earth with your eyes turned skyward, for there you have been, and there you will always long to return.",
    source: "Leonardo da Vinci",
    length: "medium",
  },
  {
    text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    source: "George R.R. Martin",
    length: "short",
  },
  {
    text: "Not all those who wander are lost.",
    source: "J.R.R. Tolkien",
    length: "short",
  },
  {
    text: "The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and starting on the first one.",
    source: "Mark Twain",
    length: "long",
  },
  {
    text: "If you want to go fast, go alone. If you want to go far, go together.",
    source: "African proverb",
    length: "short",
  },
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    source: "Zig Ziglar",
    length: "medium",
  },
  {
    text: "I am a slow walker, but I never walk back.",
    source: "Abraham Lincoln",
    length: "short",
  },
  {
    text: "The best time to plant a tree was twenty years ago. The second best time is now.",
    source: "Chinese proverb",
    length: "short",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    source: "Winston Churchill",
    length: "medium",
  },
  {
    text: "You miss one hundred percent of the shots you don't take.",
    source: "Wayne Gretzky",
    length: "short",
  },
  {
    text: "Whether you think you can, or you think you cannot, you are right.",
    source: "Henry Ford",
    length: "short",
  },
];

export function randomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export function quoteToWords(quote: Quote) {
  return quote.text.split(/\s+/);
}
