/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT — LANGUAGE / i18n MODULE (i18n.js)
   Supports: English (en), Tamil (ta), Tanglish (tl)
   Usage: window.SKY_i18n.t('key') — returns translated string
   Language preference is persisted in localStorage: sky_lang
   ========================================================================== */

(function () {
  'use strict';

  /* ── Translation dictionary ─────────────────────────────────────────── */
  const translations = {
    en: {
      // Navigation
      nav_home: 'HOME',
      nav_equipment: 'EQUIPMENT',
      nav_quotation: 'GET A QUOTATION',
      nav_contact: 'CONTACT',
      nav_login: 'LOGIN',

      // Hero
      hero_subtitle: 'DJ • Sound • Lighting • Stage • Events',
      hero_browse: 'Browse Equipment',
      hero_quotation: 'Get a Quotation',
      scroll_explore: 'Scroll to explore',

      // Reviews
      review_eyebrow: '⭐ Client Feedback',
      review_heading: 'CLIENT REVIEWS',
      review_subtext: 'Real experiences shared by clients of SKY DJ & EVENT MANAGEMENT.',
      review_loading: 'Loading reviews...',
      review_none: 'No reviews yet. Be the first to share your experience!',
      your_review_eyebrow: '✦ SHARE YOUR EXPERIENCE',
      your_review_heading: 'YOUR REVIEW',
      your_review_desc: "We'd love to hear about your event experience with SKY DJ.",
      add_your_review: 'ADD YOUR REVIEW',

      // Review modal
      modal_posting_as: 'Posting as',
      modal_account_verified: '(Account Verified)',
      modal_function_type: 'Function Type *',
      modal_select_function: 'Select Function Type',
      modal_feedback: 'Feedback / Review *',
      modal_feedback_placeholder: 'Share your experience with SKY DJ sound, lighting, or event management...',
      modal_event_photo: 'Event Photo',
      modal_photo_hint: 'Allowed: JPG, JPEG, PNG, WEBP (Max 5MB).',
      modal_cancel: 'Cancel',
      modal_submit: 'SUBMIT REVIEW',

      // Contact section
      contact_eyebrow: '📞 Get In Touch',
      contact_heading: 'CONTACT US',
      contact_subtext: 'Reach out to SKY DJ & EVENT MANAGEMENT directly on WhatsApp.',
      contact_btn: '💬 Contact on WhatsApp',
      contact_loading: 'Loading...',
      contact_not_set: 'Contact not configured yet.',

      // Footer
      footer_rights: 'All rights reserved.',

      // Toast messages
      toast_login_review: 'Please log in to submit a review.',
      toast_review_success: 'Review submitted! It will appear after admin approval.',
      toast_review_error: 'Failed to submit review. Please try again.',
      toast_contact_error: 'Could not load WhatsApp number.',
      toast_signed_out: 'Signed out successfully',

      // Chatbot
      chatbot_title: 'SKY DJ Assistant',
      chatbot_subtitle: 'Ask me anything!',
      chatbot_placeholder: 'Type your question here...',
      chatbot_send: 'Send',
      chatbot_greeting: 'Hi! 👋 I\'m the SKY DJ Assistant. How can I help you today?\n\nYou can ask me about our services, equipment, pricing, or how to book!',
      chatbot_unknown: 'I\'m not sure about that. You can contact us directly on WhatsApp for more help! 😊',
      chatbot_open_label: 'Open chat assistant',
      chatbot_close_label: 'Close chat',
    },

    ta: {
      // Navigation
      nav_home: 'முகப்பு',
      nav_equipment: 'உபகரணங்கள்',
      nav_quotation: 'மேற்கோள் பெறுக',
      nav_contact: 'தொடர்பு',
      nav_login: 'உள்நுழைவு',

      // Hero
      hero_subtitle: 'DJ • ஒலி • வெளிச்சம் • மேடை • நிகழ்வுகள்',
      hero_browse: 'உபகரணங்கள் காண்க',
      hero_quotation: 'விலை கேட்க',
      scroll_explore: 'கீழே உருட்டவும்',

      // Reviews
      review_eyebrow: '⭐ வாடிக்கையாளர் கருத்துகள்',
      review_heading: 'வாடிக்கையாளர் மதிப்புரைகள்',
      review_subtext: 'SKY DJ & EVENT MANAGEMENT வாடிக்கையாளர்கள் பகிர்ந்த உண்மையான அனுபவங்கள்.',
      review_loading: 'மதிப்புரைகள் ஏற்றப்படுகின்றன...',
      review_none: 'இன்னும் மதிப்புரைகள் இல்லை. முதலில் உங்கள் அனுபவத்தை பகிருங்கள்!',
      your_review_eyebrow: '✦ உங்கள் அனுபவத்தை பகிருங்கள்',
      your_review_heading: 'உங்கள் மதிப்புரை',
      your_review_desc: 'SKY DJ உடனான உங்கள் நிகழ்வு அனுபவத்தை அறிய விரும்புகிறோம்.',
      add_your_review: 'மதிப்புரை சேர்க்க',

      // Review modal
      modal_posting_as: 'இவராக பதிவிடுகிறீர்கள்',
      modal_account_verified: '(கணக்கு சரிபார்க்கப்பட்டது)',
      modal_function_type: 'நிகழ்வு வகை *',
      modal_select_function: 'நிகழ்வு வகையை தேர்வு செய்யவும்',
      modal_feedback: 'கருத்து / மதிப்புரை *',
      modal_feedback_placeholder: 'SKY DJ ஒலி, வெளிச்சம், அல்லது நிகழ்வு மேலாண்மையுடனான உங்கள் அனுபவத்தை பகிருங்கள்...',
      modal_event_photo: 'நிகழ்வு புகைப்படம்',
      modal_photo_hint: 'அனுமதி: JPG, JPEG, PNG, WEBP (அதிகபட்சம் 5MB).',
      modal_cancel: 'ரத்துசெய்',
      modal_submit: 'மதிப்புரையை சமர்ப்பி',

      // Contact section
      contact_eyebrow: '📞 தொடர்பு கொள்ளுங்கள்',
      contact_heading: 'தொடர்பு கொள்ளுங்கள்',
      contact_subtext: 'WhatsApp வழியாக SKY DJ & EVENT MANAGEMENT ஐ நேரடியாக தொடர்பு கொள்ளுங்கள்.',
      contact_btn: '💬 WhatsApp-இல் தொடர்பு கொள்ளுங்கள்',
      contact_loading: 'ஏற்றப்படுகிறது...',
      contact_not_set: 'தொடர்பு இன்னும் அமைக்கப்படவில்லை.',

      // Footer
      footer_rights: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டுள்ளன.',

      // Toast messages
      toast_login_review: 'மதிப்புரை சமர்ப்பிக்க உள்நுழையவும்.',
      toast_review_success: 'மதிப்புரை சமர்ப்பிக்கப்பட்டது! நிர்வாகி ஒப்புதலுக்கு பிறகு தோன்றும்.',
      toast_review_error: 'மதிப்புரை சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
      toast_contact_error: 'WhatsApp எண் ஏற்ற முடியவில்லை.',
      toast_signed_out: 'வெற்றிகரமாக வெளியேறினீர்கள்',

      // Chatbot
      chatbot_title: 'SKY DJ உதவியாளர்',
      chatbot_subtitle: 'எதையும் கேளுங்கள்!',
      chatbot_placeholder: 'உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யுங்கள்...',
      chatbot_send: 'அனுப்பு',
      chatbot_greeting: 'வணக்கம்! 👋 நான் SKY DJ உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவலாம்?\n\nசேவைகள், உபகரணங்கள், விலை அல்லது புக்கிங் பற்றி கேளுங்கள்!',
      chatbot_unknown: 'அதைப் பற்றி எனக்கு தெரியாது. மேலும் உதவிக்கு நேரடியாக WhatsApp-இல் தொடர்பு கொள்ளுங்கள்! 😊',
      chatbot_open_label: 'உரையாடல் உதவியாளரை திறக்கவும்',
      chatbot_close_label: 'உரையாடலை மூடவும்',
    },

    tl: {
      // Navigation
      nav_home: 'HOME',
      nav_equipment: 'EQUIPMENT',
      nav_quotation: 'QUOTATION KELUNGA',
      nav_contact: 'CONTACT',
      nav_login: 'LOGIN',

      // Hero
      hero_subtitle: 'DJ • Sound • Light • Stage • Events',
      hero_browse: 'Equipment Parunga',
      hero_quotation: 'Quotation Kelunga',
      scroll_explore: 'Keezhey scroll pannunga',

      // Reviews
      review_eyebrow: '⭐ Customer Feedback',
      review_heading: 'CUSTOMER REVIEWS',
      review_subtext: 'SKY DJ & EVENT MANAGEMENT customers share pannina real experience.',
      review_loading: 'Reviews load aaguthu...',
      review_none: 'Innum reviews illa. Neenga first-a share pannunga!',
      your_review_eyebrow: '✦ Ungal Experience Sollunga',
      your_review_heading: 'YOUR REVIEW',
      your_review_desc: 'SKY DJ kooda ungal event experience epdi irundhuchu nu sollunga.',
      add_your_review: 'ADD YOUR REVIEW',

      // Review modal
      modal_posting_as: 'Ivara poda pogireengal',
      modal_account_verified: '(Account verify aagirukku)',
      modal_function_type: 'Function Type *',
      modal_select_function: 'Function type select pannunga',
      modal_feedback: 'Feedback / Review *',
      modal_feedback_placeholder: 'SKY DJ sound, light, event management ellam epdi irundhuchu nu sollunga...',
      modal_event_photo: 'Event Photo',
      modal_photo_hint: 'Allowed: JPG, JPEG, PNG, WEBP (Max 5MB).',
      modal_cancel: 'Vendaam',
      modal_submit: 'REVIEW ANUPPU',

      // Contact section
      contact_eyebrow: '📞 Touch-la Irunga',
      contact_heading: 'CONTACT PANNUNGA',
      contact_subtext: 'SKY DJ & EVENT MANAGEMENT kku WhatsApp la neraya paesunga.',
      contact_btn: '💬 WhatsApp la Contact Pannunga',
      contact_loading: 'Load aaguthu...',
      contact_not_set: 'Contact number innum set pannala.',

      // Footer
      footer_rights: 'Ella rights-um reserved.',

      // Toast messages
      toast_login_review: 'Review podunga munnaadi login pannunga.',
      toast_review_success: 'Review poda aagirukku! Admin approve panna public-ah teriyum.',
      toast_review_error: 'Review poda mudiyala. Mela try pannunga.',
      toast_contact_error: 'WhatsApp number load aagala.',
      toast_signed_out: 'Logout aaideenga',

      // Chatbot
      chatbot_title: 'SKY DJ Assistant',
      chatbot_subtitle: 'Enna vendum kekelunga!',
      chatbot_placeholder: 'Ungal question inga type pannunga...',
      chatbot_send: 'Anuppu',
      chatbot_greeting: 'Vanakkam! 👋 Naan SKY DJ Assistant. Ungalukku epdi help pannalaam?\n\nServices, equipment, price, booking ellam pathi kekelunga!',
      chatbot_unknown: 'Athu pathi enakku theriyala. WhatsApp la contact pannunga, namba team help pannuvaaanga! 😊',
      chatbot_open_label: 'Chat assistant tirandu paaru',
      chatbot_close_label: 'Chat moodunga',
    }
  };

  /* ── Chatbot FAQ knowledge base ─────────────────────────────────────── */
  const faqData = {
    en: [
      {
        patterns: ['hello', 'hi', 'hey', 'hai', 'vanakkam', 'good morning', 'good evening', 'good afternoon'],
        answer: 'Hello! 👋 Welcome to SKY DJ & EVENT MANAGEMENT. How can I help you today? Feel free to ask about our services, equipment, pricing, or booking!'
      },
      {
        patterns: ['service', 'services', 'offer', 'provide', 'what do you do', 'what you do'],
        answer: '🎉 SKY DJ & EVENT MANAGEMENT offers:\n• 🎵 DJ Services\n• 🔊 Professional Sound Systems\n• 💡 Stage Lighting\n• 🎭 Stage Setup\n• 🎊 Complete Event Management\n\nWe handle Weddings, Receptions, Birthday Parties, Corporate Events, and more!'
      },
      {
        patterns: ['equipment', 'sound system', 'speaker', 'subwoofer', 'dj gear', 'setup', 'gear'],
        answer: '📦 We have a wide range of premium equipment:\n• JBL & Professional Subwoofers\n• DJ Controllers & Mixers\n• Stage Lighting Rigs\n• Wireless Microphones\n• LED Screens & Visual Effects\n\nClick "Equipment" in the menu to browse our full catalogue!'
      },
      {
        patterns: ['price', 'cost', 'rate', 'charge', 'how much', 'pricing', 'affordable', 'budget'],
        answer: '💰 Our pricing depends on the type of event, duration, and equipment needed.\n\nFor an accurate quote, please click "GET A QUOTATION" or contact us on WhatsApp. We offer competitive and transparent pricing!'
      },
      {
        patterns: ['book', 'booking', 'reserve', 'hire', 'rent', 'how to book', 'enquiry', 'inquiry'],
        answer: '📅 Booking is easy!\n1. Click "GET A QUOTATION" at the top\n2. Fill in your event details\n3. We\'ll contact you within 24 hours\n\nOr you can reach us directly on WhatsApp using the "CONTACT US" button!'
      },
      {
        patterns: ['wedding', 'marriage', 'reception', 'kalyanam', 'vivaham'],
        answer: '💍 Weddings are our specialty! We provide complete audio-visual solutions for:\n• Wedding ceremonies\n• Receptions\n• Engagement functions\n\nFrom DJ music to stage lighting, we make your special day unforgettable! Contact us for a custom quote.'
      },
      {
        patterns: ['birthday', 'party', 'celebration', 'birthday party'],
        answer: '🎂 We make birthdays epic! Our birthday party packages include:\n• DJ with music system\n• Colorful stage lighting\n• Fog machines & LED effects\n\nTell us your date and location to get started!'
      },
      {
        patterns: ['corporate', 'office', 'company', 'business event', 'conference', 'seminar'],
        answer: '🏢 For corporate events, we provide:\n• Professional PA Sound Systems\n• Stage & Podium Setup\n• Projector & Screen\n• Background Music\n\nWe ensure a professional and polished experience for your corporate event.'
      },
      {
        patterns: ['location', 'area', 'district', 'where', 'place', 'city', 'tamil nadu', 'coimbatore', 'chennai', 'madurai'],
        answer: '📍 SKY DJ & EVENT MANAGEMENT is based in Tamil Nadu and serves surrounding districts.\n\nContact us on WhatsApp to confirm availability for your specific location!'
      },
      {
        patterns: ['contact', 'phone', 'whatsapp', 'call', 'reach', 'number', 'touch'],
        answer: '📞 You can reach us directly!\n\nClick the "💬 Contact on WhatsApp" button on this page and we\'ll get back to you right away!'
      },
      {
        patterns: ['review', 'feedback', 'rating', 'testimonial', 'experience'],
        answer: '⭐ Client reviews matter to us!\n\nTo share your experience, click "ADD YOUR REVIEW" on the home page. You\'ll need to be logged in as a client. Reviews appear after admin approval.'
      },
      {
        patterns: ['login', 'sign in', 'signup', 'register', 'account', 'create account'],
        answer: '🔐 Client accounts are free!\n\nClick "LOGIN" in the top menu to sign up or sign in. Once logged in, you can submit reviews.'
      },
      {
        patterns: ['thank', 'thanks', 'thank you', 'nandri', 'nanri'],
        answer: 'You\'re welcome! 😊 We\'re happy to help. Is there anything else you\'d like to know about SKY DJ & EVENT MANAGEMENT?'
      },
      {
        patterns: ['bye', 'goodbye', 'ok bye', 'see you', 'later'],
        answer: 'Thank you for visiting SKY DJ & EVENT MANAGEMENT! 🎶 Have a great day. Feel free to come back anytime!'
      }
    ],

    ta: [
      {
        patterns: ['hello', 'hi', 'வணக்கம்', 'நமஸ்கார்', 'ஹலோ'],
        answer: 'வணக்கம்! 👋 SKY DJ & EVENT MANAGEMENT-க்கு வரவேற்கிறோம். இன்று நான் உங்களுக்கு எப்படி உதவலாம்? சேவைகள், உபகரணங்கள், விலை அல்லது புக்கிங் பற்றி கேளுங்கள்!'
      },
      {
        patterns: ['சேவை', 'service', 'என்ன செய்கிறீர்கள்', 'என்ன கொடுக்கிறீர்கள்'],
        answer: '🎉 SKY DJ & EVENT MANAGEMENT வழங்குவது:\n• 🎵 DJ சேவைகள்\n• 🔊 தொழில்முறை ஒலி அமைப்புகள்\n• 💡 மேடை வெளிச்சம்\n• 🎭 மேடை அமைப்பு\n• 🎊 முழுமையான நிகழ்வு மேலாண்மை\n\nதிருமணம், திருவிழா, பிறந்தநாள் விழா, நிறுவன நிகழ்வுகள் எல்லாம் செய்கிறோம்!'
      },
      {
        patterns: ['விலை', 'கட்டணம்', 'எவ்வளவு', 'price', 'cost'],
        answer: '💰 விலை நிகழ்வு வகை, நேரம், தேவையான உபகரணங்கள் பொறுத்து மாறும்.\n\n"மேற்கோள் பெறுக" பட்டனை கிளிக் செய்யுங்கள் அல்லது WhatsApp-இல் தொடர்பு கொள்ளுங்கள்!'
      },
      {
        patterns: ['புக்கிங்', 'book', 'booking', 'பதிவு', 'வாடகை'],
        answer: '📅 புக்கிங் எளிது!\n1. மேலே உள்ள "மேற்கோள் பெறுக" கிளிக் செய்யுங்கள்\n2. நிகழ்வு விவரங்கள் நிரப்புங்கள்\n3. 24 மணி நேரத்தில் தொடர்பு கொள்வோம்'
      },
      {
        patterns: ['திருமணம்', 'கல்யாணம்', 'wedding', 'marriage', 'reception'],
        answer: '💍 திருமணம் எங்கள் சிறப்பு! நாங்கள் வழங்குவது:\n• DJ இசை சேவை\n• மேடை வெளிச்சம்\n• முழுமையான ஒலி அமைப்பு\n\nவிலை மேற்கோளுக்கு தொடர்பு கொள்ளுங்கள்.'
      },
      {
        patterns: ['பிறந்தநாள்', 'birthday', 'party', 'கொண்டாட்டம்'],
        answer: '🎂 பிறந்தநாள் விழாவை அற்புதமாக்குவோம்!\n• DJ மற்றும் இசை அமைப்பு\n• வண்ணமயமான மேடை வெளிச்சம்\n• LED விளைவுகள்\n\nதேதி மற்றும் இடம் சொல்லுங்கள்!'
      },
      {
        patterns: ['தொடர்பு', 'contact', 'phone', 'whatsapp', 'எண்', 'அழைப்பு'],
        answer: '📞 நேரடியாக தொடர்பு கொள்ளுங்கள்!\n\n"💬 WhatsApp-இல் தொடர்பு கொள்ளுங்கள்" பட்டனை கிளிக் செய்யுங்கள்!'
      },
      {
        patterns: ['நன்றி', 'thanks', 'thank you'],
        answer: 'மகிழ்ச்சி! 😊 வேறு ஏதாவது கேட்க வேண்டுமா?'
      }
    ],

    tl: [
      {
        patterns: ['hello', 'hi', 'hey', 'hai', 'vanakkam', 'anna', 'machan'],
        answer: 'Vanakkam! 👋 SKY DJ & EVENT MANAGEMENT-la welcome. Ungalukku epdi help pannalaam?\n\nServices, equipment, price, booking ellam kekelunga!'
      },
      {
        patterns: ['service', 'enna pannreenga', 'enna irukku', 'enna kudukureengal'],
        answer: '🎉 SKY DJ & EVENT MANAGEMENT panrathu:\n• 🎵 DJ Services\n• 🔊 Professional Sound System\n• 💡 Stage Lighting\n• 🎭 Stage Setup\n• 🎊 Full Event Management\n\nWedding, Birthday, Corporate events ellam pannuvom!'
      },
      {
        patterns: ['equipment', 'sound', 'speaker', 'subwoofer', 'dj', 'setup', 'gear', 'item'],
        answer: '📦 Namba kitta premium equipment irukku:\n• JBL & Professional Subwoofers\n• DJ Controllers & Mixers\n• Stage Lighting Rigs\n• Wireless Mic\n• LED Effects\n\nMenu-la "Equipment" click pannunga, full catalogue theriyum!'
      },
      {
        patterns: ['price', 'cost', 'rate', 'charge', 'evvalavu', 'how much', 'budget', 'kasu'],
        answer: '💰 Price event type, duration, equipment potta maththi irukkum.\n\n"QUOTATION KELUNGA" button click pannunga, illana WhatsApp-la direct-ah kekelunga! Namba rate fair-aa irukkum!'
      },
      {
        patterns: ['book', 'booking', 'reserve', 'hire', 'rent', 'epdi book', 'epdi panni kelunga'],
        answer: '📅 Book panna romba easy!\n1. Mela irukka "QUOTATION KELUNGA" click pannunga\n2. Event details podunga\n3. 24 hours-la contact pannuvom\n\nIllana "CONTACT PANNUNGA" button la WhatsApp-la namma pesunga!'
      },
      {
        patterns: ['wedding', 'marriage', 'kalyanam', 'reception', 'thirumanam'],
        answer: '💍 Wedding-la namba specialist! Namba kudukurathu:\n• DJ music\n• Stage lighting\n• Full sound system\n• Complete event management\n\nSpecial day unforgettable-aa pannuvom! Contact pannunga price kelunga.'
      },
      {
        patterns: ['birthday', 'party', 'celebration', 'piranthanal', 'bday'],
        answer: '🎂 Birthday-a epic-aa celebrate pannuvom!\n• DJ with music system\n• Colourful stage lighting\n• Fog machine & LED effects\n\nDate and location sollunga, namba ready-aa irupom!'
      },
      {
        patterns: ['corporate', 'office', 'company', 'conference', 'seminar', 'business'],
        answer: '🏢 Corporate events-ku namba:\n• Professional PA Sound\n• Stage & Podium Setup\n• Projector & Screen\n• Background Music\n\nProfessional-aa handle pannuvom!'
      },
      {
        patterns: ['location', 'area', 'evvida', 'which place', 'where', 'yaar', 'district'],
        answer: '📍 SKY DJ & EVENT MANAGEMENT Tamil Nadu-la irukku, surrounding districts ellam serve pannuvom.\n\nUngal specific location-ku available-aa nu WhatsApp-la kekelunga!'
      },
      {
        patterns: ['contact', 'phone', 'whatsapp', 'call', 'number', 'reach', 'paesunga'],
        answer: '📞 Neraya paesalam!\n\n"💬 WhatsApp la Contact Pannunga" button click pannunga, namba turant reply pannuvom!'
      },
      {
        patterns: ['review', 'feedback', 'rating', 'experience', 'sollanum'],
        answer: '⭐ Ungal review nambakku important!\n\nHome page-la "REVIEW PODHUNGA" button click pannunga. Login pannirukanum. Admin approve panna teriyum.'
      },
      {
        patterns: ['login', 'sign in', 'signup', 'register', 'account'],
        answer: '🔐 Client account free-aa create pannalaam!\n\nMenu-la "LOGIN" click pannunga, sign up pannunga. Login-aana piragu review poda mudiyum.'
      },
      {
        patterns: ['thank', 'thanks', 'nandri', 'nanri', 'ok thanks', 'super'],
        answer: 'Welcome! 😊 Help pannithu santhosham. Vera enna kekanum?'
      },
      {
        patterns: ['bye', 'goodbye', 'ok bye', 'later', 'poga'],
        answer: 'SKY DJ & EVENT MANAGEMENT-la vandatharku nandri! 🎶 Nalla irungal. Yeppovum vaangal!'
      }
    ]
  };

  /* ── Current language state ─────────────────────────────────────────── */
  let currentLang = localStorage.getItem('sky_lang') || 'en';
  if (!translations[currentLang]) currentLang = 'en';

  /* ── Public API ─────────────────────────────────────────────────────── */
  function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) ||
           (translations['en'] && translations['en'][key]) ||
           key;
  }

  function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('sky_lang', lang);
    applyTranslations();
    dispatchLangChange(lang);
  }

  function getLanguage() {
    return currentLang;
  }

  function getFAQ() {
    return faqData[currentLang] || faqData['en'];
  }

  /* ── Apply translations to data-i18n elements ───────────────────────── */
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) el.placeholder = val;
          else el.value = val;
        } else {
          el.textContent = val;
        }
      }
    });
    // Also update placeholders tagged with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });
  }

  function dispatchLangChange(lang) {
    document.dispatchEvent(new CustomEvent('sky:langchange', { detail: { lang } }));
  }

  /* ── Expose globally ─────────────────────────────────────────────────── */
  window.SKY_i18n = { t, setLanguage, getLanguage, getFAQ, applyTranslations };

})();
