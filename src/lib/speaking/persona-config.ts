export type SpeakingTopic = {
  id: string;
  title: string;
  description: string;
  starter: string;
  cefr?: string;
};

export type SpeakingVoiceProfile = {
  voiceName: string;
  lang: string;
  speakingRate: number;
  pitch: number;
  label: string;
};

type PersonaSpeakingConfig = {
  topics: SpeakingTopic[];
  voices: SpeakingVoiceProfile[];
};

const DEFAULT_TOPIC: SpeakingTopic = {
  id: "free-conversation",
  title: "Free conversation",
  description: "Trò chuyện tự do để khởi động phản xạ nói tiếng Anh.",
  starter: "Hi! Nice to meet you. What would you like to talk about today?",
  cefr: "A2",
};

const DEFAULT_VOICE: SpeakingVoiceProfile = {
  voiceName: "en-US-Studio-O",
  lang: "en-US",
  speakingRate: 1,
  pitch: 0,
  label: "US studio",
};

const PERSONA_CONFIGS: Record<string, PersonaSpeakingConfig> = {
  "sophie-business": {
    topics: [
      {
        id: "project-alignment",
        title: "Project alignment meeting",
        description: "Bạn đóng vai thành viên dự án, Sophie giúp điều phối mục tiêu và deadline.",
        starter: "Good morning. Before we discuss timelines, could you give me a quick update on your priorities?",
        cefr: "B1",
      },
      {
        id: "client-negotiation",
        title: "Client negotiation",
        description: "Luyện cách thương lượng lịch giao hàng, ngân sách và phạm vi công việc.",
        starter: "Thanks for joining the call. What would you like to adjust in the proposal?",
        cefr: "B1",
      },
      {
        id: "professional-introduction",
        title: "Professional introduction",
        description: "Giới thiệu bản thân, kinh nghiệm và mục tiêu nghề nghiệp trong môi trường công sở.",
        starter: "It's lovely to meet you. Could you tell me a little about your current role?",
        cefr: "B1",
      },
    ],
    voices: [
      { voiceName: "en-GB-Neural2-A", lang: "en-GB", speakingRate: 0.95, pitch: 0, label: "British clear" },
      { voiceName: "en-GB-Neural2-C", lang: "en-GB", speakingRate: 0.95, pitch: 0, label: "British warm" },
      { voiceName: "en-GB-Standard-A", lang: "en-GB", speakingRate: 0.98, pitch: 0, label: "British standard" },
    ],
  },
  "marcus-casual": {
    topics: [
      {
        id: "weekend-plans",
        title: "Weekend plans",
        description: "Nói chuyện thân mật về cuối tuần, sở thích và kế hoạch cá nhân.",
        starter: "Hey! Got any fun plans for the weekend?",
        cefr: "A2",
      },
      {
        id: "food-and-coffee",
        title: "Food and coffee chat",
        description: "Luyện gọi món, gợi ý quán ăn và trò chuyện đời thường về đồ ăn.",
        starter: "I'm thinking of grabbing coffee. What kind of place do you usually like?",
        cefr: "A2",
      },
      {
        id: "catching-up",
        title: "Catching up with a friend",
        description: "Tập hỏi thăm bạn bè, kể chuyện gần đây và phản hồi tự nhiên.",
        starter: "Long time no see! How have things been going lately?",
        cefr: "A2",
      },
    ],
    voices: [
      { voiceName: "en-US-Neural2-D", lang: "en-US", speakingRate: 1, pitch: -1, label: "US casual" },
      { voiceName: "en-US-Neural2-I", lang: "en-US", speakingRate: 1.03, pitch: 0, label: "US friendly" },
      { voiceName: "en-US-Standard-D", lang: "en-US", speakingRate: 1, pitch: -1, label: "US standard" },
    ],
  },
  "mei-travel": {
    topics: [
      {
        id: "hotel-check-in",
        title: "Hotel check-in",
        description: "Luyện nhận phòng, hỏi tiện nghi và xử lý yêu cầu ở khách sạn.",
        starter: "Welcome to Sydney! Do you have a reservation with us today?",
        cefr: "A2",
      },
      {
        id: "asking-directions",
        title: "Asking for directions",
        description: "Hỏi đường, xác nhận tuyến đi và dùng cụm từ du lịch thông dụng.",
        starter: "No worries, I can help. Where are you trying to get to?",
        cefr: "A2",
      },
      {
        id: "local-tour",
        title: "Booking a local tour",
        description: "Hỏi thông tin tour, thời gian, giá vé và lịch trình tham quan.",
        starter: "Hi there! Are you interested in a city tour or something near the coast?",
        cefr: "A2",
      },
    ],
    voices: [
      { voiceName: "en-AU-Neural2-A", lang: "en-AU", speakingRate: 0.98, pitch: 0, label: "Australian clear" },
      { voiceName: "en-AU-Neural2-B", lang: "en-AU", speakingRate: 1, pitch: -1, label: "Australian guide" },
      { voiceName: "en-AU-Standard-A", lang: "en-AU", speakingRate: 0.98, pitch: 0, label: "Australian standard" },
    ],
  },
};

export function getTopicsForCharacter(slug: string | null | undefined): SpeakingTopic[] {
  if (!slug) return [DEFAULT_TOPIC];
  return PERSONA_CONFIGS[slug]?.topics ?? [DEFAULT_TOPIC];
}

export function getVoiceProfilesForCharacter(
  slug: string | null | undefined,
  fallbackVoiceName?: string | null,
): SpeakingVoiceProfile[] {
  const configuredVoices = slug ? PERSONA_CONFIGS[slug]?.voices : undefined;
  if (configuredVoices?.length) return configuredVoices;

  if (fallbackVoiceName) {
    return [{ ...DEFAULT_VOICE, voiceName: fallbackVoiceName, label: fallbackVoiceName }];
  }

  return [DEFAULT_VOICE];
}

export function pickVoiceProfileForSession(
  voices: SpeakingVoiceProfile[],
  seed: string,
): SpeakingVoiceProfile {
  return voices[stableHash(seed) % voices.length] ?? DEFAULT_VOICE;
}

function stableHash(value: string): number {
  return Array.from(value).reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0;
  }, 0);
}

export function formatTopicContext(topic: SpeakingTopic): string {
  return `${topic.title}: ${topic.description}`;
}

export function getTopicGreeting(characterName: string, topic: SpeakingTopic): string {
  return topic.starter || `Hi! I'm ${characterName}. What would you like to talk about?`;
}

export function findTopicByContext(
  topics: SpeakingTopic[],
  context: string | null | undefined,
): SpeakingTopic | null {
  if (!context) return null;
  return topics.find((topic) => formatTopicContext(topic) === context || topic.title === context) ?? null;
}
