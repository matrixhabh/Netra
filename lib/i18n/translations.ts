import type { Dictionary, Locale, TranslationKey } from './types'

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    'brand.tagline': 'SECURE. INVESTIGATE. RESOLVE.', 'nav.platform': 'Platform', 'nav.solutions': 'Solutions', 'nav.workflow': 'How It Works', 'nav.security': 'Security', 'nav.about': 'About', 'nav.resources': 'Resources',
    'hero.eyebrow': 'Smarter cyber investigations', 'hero.title': 'A safer digital India, together.', 'hero.description': 'NETRA helps investigation teams manage cybercrime complaints, evidence, and intelligence with speed, clarity, and accountability.', 'hero.primary': 'Explore Platform', 'hero.secondary': 'Learn How It Works',
    'assistant.title': 'Investigation Assistant', 'assistant.summary': 'Initial review prepared for investigator review.', 'assistant.human': 'Human-in-the-loop', 'workflow.eyebrow': 'How it works', 'workflow.title': 'From report to resolution.', 'capabilities.eyebrow': 'Capabilities', 'security.eyebrow': 'Accountable by design', 'cta.title': 'Serious tools for a safer tomorrow.', 'cta.description': 'See how NETRA can support the way your investigation teams work.', 'footer.tagline': 'Secure. Investigate. Resolve.',
  },
  hi: {
    'brand.tagline': 'सुरक्षित। जांच। समाधान।', 'nav.platform': 'प्लेटफ़ॉर्म', 'nav.solutions': 'समाधान', 'nav.workflow': 'कैसे काम करता है', 'nav.security': 'सुरक्षा', 'nav.about': 'हमारे बारे में', 'nav.resources': 'संसाधन',
    'hero.eyebrow': 'स्मार्ट साइबर जांच', 'hero.title': 'एक सुरक्षित डिजिटल भारत, साथ मिलकर।', 'hero.description': 'NETRA जांच टीमों को साइबर अपराध शिकायतों, साक्ष्य और इंटेलिजेंस को गति, स्पष्टता और जवाबदेही के साथ संभालने में मदद करता है।', 'hero.primary': 'प्लेटफ़ॉर्म देखें', 'hero.secondary': 'जानें कैसे काम करता है',
    'assistant.title': 'जांच सहायक', 'assistant.summary': 'जांचकर्ता की समीक्षा के लिए प्रारंभिक समीक्षा तैयार है।', 'assistant.human': 'मानव-नियंत्रित', 'workflow.eyebrow': 'कैसे काम करता है', 'workflow.title': 'रिपोर्ट से समाधान तक।', 'capabilities.eyebrow': 'क्षमताएं', 'security.eyebrow': 'जवाबदेही के लिए बनाया गया', 'cta.title': 'सुरक्षित कल के लिए गंभीर उपकरण।', 'cta.description': 'देखें कि NETRA आपकी जांच टीमों के काम में कैसे सहयोग कर सकता है।', 'footer.tagline': 'सुरक्षित। जांच। समाधान।',
  },
  mr: {
    'brand.tagline': 'सुरक्षित. तपास. निराकरण.', 'nav.platform': 'प्लॅटफॉर्म', 'nav.solutions': 'उपाय', 'nav.workflow': 'हे कसे काम करते', 'nav.security': 'सुरक्षा', 'nav.about': 'आमच्याबद्दल', 'nav.resources': 'संसाधने',
    'hero.eyebrow': 'स्मार्ट सायबर तपास', 'hero.title': 'एक सुरक्षित डिजिटल भारत, एकत्र.', 'hero.description': 'NETRA तपास पथकांना सायबर गुन्ह्यांच्या तक्रारी, पुरावे आणि माहिती वेग, स्पष्टता आणि जबाबदारीने हाताळण्यास मदत करते.', 'hero.primary': 'प्लॅटफॉर्म पहा', 'hero.secondary': 'हे कसे कार्य करते',
    'assistant.title': 'तपास सहाय्यक', 'assistant.summary': 'तपास अधिकाऱ्याच्या पुनरावलोकनासाठी प्राथमिक आढावा तयार आहे.', 'assistant.human': 'मानवी देखरेख', 'workflow.eyebrow': 'हे कसे काम करते', 'workflow.title': 'अहवालापासून निराकरणापर्यंत.', 'capabilities.eyebrow': 'क्षमता', 'security.eyebrow': 'जबाबदारीसाठी तयार', 'cta.title': 'सुरक्षित उद्यासाठी गंभीर साधने.', 'cta.description': 'NETRA तुमच्या तपास पथकांना कसे मदत करू शकते ते पहा.', 'footer.tagline': 'सुरक्षित. तपास. निराकरण.',
  },
}

export function getTranslation(locale: Locale, key: TranslationKey) {
  return dictionaries[locale][key] ?? dictionaries.en[key]
}
